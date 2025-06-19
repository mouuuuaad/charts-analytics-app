
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
      <Card className="shadow-md border-border/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Trending Tickers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-2 rounded-md bg-muted/50 animate-pulse">
              <div className="h-4 w-16 bg-muted rounded"></div>
              <div className="h-4 w-10 bg-muted rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!tickers || tickers.length === 0) {
    return (
      <Card className="shadow-md border-border/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Trending Tickers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No trending tickers available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-border/20 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Trending Tickers Today</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3"> {/* Adjust height as needed */}
          <ul className="space-y-3">
            {tickers.map((ticker) => (
              <li key={ticker.id} className="flex justify-between items-center p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30">
                <div>
                  <span className="font-medium text-foreground">{ticker.ticker}</span>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{ticker.name}</p>
                </div>
                <Badge
                  variant={ticker.changePercent >= 0 ? 'default' : 'destructive'}
                  className={`text-xs tabular-nums ${ticker.changePercent >= 0 ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600'}`}
                >
                  {ticker.changePercent >= 0 ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
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
