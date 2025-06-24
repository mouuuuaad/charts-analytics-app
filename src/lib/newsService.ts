
'use server';

import type { NewsArticle, NewsTopic } from '@/types';

// API key provided by the user. Should be moved to .env.local as NEXT_PUBLIC_MARKETAUX_API_KEY
const API_KEY = process.env.NEXT_PUBLIC_MARKETAUX_API_KEY || "HgDHO5BikEn1zLseGxGgsa4htJuYNdaxkLSryp6e";
const BASE_URL = 'https://api.marketaux.com/v1/news/all';

const generateImageHint = (headline: string, summary: string, topic: NewsTopic | 'breaking'): string => {
    const lowerHeadline = headline.toLowerCase();
    const lowerSummary = summary.toLowerCase();

    if (lowerHeadline.includes('bitcoin') || lowerSummary.includes('bitcoin')) return 'bitcoin crypto';
    if (lowerHeadline.includes('ethereum') || lowerSummary.includes('ethereum')) return 'ethereum crypto';
    if (lowerHeadline.includes('crypto') || lowerSummary.includes('crypto')) return 'cryptocurrency technology';
    if (lowerHeadline.includes('stock') || lowerSummary.includes('stock')) return 'stock market chart';
    if (lowerHeadline.includes('share') || lowerSummary.includes('share')) return 'stock exchange';
    if (lowerHeadline.includes('forex') || lowerSummary.includes('forex')) return 'forex trading graph';
    if (lowerHeadline.includes('currency') || lowerSummary.includes('currency')) return 'currency exchange';
    if (lowerHeadline.includes('nasdaq') || lowerSummary.includes('nasdaq')) return 'nasdaq stock';
    if (lowerHeadline.includes('dow jones') || lowerSummary.includes('dow jones')) return 'dow jones chart';
    if (lowerHeadline.includes('inflation') || lowerSummary.includes('inflation')) return 'inflation economy';
    if (lowerHeadline.includes('interest rate') || lowerSummary.includes('interest rate')) return 'interest rate chart';
    
    if (topic === 'breaking') return 'breaking news financial';

    switch (topic) {
        case 'crypto': return 'digital currency';
        case 'stocks': return 'financial stocks';
        case 'forex': return 'currency market';
        case 'global-economy': return 'global finance';
        default: return 'financial news abstract';
    }
};

export async function fetchNewsFromAPI(
  topic: NewsTopic | 'breaking', 
  searchTerm?: string,
  isBreakingNews: boolean = false
): Promise<NewsArticle[]> {
  if (!API_KEY || API_KEY.includes("YOUR_KEY_HERE")) { // Updated check for marketaux
    console.error("Marketaux API key not configured. Please set NEXT_PUBLIC_MARKETAUX_API_KEY in your .env file.");
    throw new Error("News service is not configured. Please add your Marketaux API key to the environment variables.");
  }

  const params = new URLSearchParams({
    api_token: API_KEY,
    language: 'en',
    limit: isBreakingNews ? '10' : '21', // fetch a bit more for main feed
  });
  
  // **FIX**: Force all queries to only fetch news from the last 24 hours to guarantee recency.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const publishedAfterDate = yesterday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  params.set('published_after', publishedAfterDate);
  
  let searchKeywords = "";

  if (isBreakingNews) {
    // Broader terms are now safe because we are filtering by date.
    searchKeywords = 'finance, business, market, economy, investment';
  } else {
    const topicQueryMap: Partial<Record<NewsTopic, string>> = {
      'crypto': 'cryptocurrency, Bitcoin, Ethereum, blockchain, DeFi',
      'stocks': 'stock market, equities, shares, wall street, NASDAQ, Dow Jones, earnings',
      'forex': 'forex, currency exchange, FX market, USD, EUR, JPY',
      'global-economy': 'global economy, inflation, interest rates, GDP, central bank, trade'
    };
    
    if (topic !== 'all' && topicQueryMap[topic]) {
      searchKeywords = topicQueryMap[topic]!;
    }
  }

  // Handle ticker symbols separately
  if (searchTerm && /^[A-Z]{1,5}(\/[A-Z]{1,3})?$/.test(searchTerm.toUpperCase())) {
      params.set('symbols', searchTerm.toUpperCase());
  } else if (searchTerm) {
    // Add general search term to keywords
    searchKeywords = searchKeywords ? `${searchKeywords}, ${searchTerm.trim()}` : searchTerm.trim();
  }
  
  if (!searchKeywords && topic === 'all' && !isBreakingNews && !searchTerm) {
    searchKeywords = 'finance, business, market, economy, investment';
  }
  
  if (searchKeywords) {
    params.set('search', searchKeywords);
  }

  const requestUrl = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, { next: { revalidate: 900 } }); // Revalidate every 15 minutes

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = `Failed to fetch news. Status: ${response.status}.`;
      if (errorData?.message) {
        errorMessage = `Marketaux Error: ${errorData.message}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.data) {
        return [];
    }

    const validArticles = data.data.filter((article: any) => 
        article.title && 
        article.url &&
        article.source &&
        article.published_at &&
        (article.description || article.snippet)
    );
    
    return validArticles.map((article: any): NewsArticle => {
      const articleTopicActual = isBreakingNews ? 'breaking' : topic;
      const articleSummary = article.description || article.snippet || "No summary available.";
      return {
        id: article.uuid,
        headline: article.title,
        source: article.source,
        publishedAt: new Date(article.published_at).toISOString(),
        summary: articleSummary.substring(0, 150) + (articleSummary.length > 150 ? "..." : ""),
        url: article.url,
        topic: topic, 
        ticker: article.entities?.find((e: any) => e.type === 'equity')?.symbol,
        imageUrl: article.image_url,
        imageHint: generateImageHint(article.title, articleSummary, articleTopicActual),
      };
    }).slice(0, isBreakingNews ? 10 : 21); 
  } catch (error: any) {
    console.error('Error fetching or processing news from Marketaux:', error);
    throw new Error(error.message || 'An unknown error occurred while fetching news.');
  }
}
