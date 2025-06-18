
'use client';

import { SignupForm } from '@/components/auth/signup-form';
// import { useAuth } from '@/contexts/auth-context'; // Auth is disabled
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  // const { user, loading } = useAuth(); // Auth is disabled
  const router = useRouter();

  useEffect(() => {
    // If auth is disabled, redirect to home page.
     router.push('/');
  }, [router]);

  // This content will likely not be shown due to immediate redirect.
  // Or, show a message that auth is disabled.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Authentication is currently disabled.</p>
        <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
      </div>
      {/* Original form, hidden as auth is disabled
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Create an Account</CardTitle>
          <CardDescription>Join ChartSight AI to predict market trends. (Authentication currently disabled)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">Authentication is temporarily disabled.</p>
          <SignupForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}
