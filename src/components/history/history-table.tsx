
'use client';

import type { Analysis } from '@/types'; // No need for getAnalysesForUser
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
import { ArrowUp, ArrowDown, MinusCircle } from 'lucide-react'; // Added MinusCircle for sideways
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryTableProps {
  analyses: Analysis[]; // Accept analyses directly
}

export function HistoryTable({ analyses }: HistoryTableProps) {
  // isLoading and error state management is moved to the parent component (HistoryPage)
  // useEffect fetching data is removed.

  if (!analyses || analyses.length === 0) {
    // This case should ideally be handled by the parent component (HistoryPage)
    // But as a fallback:
    return <p className="text-center text-muted-foreground">No analysis history found.</p>;
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[500px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
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
                      src={analysis.imageUrl}
                      alt={analysis.chartFileName || 'Chart image'}
                      layout="fill"
                      objectFit="contain"
                      data-ai-hint="chart analysis"
                      unoptimized={true} // Data URIs are typically not optimized by Next/Image by default
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
                    formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      analysis.prediction.trendPrediction === 'up' ? 'default' 
                      : analysis.prediction.trendPrediction === 'down' ? 'destructive' 
                      : 'secondary'
                    }
                    className={`${
                      analysis.prediction.trendPrediction === 'up' ? 'bg-green-500 hover:bg-green-600' 
                      : analysis.prediction.trendPrediction === 'down' ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    } text-white`}
                  >
                    {analysis.prediction.trendPrediction === 'up' ? (
                      <ArrowUp className="mr-1 h-4 w-4" />
                    ) : analysis.prediction.trendPrediction === 'down' ? (
                      <ArrowDown className="mr-1 h-4 w-4" />
                    ) : (
                      <MinusCircle className="mr-1 h-4 w-4" />
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
