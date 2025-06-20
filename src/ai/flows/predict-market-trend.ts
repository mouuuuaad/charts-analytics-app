
'use server';

/**
 * @fileOverview Predicts the market trend with deep technical analysis, including candlestick patterns,
 * volume, momentum, risk/reward, and provides a detailed scientific explanation.
 * This flow aims for the highest possible analytical depth and caution.
 *
 * - predictMarketTrend - A function that handles the market trend prediction process.
 * - PredictMarketTrendInput - The input type for the predictMarketTrend function.
 * - PredictMarketTrendOutput - The return type for the predictMarketTrend function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TrendAnalysisDetails, CandlestickPatternInfo, VolumeAndMomentumInfo, RiskRewardAnalysis, PredictMarketTrendOutput as PredictMarketTrendOutputType } from '@/types'; // Import new types

const PredictMarketTrendInputSchema = z.object({
  extractedData: z
    .string()
    .describe('The extracted data from the chart image in JSON format. This data is the SOLE basis for your analysis. Assume it contains OHLCV data, timestamps, and possibly names of any visible indicators.'),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The trading experience level of the user.'),
  userDefinedEntry: z.string().optional().describe("Optional user-defined entry price for R/R calculation focus."),
  userDefinedStopLoss: z.string().optional().describe("Optional user-defined stop-loss price."),
  userDefinedTakeProfit: z.string().optional().describe("Optional user-defined take-profit price."),
});
export type PredictMarketTrendInput = z.infer<typeof PredictMarketTrendInputSchema>;


// Define Zod schemas for the new types
const TrendAnalysisDetailsSchema = z.object({
  direction: z.enum(['Uptrend', 'Downtrend', 'Sideways', 'Neutral']).describe("Overall trend direction."),
  candleCountBasis: z.number().min(5).describe("Number of recent candles considered for this trend assessment (must be 5 or more)."),
  trendlineDescription: z.string().describe("Description of observed trendlines, channels, or key moving averages supporting the trend. E.g., 'Price respecting ascending trendline, MA20 acting as dynamic support.'"),
});

const CandlestickPatternInfoSchema = z.object({
  name: z.string().describe("Name of the identified candlestick pattern (e.g., 'Bullish Engulfing', 'Doji', 'Hammer')."),
  implications: z.string().describe("What this pattern typically suggests (e.g., 'Potential bullish reversal', 'Indecision, possible consolidation')."),
  candleCount: z.number().min(1).describe("Number of candles forming this specific pattern."),
  isStatisticallyWeakOrNeutral: z.boolean().describe("True if the pattern is considered weak, neutral, or its context reduces its reliability."),
});

const CandlestickAnalysisSchema = z.object({
    patterns: z.array(CandlestickPatternInfoSchema).describe("Array of identified significant candlestick patterns. Avoid drawing strong conclusions from single or very few (e.g., 2) insignificant candles unless they form a recognized strong pattern."),
    summary: z.string().optional().describe("A brief summary of the overall sentiment derived from candlestick analysis. E.g., 'Recent candles show bullish pressure.' or 'Indecision dominates recent price action.'")
});

const VolumeAndMomentumInfoSchema = z.object({
  volumeStatus: z.enum(['Present - Adequate', 'Present - Low', 'Present - High', 'Missing', 'Not Applicable']).describe("Status of volume data from the chart."),
  volumeInterpretation: z.string().describe("How volume supports or contradicts price action. E.g., 'High volume on up-move confirms bullish strength.' or 'Price rising on low volume, caution advised.' If 'Missing', state 'Volume data not available for analysis.'"),
  rsiEstimate: z.string().describe("Estimated RSI (e.g., 14-period) level and its interpretation. E.g., 'RSI at 68 - Bullish, approaching overbought', 'RSI at 30 - Oversold, potential for bounce', 'RSI at 50 - Neutral'. If not determinable, state 'RSI not determinable from data.'"),
  macdEstimate: z.string().describe("Estimated MACD status. E.g., 'MACD bullish crossover above signal line', 'MACD bearish divergence observed'. If not determinable, state 'MACD not determinable from data.'"),
});

const RewardRiskRatioSchema = z.object({ // Ensure this matches the type used in PredictMarketTrendOutputType
    reward: z.number().min(0),
    risk: z.number().min(1), // Risk should ideally be at least 1 to be meaningful
});

const RiskRewardAnalysisSchema = z.object({
  tradeAssessment: z.enum(['Good', 'Medium', 'Bad', 'Neutral']).describe("Overall assessment of the trade setup's risk/reward profile considering all factors."),
  assessmentReasoning: z.string().describe("Brief reasoning for the trade assessment. E.g., 'Favorable R:R with multiple confluences.' or 'Poor R:R against strong resistance.'"),
});

// This is the Zod schema for the entire output object
const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z.enum(['up', 'down', 'sideways', 'neutral']).describe('Primary predicted market trend direction.'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) for the trend prediction, based on strength and convergence of signals.'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('Overall assessed risk for engaging in a trade based on current analysis.'),
  opportunityScore: z.number().min(0).max(1).describe('Perceived opportunity score (0-1) based on the analysis clarity and potential. Higher is better.'),
  tradingRecommendation: z.enum(['buy', 'hold', 'avoid', 'neutral']).describe('Suggested trading action (buy, hold, avoid, neutral). Must align with trendPrediction.'),
  
  trendAnalysis: TrendAnalysisDetailsSchema,
  candlestickAnalysis: CandlestickAnalysisSchema,
  volumeAndMomentum: VolumeAndMomentumInfoSchema,
  
  suggestedEntryPoints: z.array(z.string()).describe('Specific suggested price levels or descriptive ranges for entering a trade, with justification. E.g., ["150.25 (on breakout of resistance)", "148.50 (retest of support zone X-Y)"]. Base on technicals from extractedData. If userDefinedEntry is provided, this can reflect it or suggest alternatives.'),
  takeProfitLevels: z.array(z.string()).describe('Specific suggested price levels or ranges for taking profit, with justification. E.g., ["155.00 (next resistance)", "160.00 (1.618 Fib extension from move A-B)"]. Base on technicals from extractedData. If userDefinedTakeProfit is provided, reflect or suggest alternatives.'),
  stopLossLevels: z.array(z.string()).describe('Specific suggested price levels or ranges for placing a stop-loss, with justification. E.g., ["147.50 (below recent swing low and support X)"]. Base on technicals from extractedData. If userDefinedStopLoss is provided, reflect or suggest alternatives.'),
  rewardRiskRatio: RewardRiskRatioSchema.optional().describe("Calculated potential reward to risk ratio (e.g., reward: 2, risk: 1 for 2:1). Base on primary suggested TP/SL if not user-defined. If user-defined levels are provided, calculate using those."),

  riskRewardDetails: RiskRewardAnalysisSchema,

  explanationSummary: z.string().min(1).max(250).describe('A concise summary (1-3 sentences MAX) of the most dominant factors driving the predicted trend and recommendation.'),
  fullScientificAnalysis: z.string().min(1).describe('A highly detailed, scientific, and comprehensive explanation of the analysis. This is the core of your output. It must cover all technical aspects mentioned in the prompt, justify every conclusion with robust evidence from {{{extractedData}}}, and be tailored to the userLevel. Acknowledge probabilities and potential alternative scenarios explicitly.'),
  keyIndicators: z.array(z.object({ // Keeping for potential partial compatibility if needed by UI elements not yet updated
    name: z.string(), value: z.string(), sentiment: z.enum(['positive', 'negative', 'neutral']).optional()
  })).optional().describe("Legacy field for general key indicators. Prefer detailed fields like rsiEstimate/macdEstimate."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart data. Use 'normal' if not obviously low, high or extreme."),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;


export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt_v3_detailed', // New version name
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PredictMarketTrendOutputSchema},
  prompt: `You are an exceptionally skilled, meticulous, and cautious financial technical analyst AI. Your primary function is to provide a deeply scientific, evidence-based analysis of financial charts. Your analysis MUST be based *exclusively* on the provided 'extractedData' JSON. Do NOT invent data, make assumptions beyond what is present, or use external knowledge. Financial markets are probabilistic; reflect this in your language and confidence.

Input Data:
- Extracted Chart Data (JSON): {{{extractedData}}}
- User Trading Experience: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}
{{#if userDefinedEntry}}- User Defined Entry: {{{userDefinedEntry}}}{{/if}}
{{#if userDefinedStopLoss}}- User Defined Stop Loss: {{{userDefinedStopLoss}}}{{/if}}
{{#if userDefinedTakeProfit}}- User Defined Take Profit: {{{userDefinedTakeProfit}}}{{/if}}

Your output MUST strictly conform to the 'PredictMarketTrendOutputSchema' JSON structure. All fields are mandatory unless marked optional.

**Core Analytical Tasks & Output Requirements:**

1.  **Primary Prediction & Overall Assessment**:
    *   \\\`trendPrediction\\\`: ('up', 'down', 'sideways', 'neutral') Your main directional call.
    *   \\\`confidence\\\`: (0.0-1.0) Justify this score based on the strength, clarity, and convergence of all technical signals from {{{extractedData}}}. Be conservative; high confidence requires overwhelming evidence.
    *   \\\`riskLevel\\\`: ('low', 'medium', 'high') Overall risk of taking a trade based on current chart conditions (volatility, clarity of signals, proximity to strong levels).
    *   \\\`opportunityScore\\\`: (0.0-1.0) Score representing perceived opportunity. High score needs clear patterns, favorable risk/reward, and confirmation.
    *   \\\`tradingRecommendation\\\`: ('buy', 'hold', 'avoid', 'neutral') Must align with \\\`trendPrediction\\\` and overall assessment. 'Avoid' if signals are mixed, unclear, or risk is too high.
    *   \\\`volatilityLevel\\\`: ('low', 'normal', 'high', 'extreme') Assess from price action in {{{extractedData}}}.

2.  **Trend Analysis (\\\`trendAnalysis\\\`)**:
    *   \\\`direction\\\`: Dominant trend ('Uptrend', 'Downtrend', 'Sideways', 'Neutral') based on *at least the last 5-10 candles* or more if a clear longer-term trend is evident in {{{extractedData}}}. Specify the number of candles considered in \\\`candleCountBasis\\\`.
    *   \\\`candleCountBasis\\\`: Number of candles used for this trend assessment (minimum 5).
    *   \\\`trendlineDescription\\\`: Describe key trendlines, channels, or significant moving averages (e.g., MA20, MA50 if inferable from data) that define or support this trend. E.g., "Uptrend defined by an ascending channel, price currently testing lower channel bound. MA50 providing dynamic support."

3.  **Candlestick Analysis (\\\`candlestickAnalysis\\\`)**:
    *   \\\`patterns\\\`: Identify 2-4 of the *most significant and recent* candlestick patterns (e.g., Doji, Hammer, Inverted Hammer, Bullish/Bearish Engulfing, Piercing Line, Dark Cloud Cover, Morning/Evening Star, Three White Soldiers/Black Crows, Marubozu).
        *   For each pattern: provide \\\`name\\\`, \\\`implications\\\` (what it suggests), \\\`candleCount\\\` (1, 2, 3 etc.), and critically, \\\`isStatisticallyWeakOrNeutral\\\` (true if the pattern's formation is imperfect, occurs in an unexpected location, or lacks volume confirmation, making it less reliable or merely indicative of indecision).
    *   Avoid drawing strong conclusions from single, isolated, or very few (e.g., 2) non-distinct candles unless they form a recognized, powerful pattern.
    *   \\\`summary\\\`: Briefly summarize overall sentiment from recent candlesticks.

4.  **Volume & Momentum (\\\`volumeAndMomentum\\\`)**:
    *   \\\`volumeStatus\\\`: Assess if volume data seems 'Present - Adequate', 'Present - Low', 'Present - High', 'Missing', or 'Not Applicable' from {{{extractedData}}}.
    *   \\\`volumeInterpretation\\\`: If volume is present, how does it relate to price action? (e.g., "Volume increasing on up-moves, confirming uptrend strength", "Price rally on declining volume suggests weakness and potential reversal", "Spike in volume at support indicates strong buying interest"). If 'Missing', state "Volume data not available for analysis."
    *   \\\`rsiEstimate\\\`: From {{{extractedData}}}, estimate RSI (e.g., 14-period) status (e.g., "RSI at 65 - Bullish momentum", "RSI at 75 - Overbought, caution for longs", "RSI at 25 - Oversold, potential for bounce", "RSI bearish divergence with price highs"). If not determinable, state "RSI not determinable".
    *   \\\`macdEstimate\\\`: From {{{extractedData}}}, estimate MACD status (e.g., "MACD bullish crossover above signal line", "MACD lines expanding, indicating strong momentum", "MACD bearish divergence with price"). If not determinable, state "MACD not determinable".

5.  **Trading Levels & Risk/Reward (\\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, \\\`stopLossLevels\\\`, \\\`rewardRiskRatio\\\`, \\\`riskRewardDetails\\\`)**:
    *   Provide *specific, actionable* price levels or narrow ranges for \\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, and \\\`stopLossLevels\\\`. EACH LEVEL MUST BE JUSTIFIED with reasoning from {{{extractedData}}} (e.g., "Entry at 105.50 on break of consolidation high", "Stop Loss at 103.80, below recent swing low and 0.618 Fib level", "Take Profit at 108.00, targeting previous major resistance").
    *   If user-defined levels are provided, use them for \\\`rewardRiskRatio\\\` calculation and in \\\`riskRewardDetails\\\`. You can still suggest your own levels in the arrays if they differ significantly and provide rationale.
    *   \\\`rewardRiskRatio\\\`: Calculate based on the primary suggested TP/SL or user-defined levels. Ensure 'risk' is at least 1. If not calculable (e.g. SL=TP), describe why.
    *   \\\`riskRewardDetails.tradeAssessment\\\`: ('Good', 'Medium', 'Bad', 'Neutral') Based on the R:R ratio, probability of success from TA, and overall market conditions.
    *   \\\`riskRewardDetails.assessmentReasoning\\\`: Brief justification. (e.g., "Good: R:R > 2:1 with pattern confirmation." or "Bad: R:R < 1:1, trading into resistance.")

6.  **Explanation & Justification**:
    *   \\\`explanationSummary\\\`: A very concise (1-3 sentences) summary of the MOST DOMINANT technical factor(s) driving your \\\`trendPrediction\\\` and \\\`tradingRecommendation\\\`.
    *   \\\`fullScientificAnalysis\\\`: This is CRITICAL. Provide an extensive, in-depth, and scientific explanation for your entire analysis.
        *   Synthesize all findings: how trend, patterns, volume, momentum, S/R levels converge or diverge.
        *   Clearly state the evidence from {{{extractedData}}} for each assertion.
        *   Discuss probabilities and alternative scenarios (e.g., "If support at X breaks, the next likely target is Y.").
        *   Acknowledge limitations if data is sparse or unclear. DO NOT GUESS.
        *   Tailor language to \\\`userLevel\\\` ('beginner': explain terms; 'intermediate': standard terms; 'advanced': nuanced discussion, broader context if inferable).
        *   **Mandatory Disclaimer**: ALWAYS conclude \\\`fullScientificAnalysis\\\` with: "This analysis is based on the provided chart data for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results. Predictions are probabilistic, not guaranteed."

**Critical Evaluation & Caution**:
*   Be extremely cautious. Avoid definitive statements where uncertainty exists.
*   If {{{extractedData}}} is insufficient for a reliable analysis in any section, clearly state this (e.g., in \\\`volumeInterpretation\\\` if volume is missing, or in \\\`fullScientificAnalysis\\\` if overall data quality is poor).
*   Your primary goal is a responsible, technically sound analysis, not to force a trade recommendation. 'Neutral' or 'Avoid' are valid if conditions are unclear or too risky.
*   Do not generate values for \\\`keyIndicators\\\` or \\\`volatilityLevel\\\` if the specific details are better captured in \\\`volumeAndMomentum\\\` or \\\`riskLevel\\\`/\\\`fullScientificAnalysis\\\`. If you must use \\\`volatilityLevel\\\`, ensure it's justified.

Ensure every field in the output schema is populated thoughtfully and accurately based *only* on {{{extractedData}}}.
`,
});

const predictMarketTrendFlow = ai.defineFlow(
  {
    name: 'predictMarketTrendFlow_v3_detailed', // Ensure flow name matches version
    inputSchema: PredictMarketTrendInputSchema,
    outputSchema: PredictMarketTrendOutputSchema,
  },
  async (input): Promise<PredictMarketTrendOutputType> => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback if AI fails to return structured output
      const fallbackReason = "The AI model was unable to provide a detailed analysis. This could be due to unusual data patterns or a temporary issue.";
      return {
        trendPrediction: 'neutral',
        confidence: 0.1,
        riskLevel: 'high',
        opportunityScore: 0.1,
        tradingRecommendation: 'avoid',
        trendAnalysis: {
            direction: 'Neutral',
            candleCountBasis: 0,
            trendlineDescription: "Trend analysis could not be performed.",
        },
        candlestickAnalysis: {
            patterns: [],
            summary: "Candlestick analysis could not be performed.",
        },
        volumeAndMomentum: {
            volumeStatus: 'Missing',
            volumeInterpretation: "Volume data not available.",
            rsiEstimate: "RSI not determinable.",
            macdEstimate: "MACD not determinable.",
        },
        suggestedEntryPoints: [],
        takeProfitLevels: [],
        stopLossLevels: [],
        // rewardRiskRatio will be undefined
        riskRewardDetails: {
            tradeAssessment: 'Bad',
            assessmentReasoning: "Insufficient data for risk/reward assessment.",
        },
        explanationSummary: fallbackReason.substring(0,100),
        fullScientificAnalysis: fallbackReason + " This analysis is based on the provided chart data for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results. Predictions are probabilistic, not guaranteed.",
        volatilityLevel: 'normal',
      };
    }
    // Ensure all required fields have fallbacks if AI somehow misses them, though the prompt is strict.
    return {
      trendPrediction: output.trendPrediction || 'neutral',
      confidence: output.confidence ?? 0.5,
      riskLevel: output.riskLevel || 'medium',
      opportunityScore: output.opportunityScore ?? 0.5,
      tradingRecommendation: output.tradingRecommendation || 'neutral',
      trendAnalysis: output.trendAnalysis || { direction: 'Neutral', candleCountBasis: 0, trendlineDescription: "AI did not provide trend analysis." },
      candlestickAnalysis: output.candlestickAnalysis || { patterns: [], summary: "AI did not provide candlestick analysis." },
      volumeAndMomentum: output.volumeAndMomentum || { volumeStatus: 'Missing', volumeInterpretation: "N/A", rsiEstimate: "N/A", macdEstimate: "N/A" },
      suggestedEntryPoints: output.suggestedEntryPoints || [],
      takeProfitLevels: output.takeProfitLevels || [],
      stopLossLevels: output.stopLossLevels || [],
      rewardRiskRatio: output.rewardRiskRatio, 
      riskRewardDetails: output.riskRewardDetails || { tradeAssessment: 'Neutral', assessmentReasoning: "AI did not provide detailed R/R assessment." },
      explanationSummary: output.explanationSummary || "No concise AI summary.",
      fullScientificAnalysis: output.fullScientificAnalysis || "No detailed scientific analysis provided by AI.",
      keyIndicators: output.keyIndicators || [], // Keep for now
      volatilityLevel: output.volatilityLevel || 'normal', // Keep for now
    };
  }
);

