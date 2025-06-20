
'use client';

import type { TrendingTicker } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TrendingTickersSidebarProps {
  tickers: TrendingTicker[];
  isLoading: boolean;
}

export function TrendingTickersSidebar({ tickers, isLoading }: TrendingTickersSidebarProps) {
  if (isLoading) {
    return (
      <Card className="border"> {/* Removed shadow */}
        <CardHeader className="p-3">
          <CardTitle className="text-lg font-medium text-primary">Trending</CardTitle> {/* Simplified */}
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-1.5 rounded bg-muted/50 animate-pulse">
              <div className="h-3.5 w-14 bg-muted rounded"></div>
              <div className="h-3.5 w-8 bg-muted rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!tickers || tickers.length === 0) {
    return (
      <Card className="border">
        <CardHeader className="p-3">
          <CardTitle className="text-lg font-medium text-primary">Trending</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-sm text-muted-foreground">No trending tickers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border h-full"> {/* Removed shadow */}
      <CardHeader className="p-3">
        <CardTitle className="text-lg font-medium text-primary">Trending Today</CardTitle>
      </CardHeader>
      <CardContent className="p-0"> {/* Remove CardContent padding, handle in ScrollArea */}
        <ScrollArea className="h-[380px] px-3 pb-3"> {/* Adjusted height and padding */}
          <ul className="space-y-2">
            {tickers.map((ticker) => (
              <li key={ticker.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50 border border-transparent hover:border-border/70">
                <div>
                  <span className="font-medium text-sm text-foreground">{ticker.ticker}</span>
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">{ticker.name}</p>
                </div>
                <Badge
                  variant="outline" // Simpler badge variant
                  className={`text-xs tabular-nums px-1.5 py-0.5 ${ticker.changePercent >= 0 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}
                >
                  {ticker.changePercent >= 0 ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
                  {ticker.changePercent.toFixed(2)}%
                </Badge>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
