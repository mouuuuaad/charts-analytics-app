
// This file's getMockNews function is no longer the primary source for news articles.
// It is being replaced by src/lib/newsService.ts which fetches from NewsAPI.org.
// The trending tickers mock data and function will remain here for now.

import type { NewsArticle, NewsTopic, TrendingTicker } from '@/types';
// import { formatISO, subDays, subHours, subMinutes } from 'date-fns'; // Not needed for this file anymore

// const sampleSummaries = [
//   "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam.",
//   "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.",
//   "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
//   "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste.",
//   "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo.",
// ];

// const sampleSources = ["Reuters", "Bloomberg", "CoinDesk", "Wall Street Journal", "Financial Times", "TechCrunch", "Associated Press", "MarketWatch"];
// const sampleTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "BTC", "ETH", "SOL", "ADA", "EUR/USD", "GBP/JPY"];

// const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// let articleIdCounter = 1;

// const generateMockArticle = (topic: NewsTopic, tickerInput?: string, customHeadline?: string): NewsArticle => {
//   const now = new Date();
//   const publishedAt = formatISO(subMinutes(subHours(subDays(now, Math.floor(Math.random() * 2)), Math.floor(Math.random() * 12)), Math.floor(Math.random() * 59)));
//   // const sentimentOptions: NewsArticle['sentiment'][] = ['positive', 'negative', 'neutral']; // Sentiment removed from type
//   const id = `mock-news-${topic}-${articleIdCounter++}${tickerInput ? '-' + tickerInput : ''}`;
  
//   let headline = customHeadline;
//   let articleTicker = tickerInput;

//   if (!headline) {
//     const randomTickerForHeadline = tickerInput || getRandomElement(sampleTickers);
//     switch (topic) {
//       case 'crypto':
//         articleTicker = tickerInput || getRandomElement(['BTC', 'ETH', 'SOL']);
//         headline = `${articleTicker.toUpperCase()} Experiences Significant Price Movement Amidst Market Speculation`;
//         break;
//       case 'stocks':
//         articleTicker = tickerInput || getRandomElement(['AAPL', 'TSLA', 'NVDA']);
//         headline = `${articleTicker.toUpperCase()} Stock Reacts to Analyst Upgrades and Sector News`;
//         break;
//       case 'forex':
//         articleTicker = tickerInput || getRandomElement(['EUR/USD', 'GBP/JPY']);
//         headline = `${articleTicker.toUpperCase()} Pair Shows Increased Volatility Ahead of Economic Data Release`;
//         break;
//       case 'global-economy':
//         headline = `Global Markets Brace for Impact of New Economic Policies and Inflation Data`;
//         break;
//       default: // 'all' or fallback
//         headline = `${randomTickerForHeadline.toUpperCase()} News: Market Reacts to New Developments and Trends`;
//         break;
//     }
//   }
  
//   const imageHints: {[key in NewsTopic]: string} = {
//     all: 'financial news',
//     crypto: 'cryptocurrency market',
//     stocks: 'stock market chart',
//     forex: 'currency exchange graph',
//     'global-economy': 'world economy report',
//   }

//   return {
//     id,
//     headline,
//     source: getRandomElement(sampleSources),
//     publishedAt,
//     summary: getRandomElement(sampleSummaries).substring(0, Math.floor(Math.random() * 50) + 80) + "...", // Summary length 80-130
//     url: '#', // Placeholder URL
//     // sentiment: getRandomElement(sentimentOptions), // Removed
//     topic,
//     ticker: articleTicker,
//     imageUrl: `https://placehold.co/600x400.png`,
//     imageHint: imageHints[topic] || 'news article',
//   };
// };


// export const getMockNews = (topic: NewsTopic, searchTerm?: string): Promise<NewsArticle[]> => {
//   // This function is effectively deprecated by newsService.ts
//   // It's kept here in case a fallback to mock data is desired if API fails or key is missing.
//   // For now, it will return an empty array to ensure newsService.ts is used.
//   console.warn("getMockNews is deprecated. Using fetchNewsFromAPI from newsService.ts");
//   return Promise.resolve([]);
// };

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
            // Simulate some randomness in trending tickers
            const shuffledTickers = [...mockTrendingTickersData].sort(() => 0.5 - Math.random());
            const randomLength = Math.floor(Math.random() * (mockTrendingTickersData.length - 3 + 1)) + 3; // Min 3 tickers
            resolve(shuffledTickers.slice(0, randomLength));
        }, 300);
    });
};

// Helper to get a single article for watchlist enrichment (can be removed if watchlist uses live data)
// For now, this might not be used if watchlist items are directly populated from API results
// export const getMockArticleById = (id: string): NewsArticle | undefined => {
//     // This logic would need to be updated if mockNewsDataGenerated is removed
//     return undefined; 
// };
