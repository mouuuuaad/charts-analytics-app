
'use client';

import type { NewsArticle } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { TrendingUp, TrendingDown, MinusCircle, Heart, ExternalLink, CalendarDays, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
  isWatchlisted: boolean;
  onToggleWatchlist: (article: NewsArticle) => void;
}

const SentimentIndicator: React.FC<{ sentiment: NewsArticle['sentiment'] }> = ({ sentiment }) => {
  switch (sentiment) {
    case 'positive':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs"><TrendingUp className="mr-1 h-3.5 w-3.5" /> Positive</Badge>;
    case 'negative':
      return <Badge variant="destructive" className="text-xs"><TrendingDown className="mr-1 h-3.5 w-3.5" /> Negative</Badge>;
    case 'neutral':
      return <Badge variant="secondary" className="text-xs"><MinusCircle className="mr-1 h-3.5 w-3.5" /> Neutral</Badge>;
    default:
      return null;
  }
};

export function NewsCard({ article, isWatchlisted, onToggleWatchlist }: NewsCardProps) {
  const timeAgo = article.publishedAt ? formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true }) : 'Recently';

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full border border-border/20 rounded-lg">
      {article.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={article.imageUrl}
            alt={article.headline}
            layout="fill"
            objectFit="cover"
            data-ai-hint={article.imageHint || 'news image'}
          />
        </div>
      )}
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">
          <a href={article.url} target="_blank" rel="noopener noreferrer" title={article.headline}>
            {article.headline}
          </a>
        </CardTitle>
         <div className="text-xs text-muted-foreground flex items-center pt-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            <span>{article.source} - {timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-sm text-muted-foreground flex-grow">
        <p className="line-clamp-2">{article.summary}</p>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-muted/30 border-t border-border/20 flex justify-between items-center">
        <SentimentIndicator sentiment={article.sentiment} />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleWatchlist(article)}
            aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            className="text-muted-foreground hover:text-primary"
            title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart className={`h-5 w-5 transition-all ${isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} />
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read More <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
