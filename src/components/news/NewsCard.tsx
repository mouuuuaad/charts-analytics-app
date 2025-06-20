
'use client';

import type { NewsArticle } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge'; // Sentiment Badge no longer used
// Removed: import Image from 'next/image';
import { Heart, ExternalLink, CalendarDays } from 'lucide-react'; // Removed sentiment icons
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
  isWatchlisted: boolean;
  onToggleWatchlist: (article: NewsArticle) => void;
}

// SentimentIndicator component is removed as NewsAPI doesn't directly provide this.
// If sentiment analysis is added via Genkit later, this can be reintroduced.

export function NewsCard({ article, isWatchlisted, onToggleWatchlist }: NewsCardProps) {
  const timeAgo = article.publishedAt ? formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true }) : 'Recently';

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full border border-border/20 rounded-lg">
      {article.imageUrl ? (
        <div className="relative w-full h-48 bg-muted"> {/* Parent needs to be relative for absolute positioning of img */}
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="absolute top-0 left-0 w-full h-full object-cover" // CSS for fill and cover
            data-ai-hint={article.imageHint || 'news image'}
            onError={(e) => {
              // Fallback for broken image links
              (e.target as HTMLImageElement).src = "https://placehold.co/600x400.png";
            }}
          />
        </div>
      ) : ( // Placeholder if no image URL
          <div className="relative w-full h-48 bg-muted flex items-center justify-center">
             <img
                src="https://placehold.co/600x400.png" // Default placeholder
                alt="Default news placeholder"
                className="absolute top-0 left-0 w-full h-full object-cover"
                data-ai-hint={article.imageHint || 'news image abstract'}
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
        <p className="line-clamp-3">{article.summary}</p> {/* Increased to 3 lines for more context */}
      </CardContent>
      <CardFooter className="px-4 py-3 bg-muted/30 border-t border-border/20 flex justify-between items-center">
        {/* SentimentIndicator removed here */}
        <span className="text-xs text-muted-foreground capitalize">{article.topic}</span>
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
