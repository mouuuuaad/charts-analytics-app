
import type { NewsArticle, NewsTopic, TrendingTicker } from '@/types';
import { formatISO, subDays, subHours, subMinutes } from 'date-fns';

const sampleSummaries = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo.",
];

const sampleSources = ["Reuters", "Bloomberg", "CoinDesk", "Wall Street Journal", "Financial Times", "TechCrunch", "Associated Press", "MarketWatch"];
const sampleTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "BTC", "ETH", "SOL", "ADA", "EUR/USD", "GBP/JPY"];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let articleIdCounter = 1;

const generateMockArticle = (topic: NewsTopic, tickerInput?: string, customHeadline?: string): NewsArticle => {
  const now = new Date();
  const publishedAt = formatISO(subMinutes(subHours(subDays(now, Math.floor(Math.random() * 2)), Math.floor(Math.random() * 12)), Math.floor(Math.random() * 59)));
  const sentimentOptions: NewsArticle['sentiment'][] = ['positive', 'negative', 'neutral'];
  const id = `news-${topic}-${articleIdCounter++}${tickerInput ? '-' + tickerInput : ''}`;
  
  let headline = customHeadline;
  let articleTicker = tickerInput;

  if (!headline) {
    const randomTickerForHeadline = tickerInput || getRandomElement(sampleTickers);
    switch (topic) {
      case 'crypto':
        articleTicker = tickerInput || getRandomElement(['BTC', 'ETH', 'SOL']);
        headline = `${articleTicker.toUpperCase()} Experiences Significant Price Movement Amidst Market Speculation`;
        break;
      case 'stocks':
        articleTicker = tickerInput || getRandomElement(['AAPL', 'TSLA', 'NVDA']);
        headline = `${articleTicker.toUpperCase()} Stock Reacts to Analyst Upgrades and Sector News`;
        break;
      case 'forex':
        articleTicker = tickerInput || getRandomElement(['EUR/USD', 'GBP/JPY']);
        headline = `${articleTicker.toUpperCase()} Pair Shows Increased Volatility Ahead of Economic Data Release`;
        break;
      case 'global-economy':
        headline = `Global Markets Brace for Impact of New Economic Policies and Inflation Data`;
        break;
      default: // 'all' or fallback
        headline = `${randomTickerForHeadline.toUpperCase()} News: Market Reacts to New Developments and Trends`;
        break;
    }
  }
  
  const imageHints: {[key in NewsTopic]: string} = {
    all: 'financial news',
    crypto: 'cryptocurrency market',
    stocks: 'stock market chart',
    forex: 'currency exchange graph',
    'global-economy': 'world economy report',
  }

  return {
    id,
    headline,
    source: getRandomElement(sampleSources),
    publishedAt,
    summary: getRandomElement(sampleSummaries).substring(0, Math.floor(Math.random() * 50) + 80) + "...", // Summary length 80-130
    url: '#', // Placeholder URL
    sentiment: getRandomElement(sentimentOptions),
    topic,
    ticker: articleTicker,
    imageUrl: `https://placehold.co/600x400.png`,
    imageHint: imageHints[topic] || 'news article',
  };
};

const topicsForGeneration: NewsTopic[] = ['crypto', 'stocks', 'forex', 'global-economy'];
const initialAllArticles: NewsArticle[] = [];
for (let i = 0; i < 2; i++) { // Generate 2 articles per topic for 'all'
    topicsForGeneration.forEach(topic => {
        initialAllArticles.push(generateMockArticle(topic, undefined, undefined));
    });
}
// Add a few more with specific tickers for variety
initialAllArticles.push(generateMockArticle('stocks', 'AAPL', 'Apple (AAPL) Announces Quarterly Earnings Call Date'));
initialAllArticles.push(generateMockArticle('crypto', 'BTC', 'Bitcoin (BTC) Halving Event: What to Expect'));


