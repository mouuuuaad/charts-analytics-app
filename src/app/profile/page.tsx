
'use client';

import { useEffect, useState } from 'react';
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

type UserLevel = 'beginner' | 'intermediate' | 'advanced';
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

  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [analysisAttempts, setAnalysisAttempts] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(true);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [isStripeKeySet, setIsStripeKeySet] = useState(false);
  const [stripePriceId, setStripePriceId] = useState<string>(stripePriceIdValue);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [subscriptionNextBillingDate, setSubscriptionNextBillingDate] = useState<string | null>(null);
  const [timeRemainingToNextBilling, setTimeRemainingToNextBilling] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingProfileData(true);
    if (stripePublishableKeyValue && stripePublishableKeyValue.trim() !== "" && !stripePublishableKeyValue.includes("YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE") && !stripePublishableKeyValue.includes("pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE")) {
      setIsStripeKeySet(true);
    } else {
      setIsStripeKeySet(false);
      // console.error('Stripe Publishable Key not set or placeholder.'); // Avoid console for user
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID === 'YOUR_STRIPE_PRICE_ID_HERE' || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID.trim() === '') {
      // console.warn('Stripe Price ID not set. Using default test Price ID.');
    } else {
      setStripePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
    }

    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('userTradingLevel') as UserLevel | null;
      setUserLevel(savedLevel);
      const attemptsString = localStorage.getItem('analysisAttempts');
      setAnalysisAttempts(attemptsString ? parseInt(attemptsString, 10) : 0);
      const premiumStatus = localStorage.getItem('isUserPremium') === 'true';
      setIsPremium(premiumStatus);
      if (premiumStatus) {
        setSubscriptionStartDate(localStorage.getItem('subscriptionStartDate'));
        setSubscriptionNextBillingDate(localStorage.getItem('subscriptionNextBillingDate'));
      }
    }
    setIsLoadingProfileData(false);
  }, []);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const paymentCanceled = searchParams.get('payment_canceled');
    if (paymentSuccess === 'true' && typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'true'); setIsPremium(true);
        localStorage.setItem('analysisAttempts', '0'); setAnalysisAttempts(0);
        const today = new Date(); const startDateISO = today.toISOString();
        const nextBillingDate = addDays(today, 30); const nextBillingDateISO = nextBillingDate.toISOString();
        localStorage.setItem('subscriptionStartDate', startDateISO); localStorage.setItem('subscriptionNextBillingDate', nextBillingDateISO);
        setSubscriptionStartDate(startDateISO); setSubscriptionNextBillingDate(nextBillingDateISO);
        toast({ title: 'Payment Successful!', description: 'Welcome to Premium!', duration: 6000 });
        router.replace('/profile', { scroll: false });
    }
    if (paymentCanceled === 'true') {
      toast({ title: 'Payment Canceled', description: 'Payment process canceled.', variant: 'destructive', duration: 6000 });
      router.replace('/profile', { scroll: false });
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (!subscriptionNextBillingDate) { setTimeRemainingToNextBilling(null); return; }
    const calculateRemaining = () => {
      const now = new Date(); const nextBilling = parseISO(subscriptionNextBillingDate);
      if (now >= nextBilling) { setTimeRemainingToNextBilling("Renewal due"); return; }
      const days = differenceInDays(nextBilling, now); const hours = differenceInHours(nextBilling, now) % 24;
      const minutes = differenceInMinutes(nextBilling, now) % 60;
      setTimeRemainingToNextBilling(`${days}d ${hours}h ${minutes}m`);
    };
    calculateRemaining(); const intervalId = setInterval(calculateRemaining, 60000); 
    return () => clearInterval(intervalId);
  }, [subscriptionNextBillingDate]);

  const getInitials = (displayName: string | null | undefined, email: string | null | undefined): string => {
    if (displayName) { const names = displayName.split(' '); return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase(); }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const getLevelDisplayName = (level: UserLevel | null): string => {
    if (!level) return 'Not Assessed';
    return level.charAt(0).toUpperCase() + level.slice(1); // Simpler display
  }

  const handleSurveyComplete = (level: UserLevel) => {
    setUserLevel(level); if (typeof window !== 'undefined') localStorage.setItem('userTradingLevel', level);
    setShowSurveyModal(false); toast({ title: "Level Updated", description: `Level: ${getLevelDisplayName(level)}.` });
  };

  const handleServerSideCheckout = async (priceIdToCheckout: string): Promise<void> => {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST', headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ priceId: priceIdToCheckout, successUrl: `${window.location.origin}/profile?payment_success=true`, cancelUrl: `${window.location.origin}/profile?payment_canceled=true`, }),
    });
    if (!response.ok) { let msg = 'Checkout failed.'; try { const err = await response.json(); if (err && err.error) msg = err.error; } catch (e) {} throw new Error(msg); }
    const { sessionId, url } = await response.json();
    if (window.self !== window.top && url) { window.open(url, '_blank'); return; } // Handle iframe
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

  const handleDowngradeToFree = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'false'); setIsPremium(false);
        localStorage.setItem('analysisAttempts', '0'); setAnalysisAttempts(0);
        localStorage.removeItem('subscriptionStartDate'); localStorage.removeItem('subscriptionNextBillingDate');
        setSubscriptionStartDate(null); setSubscriptionNextBillingDate(null); setTimeRemainingToNextBilling(null);
        toast({ title: 'Subscription Changed', description: 'Now on Free plan (Simulated).', });
    }
  };

  if (authLoading || isLoadingProfileData || !user) {
    return ( <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center"> <Loader2 className="h-8 w-8 animate-spin" /> </div> ); /* Simplified */
  }

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-lg"> {/* Simplified padding/width */}
       <LevelAssessmentModal isOpen={showSurveyModal} onComplete={handleSurveyComplete} />
      <Card className="overflow-hidden border">
        <CardHeader className="p-3 md:p-4"> {/* Simplified padding */}
          <div className="flex items-center space-x-2.5"> {/* Simplified spacing */}
            <Avatar className="h-14 w-14 border"> {/* Simplified */}
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback className="text-lg bg-muted">{getInitials(user.displayName, user.email)}</AvatarFallback> {/* Simplified */}
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.displayName || 'User'}</CardTitle> {/* Simpler font */}
              <CardDescription className="text-xs flex items-center mt-0.5"> {/* Simplified */}
                <Mail className="mr-1 h-3 w-3" />{user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-4 space-y-3"> {/* Simplified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> {/* Simplified */}
            <Card className="border">
              <CardHeader className="pb-1.5 pt-2 px-2"> {/* Simplified */}
                <CardTitle className="text-sm flex items-center"><BarChart3 className="mr-1 h-3.5 w-3.5" />Trading Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs px-2 pb-2"> {/* Simplified */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Level:</span>
                  <Badge variant={userLevel ? "secondary" : "outline"} className="text-xs px-1.5 py-0"> {/* Simplified */}
                    {getLevelDisplayName(userLevel)}
                  </Badge>
                </div>
                 <Button variant="outline" size="sm" onClick={() => setShowSurveyModal(true)} className="w-full text-xs h-7"> {/* Simplified */}
                    <Edit3 className="mr-1 h-3 w-3" /> {userLevel ? 'Retake' : 'Assess Level'}
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
                  <Badge variant={isPremium ? "default" : "destructive"} className={`text-xs px-1.5 py-0 ${isPremium ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground"}`}> {/* Simplified colors */}
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
                    <span className="font-medium">{format(parseISO(subscriptionStartDate), "MMM d, yy")}</span> {/* Shorter format */}
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
                            <span className="text-muted-foreground flex items-center"><Clock className="mr-0.5 h-3 w-3"/>Renewal:</span>
                            <span className="font-semibold">{timeRemainingToNextBilling}</span>
                        </div>
                    )}
                  </>
                )}
                {analysisAttempts >= MAX_FREE_ATTEMPTS && !isPremium && ( // Simpler condition
                    <div className="p-1.5 border border-destructive/50 rounded text-xs flex items-center bg-destructive/10 text-destructive"> {/* Simplified */}
                        <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                        Free attempts used. Upgrade.
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-3 md:p-4 border-t"> {/* Simplified */}
            <div className="w-full space-y-1.5">
                {isPremium ? (
                     <Button onClick={handleDowngradeToFree} variant="outline" className="w-full text-sm h-8"> {/* Simpler */}
                        Switch to Free Plan (Simulated)
                    </Button>
                ) : (
                    <div className="space-y-1"> {/* Simplified */}
                      <Button
                          onClick={handleUpgradeToPremiumViaStripe}
                          className="w-full text-sm h-9" // Simplified
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
