
import type { PredictMarketTrendOutput as OldPredictMarketTrendOutput } from '@/ai/flows/predict-market-trend'; // Keep old for reference if needed, or remove if fully replaced

export const ADMIN_EMAIL = "mouaadidoufkir2@gmail.com";

export interface AuthFormData {
  email: string;
  password: string;
}

// New detailed output structure for market trend prediction
export interface TrendAnalysisDetails {
  direction: 'Uptrend' | 'Downtrend' | 'Sideways' | 'Neutral';
  candleCountBasis: number; // e.g., "based on last 10 candles"
  trendlineDescription: string; // e.g., "Price respecting ascending trendline, MA20 acting as dynamic support."
}

export interface CandlestickPatternInfo {
  name: string; // e.g., "Bullish Engulfing", "Doji"
  implications: string; // e.g., "Suggests potential reversal to upside.", "Indicates indecision."
  candleCount: number; // How many candles form this pattern
  isStatisticallyWeakOrNeutral: boolean;
}

export interface VolumeAndMomentumInfo {
  volumeStatus: 'Present - Adequate' | 'Present - Low' | 'Present - High' | 'Missing' | 'Not Applicable';
  volumeInterpretation: string; // e.g., "Volume confirms upward move.", "Low volume suggests lack of conviction."
  rsiEstimate: string; // e.g., "RSI (14) at 65 - Bullish momentum, nearing overbought."
  macdEstimate: string; // e.g., "MACD showing bullish crossover above signal line."
}

export interface RiskRewardAnalysis {
  // suggestedEntry, stopLoss, takeProfit will come from main prediction fields
  tradeAssessment: 'Good' | 'Medium' | 'Bad' | 'Neutral'; // Visual gauge
  assessmentReasoning: string; // Brief reason for the assessment
}

export interface PredictMarketTrendOutput {
  trendPrediction: 'up' | 'down' | 'sideways' | 'neutral'; // Primary AI call for market direction
  confidence: number; // Confidence in trendPrediction (0-1)
  riskLevel: 'low' | 'medium' | 'high'; // Overall assessed risk for a trade
  opportunityScore: number; // Perceived opportunity (0-1)
  tradingRecommendation: 'buy' | 'hold' | 'avoid' | 'neutral'; // Suggested action
  
  // Detailed Breakdown
  trendAnalysis: TrendAnalysisDetails;
  candlestickAnalysis: {
    patterns: CandlestickPatternInfo[];
    summary?: string; // Optional summary of candlestick sentiment
  };
  volumeAndMomentum: VolumeAndMomentumInfo;
  
  // Suggested Levels (can be refined/overridden by user in UI)
  suggestedEntryPoints: string[]; // e.g., ["150.25 (breakout)", "148.50 (retest of support)"]
  takeProfitLevels: string[]; // e.g., ["155.00 (resistance)", "160.00 (pattern target)"]
  stopLossLevels: string[]; // e.g., ["147.50 (below support)"]
  rewardRiskRatio?: { reward: number; risk: number }; // If calculable

  riskRewardDetails: RiskRewardAnalysis; // Specific assessment of the trade setup

  explanationSummary: string; // Concise (1-2 sentences) reasoning for the main prediction & recommendation
  fullScientificAnalysis: string; // The comprehensive, detailed analysis text
  keyIndicators?: OldPredictMarketTrendOutput['keyIndicators']; // Keep for compatibility if needed, or phase out
  volatilityLevel?: OldPredictMarketTrendOutput['volatilityLevel']; // Keep for now
}


export interface Analysis {
  id: string; 
  userId?: string; 
  imageUrl: string; 
  extractedData?: string | null; 
  prediction: PredictMarketTrendOutput; // Use the new detailed output
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

// UserProfileData interface is back for Firestore integration
export interface UserProfileData {
  analysisAttempts: number;
  isPremium: boolean;
  userLevel: UserLevel | null; 
  subscriptionStartDate: string | null; 
  subscriptionNextBillingDate: string | null; 
  fcmTokens?: string[]; // Array of Firebase Cloud Messaging tokens
}

export type ReactionType = 'like' | 'love';

export interface FeedbackReply {
  id: string;
  userId: string;
  username: string;
  photoURL?: string | null;
  text: string;
  createdAt: any; // Firestore Timestamp
  isAdmin: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  username: string;
  photoURL?: string | null;
  text: string;
  createdAt: any; // Firestore Timestamp
  reactions: {
    [key in ReactionType]?: string[]; // Array of user IDs who reacted
  };
  replyCount?: number;
}
