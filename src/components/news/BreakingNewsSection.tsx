
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { NewsArticle } from '@/types';
import { fetchNewsFromAPI } from '@/lib/newsService';
import { AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns'; // Added parseISO

const REFRESH_INTERVAL = 60 * 1000; // 1 minute in milliseconds

export function BreakingNewsSection() {
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreaking = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The 'breaking' topic is now handled by a specific query in fetchNewsFromAPI
      const articles = await fetchNewsFromAPI('breaking', undefined, true);
      setBreakingNews(articles.slice(0, 5)); // Take top 5 for the ticker
    } catch (err: any) {
      console.error("Failed to fetch breaking news:", err);
      setError(err.message || 'Failed to load breaking news.');
      setBreakingNews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBreaking(); // Initial fetch
    const intervalId = setInterval(fetchBreaking, REFRESH_INTERVAL);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchBreaking]);

  return (
    <div className="p-2 border rounded-md mb-3">
      <h2 className="text-md font-semibold mb-1.5">Breaking News</h2>
      {isLoading && !error && (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center h-24 text-center">
          <AlertTriangle className="w-6 h-6 mb-1" />
          <p className="text-sm">Error: {error}</p>
          <button
            onClick={fetchBreaking}
            className="mt-1.5 px-2 py-0.5 border rounded text-xs hover:bg-muted/50"
          >
            Retry
          </button>
        </div>
      )}
      {!isLoading && !error && breakingNews.length === 0 && (
        <div className="text-center py-3">
          <p className="text-sm text-muted-foreground">No breaking news found at the moment.</p>
        </div>
      )}
      {!isLoading && !error && breakingNews.length > 0 && (
        <ul className="space-y-1">
          {breakingNews.map((article) => (
            <li key={article.id} className="p-1 border-b last:border-b-0">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group hover:bg-muted/20 p-0.5 rounded-sm"
              >
                <h3 className="text-sm font-medium group-hover:underline truncate">
                  {article.headline}
                </h3>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-0.5">
                  <span className="truncate max-w-[150px]">{article.source}</span>
                  <span>
                    {article.publishedAt ? formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true }) : 'Recently'}
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
