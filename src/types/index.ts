
import type { PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';

export interface AuthFormData {
  email: string;
  password: string;
}

export interface Analysis {
  id: string; // Changed from optional to required, will be generated locally
  userId?: string; // Keep optional as it's not used with localStorage but good for future
  imageUrl: string; // Base64 data URI
  extractedData?: string | null; // JSON string of extracted data or null
  prediction: PredictMarketTrendOutput;
  createdAt: string; // Changed from Timestamp to ISO string
  chartFileName?: string;
}
