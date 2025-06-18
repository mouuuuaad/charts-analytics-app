'use client';

import { HistoryTable } from '@/components/history/history-table';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function HistoryPage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Analysis History</CardTitle>
          <CardDescription>Review your past chart analyses and predictions.</CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryTable userId={user.uid} />
        </CardContent>
      </Card>
    </div>
  );
}
