'use client';

import type { PrayerTime, PrayerTimesData, PrayerTimeContextType, PrayerName, ActiveOverlay } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { format, set, isAfter, isBefore } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';
import { decrementUserAnalysisAttempts } from '@/services/firestore';
import { ToastAction } from '@/components/ui/toast';

const PrayerTimeContext = createContext<PrayerTimeContextType | undefined>(undefined);

const PRAYER_NAMES_ORDER: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Storage Keys
const PLAYED_ADHANS_TODAY_KEY = 'playedAdhansToday';
const CONFIRMED_PRAYERS_TODAY_KEY = 'confirmedPrayersToday';
const ACTIVE_OVERLAY_KEY = 'activeOverlay';
const AUDIO_UNLOCKED_KEY = 'audioUnlocked';

// Durations
const LIVE_OVERLAY_DURATION_MINUTES = 15;
const CATCH_UP_OVERLAY_DURATION_MINUTES = 8;
const ADHAN_URL = 'https://www.islamcan.com/audio/adhan/azan2.mp3';

// --- Helper Functions for localStorage ---
const getTodayStorage = <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
        const { date, data } = JSON.parse(item);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (date !== todayStr) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        console.error("Failed to parse from localStorage", e);
        return null;
    }
};

const setTodayStorage = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        localStorage.setItem(key, JSON.stringify({ date: todayStr, data }));
    } catch(e) {
        console.error("Failed to write to localStorage", e);
    }
};
// --- End Helper Functions ---


