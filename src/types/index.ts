
import type { PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';

export interface AuthFormData {
  email: string;
  password: string;
}

export interface Analysis {
  id: string; 
  userId?: string; 
  imageUrl: string; 
  extractedData?: string | null; 
  prediction: PredictMarketTrendOutput;
  createdAt: string; 
  chartFileName?: string;
}

// News Dashboard Types
export type NewsTopic = 'all' | 'crypto' | 'stocks' | 'forex' | 'global-economy';

export interface NewsArticle {
  id: string; // Will use article.url from NewsAPI as ID
  headline: string;
  source: string;
  publishedAt: string; // ISO string format
  summary: string; // Will map from 'description' field
  url: string;
  topic: NewsTopic; // The topic used for fetching this article
  ticker?: string; // If the search was for a specific ticker
  imageUrl?: string | null; // Will map from 'urlToImage', can be null
  imageHint?: string;
}

export interface TrendingTicker {
  id: string;
  ticker: string;
  name: string;
  changePercent: number; // e.g., 2.5 for +2.5%, -1.3 for -1.3%
}

export interface WatchlistItem {
  articleId: string; // Corresponds to NewsArticle.id (which is article.url)
  addedAt: string; // ISO string
  headline?: string;
  source?: string;
  topic?: NewsTopic;
  imageUrl?: string | null;
  imageHint?: string;
  url?: string;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfileData {
  analysisAttempts: number;
  isPremium: boolean;
  userLevel: UserLevel | null; // Changed from optional to allow null explicitly
  subscriptionStartDate: string | null; // Changed from optional
  subscriptionNextBillingDate: string | null; // Changed from optional
  // uid: string; // No longer needed here, doc ID is uid
}
