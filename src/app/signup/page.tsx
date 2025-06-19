
'use client';

import { SignupForm } from '@/components/auth/signup-form';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
    // If user is not logged in and auth is not loading,
    // this page will render the form.
    // For consistency with login page, redirect to landing page if not logged in.
     if (!loading && !user) {
        router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) { // Show loader while checking auth or if user exists (will redirect)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // This part will effectively not be reached if !user leads to router.push('/')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Create an Account</CardTitle>
          <CardDescription>Join ChartSight AI to predict market trends.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
           <p className="mt-4 text-center text-sm">
            Or sign up using the{' '}
            <Link href="/" className="font-medium text-primary hover:underline">
              main page
            </Link>
            .
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
