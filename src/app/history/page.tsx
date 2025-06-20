
'use client';

import { useEffect, useState } from 'react';
import { HistoryTable } from '@/components/history/history-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Analysis } from '@/types';
import { AlertCircle, Loader2 } from 'lucide-react'; 

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
          parsedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAnalyses(parsedHistory);
        } else {
          setAnalyses([]); 
        }
      } catch (e) {
        console.error('Failed to load history from localStorage:', e);
        setError('Could not load analysis history.'); // Simplified
        setAnalyses([]);
      }
    } else {
      setAnalyses([]); 
    }
    setIsLoading(false);
  }, []);

  return (
    <div className="container mx-auto py-4 px-2 md:px-4"> {/* Reduced padding */}
      <Card className="border"> {/* Removed shadow */}
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="text-2xl text-primary">Analysis History</CardTitle> {/* Simpler font */}
          <CardDescription className="text-xs">Past chart analyses stored locally.</CardDescription> {/* Simplified */}
        </CardHeader>
        <CardContent className="p-3 md:p-4"> {/* Adjusted padding */}
          {isLoading ? (
            <div className="flex h-[150px] items-center justify-center"> {/* Reduced height */}
              <Loader2 className="h-10 w-10 animate-spin text-primary" /> {/* Smaller loader */}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[150px] text-center text-destructive">
              <AlertCircle className="h-7 w-7 mb-2" /> {/* Smaller icon */}
              <p className="text-md">{error}</p>
            </div>
          ) : analyses.length > 0 ? (
            <HistoryTable analyses={analyses} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
              <p className="text-md text-muted-foreground">
                No analysis history found.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Perform analyses on the dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
