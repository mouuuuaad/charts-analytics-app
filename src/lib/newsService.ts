
'use server'; // Can be used by server components/actions, but fetch is client-side here.
              // For client-side fetching, 'use server' is not strictly necessary for this file itself
              // if only used by client components. But good practice if might be used by server context.

import type { NewsArticle, NewsTopic } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2/everything';

// Helper to get a more relevant image hint based on keywords in headline or summary
const generateImageHint = (headline: string, summary: string, topic: NewsTopic): string => {
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
    
    switch (topic) {
        case 'crypto': return 'digital currency';
        case 'stocks': return 'financial stocks';
        case 'forex': return 'currency market';
        case 'global-economy': return 'global finance';
        default: return 'financial news abstract';
    }
};


export async function fetchNewsFromAPI(topic: NewsTopic, searchTerm?: string): Promise<NewsArticle[]> {
  if (!API_KEY || API_KEY === "YOUR_NEWSAPI_ORG_KEY_HERE") {
    console.error("NewsAPI key not configured. Please set NEXT_PUBLIC_NEWS_API_KEY in your .env file with a valid key from NewsAPI.org.");
    throw new Error("NewsAPI key is not configured. Please set NEXT_PUBLIC_NEWS_API_KEY in your .env file to fetch live news.");
  }

  const queryParams = new URLSearchParams({
    apiKey: API_KEY,
    language: 'en', // NewsAPI has better support for English. Arabic ('ar') might have limited sources.
    pageSize: '21', // Fetch a bit more to account for filtering out bad data
    sortBy: 'publishedAt', // Get the latest news
  });

  let q = "";

  // Topic mapping to keywords for NewsAPI
  const topicQueryMap: Partial<Record<NewsTopic, string>> = {
    'crypto': '(cryptocurrency OR Bitcoin OR Ethereum OR Ripple OR Solana OR Cardano OR Dogecoin OR Shiba Inu OR Binance Coin OR NFT OR DeFi OR blockchain)',
    'stocks': '(stocks OR shares OR "stock market" OR equities OR NYSE OR NASDAQ OR Dow Jones OR S&P 500 OR specific company stocks like Apple OR Microsoft OR Google OR Tesla OR Amazon OR Nvidia)',
    'forex': '(forex OR "currency exchange" OR FX OR USD OR EUR OR JPY OR GBP OR AUD OR CAD OR CHF)',
    'global-economy': '("global economy" OR inflation OR "interest rates" OR GDP OR "monetary policy" OR "central bank" OR trade OR recession OR "economic growth")'
  };
  
  if (topic !== 'all' && topicQueryMap[topic]) {
    q = topicQueryMap[topic]!;
  }

  if (searchTerm) {
    // Sanitize search term a bit (basic example)
    const sanitizedSearchTerm = searchTerm.trim().replace(/[^\w\s/-]/gi, ''); // Allow alphanum, space, slash, dash
    if (sanitizedSearchTerm) {
        q = q ? `${q} AND (${sanitizedSearchTerm})` : sanitizedSearchTerm;
    }
  }
  
  if (!q && topic === 'all') {
    q = '(finance OR business OR market OR economy OR investment)'; // Broad query for 'all' if no search term
  }
  
  if (!q) {
      console.warn("No query constructed for NewsAPI (topic and searchTerm might be empty or invalid). Fetching general business news.");
      q = 'business OR finance'; // Fallback to general business if q is still empty
  }

  queryParams.set('q', q);
  // Optional: Add domains if you want to restrict sources, e.g., 'domains': 'wsj.com,nytimes.com'

  const requestUrl = `${BASE_URL}?${queryParams.toString()}`;
  // console.log("NewsAPI Request URL:", requestUrl); // For debugging

  try {
    const response = await fetch(requestUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('NewsAPI request failed with status:', response.status, 'Error data:', errorData);
      let errorMessage = `Failed to fetch news. Status: ${response.status}.`;
      if (errorData && errorData.message) {
        errorMessage += ` Message: ${errorData.message}`;
        if (errorData.code === 'rateLimited') {
            errorMessage = "NewsAPI request limit reached. Please try again later or check your API plan.";
        } else if (errorData.code === 'apiKeyInvalid' || errorData.code === 'apiKeyMissing') {
            errorMessage = "NewsAPI key is invalid or missing. Please check your NEXT_PUBLIC_NEWS_API_KEY in the .env file.";
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.articles) {
        console.warn("NewsAPI response does not contain 'articles' array.", data);
        return [];
    }

    // Filter out articles that are missing essential fields or have problematic content
    const validArticles = data.articles.filter((article: any) => 
        article.title && 
        article.title !== "[Removed]" &&
        article.url &&
        article.source && article.source.name &&
        article.publishedAt
    );
    
    return validArticles.map((article: any): NewsArticle => {
      const articleTopic = topic; // The topic used for this search query
      const articleSummary = article.description || article.content || "No summary available.";
      return {
        id: article.url, 
        headline: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary: articleSummary.substring(0, 150) + (articleSummary.length > 150 ? "..." : ""), // Truncate summary
        url: article.url,
        topic: articleTopic,
        ticker: searchTerm && /^[A-Z]{1,5}(\/[A-Z]{1,3})?$/.test(searchTerm.toUpperCase()) ? searchTerm.toUpperCase() : undefined,
        imageUrl: article.urlToImage,
        imageHint: generateImageHint(article.title, articleSummary, articleTopic),
      };
    }).slice(0, 20); // Ensure we don't exceed 20 articles after mapping
  } catch (error: any) {
    console.error('Error fetching or processing news from API:', error);
    // Pass the error message to the UI to be displayed in a toast
    throw new Error(error.message || 'An unknown error occurred while fetching news.');
  }
}
