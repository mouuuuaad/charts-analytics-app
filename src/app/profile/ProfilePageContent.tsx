'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, BarChart3, ShieldCheck, Edit3, AlertTriangle, Star, Clock, CalendarDays, MessageSquare, Settings, Bell } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { format, addDays, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import type { UserLevel, UserProfileData } from '@/types';
import { ADMIN_EMAIL } from '@/types';
import { getUserProfile, setUserTradingLevel, updateUserPremiumStatus } from '@/services/firestore';

const stripePublishableKeyValue = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePriceIdValue = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1RbmIqDBVAJnzUOxV5JLIsGE'; 
const stripePromise = stripePublishableKeyValue ? loadStripe(stripePublishableKeyValue) : Promise.resolve(null);

const MAX_FREE_ATTEMPTS = 2;

export function ProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  useRequireAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [isStripeKeySet, setIsStripeKeySet] = useState(false);
  const [stripePriceId, setStripePriceId] = useState<string>(stripePriceIdValue);
  const [timeRemainingToNextBilling, setTimeRemainingToNextBilling] = useState<string | null>(null);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const fetchSetIsStripeKey = useCallback(() => {
    if (stripePublishableKeyValue && stripePublishableKeyValue.trim() !== "" && !stripePublishableKeyValue.includes("YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE") && !stripePublishableKeyValue.includes("pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE")) {
      setIsStripeKeySet(true);
    } else {
      setIsStripeKeySet(false);
    }
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID.trim() !== '') {
      setStripePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
    }
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (user) {
      setIsLoadingProfileData(true);
      fetchSetIsStripeKey();
      try {
        let data = await getUserProfile(user.uid);
        if (data && data.isPremium && data.subscriptionNextBillingDate && new Date() > parseISO(data.subscriptionNextBillingDate)) {
          toast({
            title: "Subscription Expired",
            description: "Your Premium plan has ended. You are now on the Free plan.",
            variant: "destructive"
          });
          await updateUserPremiumStatus(user.uid, false, null, null);
          data = await getUserProfile(user.uid);
        }
        setProfileData(data);
      } catch (e) {
        console.error("Failed to load profile from Firestore:", e);
        toast({ variant: 'destructive', title: 'Profile Error', description: "Could not load your profile from the database." });
      } finally {
        setIsLoadingProfileData(false);
      }
    }
  }, [user, toast, fetchSetIsStripeKey]);

  useEffect(() => { if (user) fetchProfileData(); }, [user, fetchProfileData]);

  const handlePaymentSuccess = useCallback(async () => {
    if (user && searchParams.get('payment_success') === 'true') {
      const today = new Date();
      const startDateISO = today.toISOString();
      const nextBillingDate = addDays(today, 30);
      const nextBillingDateISO = nextBillingDate.toISOString();

      await updateUserPremiumStatus(user.uid, true, startDateISO, nextBillingDateISO);
      await fetchProfileData();

      toast({ title: 'Payment Successful!', description: 'Welcome to Premium!', duration: 6000 });
      router.replace('/profile', { scroll: false });
    }
  }, [user, searchParams, router, toast, fetchProfileData]);

  const handlePaymentCanceled = useCallback(() => {
    if (searchParams.get('payment_canceled') === 'true') {
      toast({ title: 'Payment Canceled', description: 'Your payment process was canceled.', variant: 'destructive', duration: 6000 });
      router.replace('/profile', { scroll: false });
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (user && !authLoading) {
      handlePaymentSuccess();
      handlePaymentCanceled();
    }
  }, [user, authLoading, searchParams, handlePaymentSuccess, handlePaymentCanceled]);

  useEffect(() => {
    if (!profileData?.subscriptionNextBillingDate) {
      setTimeRemainingToNextBilling(null);
      return;
    }
    const calculateRemaining = () => {
      const now = new Date();
      const nextBilling = parseISO(profileData.subscriptionNextBillingDate);
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
    const intervalId = setInterval(calculateRemaining, 60000);
    return () => clearInterval(intervalId);
  }, [profileData?.subscriptionNextBillingDate]);

  const getInitials = (displayName, email) => {
    if (displayName) {
      const names = displayName.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const getLevelDisplayName = (levelValue) => {
    if (!levelValue) return 'Not Assessed';
    return levelValue.charAt(0).toUpperCase() + levelValue.slice(1);
  };

  const handleSurveyComplete = async (levelValue) => {
    if (user) {
      await setUserTradingLevel(user.uid, levelValue);
      setShowSurveyModal(false);
      await fetchProfileData();
      toast({ title: "Level Updated", description: `Your trading level is now: ${getLevelDisplayName(levelValue)}.` });
    }
  };

  const handleServerSideCheckout = async (priceIdToCheckout) => {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: priceIdToCheckout, successUrl: `${window.location.origin}/profile?payment_success=true`, cancelUrl: `${window.location.origin}/profile?payment_canceled=true` }),
    });
    if (!response.ok) {
      let msg = 'Checkout failed.';
      try { const err = await response.json(); if (err && err.error) msg = err.error; } catch (e) {}
      throw new Error(msg);
    }
    const { sessionId, url } = await response.json();
    if (window.self !== window.top && url) { window.open(url, '_blank'); return; }
    if (sessionId) {
      const stripe = await stripePromise;
      if (stripe) { const { error } = await stripe.redirectToCheckout({ sessionId }); if (error) throw error; return; }
    }
    if (url) { window.location.href = url; return; }
    throw new Error("No session/URL from server.");
  };

  const handleUpgradeToPremiumViaStripe = async () => {
    if (!isStripeKeySet) { toast({ title: "Stripe Error", description: "Stripe is not configured on the server.", variant: "destructive" }); return; }
    if (!stripePriceId || stripePriceId.trim() === '') { toast({ title: "Stripe Error", description: "Stripe Price ID is missing.", variant: "destructive" }); return; }
    setIsRedirectingToCheckout(true);
    try { await handleServerSideCheckout(stripePriceId); }
    catch (error) { toast({ title: "Checkout Failed", description: error.message || "Could not initiate checkout.", variant: "destructive", duration: 8000 }); }
    setIsRedirectingToCheckout(false);
  };

  const handleDowngradeToFree = async () => {
    if (user) {
      await updateUserPremiumStatus(user.uid, false, null, null);
      await fetchProfileData();
      toast({ title: 'Subscription Changed', description: 'You are now on the Free plan.' });
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    setIsEnablingNotifications(true);
    const { initializeFirebaseMessaging } = await import('@/lib/firebase-messaging-util');
    const result = await initializeFirebaseMessaging(user.uid);
    switch (result) {
      case 'success': toast({ title: 'Notifications Enabled!', description: 'You will now receive alerts for new feedback.' }); break;
      case 'permission-denied': toast({ variant: 'destructive', title: 'Permission Denied', description: 'To get notifications, you need to allow them in your browser settings.', duration: 7000 }); break;
      case 'vapid-key-missing': toast({ variant: 'destructive', title: 'Configuration Error', description: 'The application is not configured for push notifications.' }); break;
      case 'no-token':
      case 'error':
      default: toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while enabling notifications.' }); break;
    }
    setIsEnablingNotifications(false);
  };

  if (authLoading || isLoadingProfileData || !user || !profileData) {
    return ( <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center"> <Loader2 className="h-8 w-8 animate-spin" /> </div> );
  }

  const { userLevel, analysisAttempts, subscriptionStartDate, subscriptionNextBillingDate } = profileData;
  const isEffectivelyPremium = profileData.isPremium || isAdmin;

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-lg space-y-4">
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
                {isAdmin && <Badge variant="destructive" className="ml-2 text-xs">Admin</Badge>}
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
                  <Badge variant={isEffectivelyPremium ? "default" : "destructive"} className={`text-xs px-1.5 py-0 ${isEffectivelyPremium ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground"}`}>
                    {isEffectivelyPremium ? <><Star className="mr-0.5 h-2.5 w-2.5"/>Premium</> : 'Free'}
                  </Badge>
                </div>
                {!isEffectivelyPremium && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Attempts:</span>
                    <span>{analysisAttempts} / {MAX_FREE_ATTEMPTS}</span>
                  </div>
                )}
                 {isEffectivelyPremium && subscriptionStartDate && !isAdmin && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-0.5 h-3 w-3"/>Since:</span>
                    <span className="font-medium">{format(parseISO(subscriptionStartDate), "MMM d, yy")}</span>
                  </div>
                )}
                {isEffectivelyPremium && subscriptionNextBillingDate && !isAdmin && (
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
                {analysisAttempts >= MAX_FREE_ATTEMPTS && !isEffectivelyPremium && (
                    <div className="p-1.5 border border-destructive/50 rounded text-xs flex items-center bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                        All free attempts used. Upgrade for more.
                    </div>
                )}
                {isAdmin && (
                    <div className="p-1.5 border border-primary/50 rounded text-xs flex items-center bg-primary/10 text-primary-foreground">
                        <ShieldCheck className="h-3 w-3 mr-1 shrink-0 text-primary" />
                        <span className="text-primary">Admin access enabled.</span>
                    </div>
                )}
              </CardContent>
               <CardFooter className="p-2 border-t">
                {isEffectivelyPremium ? (
                  <>
                    {isAdmin ? (
                      <Button variant="outline" className="w-full text-xs h-7" disabled>Admin Plan Active</Button>
                    ) : (
                      <Button onClick={handleDowngradeToFree} variant="outline" className="w-full text-xs h-7">
                        Switch to Free Plan
                      </Button>
                    )}
                  </>
                ) : (
                    <div className="space-y-1 w-full">
                      <Button
                          onClick={handleUpgradeToPremiumViaStripe}
                          className="w-full text-sm h-8"
                          disabled={isRedirectingToCheckout || !isStripeKeySet}
                      >
                          {isRedirectingToCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Upgrade to Premium"}
                      </Button>
                      {!isStripeKeySet && ( <p className="text-xs text-center text-destructive">Payments disabled.</p> )}
                    </div>
                )}
               </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center"><Bell className="mr-2 h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Enable push notifications for important app events.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleEnableNotifications} disabled={isEnablingNotifications}>
                {isEnablingNotifications ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                Notify Me About New Feedback
            </Button>
            <p className="text-xs text-muted-foreground mt-2 px-1">
                This will ask for permission to send you push notifications. You can manage this in your browser settings at any time.
            </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 flex flex-col space-y-2">
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> App Settings</Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/feedback"><MessageSquare className="mr-2 h-4 w-4" /> Share Feedback</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}