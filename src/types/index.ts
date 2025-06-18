import type { Timestamp } from 'firebase/firestore';
import type { PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';

export interface AuthFormData {
  email: string;
  password: string;
}

export interface Analysis {
  id?: string;
  userId: string;
  imageUrl: string; // Base64 data URI or path to image in storage
  extractedData?: string; // JSON string of extracted data
  prediction: PredictMarketTrendOutput;
  createdAt: Timestamp;
  chartFileName?: string;
}
