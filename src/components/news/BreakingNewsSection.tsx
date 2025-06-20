
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { NewsArticle } from '@/types';
import { fetchNewsFromAPI } from '@/lib/newsService';
import { AlertTriangle, Loader2, ExternalLink, Newspaper } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const REFRESH_INTERVAL = 60 * 1000 * 2; // 2 minutes in milliseconds
const ITEMS_TO_FETCH = 7; // Fetch a few items for the ticker

export function BreakingNewsSection() {
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreaking = useCallback(async () => {
    // Don't set isLoading to true if we already have news, to avoid flicker on refresh
    if (breakingNews.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const articles = await fetchNewsFromAPI('breaking', undefined, true); // true for isBreakingNews
      setBreakingNews(articles.slice(0, ITEMS_TO_FETCH)); 
    } catch (err: any) {
      console.error("Failed to fetch breaking news:", err);
      setError(err.message || 'Failed to load breaking news.');
      setBreakingNews([]); // Clear news on error
    } finally {
      setIsLoading(false);
    }
  }, [breakingNews.length]); // Add breakingNews.length to dependencies

  useEffect(() => {
    fetchBreaking(); // Initial fetch
    const intervalId = setInterval(fetchBreaking, REFRESH_INTERVAL);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchBreaking]);


  if (isLoading && breakingNews.length === 0) {
    return (
      <div className="p-2 border-y border-border bg-muted h-12 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading breaking news...</span>
      </div>
    );
  }

  if (error && breakingNews.length === 0) {
    return (
      <div className="p-2 border-y border-border bg-destructive/10 h-12 flex items-center justify-center text-destructive">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="text-sm">Error: {error}</span>
        <button
            onClick={fetchBreaking}
            className="ml-3 px-2 py-0.5 border border-destructive rounded text-xs hover:bg-destructive/20"
          >
            Retry
        </button>
      </div>
    );
  }
  
  if (!isLoading && breakingNews.length === 0 && !error) {
      return (
        <div className="p-2 border-y border-border bg-muted h-12 flex items-center justify-center">
            <Newspaper className="h-5 w-5 mr-2 text-muted-foreground"/>
            <span className="text-sm text-muted-foreground">No breaking news at the moment.</span>
        </div>
      );
  }


  // Only render ticker if there's news to display
  if (breakingNews.length === 0) {
      return null; 
  }
  
  // Duplicate news items for seamless looping, only if there are items
  const duplicatedNews = breakingNews.length > 0 ? [...breakingNews, ...breakingNews] : [];

  return (
    <div className="ticker-container mb-3" dir="ltr"> {/* Force LTR for scroll direction consistency */}
      <div className="ticker-track">
        {duplicatedNews.map((article, index) => (
          <React.Fragment key={`${article.id}-${index}`}>
            <div className="ticker-item">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0" />
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ticker-item-link"
                title={article.headline}
              >
                {article.headline}
              </a>
              <span className="ticker-item-source-time">
                ({article.source} - {article.publishedAt ? formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true }) : 'Recently'})
              </span>
            </div>
            {index < duplicatedNews.length -1 && <span className="ticker-item-separator">|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
