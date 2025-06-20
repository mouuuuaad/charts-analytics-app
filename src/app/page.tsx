
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3 } from 'lucide-react'; // Removed Zap, ShieldCheck, Brain

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
      // Successfully signed in (result is UserCredential)
      router.push('/dashboard');
    } else {
      // An error occurred (result is an error message string)
      // Only log the error if it's not the user closing the popup.
      if (!result.includes('auth/popup-closed-by-user')) {
        console.error("Google Sign-In Error:", result);
        // You could add a toast notification here for other types of errors if desired
        // import { useToast } from '@/hooks/use-toast';
        // const { toast } = useToast();
        // toast({ variant: 'destructive', title: 'Sign-In Failed', description: result });
      }
      // If it is 'auth/popup-closed-by-user', we simply do nothing here (no console error).
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin" /> {/* Removed text-primary */}
        <p className="mt-2 text-sm">Loading...</p> {/* Simplified text */}
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin" /> {/* Removed text-primary */}
        <p className="mt-2 text-sm">Redirecting...</p> {/* Simplified text */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="py-3 px-4 md:px-6 absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> {/* Removed text-primary */}
            <h1 className="text-lg font-semibold">ChartSight AI</h1> {/* Simplified */}
          </div>
          <Button variant="outline" onClick={handleGoogleSignIn} size="sm">
             Sign In
          </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-16 relative">
        <div className="relative z-10 max-w-xl"> {/* Reduced max-width */}
            <h2 className="text-3xl md:text-4xl font-bold mb-4"> {/* Simplified text size */}
            Unlock Market Insights
            </h2>
            <p className="text-md text-muted-foreground mb-6 max-w-md mx-auto"> {/* Simplified */}
            AI to analyze financial charts, predict trends, and assess risk.
            </p>
            <Button
            size="lg"
            onClick={handleGoogleSignIn}
            className="text-md px-6 py-2.5" // Simplified button classes
            >
            <GoogleIcon />
            Login with Google
            </Button>
             <p className="mt-2 text-xs text-muted-foreground">Free to start.</p>
        </div>
      </main>

       <section className="py-10 md:py-12"> {/* Simplified padding */}
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-semibold text-center mb-8">Why ChartSight AI?</h3> {/* Simplified */}
          <div className="grid md:grid-cols-3 gap-4"> {/* Reduced gap */}
            <div className="flex flex-col items-center text-center p-3 border rounded-md"> {/* Simplified */}
              {/* <Zap className="h-8 w-8 mb-2" /> Removed text-primary */}
              <h4 className="text-md font-medium mb-1">Instant Analysis</h4>
              <p className="text-sm text-muted-foreground">Upload a chart, get AI insights.</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 border rounded-md"> {/* Simplified */}
              {/* <ShieldCheck className="h-8 w-8 mb-2" /> Removed text-primary */}
              <h4 className="text-md font-medium mb-1">Risk & Opportunity</h4>
              <p className="text-sm text-muted-foreground">Understand risks, get recommendations.</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 border rounded-md"> {/* Simplified */}
              {/* <Brain className="h-8 w-8 mb-2" /> Removed text-primary */}
              <h4 className="text-md font-medium mb-1">Personalized Learning</h4>
              <p className="text-sm text-muted-foreground">Access tailored training.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-5 text-center border-t"> {/* Simplified */}
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} ChartSight AI.</p> {/* Simplified */}
      </footer>
    </div>
  );
}
