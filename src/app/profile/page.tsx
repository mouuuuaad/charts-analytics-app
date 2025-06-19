
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, BarChart3, ShieldCheck, Zap, Edit3, AlertTriangle, Star, ExternalLink } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import { useToast } from '@/hooks/use-toast';
import { loadStripe, Stripe } from '@stripe/stripe-js';

type UserLevel = 'beginner' | 'intermediate' | 'advanced';

const MAX_FREE_ATTEMPTS = 2;

// Initialize Stripe.js with your publishable key.
// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);


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


  useEffect(() => {
    setIsLoadingProfileData(true);
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('userTradingLevel') as UserLevel | null;
      setUserLevel(savedLevel);

      const attemptsString = localStorage.getItem('analysisAttempts');
      setAnalysisAttempts(attemptsString ? parseInt(attemptsString, 10) : 0);
      
      const premiumStatus = localStorage.getItem('isUserPremium') === 'true';
      setIsPremium(premiumStatus);
    }
    setIsLoadingProfileData(false);
  }, []);

  useEffect(() => {
    // Check for Stripe Checkout success/cancel query parameters
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
        // Clean the URL
        router.replace('/profile');
      }
    }

    if (paymentCanceled === 'true') {
      toast({
        title: 'Payment Canceled',
        description: 'Your payment process was canceled. You can try again anytime.',
        variant: 'destructive',
        duration: 8000,
      });
      // Clean the URL
      router.replace('/profile');
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
    setIsRedirectingToCheckout(true);
    const stripe = await stripePromise;
    if (!stripe) {
      toast({ title: "Stripe Error", description: "Could not connect to Stripe. Please try again later.", variant: "destructive" });
      setIsRedirectingToCheckout(false);
      return;
    }

    // IMPORTANT: This is a TEST Price ID. 
    // You MUST create your own product and price in your Stripe Dashboard (Test mode)
    // and replace this ID with your actual test Price ID.
    // Example Price IDs for testing might include monthly subscriptions.
    const priceId = 'price_1PGW91DBVAJnzUOxL1dJ63sQ'; 
    // Common test Price ID formats: price_xxxxxxxxxxxxxx

    // The following check for 'PRICE_ID_REPLACE_ME' is removed as we are providing a default test ID.
    // However, for a real application, ensure you have a valid Price ID.
    // if (priceId === 'PRICE_ID_REPLACE_ME_OR_INVALID') { // Example of a check you might have
    //     toast({
    //         title: 'Configuration Needed',
    //         description: 'Stripe Price ID is not configured correctly. Please use a valid test Price ID.',
    //         variant: 'destructive',
    //         duration: 10000,
    //     });
    //     console.error("Developer Note: Replace with your actual Stripe test Price ID in src/app/profile/page.tsx.");
    //     setIsRedirectingToCheckout(false);
    //     return;
    // }

    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription', // Or 'payment' for one-time
      successUrl: `${window.location.origin}/profile?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/profile?payment_canceled=true`,
    });

    if (error) {
      console.error('Stripe redirectToCheckout error:', error);
      toast({ title: "Payment Error", description: error.message || "Could not redirect to checkout.", variant: "destructive" });
      setIsRedirectingToCheckout(false);
    }
    // If redirectToCheckout is successful, the user will be redirected
    // and this part of the code might not be reached immediately.
  };

  // This function is for simulation if Stripe is not fully set up or for testing UI
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
                        disabled={isRedirectingToCheckout}
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
