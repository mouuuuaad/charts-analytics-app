
'use client';

import type { TrendingTicker } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '../ui/badge'; // Assuming Badge is from here

export function TrendingTickersSidebar({ tickers, isLoading }: TrendingTickersSidebarProps) {
  if (isLoading) {
    return (
      <Card className="border">
        <CardHeader className="p-2"> {/* Simplified padding */}
          <CardTitle className="text-md font-medium">Trending</CardTitle> {/* Simplified */}
        </CardHeader>
        <CardContent className="space-y-1.5 p-2"> {/* Simplified padding & spacing */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-1 rounded bg-muted/50 animate-pulse"> {/* Simplified */}
              <div className="h-3 w-12 bg-muted rounded"></div>
              <div className="h-3 w-7 bg-muted rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!tickers || tickers.length === 0) {
    return (
      <Card className="border">
        <CardHeader className="p-2">
          <CardTitle className="text-md font-medium">Trending</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <p className="text-sm text-muted-foreground">No trending tickers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border h-full">
      <CardHeader className="p-2">
        <CardTitle className="text-md font-medium">Trending Today</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-2 pb-2"> {/* Adjusted height and padding */}
          <ul className="space-y-1.5"> {/* Simplified spacing */}
            {tickers.map((ticker) => (
              <li key={ticker.id} className="flex justify-between items-center p-1.5 rounded hover:bg-muted/30 border border-transparent hover:border-border/50"> {/* Simpler */}
                <div>
                  <span className="font-medium text-sm">{ticker.ticker}</span>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{ticker.name}</p> {/* Simplified */}
                </div>
                <Badge
                  variant="outline" 
                  className={`text-xs tabular-nums px-1 py-0 ${ticker.changePercent >= 0 ? 'border-foreground' : 'border-destructive text-destructive'}`} // Simplified colors
                >
                  {ticker.changePercent >= 0 ? <TrendingUp className="mr-0.5 h-2.5 w-2.5" /> : <TrendingDown className="mr-0.5 h-2.5 w-2.5" />}
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
