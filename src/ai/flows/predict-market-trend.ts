
'use server';

/**
 * @fileOverview Predicts the market trend with deep technical analysis, including candlestick patterns,
 * volume, momentum, risk/reward, and provides a detailed scientific explanation.
 * This flow aims for the highest possible analytical depth and caution. (v4 - Second Entry Enhanced)
 *
 * - predictMarketTrend - A function that handles the market trend prediction process.
 * - PredictMarketTrendInput - The input type for the predictMarketTrend function.
 * - PredictMarketTrendOutput - The return type for the predictMarketTrend function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TrendAnalysisDetails, CandlestickPatternInfo, CandlestickAnalysis, VolumeAndMomentumInfo, RewardRiskRatio, RiskRewardAnalysis, PredictMarketTrendOutput as PredictMarketTrendOutputType } from '@/types'; 

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
  name: z.string().describe("Name of the identified candlestick pattern (e.g., 'Bullish Engulfing', 'Doji', 'Hammer', 'Morning Star')."),
  implications: z.string().describe("What this pattern typically suggests (e.g., 'Potential bullish reversal', 'Indecision, possible consolidation')."),
  candleCount: z.number().min(1).describe("Number of candles forming this specific pattern."),
  isStatisticallyWeakOrNeutral: z.boolean().describe("True if the pattern is considered weak, neutral, or its context reduces its reliability (e.g., low volume, against strong trend)."),
});

const CandlestickAnalysisSchema = z.object({
    patterns: z.array(CandlestickPatternInfoSchema).describe("Array of identified significant candlestick patterns. Avoid drawing strong conclusions from single or very few (e.g., 2) insignificant candles unless they form a recognized strong pattern. Identify a broad range including Doji, Hammer, Engulfing, Morning/Evening Star, Three White Soldiers/Black Crows, Harami, Piercing Line, Dark Cloud Cover, Marubozu."),
    summary: z.string().optional().describe("A brief summary of the overall sentiment derived from candlestick analysis. E.g., 'Recent candles show bullish pressure.' or 'Indecision dominates recent price action.'")
});

const VolumeAndMomentumInfoSchema = z.object({
  volumeStatus: z.enum(['Present - Adequate', 'Present - Low', 'Present - High', 'Missing', 'Not Applicable']).describe("Status of volume data from the chart."),
  volumeInterpretation: z.string().describe("How volume supports or contradicts price action. E.g., 'High volume on up-move confirms bullish strength.' or 'Price rising on low volume, caution advised.' If 'Missing', state 'Volume data not available for analysis.'"),
  rsiEstimate: z.string().describe("Estimated RSI (e.g., 14-period) level and its interpretation. E.g., 'RSI at 68 - Bullish, approaching overbought', 'RSI at 30 - Oversold, potential for bounce', 'RSI at 50 - Neutral', 'Bearish RSI divergence observed with price making higher highs'. If not determinable, state 'RSI not determinable from data.'"),
  macdEstimate: z.string().describe("Estimated MACD status. E.g., 'MACD bullish crossover above signal line', 'MACD bearish divergence observed'. If not determinable, state 'MACD not determinable from data.'"),
});

const RewardRiskRatioSchema = z.object({ 
    reward: z.number().min(0),
    risk: z.number().min(1), // Risk must be at least 1 to avoid division by zero or meaningless ratios
});

const RiskRewardAnalysisSchema = z.object({
  tradeAssessment: z.enum(['Good', 'Medium', 'Bad', 'Neutral']).describe("Overall assessment of the trade setup's risk/reward profile considering all factors."),
  assessmentReasoning: z.string().describe("Brief reasoning for the trade assessment. E.g., 'Favorable R:R with multiple confluences.' or 'Poor R:R against strong resistance.'"),
});

const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z.enum(['up', 'down', 'sideways', 'neutral']).describe('Primary predicted market trend direction. Must always be provided.'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) for the trend prediction, based on strength and convergence of signals. Must always be provided.'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('Overall assessed risk for engaging in a trade based on current analysis.'),
  opportunityScore: z.number().min(0).max(1).describe('Perceived opportunity score (0-1) based on the analysis clarity and potential. Higher is better.'),
  tradingRecommendation: z.enum(['buy', 'hold', 'avoid', 'neutral']).describe('Suggested trading action (buy, hold, avoid, neutral). Must align with trendPrediction.'),
  
  trendAnalysis: TrendAnalysisDetailsSchema,
  candlestickAnalysis: CandlestickAnalysisSchema,
  volumeAndMomentum: VolumeAndMomentumInfoSchema,
  
  suggestedEntryPoints: z.array(z.string()).min(1,"At least one suggested entry point must be provided, even if conservative.").describe('Specific suggested price levels or descriptive ranges for entering a trade, with justification. E.g., ["150.25 (on breakout of resistance)", "148.50 (retest of support zone X-Y)"]. Base on technicals from extractedData. Must always be provided, even if conservative. If userDefinedEntry is provided, this can reflect it or suggest alternatives.'),
  takeProfitLevels: z.array(z.string()).min(1,"At least one take profit level must be provided, even if conservative.").describe('Specific suggested price levels or ranges for taking profit, with justification. E.g., ["155.00 (next resistance)", "160.00 (1.618 Fib extension from move A-B)"]. Base on technicals from extractedData. Must always be provided, even if conservative. If userDefinedTakeProfit is provided, reflect or suggest alternatives.'),
  stopLossLevels: z.array(z.string()).min(1,"At least one stop loss level must be provided, even if conservative.").describe('Specific suggested price levels or ranges for placing a stop-loss, with justification. E.g., ["147.50 (below recent swing low and support X)"]. Base on technicals from extractedData. Must always be provided, even if conservative. If userDefinedStopLoss is provided, reflect or suggest alternatives.'),
  rewardRiskRatio: RewardRiskRatioSchema.optional().describe("Calculated potential reward to risk ratio (e.g., reward: 2, risk: 1 for 2:1). Base on primary suggested TP/SL if not user-defined. If user-defined levels are provided, calculate using those."),

  riskRewardDetails: RiskRewardAnalysisSchema,

  explanationSummary: z.string().min(1).max(250).describe('A concise summary (1-3 sentences MAX) of the most dominant factors driving the predicted trend and recommendation.'),
  fullScientificAnalysis: z.string().min(1).describe("A highly detailed, scientific, and comprehensive explanation of the analysis. This is the core of your output. It must cover all technical aspects mentioned in the prompt, justify every conclusion with robust evidence from {{{extractedData}}}, detail any limiting factors, suggest user actions for clearer insights if analysis is constrained, and be tailored to the userLevel. Acknowledge probabilities and potential alternative scenarios explicitly."),
  keyIndicators: z.array(z.object({ 
    name: z.string(), value: z.string(), sentiment: z.enum(['positive', 'negative', 'neutral']).optional()
  })).optional().describe("Legacy field for general key indicators. Prefer detailed fields like rsiEstimate/macdEstimate."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart data. Use 'normal' if not obviously low, high or extreme."),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;


export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow_v4_deep_analysis_second_entry(input);
}

const MANDATORY_DISCLAIMER = "This analysis is based on the provided chart data for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results. Predictions are probabilistic, not guaranteed.";

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt_v4_deep_analysis_second_entry', 
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PredictMarketTrendOutputSchema},
  prompt: `You are an exceptionally skilled, meticulous, and cautious **world-class financial technical analyst AI**. Your primary function is to provide a deeply scientific, evidence-based analysis of financial charts. Your analysis MUST be based *exclusively* on the provided 'extractedData' JSON. Do NOT invent data, make assumptions beyond what is present, or use external knowledge. Financial markets are probabilistic; reflect this in your language and confidence.

**Core Task:** Deeply analyze the provided trading chart image data ({{{extractedData}}}) to:
1.  Predict future price direction (Up/Down/Sideways/Neutral).
2.  Calculate precise Take Profit (TP) and Stop Loss (SL) levels. These must always be provided, even if conservative.
3.  Provide a clear confidence score for your directional prediction.
4.  Accompany every output with a detailed, technical explanation of your rationale.

Input Data:
- Extracted Chart Data (JSON): {{{extractedData}}}
- User Trading Experience: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}
{{#if userDefinedEntry}}- User Defined Entry: {{{userDefinedEntry}}}{{/if}}
{{#if userDefinedStopLoss}}- User Defined Stop Loss: {{{userDefinedStopLoss}}}{{/if}}
{{#if userDefinedTakeProfit}}- User Defined Take Profit: {{{userDefinedTakeProfit}}}{{/if}}

Your output MUST strictly conform to the 'PredictMarketTrendOutputSchema' JSON structure. All fields are mandatory unless marked optional.

**Analytical Requirements & Output Structure:**

1.  **Primary Prediction & Overall Assessment (Mandatory Fields)**:
    *   \\\`trendPrediction\\\`: ('up', 'down', 'sideways', 'neutral') Your main directional call. **Must always be provided.**
    *   \\\`confidence\\\`: (0.0-1.0) Justify this score based on the strength, clarity, and convergence of all technical signals from {{{extractedData}}}. Be conservative; high confidence requires overwhelming evidence. **Must always be provided.**
    *   \\\`riskLevel\\\`: ('low', 'medium', 'high') Overall risk of taking a trade based on current chart conditions (volatility, clarity of signals, proximity to strong levels).
    *   \\\`opportunityScore\\\`: (0.0-1.0) Score representing perceived opportunity. High score needs clear patterns, favorable risk/reward, and confirmation.
    *   \\\`tradingRecommendation\\\`: ('buy', 'hold', 'avoid', 'neutral') Must align with \\\`trendPrediction\\\` and overall assessment. 'Avoid' if signals are mixed, unclear, or risk is too high.
    *   \\\`volatilityLevel\\\`: ('low', 'normal', 'high', 'extreme') Assess from price action in {{{extractedData}}}.

2.  **Trend Analysis (\\\`trendAnalysis\\\`)**:
    *   \\\`direction\\\`: Dominant trend ('Uptrend', 'Downtrend', 'Sideways', 'Neutral') based on *at least the last 5-10 candles* or more if a clear longer-term trend is evident in {{{extractedData}}}.
    *   \\\`candleCountBasis\\\`: Number of candles used for this trend assessment (minimum 5).
    *   \\\`trendlineDescription\\\`: Describe key trendlines, channels, significant moving averages (e.g., MA20, MA50 if inferable from data), or other visual chart elements that define or support this trend. E.g., "Uptrend defined by an ascending channel, price currently testing lower channel bound. MA50 providing dynamic support."

3.  **Candlestick Pattern Analysis (\\\`candlestickAnalysis\\\`)**:
    *   \\\`patterns\\\`: Identify 2-4 of the *most significant and recent* candlestick patterns. Include a broad range: Doji, Hammer/Inverted Hammer, Bullish/Bearish Engulfing, Piercing Line, Dark Cloud Cover, Morning/Evening Star, Three White Soldiers/Black Crows, Harami, Marubozu.
        *   For each pattern: provide \\\`name\\\`, \\\`implications\\\` (what it suggests), \\\`candleCount\\\` (1, 2, 3 etc.), and critically, \\\`isStatisticallyWeakOrNeutral\\\` (true if the pattern's formation is imperfect, occurs in an unexpected location, lacks volume confirmation, or occurs against a strong counter-trend, making it less reliable or merely indicative of indecision).
    *   Avoid drawing strong conclusions from single, isolated, or very few (e.g., 2) non-distinct candles unless they form a recognized, powerful pattern.
    *   \\\`summary\\\`: Briefly summarize overall sentiment from recent candlesticks.

4.  **Chart Pattern Analysis (Integrate into \\\`fullScientificAnalysis\\\` and \\\`trendAnalysis.trendlineDescription\\\` where appropriate)**:
    *   Identify common chart patterns if present (e.g., Triangles (ascending, descending, symmetrical), Wedges (rising, falling), Flags, Pennants, Head and Shoulders (and inverse), Double/Triple Tops/Bottoms, Channels).
    *   Describe the pattern, its implications, and potential price targets if applicable. These details should be part of \\\`fullScientificAnalysis\\\`.

5.  **Support & Resistance (S/R) Levels (Integrate into \\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, \\\`stopLossLevels\\\`, and \\\`fullScientificAnalysis\\\`)**:
    *   Accurately delineate significant S/R levels. Justify these based on previous price action, swing highs/lows, psychological numbers, or other technical formations visible in {{{extractedData}}}. This justification is key for the TP/SL levels.

6.  **Volume & Momentum (\\\`volumeAndMomentum\\\`)**:
    *   \\\`volumeStatus\\\`: Assess if volume data seems 'Present - Adequate', 'Present - Low', 'Present - High', 'Missing', or 'Not Applicable' from {{{extractedData}}}.
    *   \\\`volumeInterpretation\\\`: If volume is present, how does it relate to price action? (e.g., "Volume increasing on up-moves, confirming uptrend strength", "Price rally on declining volume suggests weakness and potential reversal", "Spike in volume at support indicates strong buying interest"). If 'Missing', state "Volume data not available for analysis."
    *   \\\`rsiEstimate\\\`: From {{{extractedData}}}, estimate RSI (e.g., 14-period) status and its implications. Mention divergences if visible (e.g., "RSI at 65 - Bullish momentum", "RSI bearish divergence with price highs"). If not determinable, state "RSI not determinable".
    *   \\\`macdEstimate\\\`: From {{{extractedData}}}, estimate MACD status (e.g., "MACD bullish crossover above signal line", "MACD bearish divergence with price"). If not determinable, state "MACD not determinable".
    *   Interpret visual cues from any other common indicators if discernible from {{{extractedData}}}.

7.  **Advanced Pattern: Second Entry Opportunities (Integrate into \\\`fullScientificAnalysis\\\` and related fields)**:
    *   Your analysis MUST also actively look for "second entry" opportunities for both long and short positions.
    *   **For a Long Second Entry**:
        1.  Identify an initial strong bullish impulse wave from the chart data.
        2.  Observe a subsequent corrective pullback (not a full reversal) that re-tests a clearly confirmed support level (e.g., prior resistance flipped to support, a key upward trendline, or a significant moving average if discernible from data).
        3.  Look for **clear bullish confirmation** at this re-tested support. This MUST include robust evidence such as:
            *   A strong bullish candlestick pattern (e.g., Bullish Engulfing, Hammer, Piercing Line, Morning Star).
            *   A notable increase in volume on the confirmation candle(s) compared to the pullback phase.
            *   The formation of a higher low compared to a significant low within the initial impulse wave or its preceding consolidation.
        4.  If all these conditions are met, articulate this as a "Second Entry Long opportunity" within the \\\`fullScientificAnalysis\\\`. Detail each element of the setup.
        5.  Provide precise entry (e.g., "Entry above confirmation candle high at X.XX"), stop-loss (e.g., "SL below the low of the pullback/support at Y.YY"), and take-profit (e.g., "TP targeting re-test of initial impulse high at Z.ZZ, or next significant resistance"). These levels should be part of the \\\`suggestedEntryPoints\\\`, \\\`stopLossLevels\\\`, and \\\`takeProfitLevels\\\` arrays, with clear justification linking them to the second entry setup.
        6.  **Critically, explain WHY this is a second entry** and not a failed pullback or reversal. Differentiate by analyzing the depth of the pullback, volume characteristics during pullback vs. confirmation, strength of the support level, and the decisiveness of the bullish confirmation signals.
    *   **For a Short Second Entry**:
        1.  Identify an initial strong bearish impulse wave from the chart data.
        2.  Observe a subsequent corrective bounce (not a full reversal) that re-tests a clearly confirmed resistance level (e.g., prior support flipped to resistance, a key downward trendline, or a significant moving average).
        3.  Look for **clear bearish confirmation** at this re-tested resistance. This MUST include robust evidence such as:
            *   A strong bearish candlestick pattern (e.g., Bearish Engulfing, Shooting Star, Dark Cloud Cover, Evening Star).
            *   A notable increase in volume on the confirmation candle(s) compared to the bounce phase.
            *   The formation of a lower high compared to a significant high within the initial impulse wave or its preceding consolidation.
        4.  If all these conditions are met, articulate this as a "Second Entry Short opportunity" within the \\\`fullScientificAnalysis\\\`. Detail each element.
        5.  Provide precise entry, stop-loss, and take-profit levels with justifications, integrating them into the respective output arrays.
        6.  **Explain WHY this is a second entry** and not a failed bounce or reversal. Differentiate by analyzing the strength of the bounce, volume characteristics, strength of the resistance level, and the decisiveness of bearish confirmation.
    *   If such a second entry is the most compelling setup, your primary \\\`tradingRecommendation\\\` and \\\`trendPrediction\\\` should reflect this, and the confidence score adjusted. The justifications for entry/TP/SL levels must clearly reference the second entry rationale.

8.  **Trading Levels & Risk/Reward (\\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, \\\`stopLossLevels\\\` - ALL MANDATORY, \\\`rewardRiskRatio\\\`, \\\`riskRewardDetails\\\`)**:
    *   Provide *specific, actionable* price levels or narrow ranges for \\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, and \\\`stopLossLevels\\\`. **These fields must always be populated with at least one string value each, even if the market is neutral or the recommendation is 'avoid'.** In such cases, levels can be wider, indicative, or based on breakouts from current consolidation.
    *   **EACH LEVEL MUST BE JUSTIFIED** with robust reasoning from {{{extractedData}}}.
        *   **For Stop Loss (SL)**: Identify the most logical point where the trade premise is invalidated. This typically involves placing it just beyond a confirmed support (for long) or resistance (for short), or beneath the low/above the high of a significant reversal candle/pattern. Explain *why* this level invalidates the trade (e.g., "SL at 147.50, below the recent swing low at 147.80 and the identified bullish engulfing pattern's low; a break below this level would negate the bullish premise.").
        *   **For Take Profit (TP)**: Target a realistic profit objective. Identify the next significant resistance (for long) or support (for short) level. If a clear next level isn't immediately visible or is too distant, consider applying established risk-reward ratios (e.g., aiming for 1.5:1 or 2:1 relative to your SL) and clearly state this. Explain the target (e.g., "TP1 at 155.00, targeting the prominent resistance visible at the 154.80-155.20 zone from early May." or "TP set at 158.00 to achieve a 2:1 Reward:Risk ratio, as the next clear resistance is significantly further.").
    *   If user-defined levels are provided, use them for \\\`rewardRiskRatio\\\` calculation and in \\\`riskRewardDetails\\\`. You can still suggest your own levels in the arrays if they differ significantly and provide rationale.
    *   If chart data is insufficient for high-confidence levels (e.g., very new asset, extreme low liquidity, very short timeframe chart with no history), you MUST provide conservative, volatility-adjusted estimations for SL/TP. Clearly state the basis for these estimates (e.g., "SL based on 2x Average True Range (ATR) due to high volatility and lack of clear S/R.") and the inherent uncertainty.
    *   \\\`rewardRiskRatio\\\`: Calculate based on the primary suggested TP/SL or user-defined levels. Ensure 'risk' is at least 1. If not calculable (e.g. SL=TP), describe why.
    *   \\\`riskRewardDetails.tradeAssessment\\\`: ('Good', 'Medium', 'Bad', 'Neutral') Based on the R:R ratio, probability of success from TA, and overall market conditions.
    *   \\\`riskRewardDetails.assessmentReasoning\\\`: Brief justification. (e.g., "Good: R:R > 2:1 with pattern confirmation." or "Bad: R:R < 1:1, trading into resistance.")

9.  **Explanation & Justification**:
    *   \\\`explanationSummary\\\`: A very concise (1-3 sentences) summary of the MOST DOMINANT technical factor(s) driving your \\\`trendPrediction\\\` and \\\`tradingRecommendation\\\`. If a second entry is key, mention it.
    *   \\\`fullScientificAnalysis\\\`: This is CRITICAL. Provide an extensive, in-depth, and scientific explanation for your entire analysis.
        *   Synthesize all findings: how trend, patterns (candlestick, chart, second entries), S/R levels, volume, momentum, and indicators converge or diverge.
        *   Clearly state the evidence from {{{extractedData}}} for each assertion.
        *   Discuss probabilities and alternative scenarios (e.g., "If support at X breaks, the next likely target is Y.").
        *   **Limiting Factors**: Explicitly detail any limiting factors (e.g., insufficient data in view, conflicting signals, low volume reducing pattern reliability).
        *   **Suggestions for Clearer Insights**: If the analysis is constrained, suggest user actions (e.g., 'Provide a chart with a longer timeframe,' 'Look for volume confirmation on the next candle,' 'This pattern would be stronger if it occurred at a key S/R level.').
        *   Tailor language to \\\`userLevel\\\` ('beginner': explain terms; 'intermediate': standard terms; 'advanced': nuanced discussion).
        *   **Mandatory Disclaimer**: ALWAYS conclude \\\`fullScientificAnalysis\\\` with: "${MANDATORY_DISCLAIMER}"

**Critical Evaluation & Caution**:
*   Be extremely cautious. Avoid definitive statements where uncertainty exists.
*   If {{{extractedData}}} is insufficient for a reliable analysis in any section, clearly state this.
*   Your primary goal is a responsible, technically sound analysis. 'Neutral' or 'Avoid' are valid if conditions are unclear or too risky, but you must still provide TP/SL levels based on potential breakouts or ranges.
*   Ensure every field in the output schema is populated thoughtfully and accurately based *only* on {{{extractedData}}}. If specific data points are unavailable/undeterminable, use appropriate defaults ("Not determinable", empty arrays for lists IF appropriate but TP/SL/Entry must have values).
*   Crucially, ensure your entire response strictly adheres to the 'PredictMarketTrendOutputSchema' JSON structure, populating ALL required fields. \\\`trendPrediction\\\` is mandatory. Within \\\`trendAnalysis\\\`, \\\`direction\\\`, \\\`candleCountBasis\\\` (min 5), and \\\`trendlineDescription\\\` are all mandatory.

Final check: Is \\\`trendPrediction\\\` provided? Are \\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, and \\\`stopLossLevels\\\` ALL provided with at least one string entry each, and is EACH level clearly justified based on technical analysis from the chart data? Is the second entry analysis, if applicable, fully detailed in \\\`fullScientificAnalysis\\\` and reflected in suggested levels?
`,
});

const predictMarketTrendFlow_v4_deep_analysis_second_entry = ai.defineFlow(
  {
    name: 'predictMarketTrendFlow_v4_deep_analysis_second_entry',
    inputSchema: PredictMarketTrendInputSchema,
    outputSchema: PredictMarketTrendOutputSchema,
  },
  async (input): Promise<PredictMarketTrendOutputType> => {
    const {output: aiOutput} = await prompt(input);

    const baseOutput: PredictMarketTrendOutputType = {
      trendPrediction: 'neutral',
      confidence: 0.1,
      riskLevel: 'high',
      opportunityScore: 0.1,
      tradingRecommendation: 'avoid',
      trendAnalysis: {
          direction: 'Neutral',
          candleCountBasis: 5, 
          trendlineDescription: "Trend analysis details were not explicitly provided or are inconclusive based on current data. Consider providing a chart with more historical data or clearer trend indicators for a better assessment.",
      },
      candlestickAnalysis: {
          patterns: [], 
          summary: "Candlestick analysis summary not provided or patterns are inconclusive. Look for clearer candlestick formations or confirmation from volume.",
      },
      volumeAndMomentum: {
          volumeStatus: 'Missing',
          volumeInterpretation: "Volume data or interpretation not provided or insufficient for analysis. Volume is crucial for confirming patterns and trends.",
          rsiEstimate: "RSI not determinable from data or AI output. Consider adding RSI to your chart or providing clearer data.",
          macdEstimate: "MACD not determinable from data or AI output. Consider adding MACD to your chart or providing clearer data.",
      },
      suggestedEntryPoints: ["Entry levels are highly speculative due to unclear signals. Consider waiting for a breakout or breakdown from a defined range."],
      takeProfitLevels: ["Take profit levels are highly speculative. Define based on your risk tolerance and potential S/R zones if they become clearer."],
      stopLossLevels: ["Stop loss levels are highly speculative. Place based on recent swing lows/highs or volatility if market direction clarifies."],
      riskRewardDetails: {
          tradeAssessment: 'Neutral', 
          assessmentReasoning: "Risk/reward assessment could not be reliably performed or was not provided due to unclear market signals or insufficient data.",
      },
      explanationSummary: "The AI model was unable to provide a concise summary. Analysis may be limited by data quality, conflicting signals, or insufficient chart information.",
      fullScientificAnalysis: "The AI model did not provide a full scientific analysis, or the analysis was severely limited. This may be due to limitations in the provided chart data (e.g., insufficient history, unclear patterns, missing volume) or conflicting indicators. For a clearer and more reliable analysis, try providing a chart with more data points, clearer patterns, and visible volume bars. Also, consider different timeframes for a broader market context. " + MANDATORY_DISCLAIMER,
      keyIndicators: [], 
      volatilityLevel: 'normal', 
    };

    if (!aiOutput) { 
      return baseOutput; 
    }

    const finalOutput: PredictMarketTrendOutputType = JSON.parse(JSON.stringify(baseOutput));

    if (aiOutput.trendPrediction && ['up', 'down', 'sideways', 'neutral'].includes(aiOutput.trendPrediction)) {
        finalOutput.trendPrediction = aiOutput.trendPrediction;
    } 

    if (typeof aiOutput.confidence === 'number' && aiOutput.confidence >= 0 && aiOutput.confidence <= 1) {
        finalOutput.confidence = aiOutput.confidence;
    } 

    if (aiOutput.riskLevel && ['low', 'medium', 'high'].includes(aiOutput.riskLevel)) {
        finalOutput.riskLevel = aiOutput.riskLevel;
    } 

    if (typeof aiOutput.opportunityScore === 'number' && aiOutput.opportunityScore >= 0 && aiOutput.opportunityScore <= 1) {
        finalOutput.opportunityScore = aiOutput.opportunityScore;
    } 

    if (aiOutput.tradingRecommendation && ['buy', 'hold', 'avoid', 'neutral'].includes(aiOutput.tradingRecommendation)) {
        finalOutput.tradingRecommendation = aiOutput.tradingRecommendation;
    } 

    if (aiOutput.trendAnalysis) {
        if (aiOutput.trendAnalysis.direction && ['Uptrend', 'Downtrend', 'Sideways', 'Neutral'].includes(aiOutput.trendAnalysis.direction)) {
            finalOutput.trendAnalysis.direction = aiOutput.trendAnalysis.direction;
        }
        if (typeof aiOutput.trendAnalysis.candleCountBasis === 'number' && aiOutput.trendAnalysis.candleCountBasis >= 5) {
            finalOutput.trendAnalysis.candleCountBasis = aiOutput.trendAnalysis.candleCountBasis;
        } else if (typeof aiOutput.trendAnalysis.candleCountBasis === 'number' && aiOutput.trendAnalysis.candleCountBasis < 5) {
            finalOutput.trendAnalysis.candleCountBasis = 5; // Force minimum if AI provides smaller
        }
        if (typeof aiOutput.trendAnalysis.trendlineDescription === 'string' && aiOutput.trendAnalysis.trendlineDescription.trim() !== "") {
            finalOutput.trendAnalysis.trendlineDescription = aiOutput.trendAnalysis.trendlineDescription;
        }
    } 

    if (aiOutput.candlestickAnalysis) {
        if (Array.isArray(aiOutput.candlestickAnalysis.patterns)) { 
            finalOutput.candlestickAnalysis.patterns = aiOutput.candlestickAnalysis.patterns.filter(p => 
                p && typeof p.name === 'string' && typeof p.implications === 'string' && 
                typeof p.candleCount === 'number' && p.candleCount >= 1 && 
                typeof p.isStatisticallyWeakOrNeutral === 'boolean'
            ); 
        } 
        if (typeof aiOutput.candlestickAnalysis.summary === 'string') {
            finalOutput.candlestickAnalysis.summary = aiOutput.candlestickAnalysis.summary;
        } 
    }

    if (aiOutput.volumeAndMomentum) {
        if (aiOutput.volumeAndMomentum.volumeStatus && ['Present - Adequate', 'Present - Low', 'Present - High', 'Missing', 'Not Applicable'].includes(aiOutput.volumeAndMomentum.volumeStatus)) {
            finalOutput.volumeAndMomentum.volumeStatus = aiOutput.volumeAndMomentum.volumeStatus;
        }
        if (typeof aiOutput.volumeAndMomentum.volumeInterpretation === 'string' && aiOutput.volumeAndMomentum.volumeInterpretation.trim() !== "") {
            finalOutput.volumeAndMomentum.volumeInterpretation = aiOutput.volumeAndMomentum.volumeInterpretation;
        }
        if (typeof aiOutput.volumeAndMomentum.rsiEstimate === 'string' && aiOutput.volumeAndMomentum.rsiEstimate.trim() !== "") {
            finalOutput.volumeAndMomentum.rsiEstimate = aiOutput.volumeAndMomentum.rsiEstimate;
        }
        if (typeof aiOutput.volumeAndMomentum.macdEstimate === 'string' && aiOutput.volumeAndMomentum.macdEstimate.trim() !== "") {
            finalOutput.volumeAndMomentum.macdEstimate = aiOutput.volumeAndMomentum.macdEstimate;
        }
    }

    if (Array.isArray(aiOutput.suggestedEntryPoints) && aiOutput.suggestedEntryPoints.length > 0) {
        finalOutput.suggestedEntryPoints = aiOutput.suggestedEntryPoints.filter(s => typeof s === 'string' && s.trim() !== "");
    }
    if (finalOutput.suggestedEntryPoints.length === 0) finalOutput.suggestedEntryPoints = baseOutput.suggestedEntryPoints;
    
    if (Array.isArray(aiOutput.takeProfitLevels) && aiOutput.takeProfitLevels.length > 0) {
        finalOutput.takeProfitLevels = aiOutput.takeProfitLevels.filter(s => typeof s === 'string' && s.trim() !== "");
    }
    if (finalOutput.takeProfitLevels.length === 0) finalOutput.takeProfitLevels = baseOutput.takeProfitLevels;

    if (Array.isArray(aiOutput.stopLossLevels) && aiOutput.stopLossLevels.length > 0) {
        finalOutput.stopLossLevels = aiOutput.stopLossLevels.filter(s => typeof s === 'string' && s.trim() !== "");
    }
    if (finalOutput.stopLossLevels.length === 0) finalOutput.stopLossLevels = baseOutput.stopLossLevels;
    
    if (aiOutput.rewardRiskRatio && typeof aiOutput.rewardRiskRatio.reward === 'number' && typeof aiOutput.rewardRiskRatio.risk === 'number' && aiOutput.rewardRiskRatio.risk >=1) {
      finalOutput.rewardRiskRatio = aiOutput.rewardRiskRatio;
    } else {
      finalOutput.rewardRiskRatio = undefined; 
    }

    if (aiOutput.riskRewardDetails) {
        if (aiOutput.riskRewardDetails.tradeAssessment && ['Good', 'Medium', 'Bad', 'Neutral'].includes(aiOutput.riskRewardDetails.tradeAssessment)) {
            finalOutput.riskRewardDetails.tradeAssessment = aiOutput.riskRewardDetails.tradeAssessment;
        }
        if (typeof aiOutput.riskRewardDetails.assessmentReasoning === 'string' && aiOutput.riskRewardDetails.assessmentReasoning.trim() !== "") {
            finalOutput.riskRewardDetails.assessmentReasoning = aiOutput.riskRewardDetails.assessmentReasoning;
        }
    }

    if (typeof aiOutput.explanationSummary === 'string' && aiOutput.explanationSummary.trim().length >= 1) {
        finalOutput.explanationSummary = aiOutput.explanationSummary.substring(0, 250);
    } 
    
    if (typeof aiOutput.fullScientificAnalysis === 'string' && aiOutput.fullScientificAnalysis.trim().length >= 1) {
        finalOutput.fullScientificAnalysis = aiOutput.fullScientificAnalysis;
    } 
    if (!finalOutput.fullScientificAnalysis.includes(MANDATORY_DISCLAIMER)) {
        finalOutput.fullScientificAnalysis += " " + MANDATORY_DISCLAIMER;
    }
    
    if (Array.isArray(aiOutput.keyIndicators)) {
        finalOutput.keyIndicators = aiOutput.keyIndicators.filter(k => k && typeof k.name === 'string' && typeof k.value === 'string');
    } 

    if (aiOutput.volatilityLevel && ['low', 'normal', 'high', 'extreme'].includes(aiOutput.volatilityLevel)) {
        finalOutput.volatilityLevel = aiOutput.volatilityLevel;
    } 

    return finalOutput;
  }
);
    

    
