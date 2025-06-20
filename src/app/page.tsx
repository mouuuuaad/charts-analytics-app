
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Zap, ShieldCheck, Brain } from 'lucide-react';
// Using standard img tag for placeholder if next/image causes issues for user preference
// import Image from 'next/image';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (typeof result !== 'string') { 
      router.push('/dashboard');
    } else {
      console.error("Google Sign-In Error:", result);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-3 text-md text-foreground">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-3 text-md text-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="py-3 px-4 md:px-6 absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">ChartSight AI</h1>
          </div>
          <Button variant="outline" onClick={handleGoogleSignIn} size="sm">
             Sign In
          </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-16 bg-background relative">
        {/* Removed complex background image for simplicity */}
        <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
            Unlock Market Insights with <span className="text-primary">AI Analysis</span>
            </h2>
            <p className="text-md md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            ChartSight AI uses AI to analyze financial charts, predict trends, and assess risk for smarter trading.
            </p>
            <Button
            size="lg"
            onClick={handleGoogleSignIn}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-md px-8 py-3" // Simplified button
            >
            <GoogleIcon />
            Login with Google
            </Button>
             <p className="mt-3 text-xs text-muted-foreground">Free to start.</p>
        </div>
      </main>

       <section className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold text-center mb-10 text-foreground">Why ChartSight AI?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 bg-card rounded-md border">
              <Zap className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-medium mb-1 text-foreground">Instant Analysis</h4>
              <p className="text-sm text-muted-foreground">Upload a chart and get AI insights in seconds.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-card rounded-md border">
              <ShieldCheck className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-medium mb-1 text-foreground">Risk & Opportunity</h4>
              <p className="text-sm text-muted-foreground">Understand risks and get trading recommendations.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-card rounded-md border">
              <Brain className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-medium mb-1 text-foreground">Personalized Learning</h4>
              <p className="text-sm text-muted-foreground">Access training tailored to your experience level.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center bg-background border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ChartSight AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
