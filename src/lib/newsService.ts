
'use server'; // Can be used by server components/actions, but fetch is client-side here.
              // For client-side fetching, 'use server' is not strictly necessary for this file itself
              // if only used by client components. But good practice if might be used by server context.

import type { NewsArticle, NewsTopic } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2/everything'; // Using 'everything' for more specific queries and sorting
// const TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines'; // Alternative for general breaking news

// Helper to get a more relevant image hint based on keywords in headline or summary
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
  if (!API_KEY || API_KEY === "YOUR_NEWSAPI_ORG_KEY_HERE") {
    console.error("NewsAPI key not configured. Please set NEXT_PUBLIC_NEWS_API_KEY in your .env file with a valid key from NewsAPI.org.");
    throw new Error("NewsAPI key is not configured. Please set NEXT_PUBLIC_NEWS_API_KEY in your .env file to fetch live news.");
  }

  const params = new URLSearchParams({
    apiKey: API_KEY,
    language: 'en',
    pageSize: isBreakingNews ? '7' : '21', 
    sortBy: 'publishedAt', // Keep sortBy for 'everything' endpoint
  });

  let q = "";
  // Always use BASE_URL (everything endpoint) for more control, especially for breaking news refinement
  const currentBaseUrl = BASE_URL; 

  if (isBreakingNews) {
    // Refined query for "breaking" financial news focusing on urgency and relevance to specified topics
    q = `("breaking financial" OR "market alert" OR "urgent market update" OR "latest finance brief" OR "just in finance") 
         AND (forex OR stocks OR stock OR cryptocurrency OR crypto OR bitcoin OR ethereum OR "exchange rate" OR "stock price" OR "trading volume")`;
    params.set('pageSize', '7'); // Fetch fewer for breaking news section
  } else {
    // Topic mapping for the 'everything' endpoint for general news
    const topicQueryMap: Partial<Record<NewsTopic, string>> = {
      'crypto': '(cryptocurrency OR Bitcoin OR Ethereum OR Ripple OR Solana OR Cardano OR Dogecoin OR Shiba Inu OR Binance Coin OR NFT OR DeFi OR blockchain)',
      'stocks': '(stocks OR shares OR "stock market" OR equities OR NYSE OR NASDAQ OR Dow Jones OR S&P 500 OR specific company stocks like Apple OR Microsoft OR Google OR Tesla OR Amazon OR Nvidia)',
      'forex': '(forex OR "currency exchange" OR FX OR USD OR EUR OR JPY OR GBP OR AUD OR CAD OR CHF)',
      'global-economy': '("global economy" OR inflation OR "interest rates" OR GDP OR "monetary policy" OR "central bank" OR trade OR recession OR "economic growth")'
    };
    
    if (topic !== 'all' && topic !== 'breaking' && topicQueryMap[topic]) {
      q = topicQueryMap[topic]!;
    }
  }

  if (searchTerm) {
    const sanitizedSearchTerm = searchTerm.trim().replace(/[^\w\s/-]/gi, '');
    if (sanitizedSearchTerm) {
        q = q ? `${q} AND (${sanitizedSearchTerm})` : sanitizedSearchTerm;
    }
  }
  
  if (!q && topic === 'all' && !isBreakingNews) {
    q = '(finance OR business OR market OR economy OR investment)';
  }
  
  if (!q && !isBreakingNews) { // If q is still empty for non-breaking, non-search general topic
      q = 'business OR finance'; // Fallback to general business/finance
  }

  if (q) {
    params.set('q', q);
  } else if (isBreakingNews) {
    // Fallback for breaking news if the complex query above yields nothing, try something broader
    params.set('q', '(forex OR stock OR crypto OR "financial markets") AND (breaking OR alert OR urgent)');
  }


  const requestUrl = `${currentBaseUrl}?${params.toString()}`;
  // console.log("NewsAPI Request URL:", requestUrl);

  try {
    const response = await fetch(requestUrl, { cache: 'no-store' }); 

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

    const validArticles = data.articles.filter((article: any) => 
        article.title && 
        article.title !== "[Removed]" &&
        article.url &&
        article.source && article.source.name &&
        article.publishedAt
    );
    
    return validArticles.map((article: any): NewsArticle => {
      const articleTopicActual = isBreakingNews ? 'breaking' : topic;
      const articleSummary = article.description || article.content || "No summary available.";
      return {
        id: article.url, 
        headline: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary: articleSummary.substring(0, 100) + (articleSummary.length > 100 ? "..." : ""),
        url: article.url,
        topic: topic, 
        ticker: searchTerm && /^[A-Z]{1,5}(\/[A-Z]{1,3})?$/.test(searchTerm.toUpperCase()) ? searchTerm.toUpperCase() : undefined,
        imageUrl: article.urlToImage,
        imageHint: generateImageHint(article.title, articleSummary, articleTopicActual),
      };
    }).slice(0, isBreakingNews ? 7 : 20); 
  } catch (error: any) {
    console.error('Error fetching or processing news from API:', error);
    throw new Error(error.message || 'An unknown error occurred while fetching news.');
  }
}
