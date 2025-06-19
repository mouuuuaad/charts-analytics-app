
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Zap, ShieldCheck, Brain } from 'lucide-react';
import Image from 'next/image';

// Simple SVG for Google icon
const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
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
    if (typeof result !== 'string') { // Assuming UserCredential on success
      router.push('/dashboard');
    } else {
      // Handle error, maybe show a toast
      console.error("Google Sign-In Error:", result);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading ChartSight AI...</p>
      </div>
    );
  }

  if (user) {
     // This case should be handled by useEffect redirect, but as a fallback:
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="py-4 px-6 md:px-10 bg-transparent absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-foreground">ChartSight AI</h1>
          </div>
          <Button variant="outline" onClick={handleGoogleSignIn} className="rounded-full">
             Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
            {/* Subtle background pattern or image placeholder */}
             <Image src="https://placehold.co/1920x1080.png" alt="Abstract background" layout="fill" objectFit="cover" className="opacity-30" data-ai-hint="abstract lines" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
            <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight text-foreground mb-6">
            Unlock Market Insights with <span className="text-primary">AI-Powered</span> Chart Analysis
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            ChartSight AI leverages cutting-edge artificial intelligence to analyze financial charts, predict trends, and assess risk, helping you make smarter trading decisions.
            </p>
            <Button
            size="lg"
            onClick={handleGoogleSignIn}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg px-10 py-7 shadow-lg transition-transform duration-150 hover:scale-105"
            >
            <GoogleIcon />
            Login with Google & Get Started
            </Button>
             <p className="mt-4 text-xs text-muted-foreground">Free to start. No credit card required.</p>
        </div>
      </main>

      {/* Features Section (Optional) */}
       <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-headline font-bold text-center mb-12 text-foreground">Why ChartSight AI?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-lg border border-border/20">
              <Zap className="h-12 w-12 text-accent mb-4" />
              <h4 className="text-xl font-semibold mb-2 text-foreground">Instant Analysis</h4>
              <p className="text-muted-foreground">Upload any chart image and get AI-driven insights in seconds. No complex setups.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-lg border border-border/20">
              <ShieldCheck className="h-12 w-12 text-accent mb-4" />
              <h4 className="text-xl font-semibold mb-2 text-foreground">Risk & Opportunity</h4>
              <p className="text-muted-foreground">Understand potential risks, opportunities, and get tailored trading recommendations.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-lg border border-border/20">
              <Brain className="h-12 w-12 text-accent mb-4" />
              <h4 className="text-xl font-semibold mb-2 text-foreground">Personalized Learning</h4>
              <p className="text-muted-foreground">Access training materials customized to your trading experience level.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center bg-background border-t border-border/20">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} ChartSight AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
