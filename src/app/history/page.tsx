
'use client';

import { HistoryTable } from '@/components/history/history-table';
// import { useRequireAuth } from '@/hooks/use-require-auth'; // Auth disabled
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Loader2 } from 'lucide-react'; // Not needed if auth disabled

export default function HistoryPage() {
  // const { user, loading } = useRequireAuth(); // Auth disabled

  // if (loading || !user) {  // Auth disabled
  //   return (
  //     <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //     </div>
  //   );
  // }

  // When auth is disabled, user will be null. HistoryTable needs a userId.
  // We should display a message indicating history is unavailable.
  const user = null; // Simulate no user when auth is disabled

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Analysis History</CardTitle>
          <CardDescription>Review your past chart analyses and predictions.</CardDescription>
        </CardHeader>
        <CardContent>
          { user ? ( // This will be false
             <HistoryTable userId={user.uid} /> 
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-lg text-muted-foreground">
                Analysis history is unavailable as authentication is currently disabled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
