
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, BarChart3, ShieldCheck, Edit3, AlertTriangle, Star, Copy, Clock, CalendarDays } from 'lucide-react'; // Removed Zap
import { useRouter, useSearchParams } from 'next/navigation';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import { useToast } from '@/hooks/use-toast';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { format, addDays, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';


type UserLevel = 'beginner' | 'intermediate' | 'advanced';

const MAX_FREE_ATTEMPTS = 2;

const stripePublishableKeyValue = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePriceIdValue = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1RbmIqDBVAJnzUOxV5JLIsGE';

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
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE") || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY_HERE")) {
        console.error('Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is not set or is a placeholder in .env file. Payment features are disabled.');
      }
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID === 'YOUR_STRIPE_PRICE_ID_HERE' || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID.trim() === '') {
      console.warn('Stripe Price ID (NEXT_PUBLIC_STRIPE_PRICE_ID) is not set or is a placeholder. Using default test Price ID. Please set this in your .env file for correct operation.');
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
        const storedStartDate = localStorage.getItem('subscriptionStartDate');
        const storedNextBillingDate = localStorage.getItem('subscriptionNextBillingDate');
        setSubscriptionStartDate(storedStartDate);
        setSubscriptionNextBillingDate(storedNextBillingDate);
      }
    }
    setIsLoadingProfileData(false);
  }, []);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const paymentCanceled = searchParams.get('payment_canceled');

    if (paymentSuccess === 'true') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'true');
        setIsPremium(true);
        localStorage.setItem('analysisAttempts', '0');
        setAnalysisAttempts(0);

        const today = new Date();
        const startDateISO = today.toISOString();
        const nextBillingDate = addDays(today, 30);
        const nextBillingDateISO = nextBillingDate.toISOString();

        localStorage.setItem('subscriptionStartDate', startDateISO);
        localStorage.setItem('subscriptionNextBillingDate', nextBillingDateISO);
        setSubscriptionStartDate(startDateISO);
        setSubscriptionNextBillingDate(nextBillingDateISO);

        toast({
            title: 'Payment Successful!',
            description: 'Welcome to Premium! Enjoy unlimited analyses.', // Simplified
            variant: 'default',
            duration: 8000,
        });
        router.replace('/profile', { scroll: false });
      }
    }

    if (paymentCanceled === 'true') {
      toast({
        title: 'Payment Canceled',
        description: 'Your payment process was canceled.', // Simplified
        variant: 'destructive',
        duration: 8000,
      });
      router.replace('/profile', { scroll: false });
    }
  }, [searchParams, router, toast]);

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
    const intervalId = setInterval(calculateRemaining, 60000); 
    return () => clearInterval(intervalId);
  }, [subscriptionNextBillingDate]);


  const getInitials = (displayName: string | null | undefined, email: string | null | undefined): string => {
    if (displayName) {
      const names = displayName.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const getLevelDisplayName = (level: UserLevel | null): string => {
    if (!level) return 'Not Assessed'; // Simplified
    if (level === 'beginner') return 'Beginner';
    if (level === 'intermediate') return 'Intermediate';
    if (level === 'advanced') return 'Advanced';
    return 'Unknown';
  }

  const handleRetakeAssessment = () => {
    setShowSurveyModal(true);
  };

  const handleSurveyComplete = (level: UserLevel) => {
    setUserLevel(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userTradingLevel', level);
    }
    setShowSurveyModal(false);
    toast({ title: "Level Updated", description: `Your level: ${getLevelDisplayName(level)}.` }); // Simplified
  };

  const handleServerSideCheckout = async (priceIdToCheckout: string): Promise<void> => {
    try {
      const isInIframe = window.self !== window.top;
      const isRestrictedContext = isInIframe || !window.location.ancestorOrigins;

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceIdToCheckout,
          successUrl: `${window.location.origin}/profile?payment_success=true`,
          cancelUrl: `${window.location.origin}/profile?payment_canceled=true`,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Checkout session creation failed.'; // Simplified
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) { /* Do nothing */ }
        throw new Error(errorMessage);
      }

      const { sessionId, url } = await response.json();

      if (isRestrictedContext && url) {
        const newWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (newWindow) {
          const checkClosed = setInterval(() => {
            if (newWindow.closed) {
              clearInterval(checkClosed);
              window.location.reload();
            }
          }, 1000);
          return;
        }
      }

      if (sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error: stripeJsError } = await stripe.redirectToCheckout({ sessionId });
          if (stripeJsError) {
            if (stripeJsError.message && stripeJsError.message.includes('permission to navigate')) {
              if (url) {
                window.location.href = url; return;
              }
            }
            throw stripeJsError;
          }
          return;
        } else if (url) {
          window.location.href = url; return;
        } else {
          throw new Error("Stripe.js not loaded or no fallback URL."); // Simplified
        }
      } else if (url) {
        window.location.href = url; return;
      } else {
        throw new Error("No session ID or URL from server."); // Simplified
      }

    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error?.message || error) || 'Unknown checkout error.'); // Simplified
      }
    }
  };

  const handleUpgradeToPremiumViaStripe = async () => {
    if (!isStripeKeySet) {
        toast({ title: "Stripe Error", description: "Stripe not configured. Check .env.", variant: "destructive", duration: 7000 }); // Simplified
        return;
    }
    if (!stripePriceId || stripePriceId === 'YOUR_STRIPE_PRICE_ID_HERE' || stripePriceId.trim() === '') {
        toast({ title: "Stripe Error", description: "Stripe Price ID missing. Check .env.", variant: "destructive", duration: 7000 }); // Simplified
        return;
    }

    setIsRedirectingToCheckout(true);
    try {
      await handleServerSideCheckout(stripePriceId);
    } catch (serverError: any) {
      let description: React.ReactNode = serverError.message || "Could not initiate checkout.";
      // Removed complex iframe/blocked logic for simplicity as per user request
      toast({ title: "Checkout Failed", description, variant: "destructive", duration: 10000 });
    }
    setIsRedirectingToCheckout(false);
  };
  
  const handleCopyCheckoutLink = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
          priceId: stripePriceId,
          successUrl: `${window.location.origin}/profile?payment_success=true`,
          cancelUrl: `${window.location.origin}/profile?payment_canceled=true`,
        }),
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      const { url } = await response.json();
      if (url) {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link Copied!", description: "Paste in new tab to pay.", duration: 5000 }); // Simplified
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create link.", variant: "destructive", }); // Simplified
    }
  };

  const handleDowngradeToFree = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'false'); setIsPremium(false);
        localStorage.setItem('analysisAttempts', '0'); setAnalysisAttempts(0);
        localStorage.removeItem('subscriptionStartDate'); localStorage.removeItem('subscriptionNextBillingDate');
        setSubscriptionStartDate(null); setSubscriptionNextBillingDate(null); setTimeRemainingToNextBilling(null);
        toast({ title: 'Subscription Changed', description: 'Now on Free plan (Simulated).', }); // Simplified
    }
  };

  if (authLoading || isLoadingProfileData || !user) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" /> {/* Slightly smaller loader */}
      </div>
    );
  }

  const attemptsRemaining = isPremium ? Infinity : Math.max(0, MAX_FREE_ATTEMPTS - analysisAttempts);

  return (
    <div className="container mx-auto py-6 px-2 md:px-0 max-w-2xl"> {/* Reduced padding/max-width slightly */}
       <LevelAssessmentModal isOpen={showSurveyModal} onComplete={handleSurveyComplete} />
      <Card className="overflow-hidden border"> {/* Removed shadow, simplified border */}
        <CardHeader className="bg-muted/50 p-4 md:p-6"> {/* Simplified background, adjusted padding */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-16 w-16 border"> {/* Simplified avatar */}
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback className="text-xl bg-muted text-primary">{getInitials(user.displayName, user.email)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.displayName || 'User'}</CardTitle> {/* Simpler font */}
              <CardDescription className="text-xs text-muted-foreground flex items-center mt-0.5">
                <Mail className="mr-1.5 h-3.5 w-3.5" />{user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border"> {/* Simplified card */}
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-md flex items-center text-primary"><BarChart3 className="mr-1.5 h-4 w-4" />Trading Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm px-3 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Level:</span>
                  <Badge variant={userLevel ? "secondary" : "outline"} className="text-xs">
                    {getLevelDisplayName(userLevel)}
                  </Badge>
                </div>
                 <Button variant="outline" size="sm" onClick={handleRetakeAssessment} className="w-full text-xs">
                    <Edit3 className="mr-1.5 h-3 w-3" /> {userLevel ? 'Retake' : 'Assess Level'} {/* Shorter text */}
                </Button>
              </CardContent>
            </Card>

            <Card className="border"> {/* Simplified card */}
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-md flex items-center text-primary"><ShieldCheck className="mr-1.5 h-4 w-4" />Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm px-3 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Plan:</span>
                  <Badge variant={isPremium ? "default" : "destructive"} className={`text-xs ${isPremium ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}`}>
                    {isPremium ? <><Star className="mr-1 h-3 w-3"/>Premium</> : 'Free'}
                  </Badge>
                </div>
                {!isPremium && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Attempts:</span>
                    <span>{analysisAttempts} / {MAX_FREE_ATTEMPTS}</span>
                  </div>
                )}
                 {isPremium && subscriptionStartDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-1 h-3 w-3"/>Active Since:</span>
                    <span className="font-medium">{format(parseISO(subscriptionStartDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {isPremium && subscriptionNextBillingDate && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-1 h-3 w-3"/>Next Bill:</span>
                      <span className="font-medium">{format(parseISO(subscriptionNextBillingDate), "MMM d, yyyy")}</span>
                    </div>
                     {timeRemainingToNextBilling && (
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed mt-1">
                            <span className="text-muted-foreground flex items-center"><Clock className="mr-1 h-3 w-3"/>Renewal In:</span>
                            <span className="font-semibold text-primary">{timeRemainingToNextBilling}</span>
                        </div>
                    )}
                  </>
                )}
                {attemptsRemaining <= 0 && !isPremium && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive-foreground flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        Free attempts used. Upgrade to continue.
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-4 md:p-6 border-t bg-muted/30">
            <div className="w-full space-y-2">
                {isPremium ? (
                     <Button onClick={handleDowngradeToFree} variant="outline" className="w-full text-sm">
                        Switch to Free Plan
                    </Button>
                ) : (
                    <div className="space-y-1.5">
                      <Button
                          onClick={handleUpgradeToPremiumViaStripe}
                          className="w-full text-sm py-2.5" // Simplified button
                          disabled={isRedirectingToCheckout || !isStripeKeySet}
                      >
                          {isRedirectingToCheckout ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                          ) : (
                             "Upgrade to Premium"
                          )}
                      </Button>
                      <Button
                        onClick={handleCopyCheckoutLink}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        disabled={!isStripeKeySet}
                      >
                        <Copy className="mr-1.5 h-3 w-3" />
                        Copy Payment Link
                      </Button>
                    </div>
                )}
                {!isStripeKeySet && (
                  <p className="text-xs text-center text-destructive">
                    Stripe not configured. Payments disabled.
                  </p>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  Terms of Service apply (not yet created).
                </p>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full text-sm">
                    Back to Dashboard
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
