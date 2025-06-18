'use client';

import { useEffect, useState } from 'react';
import { getAnalysesForUser } from '@/services/firestore';
import type { Analysis } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, AlertCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryTableProps {
  userId: string;
}

export function HistoryTable({ userId }: HistoryTableProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyses() {
      setIsLoading(true);
      setError(null);
      try {
        const userAnalyses = await getAnalysesForUser(userId);
        setAnalyses(userAnalyses);
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
        setError('Could not load analysis history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalyses();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px] text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return <p className="text-center text-muted-foreground">No analysis history found.</p>;
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[500px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <TableRow>
              <TableHead className="w-[120px]">Chart</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Reasoning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyses.map((analysis) => (
              <TableRow key={analysis.id}>
                <TableCell>
                  <div className="w-24 h-16 relative rounded-md overflow-hidden border bg-muted">
                    <Image
                      src={analysis.imageUrl} // Assuming imageUrl is base64 data URI
                      alt={analysis.chartFileName || 'Chart image'}
                      layout="fill"
                      objectFit="contain"
                      data-ai-hint="chart analysis"
                      unoptimized={analysis.imageUrl.startsWith('data:')} // unoptimize for data URIs
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium max-w-[150px] truncate">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{analysis.chartFileName || 'N/A'}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{analysis.chartFileName || 'N/A'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {analysis.createdAt ? 
                    formatDistanceToNow(analysis.createdAt.toDate(), { addSuffix: true })
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={analysis.prediction.trendPrediction === 'up' ? 'default' : 'destructive'}
                    className={`${analysis.prediction.trendPrediction === 'up' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                  >
                    {analysis.prediction.trendPrediction === 'up' ? (
                      <ArrowUp className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="mr-1 h-4 w-4" />
                    )}
                    {analysis.prediction.trendPrediction.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {Math.round(analysis.prediction.confidence * 100)}%
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{analysis.prediction.reason}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <p className="text-sm whitespace-pre-wrap">{analysis.prediction.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </TooltipProvider>
  );
}