export const PrayerTimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast, dismiss } = useToast();
  
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerDate, setPrayerDate] = useState<Date | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [promptedMissedPrayer, setPromptedMissedPrayer] = useState<PrayerName | null>(null);
  const [confirmedPrayers, setConfirmedPrayers] = useState<Set<PrayerName>>(new Set());
  const [playedAdhans, setPlayedAdhans] = useState<Set<PrayerName>>(new Set());
  
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay | null>(null);
  
  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioUnlockToastId = useRef<string | null>(null);

  // Initialize Audio object on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !adhanAudioRef.current) {
        adhanAudioRef.current = new Audio(ADHAN_URL);
        adhanAudioRef.current.load();
    }
  }, []);
  
  const unlockAudio = useCallback(() => {
    if (!adhanAudioRef.current) return;
    const audio = adhanAudioRef.current;
    audio.muted = true;
    audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        localStorage.setItem(AUDIO_UNLOCKED_KEY, 'true');
        toast({ title: "Sounds Enabled", description: "Adhan will now play automatically." });
        if (audioUnlockToastId.current) {
            dismiss(audioUnlockToastId.current);
            audioUnlockToastId.current = null;
        }
    }).catch(err => {
        console.error("Could not unlock audio:", err);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not enable sounds.' });
    });
  }, [toast, dismiss]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || audioUnlockToastId.current) return;
    
    const isAudioUnlocked = localStorage.getItem(AUDIO_UNLOCKED_KEY) === 'true';
    if (!isAudioUnlocked) {
        const { id } = toast({
            title: "Enable Adhan Sounds",
            description: "Click 'Enable' to allow audio for prayer alerts. This is required by your browser.",
            duration: Infinity,
            action: <ToastAction altText="Enable sound for Adhan" onClick={unlockAudio}>Enable</ToastAction>,
        });
        audioUnlockToastId.current = id;
    }
  }, [user, toast, unlockAudio]);


  // Load state from localStorage on mount
  useEffect(() => {
    const storedOverlay = localStorage.getItem(ACTIVE_OVERLAY_KEY);
    if (storedOverlay) {
        try {
            const overlayData: ActiveOverlay = JSON.parse(storedOverlay);
            if (overlayData.endTime > Date.now()) {
                setActiveOverlay(overlayData);
            } else {
                localStorage.removeItem(ACTIVE_OVERLAY_KEY);
            }
        } catch (e) {
            localStorage.removeItem(ACTIVE_OVERLAY_KEY);
        }
    }
    const storedConfirmed = getTodayStorage<PrayerName[]>(CONFIRMED_PRAYERS_TODAY_KEY);
    if (storedConfirmed) setConfirmedPrayers(new Set(storedConfirmed));

    const storedPlayed = getTodayStorage<PrayerName[]>(PLAYED_ADHANS_TODAY_KEY);
    if (storedPlayed) setPlayedAdhans(new Set(storedPlayed));

  }, []);
  
  const fetchLocationAndPrayerTimes = useCallback(async () => {
    setIsLoading(true);
    try {
      // The API endpoint seems to have changed its response structure.
      // This call might be to a different version or a legacy endpoint.
      // Let's use a known working endpoint for ipbase v2 for stability.
      // NOTE: I'm keeping your original endpoint but adapting the code to the response you provided.
      // If issues persist, consider switching to `https://api.ipbase.com/v2/info`.
      const geoResponse = await fetch('https://api.ipbase.com/v1/json/');
      if (!geoResponse.ok) {
        throw new Error(`Failed to fetch from ipbase.com. Status: ${geoResponse.status}`);
      }
      
      const geoData = await geoResponse.json();
      
      // **FIX START**
      // The new response structure is flat. Let's destructure it directly.
      // Also, we need to check if the essential data exists.
      const { latitude, longitude, city: geoCity, country_name: geoCountry, time_zone: geoTimezone } = geoData;

      if (!latitude || !longitude || !geoCity || !geoCountry || !geoTimezone) {
        // Log the received data for debugging if it's incomplete
        console.error("Incomplete geolocation data received:", geoData);
        throw new Error('Incomplete geolocation data from ipbase.com.');
      }
      
      // The API response you provided doesn't include 'current_time'.
      // We will create a new Date object for the current day.
      // The AlAdhan API primarily needs the date, and the timezone will handle the rest.
      const apiDate = new Date();
      // **FIX END**
      
      setPrayerDate(apiDate);
      setCity(geoCity);
      setCountry(geoCountry);

      // Now fetch prayer times with the obtained location data
      const dateString = format(apiDate, 'dd-MM-yyyy');
      const prayerResponse = await fetch(`https://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=2`);
      if (!prayerResponse.ok) {
        throw new Error('Failed to fetch prayer times from AlAdhan API.');
      }

      const prayerData = await prayerResponse.json();
      if (prayerData.code !== 200) {
        throw new Error(prayerData.status || 'Invalid prayer time data from AlAdhan API.');
      }

      const timings: PrayerTimesData = prayerData.data.timings;
      
      const todayAt = (timeStr: string): Date => {
        const [hour, minute] = timeStr.split(':').map(Number);
        return toZonedTime(set(apiDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 }), geoTimezone);
      };

      const loadedTimes: PrayerTime[] = PRAYER_NAMES_ORDER.map(name => ({
        name,
        time: todayAt(timings[name]),
      }));

      setPrayerTimes(loadedTimes);

    } catch (error) {
        console.error("Could not fetch location or prayer times:", error);
        setPrayerTimes([]); // Clear data on error
    } finally {
        setIsLoading(false); // Ensure loading is always stopped
    }
  }, []); // This useCallback has no dependencies as it's self-contained


  useEffect(() => {
    fetchLocationAndPrayerTimes();
  }, [fetchLocationAndPrayerTimes]);

  // Main Prayer Time Check Logic
  useEffect(() => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (!user || prayerTimes.length === 0 || activeOverlay) {
        return;
    }

    checkIntervalRef.current = setInterval(() => {
      const now = new Date();
      
      // Determine next and previous prayer
      const upcomingPrayers = prayerTimes.filter(p => isAfter(p.time, now));
      const newNextPrayer = upcomingPrayers.length > 0 ? upcomingPrayers[0] : null;
      setNextPrayer(newNextPrayer);

      // --- Live Adhan and Overlay Logic ---
      for (const prayer of prayerTimes) {
        // Check if prayer time is within the last minute and adhan hasn't been played
        if (isAfter(now, prayer.time) && isBefore(now, new Date(prayer.time.getTime() + 60000)) && !playedAdhans.has(prayer.name)) {
          
          // 1. Play Adhan if unlocked
          if (localStorage.getItem(AUDIO_UNLOCKED_KEY) === 'true' && adhanAudioRef.current) {
              adhanAudioRef.current.play().catch(console.error);
          }
          
          // 2. Update state and localStorage
          const newPlayedAdhans = new Set(playedAdhans).add(prayer.name);
          setPlayedAdhans(newPlayedAdhans);
          setTodayStorage(PLAYED_ADHANS_TODAY_KEY, Array.from(newPlayedAdhans));
          
          // 3. Set the 15-minute live overlay
          const endTime = Date.now() + LIVE_OVERLAY_DURATION_MINUTES * 60 * 1000;
          const newOverlay: ActiveOverlay = { type: 'live', prayerName: prayer.name, endTime };
          setActiveOverlay(newOverlay);
          localStorage.setItem(ACTIVE_OVERLAY_KEY, JSON.stringify(newOverlay));
          
          return; // Stop checking once a live prayer is triggered
        }
      }

      // --- Missed Prayer Prompt Logic ---
      let prayerToPrompt: PrayerTime | null = null;
      if (newNextPrayer) {
          const nextPrayerIndex = PRAYER_NAMES_ORDER.indexOf(newNextPrayer.name);
          if (nextPrayerIndex > 0) {
              const prevPrayerName = PRAYER_NAMES_ORDER[nextPrayerIndex - 1];
              prayerToPrompt = prayerTimes.find(p => p.name === prevPrayerName) || null;
          }
      } else if (prayerTimes.length > 0) { // After Isha
          prayerToPrompt = prayerTimes.find(p => p.name === 'Isha') || null;
      }
      
      if (prayerToPrompt && isAfter(now, prayerToPrompt.time) && !confirmedPrayers.has(prayerToPrompt.name)) {
        setPromptedMissedPrayer(prayerToPrompt.name);
      }

    }, 5000); // Check every 5 seconds

    return () => {
        if(checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [user, prayerTimes, activeOverlay, confirmedPrayers, playedAdhans]);


  const handlePrayerConfirmation = (prayerName: PrayerName) => {
    const newConfirmed = new Set(confirmedPrayers).add(prayerName);
    setConfirmedPrayers(newConfirmed);
    setTodayStorage(CONFIRMED_PRAYERS_TODAY_KEY, Array.from(newConfirmed));
    setPromptedMissedPrayer(null);
  };

  const handlePrayerPostponement = (prayerName: PrayerName) => {
    // Confirm it so we don't ask again
    handlePrayerConfirmation(prayerName);
    
    // Start the 8-minute catch-up overlay
    const endTime = Date.now() + CATCH_UP_OVERLAY_DURATION_MINUTES * 60 * 1000;
    const newOverlay: ActiveOverlay = { type: 'catch-up', prayerName, endTime };
    setActiveOverlay(newOverlay);
    localStorage.setItem(ACTIVE_OVERLAY_KEY, JSON.stringify(newOverlay));
  };

  const handleOverlayEnd = useCallback(async () => {
    if (activeOverlay?.type === 'catch-up' && user) {
        await decrementUserAnalysisAttempts(user.uid);
        toast({
            title: `تقبل الله صلاتك`,
            description: `نأمل أنك أديت صلاة ${activeOverlay.prayerName}. كمكافأة، حصلت على محاولة تحليل إضافية!`,
            duration: 8000,
        });
    }
    
    setActiveOverlay(null);
    localStorage.removeItem(ACTIVE_OVERLAY_KEY);
  }, [user, activeOverlay, toast]);

  return (
    <PrayerTimeContext.Provider value={{ 
        prayerTimes, 
        nextPrayer, 
        city, 
        country, 
        isLoading,
        prayerDate,
        promptedMissedPrayer, 
        handlePrayerConfirmation, 
        handlePrayerPostponement, 
        activeOverlay,
        handleOverlayEnd
    }}>
      {children}
    </PrayerTimeContext.Provider>
  );
};

export const usePrayerTime = (): PrayerTimeContextType => {
  const context = useContext(PrayerTimeContext);
  if (context === undefined) {
    throw new Error('usePrayerTime must be used within a PrayerTimeProvider');
  }
  return context;
};
