
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
          // Sort by date descending (newest first)
          parsedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAnalyses(parsedHistory);
        } else {
          setAnalyses([]); 
        }
      } catch (e) {
        console.error('Failed to load history from localStorage:', e);
        setError('Could not load analysis history.');
        setAnalyses([]);
      }
    } else {
      // For SSR or environments where localStorage is not available
      setAnalyses([]); 
    }
    setIsLoading(false);
  }, []);

  return (
    <div className="container mx-auto py-2 px-1 md:px-2"> {/* Extremely reduced padding */}
      <Card className="border-0 md:border"> {/* No border on mobile, border on md+ */}
        <CardHeader className="p-2 md:p-3"> {/* Reduced padding */}
          <CardTitle className="text-lg">Analysis History</CardTitle> {/* Simplified font */}
          <CardDescription className="text-xs">Locally stored past analyses.</CardDescription> {/* Simplified */}
        </CardHeader>
        <CardContent className="p-0 md:p-2"> {/* No padding on mobile, some on md+ */}
          {isLoading ? (
            <div className="flex h-[100px] items-center justify-center"> {/* Reduced height */}
              <Loader2 className="h-8 w-8 animate-spin" /> {/* Smaller loader */}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[100px] text-center p-2">
              <AlertCircle className="h-6 w-6 mb-1" /> {/* Smaller icon */}
              <p className="text-sm">{error}</p>
            </div>
          ) : analyses.length > 0 ? (
            <HistoryTable analyses={analyses} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[100px] text-center p-2">
              <p className="text-sm text-muted-foreground"> No analysis history found. </p>
              <p className="text-xs text-muted-foreground mt-0.5"> Perform analyses on the dashboard. </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
