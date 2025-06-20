
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
import type { UserLevel } from '@/types';
// Removed Firestore service imports for user profile

const stripePublishableKeyValue = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePriceIdValue = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1RbmIqDBVAJnzUOxV5JLIsGE'; 
const stripePromise = stripePublishableKeyValue ? loadStripe(stripePublishableKeyValue) : Promise.resolve(null);

const MAX_FREE_ATTEMPTS = 2; // Define it here or import from a shared constants file

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  useRequireAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [analysisAttempts, setAnalysisAttempts] = useState(0);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [subscriptionNextBillingDate, setSubscriptionNextBillingDate] = useState<string | null>(null);
  
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(true); // For initial localStorage load
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
  }, []);

  const loadProfileFromLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsLoadingProfileData(true);
      fetchSetIsStripeKey();
      try {
        const savedLevel = localStorage.getItem('userTradingLevel') as UserLevel | null;
        const savedIsPremium = localStorage.getItem('isUserPremium') === 'true';
        const savedAttempts = parseInt(localStorage.getItem('analysisAttempts') || '0', 10);
        const savedStartDate = localStorage.getItem('subscriptionStartDate');
        const savedNextBillingDate = localStorage.getItem('subscriptionNextBillingDate');

        if (savedLevel && ['beginner', 'intermediate', 'advanced'].includes(savedLevel)) {
            setUserLevel(savedLevel);
        } else {
            setUserLevel(null);
        }
        setIsPremium(savedIsPremium);
        setAnalysisAttempts(savedAttempts);
        setSubscriptionStartDate(savedStartDate);
        setSubscriptionNextBillingDate(savedNextBillingDate);

      } catch (e) {
        console.error("Failed to load profile from localStorage:", e);
        toast({ variant: 'destructive', title: 'Profile Error', description: "Could not load your profile settings from local storage." });
        // Set defaults if localStorage fails
        setUserLevel(null);
        setIsPremium(false);
        setAnalysisAttempts(0);
        setSubscriptionStartDate(null);
        setSubscriptionNextBillingDate(null);
      } finally {
        setIsLoadingProfileData(false);
      }
    }
  }, [toast, fetchSetIsStripeKey]);


  useEffect(() => {
    if (!authLoading && user) { // Ensure user context is resolved before loading from localStorage
        loadProfileFromLocalStorage();
    } else if (!authLoading && !user) {
        // If no user, clear local states or set defaults (already handled by useState defaults)
        setIsLoadingProfileData(false); 
    }
  }, [user, authLoading, loadProfileFromLocalStorage]);


  const handlePaymentSuccess = useCallback(() => {
    if (user && searchParams.get('payment_success') === 'true' && typeof window !== 'undefined') {
      const today = new Date();
      const startDateISO = today.toISOString();
      const nextBillingDate = addDays(today, 30); // Example: 30-day subscription
      const nextBillingDateISO = nextBillingDate.toISOString();
      
      setIsLoadingProfileData(true);
      try {
        localStorage.setItem('isUserPremium', 'true');
        localStorage.setItem('analysisAttempts', '0'); // Reset attempts
        localStorage.setItem('subscriptionStartDate', startDateISO);
        localStorage.setItem('subscriptionNextBillingDate', nextBillingDateISO);

        setIsPremium(true);
        setAnalysisAttempts(0);
        setSubscriptionStartDate(startDateISO);
        setSubscriptionNextBillingDate(nextBillingDateISO);
        
        toast({ title: 'Payment Successful!', description: 'Welcome to Premium!', duration: 6000 });
      } catch (error) {
        console.error("Error updating premium status in localStorage:", error);
        toast({ variant: 'destructive', title: 'Update Error', description: 'Failed to update premium status locally.'});
      } finally {
        setIsLoadingProfileData(false);
        router.replace('/profile', { scroll: false }); // Clear URL params
      }
    }
  }, [user, searchParams, router, toast]);

  const handlePaymentCanceled = useCallback(() => {
    if (searchParams.get('payment_canceled') === 'true') {
        toast({ title: 'Payment Canceled', description: 'Your payment process was canceled.', variant: 'destructive', duration: 6000 });
        router.replace('/profile', { scroll: false }); // Clear URL params
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (user && !authLoading) { // Ensure user context is available
        handlePaymentSuccess();
        handlePaymentCanceled();
    }
  }, [user, authLoading, searchParams, handlePaymentSuccess, handlePaymentCanceled]);


  useEffect(() => {
    if (!subscriptionNextBillingDate) {
      setTimeRemainingToNextBilling(null);
      return;
    }
    const calculateRemaining = () => {
      const now = new Date();
      const nextBilling = parseISO(subscriptionNextBillingDate);
      if (now >= nextBilling) {
        setTimeRemainingToNextBilling("Renewal due");
        return;
      }
      const days = differenceInDays(nextBilling, now);
      const hours = differenceInHours(nextBilling, now) % 24;
      const minutes = differenceInMinutes(nextBilling, now) % 60;
      setTimeRemainingToNextBilling(`${days}d ${hours}h ${minutes}m`);
    };
    calculateRemaining();
    const intervalId = setInterval(calculateRemaining, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, [subscriptionNextBillingDate]);


  const getInitials = (displayName: string | null | undefined, email: string | null | undefined): string => {
    if (displayName) { const names = displayName.split(' '); return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase(); }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const getLevelDisplayName = (levelValue: UserLevel | null): string => {
    if (!levelValue) return 'Not Assessed';
    return levelValue.charAt(0).toUpperCase() + levelValue.slice(1);
  }

  const handleSurveyComplete = async (levelValue: UserLevel) => {
    if (user && typeof window !== 'undefined') {
      try {
        localStorage.setItem('userTradingLevel', levelValue);
        setUserLevel(levelValue);
        setShowSurveyModal(false);
        toast({ title: "Level Updated", description: `Your trading level is now: ${getLevelDisplayName(levelValue)}.` });
      } catch (error) {
        console.error("Error saving level to localStorage:", error);
        toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save your trading level locally.' });
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
    if (!isStripeKeySet) { toast({ title: "Stripe Error", description: "Stripe is not configured on the server.", variant: "destructive" }); return; }
    if (!stripePriceId || stripePriceId === 'YOUR_STRIPE_PRICE_ID_HERE' || stripePriceId.trim() === '') { toast({ title: "Stripe Error", description: "Stripe Price ID is missing.", variant: "destructive" }); return; }
    setIsRedirectingToCheckout(true);
    try { await handleServerSideCheckout(stripePriceId); }
    catch (error: any) { toast({ title: "Checkout Failed", description: error.message || "Could not initiate checkout.", variant: "destructive", duration: 8000 }); }
    setIsRedirectingToCheckout(false);
  };
  
  const handleCopyCheckoutLink = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ priceId: stripePriceId, successUrl: `${window.location.origin}/profile?payment_success=true`, cancelUrl: `${window.location.origin}/profile?payment_canceled=true`, }), });
      if (!response.ok) throw new Error('Failed to create session');
      const { url } = await response.json(); if (url) { await navigator.clipboard.writeText(url); toast({ title: "Link Copied!", description: "You can paste the link in a new tab to complete payment.", duration: 4000 }); }
    } catch (error) { toast({ title: "Error", description: "Failed to create payment link.", variant: "destructive", }); }
  };

  const handleDowngradeToFree = async () => {
    if (user && typeof window !== 'undefined') {
        try {
            localStorage.setItem('isUserPremium', 'false');
            localStorage.setItem('analysisAttempts', '0'); // Reset attempts for free plan as well
            localStorage.removeItem('subscriptionStartDate');
            localStorage.removeItem('subscriptionNextBillingDate');

            setIsPremium(false);
            setAnalysisAttempts(0); 
            setSubscriptionStartDate(null);
            setSubscriptionNextBillingDate(null);
            
            toast({ title: 'Subscription Changed', description: 'You are now on the Free plan (Simulated).', });
        } catch (error) {
            console.error("Error downgrading in localStorage:", error);
            toast({ variant: 'destructive', title: 'Update Error', description: 'Failed to switch to free plan locally.'});
        }
    }
  };

  if (authLoading || isLoadingProfileData || !user) { // Check !user as well
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
                  <Badge variant={userLevel ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                    {getLevelDisplayName(userLevel)}
                  </Badge>
                </div>
                 <Button variant="outline" size="sm" onClick={() => setShowSurveyModal(true)} className="w-full text-xs h-7">
                    <Edit3 className="mr-1 h-3 w-3" /> {userLevel ? 'Retake Assessment' : 'Take Assessment'}
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
                  <Badge variant={isPremium ? "default" : "destructive"} className={`text-xs px-1.5 py-0 ${isPremium ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground"}`}>
                    {isPremium ? <><Star className="mr-0.5 h-2.5 w-2.5"/>Premium</> : 'Free'}
                  </Badge>
                </div>
                {!isPremium && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Attempts:</span>
                    <span>{analysisAttempts} / {MAX_FREE_ATTEMPTS}</span>
                  </div>
                )}
                 {isPremium && subscriptionStartDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-0.5 h-3 w-3"/>Since:</span>
                    <span className="font-medium">{format(parseISO(subscriptionStartDate), "MMM d, yy")}</span>
                  </div>
                )}
                {isPremium && subscriptionNextBillingDate && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-0.5 h-3 w-3"/>Next Bill:</span>
                      <span className="font-medium">{format(parseISO(subscriptionNextBillingDate), "MMM d, yy")}</span>
                    </div>
                     {timeRemainingToNextBilling && (
                        <div className="flex justify-between items-center pt-0.5 border-t border-dashed mt-0.5">
                            <span className="text-muted-foreground flex items-center"><Clock className="mr-0.5 h-3 w-3"/>Renewal in:</span>
                            <span className="font-semibold">{timeRemainingToNextBilling}</span>
                        </div>
                    )}
                  </>
                )}
                {analysisAttempts >= MAX_FREE_ATTEMPTS && !isPremium && (
                    <div className="p-1.5 border border-destructive/50 rounded text-xs flex items-center bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                        All free attempts used. Upgrade for more.
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-3 md:p-4 border-t">
            <div className="w-full space-y-1.5">
                {isPremium ? (
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
                        <Copy className="mr-1 h-3 w-3" /> Copy Payment Link (for testing)
                      </Button>
                    </div>
                )}
                {!isStripeKeySet && ( <p className="text-xs text-center text-destructive">Stripe is not configured. Payments are disabled.</p> )}
                <p className="text-xs text-center text-muted-foreground">Terms and conditions apply (not yet created).</p>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full text-sm h-8">Back to Dashboard</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
    

    