
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, BarChart3, ShieldCheck, Zap, Edit3, AlertTriangle, Star } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import { useToast } from '@/hooks/use-toast';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import Link from 'next/link'; 

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


  useEffect(() => {
    setIsLoadingProfileData(true);
    if (stripePublishableKeyValue && stripePublishableKeyValue.trim() !== "") {
      setIsStripeKeySet(true);
    } else {
      setIsStripeKeySet(false);
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.error('Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is not set in .env file.');
        toast({
          title: 'Stripe Configuration Error',
          description: 'Stripe publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is not set. Payment features are disabled.',
          variant: 'destructive',
          duration: 10000, 
        });
      }
    }
    
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID === 'YOUR_STRIPE_PRICE_ID_HERE') {
      console.warn('Stripe Price ID (NEXT_PUBLIC_STRIPE_PRICE_ID) is not set or is a placeholder. Using default test Price ID. Please set this in your .env file for correct operation.');
      // Keep stripePriceId as the default test one if not set by env var
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
    }
    setIsLoadingProfileData(false);
  }, [toast]);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const paymentCanceled = searchParams.get('payment_canceled');

    if (paymentSuccess === 'true') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'true');
        setIsPremium(true);
        localStorage.setItem('analysisAttempts', '0'); 
        setAnalysisAttempts(0);
        toast({
            title: 'Payment Successful!',
            description: 'Welcome to ChartSight AI Premium! Enjoy unlimited analyses.',
            variant: 'default',
            duration: 8000,
        });
        router.replace('/profile', { scroll: false }); 
      }
    }

    if (paymentCanceled === 'true') {
      toast({
        title: 'Payment Canceled',
        description: 'Your payment process was canceled. You can try again anytime.',
        variant: 'destructive',
        duration: 8000,
      });
      router.replace('/profile', { scroll: false }); 
    }
  }, [searchParams, router, toast]);


  const getInitials = (displayName: string | null | undefined, email: string | null | undefined): string => {
    if (displayName) {
      const names = displayName.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };
  
  const getLevelDisplayName = (level: UserLevel | null): string => {
    if (!level) return 'Not Assessed Yet';
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
    toast({ title: "Level Updated", description: `Your trading level is now set to ${getLevelDisplayName(level)}.` });
  };
  
  const handleUpgradeToPremiumViaStripe = async () => {
    if (!isStripeKeySet) {
        toast({ title: "Stripe Error", description: "Stripe is not configured. Cannot proceed to payment.", variant: "destructive" });
        return;
    }
    if (!stripePriceId || stripePriceId === 'YOUR_STRIPE_PRICE_ID_HERE') { 
        toast({ title: "Stripe Error", description: "Stripe Price ID is not configured correctly. Please set NEXT_PUBLIC_STRIPE_PRICE_ID in your .env file or use a valid Price ID.", variant: "destructive" });
        console.error('Stripe Price ID (NEXT_PUBLIC_STRIPE_PRICE_ID) is not set or is a placeholder. Using default:', stripePriceId);
        // If you want to allow proceeding with a default test ID if not configured, you can remove the return here.
        // For now, it's safer to require it.
        // return; 
    }


    setIsRedirectingToCheckout(true);
    const stripe = await stripePromise; 
    
    if (!stripe) {
      toast({ title: "Stripe Error", description: "Could not connect to Stripe. Please ensure your publishable key is correct and try again.", variant: "destructive" });
      setIsRedirectingToCheckout(false);
      return;
    }

    try {
        // IMPORTANT: If you get an "IntegrationError: The Checkout client-only integration is not enabled."
        // you MUST enable it in your Stripe Dashboard at:
        // https://dashboard.stripe.com/account/checkout/settings
        const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: stripePriceId, quantity: 1 }],
        mode: 'subscription', 
        successUrl: `${window.location.origin}/profile?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/profile?payment_canceled=true`,
        });

        if (error) {
            console.error('Stripe redirectToCheckout error:', error);
            if (error.message && error.message.includes('The Checkout client-only integration is not enabled')) {
                toast({
                    title: "Stripe Configuration Needed",
                    description: (
                        <div className="flex flex-col gap-1">
                            <p className="mb-1">The Stripe Checkout client-only integration is not enabled in your Stripe account.</p>
                            <p className="mb-1">Please enable it in your Stripe Dashboard by visiting:</p>
                            <Link
                                href="https://dashboard.stripe.com/account/checkout/settings"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-foreground underline hover:text-primary-foreground/80 font-semibold"
                            >
                                https://dashboard.stripe.com/account/checkout/settings
                            </Link>
                            <p className="mt-1 text-xs">This is a Stripe account setting, not an app issue. After enabling, please try again.</p>
                        </div>
                    ),
                    variant: "destructive",
                    duration: 30000, 
                });
            } else {
                toast({ title: "Payment Error", description: error.message || "Could not redirect to checkout. Please check Stripe Price ID and account settings.", variant: "destructive" });
            }
            setIsRedirectingToCheckout(false);
        }
    } catch (e: any) {
        console.error('Exception during Stripe checkout redirect:', e);
        let description = "An unexpected error occurred while attempting to redirect to Stripe Checkout.";
        // Check for messages indicative of iframe/sandbox restrictions
        if (e.message && (e.message.toLowerCase().includes('permission to navigate') || e.message.toLowerCase().includes('location') || e.message.toLowerCase().includes('target frame') || e.message.toLowerCase().includes('cross-origin frame') || e.message.toLowerCase().includes('failed to set a named property \'href\' on \'location\''))) {
            description = "Could not redirect to Stripe for payment. This can happen if the app is running in a restricted environment (like an embedded frame or sandbox). Please try opening the application in a new, standalone browser window/tab. If the problem continues, check your browser console for more details or contact support.";
        } else if (e.message) {
            description = e.message;
        }
        toast({ 
            title: "Redirection to Payment Failed", 
            description: description, 
            variant: "destructive",
            duration: 20000 
        });
        setIsRedirectingToCheckout(false);
    }
  };

  const handleDowngradeToFree = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'false');
        setIsPremium(false);
        localStorage.setItem('analysisAttempts', '0'); 
        setAnalysisAttempts(0);
        toast({
            title: 'Subscription Changed',
            description: 'You are now on the Free plan. (Simulated)',
        });
    }
  };


  if (authLoading || isLoadingProfileData || !user) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const attemptsRemaining = isPremium ? Infinity : Math.max(0, MAX_FREE_ATTEMPTS - analysisAttempts);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0 max-w-3xl">
       <LevelAssessmentModal
        isOpen={showSurveyModal}
        onComplete={handleSurveyComplete}
      />
      <Card className="shadow-xl overflow-hidden border border-primary/20">
        <CardHeader className="bg-gradient-to-br from-primary/80 via-primary to-accent/70 text-primary-foreground p-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-background shadow-lg">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback className="text-2xl bg-background text-primary">{getInitials(user.displayName, user.email)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-headline">{user.displayName || 'Valued User'}</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm flex items-center mt-1">
                <Mail className="mr-2 h-4 w-4" />{user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-primary"><BarChart3 className="mr-2 h-5 w-5" />Trading Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Experience Level:</span>
                  <Badge variant={userLevel ? "secondary" : "outline"} className={userLevel ? "bg-accent/20 text-accent-foreground border-accent/30" : ""}>
                    {getLevelDisplayName(userLevel)}
                  </Badge>
                </div>
                 <Button variant="outline" size="sm" onClick={handleRetakeAssessment} className="w-full text-xs">
                    <Edit3 className="mr-2 h-3.5 w-3.5" /> {userLevel ? 'Retake Assessment' : 'Take Level Assessment'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-primary"><ShieldCheck className="mr-2 h-5 w-5" />Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <Badge variant={isPremium ? "default" : "destructive"} className={isPremium ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}>
                    {isPremium ? <><Star className="mr-1.5 h-4 w-4"/>Premium User</> : 'Free Tier'}
                  </Badge>
                </div>
                {!isPremium && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Analysis Attempts:</span>
                    <span>{analysisAttempts} / {MAX_FREE_ATTEMPTS} used</span>
                  </div>
                )}
                {attemptsRemaining <= 0 && !isPremium && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive-foreground flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
                        You've used all free analysis attempts. Upgrade to continue.
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
          
        </CardContent>
        <CardFooter className="p-6 border-t bg-muted/20">
            <div className="w-full space-y-3">
                {isPremium ? (
                     <Button onClick={handleDowngradeToFree} variant="outline" className="w-full">
                        Switch to Free Plan (Simulated)
                    </Button>
                ) : (
                    <Button 
                        onClick={handleUpgradeToPremiumViaStripe} 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 shadow-lg"
                        disabled={isRedirectingToCheckout || !isStripeKeySet}
                    >
                        {isRedirectingToCheckout ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                        ) : (
                            <Zap className="mr-2 h-5 w-5"/>
                        )}
                         Upgrade to Premium
                    </Button>
                )}
                <p className="text-xs text-center text-muted-foreground mt-1">
                  By upgrading, you agree to our Terms of Service (not yet created).
                </p>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full">
                    Back to Dashboard
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
    

    

    

    

    

    


