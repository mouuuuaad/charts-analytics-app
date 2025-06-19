
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, BarChart3, ShieldCheck, Zap, Edit3, AlertTriangle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation'; // For navigation
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal'; // For retaking assessment
import { useToast } from '@/hooks/use-toast';

type UserLevel = 'beginner' | 'intermediate' | 'advanced';

const MAX_FREE_ATTEMPTS = 2;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  useRequireAuth(); // Ensures user is authenticated
  const router = useRouter();
  const { toast } = useToast();

  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [analysisAttempts, setAnalysisAttempts] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(true);


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
  
  // Placeholder function to simulate upgrading to premium
  const handleUpgradeToPremium = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'true');
        setIsPremium(true);
        // Optionally reset attempts or grant more
        localStorage.setItem('analysisAttempts', '0'); 
        setAnalysisAttempts(0);
        toast({
            title: 'Congratulations!',
            description: 'You are now a Premium user! (Simulated)',
        });
    }
  };

  // Placeholder function to simulate downgrading to free (for testing)
  const handleDowngradeToFree = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('isUserPremium', 'false');
        setIsPremium(false);
        localStorage.setItem('analysisAttempts', '0'); // Reset attempts for free tier
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
          
          {/* Placeholder for Age - not available from Google directly */}
          {/* 
          <div className="space-y-1">
            <Label htmlFor="age" className="text-xs text-muted-foreground">Age (Optional)</Label>
            <Input id="age" placeholder="Enter your age" disabled className="text-sm" />
            <p className="text-xs text-muted-foreground italic">Age information is not yet editable.</p>
          </div>
          */}

        </CardContent>
        <CardFooter className="p-6 border-t bg-muted/20">
            <div className="w-full space-y-3">
                {isPremium ? (
                     <Button onClick={handleDowngradeToFree} variant="outline" className="w-full">
                        Switch to Free Plan (Simulated)
                    </Button>
                ) : (
                    <Button onClick={handleUpgradeToPremium} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-6 shadow-lg">
                        <Zap className="mr-2 h-5 w-5"/> Upgrade to Premium (Simulated)
                    </Button>
                )}
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full">
                    Back to Dashboard
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

