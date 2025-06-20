
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { NewsArticle, NewsTopic, TrendingTicker, WatchlistItem } from '@/types';
import { getMockTrendingTickers } from '@/lib/mockNewsData'; 
import { fetchNewsFromAPI } from '@/lib/newsService'; 
import { NewsCard } from '@/components/news/NewsCard';
import { TrendingTickersSidebar } from '@/components/news/TrendingTickersSidebar';
import { FloatingAIButton } from '@/components/news/FloatingAIButton';
import { BreakingNewsSection } from '@/components/news/BreakingNewsSection'; // Added
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Bitcoin, Landmark, BadgeDollarSign, Globe, LayoutGrid, AlertTriangle, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

const WATCHLIST_STORAGE_KEY = 'newsWatchlist';
const MAX_WATCHLIST_ITEMS = 50;

export default function NewsPage() {
  const [selectedTopic, setSelectedTopic] = useState<NewsTopic>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [trendingTickers, setTrendingTickers] = useState<TrendingTicker[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingTickers, setIsLoadingTickers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
      } catch (e) { 
        console.error("Failed to load watchlist:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load watchlist.' });
      }
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist)); }
      catch (e) { console.error("Failed to save watchlist:", e); }
    }
  }, [watchlist]);

  const fetchNews = useCallback(async (topic: NewsTopic, term?: string) => {
    setIsLoadingNews(true); setError(null);
    try {
      const articles = await fetchNewsFromAPI(topic, term, false); // false for isBreakingNews
      setNewsArticles(articles);
    } catch (err: any) {
      console.error("Failed to fetch news:", err);
      const errorMessage = err.message || 'Failed to load news.';
      setError(errorMessage); setNewsArticles([]); 
      toast({ variant: 'destructive', title: 'News Fetch Error', description: errorMessage, duration: 7000});
    } finally {
      setIsLoadingNews(false);
    }
  }, [toast]);

  const fetchTrendingTickers = useCallback(async () => {
    setIsLoadingTickers(true);
    try {
      const tickers = await getMockTrendingTickers(); 
      setTrendingTickers(tickers);
    } catch (err) {
      console.error("Failed to fetch tickers:", err);
      toast({ variant: 'destructive', title: 'Tickers Error', description: 'Could not load tickers.'});
    } finally {
      setIsLoadingTickers(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNews(selectedTopic, debouncedSearchTerm);
  }, [selectedTopic, debouncedSearchTerm, fetchNews]);

  useEffect(() => {
    fetchTrendingTickers();
  }, [fetchTrendingTickers]);

  const handleToggleWatchlist = (article: NewsArticle) => {
    setWatchlist((prevWatchlist) => {
      const existingIndex = prevWatchlist.findIndex(item => item.articleId === article.id);
      if (existingIndex > -1) {
        toast({ title: 'Removed from Watchlist', description: `"${article.headline.substring(0,20)}..." removed.` });
        return prevWatchlist.filter(item => item.articleId !== article.id);
      } else {
        if (prevWatchlist.length >= MAX_WATCHLIST_ITEMS) {
            toast({ variant: 'destructive', title: 'Watchlist Full', description: `Max ${MAX_WATCHLIST_ITEMS} items.` });
            return prevWatchlist;
        }
        toast({ title: 'Added to Watchlist', description: `"${article.headline.substring(0,20)}..." saved.` });
        const newItem: WatchlistItem = { 
            articleId: article.id, addedAt: new Date().toISOString(), headline: article.headline,
            source: article.source, topic: article.topic, imageUrl: article.imageUrl,
            imageHint: article.imageHint, url: article.url,
        };
        return [newItem, ...prevWatchlist];
      }
    });
  };

  const topicIcons: Record<NewsTopic, React.ElementType> = {
    all: LayoutGrid, crypto: Bitcoin, stocks: Landmark, forex: BadgeDollarSign, 'global-economy': Globe,
  };
  
  const topicLabels: Record<NewsTopic, string> = {
    all: "All", crypto: "Crypto", stocks: "Stocks", forex: "Forex", 'global-economy': "Economy",
  };

  return (
    <div className="container mx-auto py-3 px-2 md:px-3 space-y-3"> {/* Simplified padding/spacing */}
      <Card className="border">
        <CardHeader className="p-2 md:p-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2"> {/* Simplified gap */}
            <div className="flex items-center">
                <Newspaper className="h-6 w-6 mr-1.5" /> {/* Simpler icon/margin */}
                <div>
                    <CardTitle className="text-lg">Market News</CardTitle> {/* Simpler font */}
                    <CardDescription className="text-xs">Latest financial news.</CardDescription> {/* Simplified */}
                </div>
            </div>
            <div className="relative w-full sm:w-60"> {/* Simplified width */}
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search" placeholder="Search news..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 w-full h-8 text-sm" /* Simplified */ aria-label="Search news"
              />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <BreakingNewsSection /> {/* Added Breaking News Section */}

      <Tabs value={selectedTopic} onValueChange={(value) => setSelectedTopic(value as NewsTopic)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 p-0.5 h-auto"> {/* Simplified */}
          {(Object.keys(topicLabels) as NewsTopic[]).map(topic => {
            const Icon = topicIcons[topic];
            return (
              <TabsTrigger key={topic} value={topic} className="py-1.5 text-xs data-[state=active]:shadow-none flex items-center gap-1"> {/* Simpler */}
                <Icon className="h-3 w-3" /> {topicLabels[topic]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start"> {/* Simplified gap/width */}
        <section aria-labelledby="news-articles-heading">
          <h2 id="news-articles-heading" className="sr-only">News Articles for {topicLabels[selectedTopic]} {debouncedSearchTerm && `matching "${debouncedSearchTerm}"`}</h2>
          {isLoadingNews && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"> {/* Simplified gap */}
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border">
                  <Skeleton className="h-36 w-full" /> {/* Smaller skeleton */}
                  <CardHeader className="pb-1 pt-1.5 px-2"><Skeleton className="h-3.5 w-3/4" /></CardHeader> {/* Simpler */}
                  <CardContent className="px-2 space-y-1 pb-1.5"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /></CardContent>
                  <CardFooter className="p-2 flex justify-between items-center">
                     <Skeleton className="h-4 w-16" /> <Skeleton className="h-6 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {!isLoadingNews && error && (
             <Card className="col-span-full border p-3"> {/* Simplified */}
                <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-8 h-8 mb-2" /> {/* Simpler */}
                    <p className="text-md font-medium">Error Loading News</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{error}</p>
                    <Button onClick={() => fetchNews(selectedTopic, debouncedSearchTerm)} className="mt-2 text-xs h-7">Try Again</Button>
                </CardContent>
            </Card>
          )}
          {!isLoadingNews && !error && newsArticles.length === 0 && (
            <Card className="col-span-full border p-3">
                <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                     <Search className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-md font-medium">No News Found</p>
                    <p className="text-sm text-muted-foreground">
                        {debouncedSearchTerm ? 
                            `No articles for "${debouncedSearchTerm}" in ${topicLabels[selectedTopic]}.` :
                            `No articles for ${topicLabels[selectedTopic]}.`
                        }
                    </p>
                </CardContent>
            </Card>
          )}
          {!isLoadingNews && !error && newsArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"> {/* Simplified gap */}
              {newsArticles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  isWatchlisted={watchlist.some(item => item.articleId === article.id)}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ))}
            </div>
          )}
        </section>
        
        <aside className="sticky top-14 space-y-3 lg:block hidden"> {/* Simplified spacing */}
            <TrendingTickersSidebar tickers={trendingTickers} isLoading={isLoadingTickers} />
        </aside>
      </div>
      
      <div className="lg:hidden mt-4"> {/* Simplified margin */}
          <TrendingTickersSidebar tickers={trendingTickers} isLoading={isLoadingTickers} />
      </div>

      <FloatingAIButton />
    </div>
  );
}
