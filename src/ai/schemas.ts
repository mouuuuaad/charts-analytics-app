
import {z} from 'zod';

// Define Zod schemas for the new types
export const TrendAnalysisDetailsSchema = z.object({
  direction: z.enum(['Uptrend', 'Downtrend', 'Sideways', 'Neutral']).describe("Overall trend direction."),
  candleCountBasis: z.number().min(5).describe("Number of recent candles considered for this trend assessment (must be 5 or more)."),
  trendlineDescription: z.string().describe("Description of observed trendlines, channels, or key moving averages supporting the trend. E.g., 'Price respecting ascending trendline, MA20 acting as dynamic support.'"),
});

export const CandlestickPatternInfoSchema = z.object({
  name: z.string().describe("Name of the identified candlestick pattern (e.g., 'Bullish Engulfing', 'Doji', 'Hammer', 'Morning Star')."),
  implications: z.string().describe("What this pattern typically suggests (e.g., 'Potential bullish reversal', 'Indecision, possible consolidation')."),
  candleCount: z.number().min(1).describe("Number of candles forming this specific pattern."),
  isStatisticallyWeakOrNeutral: z.boolean().describe("True if the pattern is considered weak, neutral, or its context reduces its reliability (e.g., low volume, against strong trend)."),
});

export const CandlestickAnalysisSchema = z.object({
    patterns: z.array(CandlestickPatternInfoSchema).describe("Array of identified significant candlestick patterns. Avoid drawing strong conclusions from single or very few (e.g., 2) insignificant candles unless they form a recognized strong pattern. Identify a broad range including Doji, Hammer, Engulfing, Morning/Evening Star, Three White Soldiers/Black Crows, Harami, Piercing Line, Dark Cloud Cover, Marubozu."),
    summary: z.string().optional().describe("A brief summary of the overall sentiment derived from candlestick analysis. E.g., 'Recent candles show bullish pressure.' or 'Indecision dominates recent price action.'")
});

export const VolumeAndMomentumInfoSchema = z.object({
  volumeStatus: z.enum(['Present - Adequate', 'Present - Low', 'Present - High', 'Missing', 'Not Applicable']).describe("Status of volume data from the chart. 'Missing' if not mentioned in extractedData. 'Not Applicable' if context makes volume irrelevant (rare)."),
  volumeInterpretation: z.string().describe("How volume supports or contradicts price action. E.g., 'High volume on up-move confirms bullish strength.' or 'Price rising on low volume, caution advised.' If 'Missing', state 'Volume data not available for analysis.'"),
  rsiEstimate: z.string().describe("Estimated RSI (e.g., 14-period) level and its interpretation based on extractedData. E.g., 'RSI at 68 - Bullish, approaching overbought', 'RSI at 30 - Oversold, potential for bounce', 'RSI at 50 - Neutral', 'Bearish RSI divergence observed with price making higher highs'. If not determinable from extractedData, state 'RSI not determinable from data.'"),
  macdEstimate: z.string().describe("Estimated MACD status based on extractedData. E.g., 'MACD bullish crossover above signal line', 'MACD bearish divergence observed'. If not determinable from extractedData, state 'MACD not determinable from data.'"),
});

export const RewardRiskRatioSchema = z.object({ 
    reward: z.number().min(0),
    risk: z.number().min(1), // Risk must be at least 1 to avoid division by zero or meaningless ratios
});

export const RiskRewardAnalysisSchema = z.object({
  tradeAssessment: z.enum(['Good', 'Medium', 'Bad', 'Neutral']).describe("Overall assessment of the trade setup's risk/reward profile considering all factors."),
  assessmentReasoning: z.string().describe("Brief reasoning for the trade assessment. E.g., 'Favorable R:R with multiple confluences.' or 'Poor R:R against strong resistance.'"),
});

export const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z.enum(['up', 'down', 'sideways', 'neutral']).describe('Primary predicted market trend direction. Must always be provided. Strive for a directional call (up/down/sideways) unless signals are genuinely mixed making "neutral" the most responsible call.'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) for the trend prediction, based on strength and convergence of signals. Must always be provided. Higher confidence requires strong, converging evidence.'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('Overall assessed risk for engaging in a trade based on current analysis.'),
  opportunityScore: z.number().min(0).max(1).describe('Perceived opportunity score (0-1) based on the analysis clarity and potential. Higher is better.'),
  tradingRecommendation: z.enum(['buy', 'hold', 'avoid', 'neutral']).describe('Suggested trading action (buy, hold, avoid, neutral). Must align with trendPrediction. Strive for an actionable recommendation.'),
  
  trendAnalysis: TrendAnalysisDetailsSchema,
  candlestickAnalysis: CandlestickAnalysisSchema,
  volumeAndMomentum: VolumeAndMomentumInfoSchema,
  
  suggestedEntryPoints: z.array(z.string()).min(1,"At least one suggested entry point must be provided, even if conservative or conditional.").describe('Specific suggested price levels or descriptive ranges for entering a trade, with justification. E.g., ["150.25 (on breakout of resistance)", "148.50 (retest of support zone X-Y)"]. Base on technicals from extractedData. Must always be provided. If userDefinedEntry is provided, this can reflect it or suggest alternatives.'),
  takeProfitLevels: z.array(z.string()).min(1,"At least one take profit level must be provided, even if conservative or conditional.").describe('Specific suggested price levels or ranges for taking profit, with justification. E.g., ["155.00 (next resistance)", "160.00 (1.618 Fib extension from move A-B)"]. Base on technicals from extractedData. Must always be provided. If userDefinedTakeProfit is provided, reflect or suggest alternatives.'),
  stopLossLevels: z.array(z.string()).min(1,"At least one stop loss level must be provided, even if conservative or conditional.").describe('Specific suggested price levels or ranges for placing a stop-loss, with justification. E.g., ["147.50 (below recent swing low and support X)"]. Base on technicals from extractedData. Must always be provided. If userDefinedStopLoss is provided, reflect or suggest alternatives.'),
  rewardRiskRatio: RewardRiskRatioSchema.optional().describe("Calculated potential reward to risk ratio (e.g., reward: 2, risk: 1 for 2:1). Base on primary suggested TP/SL if not user-defined. If user-defined levels are provided, calculate using those."),

  riskRewardDetails: RiskRewardAnalysisSchema,

  explanationSummary: z.string().min(1).max(250).describe('A concise summary (1-3 sentences MAX) of the most dominant factors driving the predicted trend and recommendation. Be direct and clear.'),
  fullScientificAnalysis: z.string().min(1).describe("A highly detailed, scientific, and comprehensive explanation of the analysis. This is the core of your output. It must cover all technical aspects mentioned in the prompt, justify every conclusion with robust evidence from the `extractedData` JSON (referencing specific details like identified MAs, RSI levels, volume descriptions from it), detail any limiting factors, suggest user actions for clearer insights if analysis is constrained, and be tailored to the userLevel. Acknowledge probabilities and potential alternative scenarios explicitly."),
  
  islamicFinanceConsiderations: z.string().optional().describe("A section discussing ethical and Islamic finance principles relevant to the trade, such as Sabr (patience), and avoiding Gharar (uncertainty) and Qimar (gambling). This is for educational purposes and is not a religious ruling."),

  keyIndicators: z.array(z.object({ 
    name: z.string(), value: z.string(), sentiment: z.enum(['positive', 'negative', 'neutral']).optional()
  })).optional().describe("Legacy field for general key indicators. Prefer detailed fields like rsiEstimate/macdEstimate which are derived from extractedData."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart data. Use 'normal' if not obviously low, high or extreme."),
});
