
'use client';

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
import Image from 'next/image'; // Keep Next/Image for data URIs for basic structure
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, MinusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryTableProps {
  analyses: Analysis[];
}

export function HistoryTable({ analyses }: HistoryTableProps) {

  if (!analyses || analyses.length === 0) {
    return <p className="text-center text-muted-foreground p-4">No analysis history found.</p>;
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[450px] md:h-[500px] rounded-none md:rounded-md border-t md:border"> {/* Simpler border/rounded */}
        <Table className="text-xs md:text-sm"> {/* Smaller text overall */}
          <TableHeader className="sticky top-0 bg-background z-10"> {/* Simpler background */}
            <TableRow>
              <TableHead className="w-[80px] md:w-[100px] px-1 md:px-2 py-1.5">Chart</TableHead> {/* Simplified padding */}
              <TableHead className="px-1 md:px-2 py-1.5">File Name</TableHead>
              <TableHead className="px-1 md:px-2 py-1.5">Date</TableHead>
              <TableHead className="px-1 md:px-2 py-1.5">Trend</TableHead>
              <TableHead className="text-right px-1 md:px-2 py-1.5">Confidence</TableHead>
              <TableHead className="px-1 md:px-2 py-1.5">Reasoning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyses.map((analysis) => (
              <TableRow key={analysis.id}>
                <TableCell className="px-1 md:px-2 py-1.5">
                  <div className="w-16 h-10 md:w-20 md:h-12 relative rounded overflow-hidden border bg-muted"> {/* Simplified */}
                    <Image
                      src={analysis.imageUrl}
                      alt={analysis.chartFileName || 'Chart image'}
                      layout="fill"
                      objectFit="contain"
                      data-ai-hint="chart analysis"
                      unoptimized={true} 
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium max-w-[100px] md:max-w-[150px] truncate px-1 md:px-2 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{analysis.chartFileName || 'N/A'}</span>
                    </TooltipTrigger>
                    <TooltipContent> <p>{analysis.chartFileName || 'N/A'}</p> </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="px-1 md:px-2 py-1.5 whitespace-nowrap">
                  {analysis.createdAt ? formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true }) : 'N/A'}
                </TableCell>
                <TableCell className="px-1 md:px-2 py-1.5">
                  <Badge 
                    variant="outline" // Simpler variant
                    className="text-xs px-1 py-0 capitalize" // Simplified padding/colors
                  >
                    {analysis.prediction.trendPrediction === 'up' ? <ArrowUp className="mr-0.5 h-3 w-3" />
                    : analysis.prediction.trendPrediction === 'down' ? <ArrowDown className="mr-0.5 h-3 w-3" />
                    : <MinusCircle className="mr-0.5 h-3 w-3" />}
                    {analysis.prediction.trendPrediction}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-1 md:px-2 py-1.5">
                  {Math.round(analysis.prediction.confidence * 100)}%
                </TableCell>
                <TableCell className="max-w-xs truncate px-1 md:px-2 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild><span>{analysis.prediction.reason}</span></TooltipTrigger>
                    <TooltipContent className="max-w-sm"> <p className="text-sm whitespace-pre-wrap">{analysis.prediction.reason}</p> </TooltipContent>
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
