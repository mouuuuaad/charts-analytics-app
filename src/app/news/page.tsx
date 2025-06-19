
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { NewsArticle, NewsTopic, TrendingTicker, WatchlistItem } from '@/types';
// import { getMockNews, getMockTrendingTickers, getMockArticleById } from '@/lib/mockNewsData'; // Using newsService now
import { getMockTrendingTickers } from '@/lib/mockNewsData'; // Keep for tickers
import { fetchNewsFromAPI } from '@/lib/newsService'; // Import the new service
import { NewsCard } from '@/components/news/NewsCard';
import { TrendingTickersSidebar } from '@/components/news/TrendingTickersSidebar';
import { FloatingAIButton } from '@/components/news/FloatingAIButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

  // Load watchlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (storedWatchlist) {
          setWatchlist(JSON.parse(storedWatchlist));
        }
      } catch (e) {
        console.error("Failed to load watchlist from localStorage:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load your watchlist.' });
      }
    }
  }, [toast]);

  // Save watchlist to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
      } catch (e) {
        console.error("Failed to save watchlist to localStorage:", e);
        // Potentially notify user if storage is full or fails
      }
    }
  }, [watchlist]);

  const fetchNews = useCallback(async (topic: NewsTopic, term?: string) => {
    setIsLoadingNews(true);
    setError(null);
    try {
      const articles = await fetchNewsFromAPI(topic, term);
      setNewsArticles(articles);
      if (articles.length === 0 && process.env.NEXT_PUBLIC_NEWS_API_KEY === "YOUR_NEWSAPI_ORG_KEY_HERE") {
        setError("News API key is not configured. Please set NEXT_PUBLIC_NEWS_API_KEY in your .env file. Displaying no news.");
        toast({
          variant: 'destructive',
          title: 'API Key Missing',
          description: 'NewsAPI key is not configured. Please set it in .env to fetch live news.',
          duration: 10000,
        });
      } else if (articles.length === 0 && term) {
        // setError(`No news found for "${term}" in ${topicLabels[topic]}.`);
      } else if (articles.length === 0) {
        // setError(`No news found for ${topicLabels[topic]}.`);
      }
    } catch (err: any) {
      console.error("Failed to fetch news:", err);
      const errorMessage = err.message || 'Failed to load news articles. Please try again later.';
      setError(errorMessage);
      setNewsArticles([]); // Clear articles on error
      toast({ variant: 'destructive', title: 'News Fetch Error', description: errorMessage, duration: 7000});
    } finally {
      setIsLoadingNews(false);
    }
  }, [toast]);

  const fetchTrendingTickers = useCallback(async () => {
    setIsLoadingTickers(true);
    try {
      const tickers = await getMockTrendingTickers(); // Keep using mock for tickers
      setTrendingTickers(tickers);
    } catch (err) {
      console.error("Failed to fetch trending tickers:", err);
      toast({ variant: 'destructive', title: 'Tickers Fetch Error', description: 'Could not load trending tickers.'});
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
        toast({ title: 'Removed from Watchlist', description: `"${article.headline.substring(0,30)}..." removed.` });
        return prevWatchlist.filter(item => item.articleId !== article.id);
      } else {
        if (prevWatchlist.length >= MAX_WATCHLIST_ITEMS) {
            toast({ variant: 'destructive', title: 'Watchlist Full', description: `You can save up to ${MAX_WATCHLIST_ITEMS} articles.` });
            return prevWatchlist;
        }
        toast({ title: 'Added to Watchlist', description: `"${article.headline.substring(0,30)}..." saved.` });
        const newItem: WatchlistItem = { 
            articleId: article.id, 
            addedAt: new Date().toISOString(),
            headline: article.headline,
            source: article.source,
            topic: article.topic, // Persist the topic it was found under
            imageUrl: article.imageUrl,
            imageHint: article.imageHint,
            url: article.url,
        };
        return [newItem, ...prevWatchlist];
      }
    });
  };

  const topicIcons: Record<NewsTopic, React.ElementType> = {
    all: LayoutGrid,
    crypto: Bitcoin,
    stocks: Landmark,
    forex: BadgeDollarSign,
    'global-economy': Globe,
  };
  
  const topicLabels: Record<NewsTopic, string> = {
    all: "All News",
    crypto: "Crypto",
    stocks: "Stocks",
    forex: "Forex",
    'global-economy': "Global Economy",
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      <Card className="shadow-lg border-border/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
                <Newspaper className="h-8 w-8 text-primary mr-3" />
                <div>
                    <CardTitle className="text-3xl font-headline text-primary">Market News Hub</CardTitle>
                    <CardDescription>Stay updated with the latest financial news and trends.</CardDescription>
                </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by ticker or keyword (e.g. AAPL, inflation)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                aria-label="Search news"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={selectedTopic} onValueChange={(value) => setSelectedTopic(value as NewsTopic)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 h-auto p-1.5">
          {(Object.keys(topicLabels) as NewsTopic[]).map(topic => {
            const Icon = topicIcons[topic];
            return (
              <TabsTrigger key={topic} value={topic} className="py-2.5 text-sm data-[state=active]:shadow-md flex items-center gap-2">
                <Icon className="h-4 w-4" /> {topicLabels[topic]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <section aria-labelledby="news-articles-heading">
          <h2 id="news-articles-heading" className="sr-only">News Articles for {topicLabels[selectedTopic]} {debouncedSearchTerm && `matching "${debouncedSearchTerm}"`}</h2>
          {isLoadingNews && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader className="pb-2 pt-3 px-4"><Skeleton className="h-5 w-3/4" /></CardHeader>
                  <CardContent className="px-4 space-y-2 pb-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
                  <CardFooter className="px-4 py-3 flex justify-between items-center bg-muted/30">
                    <Skeleton className="h-6 w-20" /> <Skeleton className="h-8 w-24" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {!isLoadingNews && error && (
             <Card className="col-span-full">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <p className="text-lg font-semibold text-destructive">Error Loading News</p>
                    <p className="text-muted-foreground whitespace-pre-line">{error}</p>
                    <Button onClick={() => fetchNews(selectedTopic, debouncedSearchTerm)} className="mt-4">Try Again</Button>
                </CardContent>
            </Card>
          )}
          {!isLoadingNews && !error && newsArticles.length === 0 && (
            <Card className="col-span-full">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                     <Search className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold">No News Found</p>
                    <p className="text-muted-foreground">
                        {debouncedSearchTerm ? 
                            `No articles found for "${debouncedSearchTerm}" in ${topicLabels[selectedTopic]}. Try a different search or topic.` :
                            `No articles found for ${topicLabels[selectedTopic]}. Try a different topic or check back later.`
                        }
                    </p>
                </CardContent>
            </Card>
          )}
          {!isLoadingNews && !error && newsArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
        
        <aside className="sticky top-20 space-y-6 lg:block hidden"> {/* Hidden on smaller than lg, shown as block on lg+ */}
            <TrendingTickersSidebar tickers={trendingTickers} isLoading={isLoadingTickers} />
        </aside>
      </div>
      
      {/* Show trending tickers below main content on smaller screens */}
      <div className="lg:hidden mt-8">
          <TrendingTickersSidebar tickers={trendingTickers} isLoading={isLoadingTickers} />
      </div>

      <FloatingAIButton />
    </div>
  );
}
