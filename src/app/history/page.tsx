
'use client';

import { useEffect, useState } from 'react';
import { HistoryTable } from '@/components/history/history-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Analysis } from '@/types';
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2 for initial loading state

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    if (typeof window !== 'undefined') {
      try {
        const historyString = localStorage.getItem('chartSightAnalysesHistory');
        if (historyString) {
          const parsedHistory: Analysis[] = JSON.parse(historyString);
          // Ensure createdAt is valid for Date constructor and sort by date
          parsedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAnalyses(parsedHistory);
        } else {
          setAnalyses([]); // No history found
        }
      } catch (e) {
        console.error('Failed to load history from localStorage:', e);
        setError('Could not load analysis history. Data might be corrupted.');
        setAnalyses([]);
      }
    } else {
      setAnalyses([]); // Should not happen in client component, but as a fallback
    }
    setIsLoading(false);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Analysis History</CardTitle>
          <CardDescription>Review your past chart analyses and predictions stored locally.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-lg">{error}</p>
            </div>
          ) : analyses.length > 0 ? (
            <HistoryTable analyses={analyses} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-lg text-muted-foreground">
                No analysis history found in local storage.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Perform some analyses on the dashboard, and they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
