
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
  id: string; 
  headline: string;
  source: string;
  publishedAt: string; 
  summary: string; 
  url: string;
  topic: NewsTopic; 
  ticker?: string; 
  imageUrl?: string | null; 
  imageHint?: string;
}

export interface TrendingTicker {
  id: string;
  ticker: string;
  name: string;
  changePercent: number; 
}

export interface WatchlistItem {
  articleId: string; 
  addedAt: string; 
  headline?: string;
  source?: string;
  topic?: NewsTopic;
  imageUrl?: string | null;
  imageHint?: string;
  url?: string;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

// UserProfileData interface removed as per rollback request
// export interface UserProfileData {
//   analysisAttempts: number;
//   isPremium: boolean;
//   userLevel: UserLevel | null; 
//   subscriptionStartDate: string | null; 
//   subscriptionNextBillingDate: string | null; 
// }


    