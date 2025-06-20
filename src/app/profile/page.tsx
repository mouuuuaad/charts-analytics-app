
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, BarChart3, ShieldCheck, Edit3, AlertTriangle, Star, Copy, Clock, CalendarDays } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import { useToast } from '@/hooks/use-toast';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { format, addDays, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import type { UserLevel, UserProfileData } from '@/types';
import {
  getUserProfile,
  setUserTradingLevel,
  setUserPremiumStatus,
  resetUserAnalysisAttempts,
} from '@/services/firestore';

const MAX_FREE_ATTEMPTS = 2;
const stripePublishableKeyValue = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePriceIdValue = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1RbmIqDBVAJnzUOxV5JLIsGE'; // Default fallback
const stripePromise = stripePublishableKeyValue ? loadStripe(stripePublishableKeyValue) : Promise.resolve(null);

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  useRequireAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [isStripeKeySet, setIsStripeKeySet] = useState(false);
  const [stripePriceId, setStripePriceId] = useState<string>(stripePriceIdValue);
  const [timeRemainingToNextBilling, setTimeRemainingToNextBilling] = useState<string | null>(null);

  const fetchSetIsStripeKey = useCallback(() => {
    if (stripePublishableKeyValue && stripePublishableKeyValue.trim() !== "" && !stripePublishableKeyValue.includes("YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE") && !stripePublishableKeyValue.includes("pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE")) {
      setIsStripeKeySet(true);
    } else {
      setIsStripeKeySet(false);
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID === 'YOUR_STRIPE_PRICE_ID_HERE' || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID.trim() === '') {
      // console.warn('Stripe Price ID not set. Using default test Price ID.');
    } else {
      setStripePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
    }
  }, []); // Empty dependency array as it only reads env vars

  const fetchUserProfile = useCallback(async () => {
    if (user && !authLoading) {
      setIsLoadingProfileData(true);
      fetchSetIsStripeKey();
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (e) {
        console.error("Failed to load profile from Firestore:", e);
        toast({ variant: 'destructive', title: 'Profile Error', description: "Could not load your profile." });
        setUserProfile({
            analysisAttempts: 0, isPremium: false, userLevel: null,
            subscriptionStartDate: null, subscriptionNextBillingDate: null,
        });
      } finally {
        setIsLoadingProfileData(false);
      }
    } else if (!authLoading && !user) {
      setIsLoadingProfileData(false);
      setUserProfile(null);
    }
  }, [user, authLoading, toast, fetchSetIsStripeKey]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handlePaymentSuccess = useCallback(async () => {
    if (user && searchParams.get('payment_success') === 'true') {
      const today = new Date();
      const startDateISO = today.toISOString();
      const nextBillingDate = addDays(today, 30);
      const nextBillingDateISO = nextBillingDate.toISOString();
      
      setIsLoadingProfileData(true);
      try {
        await setUserPremiumStatus(user.uid, true, startDateISO, nextBillingDateISO);
        const updatedProfile = await getUserProfile(user.uid);
        setUserProfile(updatedProfile);
        toast({ title: 'Payment Successful!', description: 'Welcome to Premium!', duration: 6000 });
      } catch (error) {
        console.error("Error updating premium status:", error);
        toast({ variant: 'destructive', title: 'Update Error', description: 'Failed to update premium status.'});
      } finally {
        setIsLoadingProfileData(false);
        router.replace('/profile', { scroll: false });
      }
    }
  }, [user, searchParams, router, toast]);

  const handlePaymentCanceled = useCallback(() => {
    if (searchParams.get('payment_canceled') === 'true') {
        toast({ title: 'Payment Canceled', description: 'Payment process canceled.', variant: 'destructive', duration: 6000 });
        router.replace('/profile', { scroll: false });
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    // Only attempt to handle payment status if user is loaded
    if (user && !authLoading) {
        handlePaymentSuccess();
        handlePaymentCanceled();
    }
  }, [user, authLoading, searchParams, handlePaymentSuccess, handlePaymentCanceled]); // searchParams is key for re-evaluating on URL change


  useEffect(() => {
    if (!userProfile?.subscriptionNextBillingDate) { setTimeRemainingToNextBilling(null); return; }
    const calculateRemaining = () => {
      const now = new Date(); const nextBilling = parseISO(userProfile.subscriptionNextBillingDate!);
      if (now >= nextBilling) { setTimeRemainingToNextBilling("Renewal due"); return; }
      const days = differenceInDays(nextBilling, now); const hours = differenceInHours(nextBilling, now) % 24;
      const minutes = differenceInMinutes(nextBilling, now) % 60;
      setTimeRemainingToNextBilling(`${days}d ${hours}h ${minutes}m`);
    };
    calculateRemaining(); const intervalId = setInterval(calculateRemaining, 60000); 
    return () => clearInterval(intervalId);
  }, [userProfile?.subscriptionNextBillingDate]);

  const getInitials = (displayName: string | null | undefined, email: string | null | undefined): string => {
    if (displayName) { const names = displayName.split(' '); return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase(); }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const getLevelDisplayName = (level: UserLevel | null): string => {
    if (!level) return 'Not Assessed';
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  const handleSurveyComplete = async (level: UserLevel) => {
    if (user) {
      try {
        await setUserTradingLevel(user.uid, level);
        setUserProfile(prev => prev ? { ...prev, userLevel: level } : null);
        setShowSurveyModal(false);
        toast({ title: "Level Updated", description: `Level: ${getLevelDisplayName(level)}.` });
      } catch (error) {
        console.error("Error saving level:", error);
        toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save trading level.' });
      }
    }
  };
  
  const handleServerSideCheckout = async (priceIdToCheckout: string): Promise<void> => {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST', headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ priceId: priceIdToCheckout, successUrl: `${window.location.origin}/profile?payment_success=true`, cancelUrl: `${window.location.origin}/profile?payment_canceled=true`, }),
    });
    if (!response.ok) { let msg = 'Checkout failed.'; try { const err = await response.json(); if (err && err.error) msg = err.error; } catch (e) {} throw new Error(msg); }
    const { sessionId, url } = await response.json();
    if (window.self !== window.top && url) { window.open(url, '_blank'); return; }
    if (sessionId) { const stripe = await stripePromise; if (stripe) { const { error } = await stripe.redirectToCheckout({ sessionId }); if (error) throw error; return; } }
    if (url) { window.location.href = url; return; }
    throw new Error("No session/URL from server.");
  };

  const handleUpgradeToPremiumViaStripe = async () => {
    if (!isStripeKeySet) { toast({ title: "Stripe Error", description: "Stripe not configured.", variant: "destructive" }); return; }
    if (!stripePriceId || stripePriceId === 'YOUR_STRIPE_PRICE_ID_HERE' || stripePriceId.trim() === '') { toast({ title: "Stripe Error", description: "Stripe Price ID missing.", variant: "destructive" }); return; }
    setIsRedirectingToCheckout(true);
    try { await handleServerSideCheckout(stripePriceId); }
    catch (error: any) { toast({ title: "Checkout Failed", description: error.message || "Could not initiate checkout.", variant: "destructive", duration: 8000 }); }
    setIsRedirectingToCheckout(false);
  };
  
  const handleCopyCheckoutLink = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ priceId: stripePriceId, successUrl: `${window.location.origin}/profile?payment_success=true`, cancelUrl: `${window.location.origin}/profile?payment_canceled=true`, }), });
      if (!response.ok) throw new Error('Failed to create session');
      const { url } = await response.json(); if (url) { await navigator.clipboard.writeText(url); toast({ title: "Link Copied!", description: "Paste in new tab.", duration: 4000 }); }
    } catch (error) { toast({ title: "Error", description: "Failed to create link.", variant: "destructive", }); }
  };

  const handleDowngradeToFree = async () => {
    if (user) {
        try {
            await setUserPremiumStatus(user.uid, false); 
            await resetUserAnalysisAttempts(user.uid); 
            const updatedProfile = await getUserProfile(user.uid); 
            setUserProfile(updatedProfile);
            toast({ title: 'Subscription Changed', description: 'Now on Free plan (Simulated).', });
        } catch (error) {
            console.error("Error downgrading:", error);
            toast({ variant: 'destructive', title: 'Update Error', description: 'Failed to switch to free plan.'});
        }
    }
  };

  if (authLoading || isLoadingProfileData || !user || !userProfile) {
    return ( <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center"> <Loader2 className="h-8 w-8 animate-spin" /> </div> );
  }

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-lg">
       <LevelAssessmentModal isOpen={showSurveyModal} onComplete={handleSurveyComplete} />
      <Card className="overflow-hidden border">
        <CardHeader className="p-3 md:p-4">
          <div className="flex items-center space-x-2.5">
            <Avatar className="h-14 w-14 border">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback className="text-lg bg-muted">{getInitials(user.displayName, user.email)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.displayName || 'User'}</CardTitle>
              <CardDescription className="text-xs flex items-center mt-0.5">
                <Mail className="mr-1 h-3 w-3" />{user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border">
              <CardHeader className="pb-1.5 pt-2 px-2">
                <CardTitle className="text-sm flex items-center"><BarChart3 className="mr-1 h-3.5 w-3.5" />Trading Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs px-2 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Level:</span>
                  <Badge variant={userProfile.userLevel ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                    {getLevelDisplayName(userProfile.userLevel)}
                  </Badge>
                </div>
                 <Button variant="outline" size="sm" onClick={() => setShowSurveyModal(true)} className="w-full text-xs h-7">
                    <Edit3 className="mr-1 h-3 w-3" /> {userProfile.userLevel ? 'Retake' : 'Assess Level'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="pb-1.5 pt-2 px-2">
                <CardTitle className="text-sm flex items-center"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs px-2 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant={userProfile.isPremium ? "default" : "destructive"} className={`text-xs px-1.5 py-0 ${userProfile.isPremium ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground"}`}>
                    {userProfile.isPremium ? <><Star className="mr-0.5 h-2.5 w-2.5"/>Premium</> : 'Free'}
                  </Badge>
                </div>
                {!userProfile.isPremium && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Attempts:</span>
                    <span>{userProfile.analysisAttempts} / {MAX_FREE_ATTEMPTS}</span>
                  </div>
                )}
                 {userProfile.isPremium && userProfile.subscriptionStartDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-0.5 h-3 w-3"/>Since:</span>
                    <span className="font-medium">{format(parseISO(userProfile.subscriptionStartDate), "MMM d, yy")}</span>
                  </div>
                )}
                {userProfile.isPremium && userProfile.subscriptionNextBillingDate && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-0.5 h-3 w-3"/>Next Bill:</span>
                      <span className="font-medium">{format(parseISO(userProfile.subscriptionNextBillingDate), "MMM d, yy")}</span>
                    </div>
                     {timeRemainingToNextBilling && (
                        <div className="flex justify-between items-center pt-0.5 border-t border-dashed mt-0.5">
                            <span className="text-muted-foreground flex items-center"><Clock className="mr-0.5 h-3 w-3"/>Renewal:</span>
                            <span className="font-semibold">{timeRemainingToNextBilling}</span>
                        </div>
                    )}
                  </>
                )}
                {userProfile.analysisAttempts >= MAX_FREE_ATTEMPTS && !userProfile.isPremium && (
                    <div className="p-1.5 border border-destructive/50 rounded text-xs flex items-center bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                        Free attempts used. Upgrade.
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-3 md:p-4 border-t">
            <div className="w-full space-y-1.5">
                {userProfile.isPremium ? (
                     <Button onClick={handleDowngradeToFree} variant="outline" className="w-full text-sm h-8">
                        Switch to Free Plan (Simulated)
                    </Button>
                ) : (
                    <div className="space-y-1">
                      <Button
                          onClick={handleUpgradeToPremiumViaStripe}
                          className="w-full text-sm h-9"
                          disabled={isRedirectingToCheckout || !isStripeKeySet}
                      >
                          {isRedirectingToCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Upgrade to Premium"}
                      </Button>
                      <Button onClick={handleCopyCheckoutLink} variant="outline" size="sm" className="w-full text-xs h-7" disabled={!isStripeKeySet}>
                        <Copy className="mr-1 h-3 w-3" /> Copy Payment Link
                      </Button>
                    </div>
                )}
                {!isStripeKeySet && ( <p className="text-xs text-center text-destructive">Stripe not configured. Payments disabled.</p> )}
                <p className="text-xs text-center text-muted-foreground">Terms apply (not created).</p>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full text-sm h-8">Back to Dashboard</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

