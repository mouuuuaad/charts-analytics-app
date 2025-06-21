
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
    // If user is not logged in and auth is not loading,
    // this page will render the form.
    // If the intention is to *only* use Google Sign-In from landing,
    // then this page could also redirect to '/' if !user.
    // For now, keeping it allows email/password login if needed.
    // However, the original request focuses on Google Sign-In via landing page.
    // Let's make it redirect to landing page for consistency if user is not logged in.
    if (!loading && !user) {
        router.push('/');
    }

  }, [user, loading, router]);

  if (loading || user) { // Show loader while checking auth or if user exists (will redirect)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  // This part will effectively not be reached if !user leads to router.push('/')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your Oday Ai dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm">
            Or sign in using the{' '}
            <Link href="/" className="font-medium text-primary hover:underline">
              main page
            </Link>
            .
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
