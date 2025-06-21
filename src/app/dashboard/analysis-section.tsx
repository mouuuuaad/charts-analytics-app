
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from '@/components/dashboard/image-uploader';
import { TrendDisplay } from '@/components/dashboard/trend-display';
import { extractChartData, type ExtractChartDataOutput } from '@/ai/flows/extract-chart-data';
import { predictMarketTrend, type PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import type { Analysis, UserProfileData, UserLevel } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  getUserProfile,
  incrementUserAnalysisAttempts,
  setUserTradingLevel,
} from '@/services/firestore';

const MAX_HISTORY_ITEMS = 20;
const MAX_FREE_ATTEMPTS = 2;

export function AnalysisSection() {
  const { user, loading: authLoading } = useAuth();
  const [prediction, setPrediction] = useState<PredictMarketTrendOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentChartImage, setCurrentChartImage] = useState<string | null>(null);
  const [currentChartFileName, setCurrentChartFileName] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Start true for initial load
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const fetchUserProfileData = useCallback(async () => {
    if (user) {
      setIsLoadingProfile(true);
      try {
        const profileData = await getUserProfile(user.uid);
        setUserProfile(profileData);
        // Show modal if user level is null and auth is complete and profile is loaded.
        if (profileData && profileData.userLevel === null && !authLoading) {
          setShowSurveyModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        toast({ variant: 'destructive', title: 'Profile Error', description: 'Could not load your profile data.' });
        // Set a default/empty profile on error to prevent app from breaking
        setUserProfile({
            analysisAttempts: 0, isPremium: false, userLevel: null,
            subscriptionStartDate: null, subscriptionNextBillingDate: null
        });
      } finally {
        setIsLoadingProfile(false);
      }
    } else {
      // No user, ensure profile is null and not loading
      setUserProfile(null);
      setIsLoadingProfile(false); 
    }
  }, [user, toast, authLoading]); // Dependencies: user, toast, authLoading

  useEffect(() => {
    fetchUserProfileData();
  }, [fetchUserProfileData]);

  const handleSurveyComplete = async (level: UserLevel) => {
    if (user && userProfile) {
      try {
        await setUserTradingLevel(user.uid, level);
        const updatedProfile = await getUserProfile(user.uid); // Re-fetch to confirm
        setUserProfile(updatedProfile);
        setShowSurveyModal(false);
        toast({ title: "Assessment Complete!", description: `Your trading level: ${level}. You can now analyze charts.` });
      } catch (error) {
        console.error("Failed to save trading level:", error);
        toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save your trading level.' });
      }
    }
  };

  const addAnalysisToLocalStorage = (analysisResult: PredictMarketTrendOutput, chartImage: string, chartFileName?: string, extractedChartData?: string | null) => {
    if (typeof window === 'undefined') return;
    const newAnalysis: Analysis = {
      id: Date.now().toString(), imageUrl: chartImage, prediction: analysisResult,
      extractedData: extractedChartData, createdAt: new Date().toISOString(),
      chartFileName: chartFileName || `analysis-${Date.now()}`,
    };
    try {
      const historyString = localStorage.getItem('chartSightAnalysesHistory');
      let history: Analysis[] = historyString ? JSON.parse(historyString) : [];
      history.unshift(newAnalysis); 
      if (history.length > MAX_HISTORY_ITEMS) history = history.slice(0, MAX_HISTORY_ITEMS); 
      localStorage.setItem('chartSightAnalysesHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save analysis to localStorage:", e);
    }
  };

  const handleImageAnalysis = async (file: File, dataUrl: string) => {
    if (authLoading || isLoadingProfile) { // Still check isLoadingProfile here for immediate UI feedback
        toast({ title: "Please wait", description: "Profile data is loading."});
        return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please log in to analyze charts.' });
      return;
    }

    // Force refresh profile data before checks to ensure latest data
    let profileForChecks: UserProfileData;
    try {
        const refreshedProfile = await getUserProfile(user.uid);
        setUserProfile(refreshedProfile); // Update the main state
        if (!refreshedProfile) {
            toast({ variant: 'destructive', title: 'Profile Sync Error', description: 'Could not verify your profile. Please try logging out and in again.'});
            return;
        }
        profileForChecks = refreshedProfile; // Use this for immediate checks
    } catch (refreshError) {
        console.error("Failed to refresh profile for analysis check:", refreshError);
        toast({ variant: 'destructive', title: 'Profile Sync Error', description: 'Could not verify latest profile. Please try again.'});
        return;
    }
    
    // This check relies on the profileForChecks that was just fetched
    if (profileForChecks.userLevel === null) {
      setShowSurveyModal(true);
      toast({ variant: 'destructive', title: 'Assessment Required', description: 'Please complete the trading level assessment before analyzing charts.' });
      return;
    }

    if (!profileForChecks.isPremium && profileForChecks.analysisAttempts >= MAX_FREE_ATTEMPTS) {
      toast({
          variant: 'destructive', title: 'Free Limit Reached',
          description: ( <div className="flex flex-col gap-1.5"> <p>Used all {MAX_FREE_ATTEMPTS} free attempts. Upgrade for unlimited analyses.</p> 
                            <Button size="sm" asChild className="h-7 text-xs">
                              <Link href="/profile">Upgrade</Link>
                            </Button> 
                        </div> ),
          duration: 8000,
      }); return;
    }

    setIsLoadingAnalysis(true); setPrediction(null); setCurrentError(null);
    setCurrentChartImage(dataUrl); setCurrentChartFileName(file.name);

    try {
      const chartDataInput = { chartImage: dataUrl };
      const extractedDataResult: ExtractChartDataOutput = await extractChartData(chartDataInput);
      
      if (!extractedDataResult) throw new Error('Failed to get response from data extraction service.');
      if (!extractedDataResult.isTradingChart) {
        const warning = extractedDataResult.warningMessage || 'Uploaded image is not a financial trading chart.';
        setCurrentError(warning); setPrediction(null); 
        toast({ variant: 'destructive', title: 'Invalid Image', description: warning });
        setIsLoadingAnalysis(false); return;
      }
      if (!extractedDataResult.imageQualitySufficient) {
        const qualityWarning = extractedDataResult.qualityWarningMessage || 'Image quality insufficient for analysis.';
        setCurrentError(qualityWarning); setPrediction(null);
        toast({ variant: 'destructive', title: 'Poor Quality', description: qualityWarning });
        setIsLoadingAnalysis(false); return;
      }
      if (!extractedDataResult.extractedData && extractedDataResult.isTradingChart && extractedDataResult.imageQualitySufficient) {
        const dataWarning = 'Could not extract data from the chart.';
        setCurrentError(dataWarning); setPrediction(null);
        toast({ variant: 'destructive', title: 'Data Extraction Failed', description: dataWarning });
        setIsLoadingAnalysis(false); return;
      }
      
      const trendInput = { extractedData: extractedDataResult.extractedData || "{}", userLevel: profileForChecks.userLevel || 'intermediate' }; // userLevel should exist now
      const trendPredictionResult: PredictMarketTrendOutput = await predictMarketTrend(trendInput);
      
      if (!trendPredictionResult) throw new Error('Failed to predict market trend.');
      
      setPrediction(trendPredictionResult);
      addAnalysisToLocalStorage(trendPredictionResult, dataUrl, file.name, extractedDataResult.extractedData);

      if (!profileForChecks.isPremium) {
        await incrementUserAnalysisAttempts(user.uid);
        const attemptsAfterIncrement = profileForChecks.analysisAttempts + 1;
        // Re-fetch profile to get the most up-to-date state after increment
        const updatedProfileData = await getUserProfile(user.uid);
        setUserProfile(updatedProfileData);
        
        if (attemptsAfterIncrement >= MAX_FREE_ATTEMPTS) {
            toast({ title: "Last Free Attempt Used", description: "You've used all your free analyses. Upgrade for unlimited access.", action: (<Button size="sm" asChild className="h-7 text-xs"><Link href="/profile">Upgrade</Link></Button>), duration: 7000 });
        } else {
            toast({ title: "Analysis Successful", description: `${MAX_FREE_ATTEMPTS - attemptsAfterIncrement} free attempts remaining.`, duration: 4000 });
        }
      } else {
         toast({ title: "Analysis Successful!", description: "Premium insights generated.", duration: 4000 });
      }

    } catch (error: any) {
      console.error('Analysis pipeline error:', error);
      let errorMessage = error.message || 'An unexpected error occurred.';
      setCurrentError(errorMessage); setPrediction(null);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  if (authLoading || (isLoadingProfile && !userProfile)) { 
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  return (
    <>
      <LevelAssessmentModal 
        isOpen={showSurveyModal && userProfile !== null && userProfile.userLevel === null && !authLoading} 
        onComplete={handleSurveyComplete} 
      />
      <div className="container mx-auto py-4 px-2 md:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,450px] gap-4 items-start">
          <ImageUploader onImageUpload={handleImageAnalysis} isProcessing={isLoadingAnalysis} />
          <div className="sticky top-16">
             <TrendDisplay 
                prediction={prediction} isLoading={isLoadingAnalysis} error={currentError} 
                currentChartImage={currentChartImage} userLevel={userProfile?.userLevel}
              />
          </div>
        </div>
      </div>
    </>
  );
}
