
'use client';

import type { NewsArticle } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink, CalendarDays } from 'lucide-react'; 
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
  isWatchlisted: boolean;
  onToggleWatchlist: (article: NewsArticle) => void;
}

export function NewsCard({ article, isWatchlisted, onToggleWatchlist }: NewsCardProps) {
  const timeAgo = article.publishedAt ? formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true }) : 'Recently';

  return (
    <Card className="flex flex-col overflow-hidden h-full border rounded-md"> {/* Simplified card styling */}
      {article.imageUrl ? (
        <div className="relative w-full h-40 bg-muted"> {/* Reduced height */}
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="absolute top-0 left-0 w-full h-full object-cover"
            data-ai-hint={article.imageHint || 'news image'}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x240.png"; // Smaller placeholder
            }}
          />
        </div>
      ) : ( 
          <div className="relative w-full h-40 bg-muted flex items-center justify-center">
             <img
                src="https://placehold.co/400x240.png" 
                alt="Default news placeholder"
                className="absolute top-0 left-0 w-full h-full object-cover"
                data-ai-hint={article.imageHint || 'news image abstract'}
             />
          </div>
      )}
      <CardHeader className="pb-2 pt-3 px-3"> {/* Reduced padding */}
        <CardTitle className="text-md font-medium leading-snug line-clamp-2 hover:text-primary"> {/* Simpler font, line-clamp */}
          <a href={article.url} target="_blank" rel="noopener noreferrer" title={article.headline}>
            {article.headline}
          </a>
        </CardTitle>
         <div className="text-xs text-muted-foreground flex items-center pt-0.5">
            <CalendarDays className="h-3 w-3 mr-1" />
            <span>{article.source} - {timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 text-sm text-muted-foreground flex-grow">
        <p className="line-clamp-3">{article.summary}</p> 
      </CardContent>
      <CardFooter className="px-3 py-2 bg-muted/50 border-t flex justify-between items-center"> {/* Reduced padding */}
        <span className="text-xs text-muted-foreground capitalize">{article.topic}</span>
        <div className="flex items-center gap-1.5"> {/* Reduced gap */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleWatchlist(article)}
            aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            className="text-muted-foreground hover:text-primary h-7 w-7" // Smaller button
            title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} />
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs h-7 px-2"> {/* Smaller button */}
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
