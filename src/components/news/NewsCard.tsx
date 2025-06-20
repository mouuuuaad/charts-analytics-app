
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
    <Card className="flex flex-col overflow-hidden h-full border rounded"> {/* Simplified rounded */}
      {article.imageUrl ? (
        <div className="relative w-full h-36 bg-muted"> {/* Reduced height */}
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="absolute top-0 left-0 w-full h-full object-cover"
            data-ai-hint={article.imageHint || 'news image'}
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/300x180.png"; }} /* Smaller placeholder */
          />
        </div>
      ) : ( 
          <div className="relative w-full h-36 bg-muted flex items-center justify-center">
             <img
                src="https://placehold.co/300x180.png" 
                alt="Default news placeholder"
                className="absolute top-0 left-0 w-full h-full object-cover"
                data-ai-hint={article.imageHint || 'news image abstract'}
             />
          </div>
      )}
      <CardHeader className="pb-1 pt-2 px-2"> {/* Reduced padding */}
        <CardTitle className="text-sm font-medium leading-tight line-clamp-2 hover:underline"> {/* Simpler */}
          <a href={article.url} target="_blank" rel="noopener noreferrer" title={article.headline}>
            {article.headline}
          </a>
        </CardTitle>
         <div className="text-xs text-muted-foreground flex items-center pt-0.5">
            <CalendarDays className="h-3 w-3 mr-0.5" /> {/* Smaller icon/margin */}
            <span className="truncate">{article.source} - {timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-1.5 text-xs text-muted-foreground flex-grow"> {/* Simplified */}
        <p className="line-clamp-3">{article.summary}</p> 
      </CardContent>
      <CardFooter className="px-2 py-1.5 border-t flex justify-between items-center"> {/* Simplified padding */}
        <span className="text-xs text-muted-foreground capitalize">{article.topic}</span>
        <div className="flex items-center gap-1"> {/* Reduced gap */}
          <Button
            variant="ghost" size="icon" onClick={() => onToggleWatchlist(article)}
            aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            className="h-6 w-6" /* Smaller button */ title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart className={`h-3.5 w-3.5 ${isWatchlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-destructive'}`} />
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs h-6 px-1.5"> {/* Smaller button */}
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read <ExternalLink className="ml-0.5 h-3 w-3" /> {/* Smaller icon/margin */}
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
