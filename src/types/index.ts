
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
  publishedAt: string; // ISO string format
  summary: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  topic: NewsTopic;
  ticker?: string;
  imageUrl?: string;
  imageHint?: string;
}

export interface TrendingTicker {
  id: string;
  ticker: string;
  name: string;
  changePercent: number; // e.g., 2.5 for +2.5%, -1.3 for -1.3%
}

export interface WatchlistItem {
  articleId: string;
  addedAt: string; // ISO string
  headline?: string;
  source?: string;
  topic?: NewsTopic;
  imageUrl?: string;
  imageHint?: string;
  url?: string;
}