export const mockNewsDataGenerated: { [key in NewsTopic]: NewsArticle[] } = {
  all: initialAllArticles,
  crypto: [
    generateMockArticle('crypto', 'BTC'), generateMockArticle('crypto', 'ETH'),
    generateMockArticle('crypto', 'SOL', 'Solana (SOL) Network Upgrade Boosts Transaction Speed'),
    generateMockArticle('crypto', 'ADA', 'Cardano (ADA) Foundation Releases New Development Roadmap'),
    generateMockArticle('crypto', 'XRP', 'Ripple (XRP) Faces New Regulatory Scrutiny'),
  ],
  stocks: [
    generateMockArticle('stocks', 'MSFT'), generateMockArticle('stocks', 'GOOGL'),
    generateMockArticle('stocks', 'AMZN', 'Amazon (AMZN) Prime Day Sales Exceed Expectations'),
    generateMockArticle('stocks', 'NVDA', 'NVIDIA (NVDA) Unveils Next-Gen AI Chips'),
    generateMockArticle('stocks', 'JPM', 'JPMorgan (JPM) Chase CEO Comments on Market Outlook'),
  ],
  forex: [
    generateMockArticle('forex', 'EUR/USD', 'EUR/USD Fluctuates on ECB Interest Rate Decision'),
    generateMockArticle('forex', 'USD/JPY', 'Bank of Japan Intervention Speculation Shakes USD/JPY'),
    generateMockArticle('forex', 'GBP/USD', 'GBP/USD Hits Multi-Month Low Amidst UK Economic Data'),
  ],
  'global-economy': [
    generateMockArticle('global-economy', undefined, 'Global Inflation Rate Hits Decade High, Central Banks Respond'),
    generateMockArticle('global-economy', undefined, 'IMF Downgrades Global Economic Growth Forecast'),
    generateMockArticle('global-economy', undefined, 'Supply Chain Disruptions Continue to Impact Manufacturing Output Worldwide'),
  ],
};

export const getMockNews = (topic: NewsTopic, searchTerm?: string): Promise<NewsArticle[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let articlesToReturn: NewsArticle[] = [];
      if (topic === 'all') {
        articlesToReturn = [...mockNewsDataGenerated.all]; // Use a copy
      } else {
        articlesToReturn = [...(mockNewsDataGenerated[topic] || [])]; // Use a copy
      }

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        // Prioritize ticker match
        const tickerMatchedArticles = articlesToReturn.filter(article => article.ticker?.toLowerCase() === lowerSearchTerm);
        const otherMatchedArticles = articlesToReturn.filter(
          (article) =>
            article.ticker?.toLowerCase() !== lowerSearchTerm &&
            (article.headline.toLowerCase().includes(lowerSearchTerm) ||
            article.summary.toLowerCase().includes(lowerSearchTerm) ||
            article.source.toLowerCase().includes(lowerSearchTerm))
        );
        articlesToReturn = [...tickerMatchedArticles, ...otherMatchedArticles];
        
        // If no articles found but search term looks like a ticker, generate one specific for it
        if (articlesToReturn.length === 0 && /^[A-Z]{1,5}(\/[A-Z]{1,3})?$/.test(searchTerm.toUpperCase())) {
            const presumedTopic: NewsTopic = searchTerm.toUpperCase().includes('/') ? 'forex' : (['BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP'].includes(searchTerm.toUpperCase()) ? 'crypto' : 'stocks');
            articlesToReturn.push(generateMockArticle(presumedTopic, searchTerm.toUpperCase(), `${searchTerm.toUpperCase()} Specific News: Breaking Developments`));
        }
      }
      // Simulate some variability in results
      articlesToReturn = articlesToReturn.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 8); // 8-12 articles
      resolve(articlesToReturn);
    }, 500); // Simulate network delay
  });
};

export const mockTrendingTickersData: TrendingTicker[] = [
  { id: 't1', ticker: 'GME', name: 'GameStop Corp.', changePercent: 15.72 },
  { id: 't2', ticker: 'BTC', name: 'Bitcoin USD', changePercent: 5.12 },
  { id: 't3', ticker: 'AMC', name: 'AMC Entertainment', changePercent: -8.33 },
  { id: 't4', ticker: 'ETH', name: 'Ethereum USD', changePercent: 3.45 },
  { id: 't5', ticker: 'DOGE', name: 'Dogecoin USD', changePercent: 22.01 },
  { id: 't6', ticker: 'NVDA', name: 'NVIDIA Corporation', changePercent: 1.89 },
  { id: 't7', ticker: 'AAPL', name: 'Apple Inc.', changePercent: 0.50 },
  { id: 't8', ticker: 'EUR/USD', name: 'Euro/US Dollar', changePercent: -0.21 },
];

export const getMockTrendingTickers = (): Promise<TrendingTicker[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockTrendingTickersData);
        }, 300);
    });
};

// Helper to get a single article for watchlist enrichment
export const getMockArticleById = (id: string): NewsArticle | undefined => {
    for (const topicKey in mockNewsDataGenerated) {
        const articles = mockNewsDataGenerated[topicKey as NewsTopic];
        const found = articles.find(article => article.id === id);
        if (found) return found;
    }
    // Fallback if not in pre-generated, try to generate one that might match
    // This is a rough fallback, real API would be better.
    const parts = id.split('-');
    if (parts.length >= 3) {
        const topic = parts[1] as NewsTopic;
        const ticker = parts.length > 3 ? parts[parts.length-1] : undefined;
        if (topicsForGeneration.includes(topic)) {
            const tempArticle = generateMockArticle(topic, ticker);
            return { ...tempArticle, id }; // Ensure ID matches
        }
    }
    return undefined;
};
