
'use server';

/**
 * @fileOverview Predicts the market trend with expert-level deep technical analysis, including candlestick patterns,
 * volume, momentum, risk/reward, second entries, and provides a detailed scientific explanation.
 * This flow aims for the highest possible analytical depth and caution. (v5 - Expert Analyst)
 *
 * - predictMarketTrend - A function that handles the market trend prediction process.
 * - PredictMarketTrendInput - The input type for the predictMarketTrend function.
 * - PredictMarketTrendOutput - The return type for the predictMarketTrend function.
 */


import { analysisAi as ai } from '@/ai/genkit';
import {z} from 'genkit';
import type { TrendAnalysisDetails, CandlestickPatternInfo, CandlestickAnalysis, VolumeAndMomentumInfo, RewardRiskRatio, RiskRewardAnalysis, PredictMarketTrendOutput as PredictMarketTrendOutputType } from '@/types'; 

const PredictMarketTrendInputSchema = z.object({
  extractedData: z
    .string()
    .describe('A DETAILED JSON string representing all discernible elements from the chart image. This includes descriptions of price action (candlesticks/bars), volume bars, and any visible technical indicators (e.g., moving averages, RSI, MACD). This data is the SOLE basis for your analysis. Assume it contains OHLCV data (or descriptions allowing inference), timestamps, volume data, and details of any visible indicators.'),
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
  volumeStatus: z.enum(['Present - Adequate', 'Present - Low', 'Present - High', 'Missing', 'Not Applicable']).describe("Status of volume data from the chart. 'Missing' if not mentioned in extractedData. 'Not Applicable' if context makes volume irrelevant (rare)."),
  volumeInterpretation: z.string().describe("How volume supports or contradicts price action. E.g., 'High volume on up-move confirms bullish strength.' or 'Price rising on low volume, caution advised.' If 'Missing', state 'Volume data not available for analysis.'"),
  rsiEstimate: z.string().describe("Estimated RSI (e.g., 14-period) level and its interpretation based on extractedData. E.g., 'RSI at 68 - Bullish, approaching overbought', 'RSI at 30 - Oversold, potential for bounce', 'RSI at 50 - Neutral', 'Bearish RSI divergence observed with price making higher highs'. If not determinable from extractedData, state 'RSI not determinable from data.'"),
  macdEstimate: z.string().describe("Estimated MACD status based on extractedData. E.g., 'MACD bullish crossover above signal line', 'MACD bearish divergence observed'. If not determinable from extractedData, state 'MACD not determinable from data.'"),
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
  keyIndicators: z.array(z.object({ 
    name: z.string(), value: z.string(), sentiment: z.enum(['positive', 'negative', 'neutral']).optional()
  })).optional().describe("Legacy field for general key indicators. Prefer detailed fields like rsiEstimate/macdEstimate which are derived from extractedData."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart data. Use 'normal' if not obviously low, high or extreme."),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;

// Lenient schema for the prompt output to handle incomplete AI responses gracefully.
const PartialPredictMarketTrendOutputSchema = PredictMarketTrendOutputSchema.deepPartial();


export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow_v5_expert_analyst(input);
}

const MANDATORY_DISCLAIMER = "This analysis is based on the provided chart data for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results. Predictions are probabilistic, not guaranteed.";

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt_v5_expert_analyst', 
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PartialPredictMarketTrendOutputSchema}, // Use the lenient schema for the AI output
  prompt: `You are an **EXPERT-LEVEL financial technical analyst AI**, a master of chart interpretation. Your primary directive is to evolve beyond simple observations into providing a flawless, comprehensive, and trustworthy assessment. You will receive DETAILED JSON in \`{{{extractedData}}}\`, which includes descriptions of candles, price action, volume, and any visible indicators like EMAs, RSI, or MACD. This JSON in \`{{{extractedData}}}\` is your SOLE source of truth. Do NOT invent data or use external knowledge.

**Core Task:** From the JSON provided in \`{{{extractedData}}}\`, perform a deep, multi-layered analysis to:
1.  **Confidently identify the market trend** (Up/Down/Sideways). Avoid "Neutral" unless signals are overwhelmingly mixed.
2.  **Pinpoint critical support and resistance zones.**
3.  **Recognize both simple and complex candlestick and chart patterns.**
4.  Your **PRIMARY OUTPUT** must be **precise, actionable, and logically justified Stop Loss (SL) and Take Profit (TP) levels.**
    *   SL should be at the point where the trade premise is invalidated.
    *   TP should be at the next high-probability target, ensuring a favorable risk-reward.
5.  Accompany EVERY output with a **detailed, clear rationale in \`fullScientificAnalysis\`** explaining *why* you arrived at your conclusions, referencing specific visual evidence from the JSON in \`{{{extractedData}}}\` (e.g., "The bullish engulfing pattern on increasing volume, as noted in the 'candlestickDetails' and 'volumeAnalysis' attributes of the JSON in \`{{{extractedData}}}\`, supports the entry.").
6.  The final goal is a **holistic, professional-grade assessment** that empowers the user, moving far beyond uncertain predictions.

Input Data:
- Extracted Chart Data (JSON describing visual elements): \`{{{extractedData}}}\`
- User Trading Experience: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}
{{#if userDefinedEntry}}- User Defined Entry: {{{userDefinedEntry}}}{{/if}}
{{#if userDefinedStopLoss}}- User Defined Stop Loss: {{{userDefinedStopLoss}}}{{/if}}
{{#if userDefinedTakeProfit}}- User Defined Take Profit: {{{userDefinedTakeProfit}}}{{/if}}

Your output MUST strictly conform to the JSON structure. All fields are mandatory unless marked optional.

**Analytical Requirements & Output Structure (Referencing the JSON in \`{{{extractedData}}}\`):**

1.  **Primary Prediction & Overall Assessment (Mandatory Fields)**:
    *   \`trendPrediction\`: ('up', 'down', 'sideways', 'neutral') Your main directional call. Strive for a clear directional call. **Must always be provided.**
    *   \`confidence\`: (0.0-1.0) Justify based on convergence of signals from the JSON in \`{{{extractedData}}}\`. High confidence requires overwhelming, converging evidence. **Must always be provided.**
    *   \`riskLevel\`: ('low', 'medium', 'high') Based on volatility (from price action in \`{{{extractedData}}}\`), clarity of signals.
    *   \`opportunityScore\`: (0.0-1.0) Clarity, favorable R:R, confirmation.
    *   \`tradingRecommendation\`: ('buy', 'hold', 'avoid', 'neutral') Align with \`trendPrediction\`. 'Avoid' if signals are unclear or risk too high despite efforts.
    *   \`volatilityLevel\`: ('low', 'normal', 'high', 'extreme') Assess from price action described in the JSON of \`{{{extractedData}}}\`.

2.  **Trend Analysis (\`trendAnalysis\`)**:
    *   \`direction\`: Dominant trend ('Uptrend', 'Downtrend', 'Sideways', 'Neutral') based on *at least the last 5-10 candles* described in the JSON from \`{{{extractedData}}}\`.
    *   \`candleCountBasis\`: Number of candles used (min 5).
    *   \`trendlineDescription\`: Describe key trendlines, channels, significant moving averages (details for which can be found in the 'movingAverages' attribute within the JSON of \`{{{extractedData}}}\`), or other visual chart elements from \`{{{extractedData}}}\` that define or support this trend.

3.  **Candlestick Pattern Analysis (\`candlestickAnalysis\`)**: (Based on candle descriptions found in the JSON of \`{{{extractedData}}}\`)
    *   \`patterns\`: Identify 2-4 of the *most significant and recent* candlestick patterns. Include a broad range.
        *   For each: \`name\`, \`implications\`, \`candleCount\`, \`isStatisticallyWeakOrNeutral\` (true if imperfect, poor location, lacks volume confirmation from the 'volumeAnalysis' attribute in \`{{{extractedData}}}\`, or against strong counter-trend).
    *   Avoid strong conclusions from isolated or few non-distinct candles unless they form a recognized, powerful pattern.
    *   \`summary\`: Briefly summarize overall sentiment from recent candlesticks.

4.  **Chart Pattern Analysis (Integrate into \`fullScientificAnalysis\` and \`trendAnalysis.trendlineDescription\` where appropriate)**: (Based on overall price action in the JSON of \`{{{extractedData}}}\`)
    *   Identify common chart patterns (Triangles, Wedges, Flags, Pennants, Head and Shoulders, Double/Triple Tops/Bottoms, Channels).
    *   Describe the pattern, implications, and potential price targets.

5.  **Support & Resistance (S/R) Levels (Integrate into trade levels and \`fullScientificAnalysis\`)**: (Based on the 'keyHorizontalLevels' attribute within the JSON of \`{{{extractedData}}}\` and price action)
    *   Accurately delineate significant S/R. Justify based on previous price action, swing highs/lows visible in the JSON of \`{{{extractedData}}}\`.

6.  **Volume & Momentum (\`volumeAndMomentum\`)**: (Based on attributes like 'volumeAnalysis', 'rsi', and 'macd' within the JSON of \`{{{extractedData}}}\`)
    *   \`volumeStatus\`: Assess from the 'volumePresent' field within the 'volumeAnalysis' attribute of the JSON in \`{{{extractedData}}}\`. If 'Missing', state "Volume data not found in extracted chart details."
    *   \`volumeInterpretation\`: If volume present, correlate with price action using the 'recentVolumeDescription' from the 'volumeAnalysis' attribute in the JSON of \`{{{extractedData}}}\`.
    *   \`rsiEstimate\`: Use the 'value' and 'condition' from the 'rsi' attribute in the JSON of \`{{{extractedData}}}\`. If not determinable from \`{{{extractedData}}}\`, state "RSI not determinable from chart data."
    *   \`macdEstimate\`: Use the 'status' from the 'macd' attribute in the JSON of \`{{{extractedData}}}\`. If not determinable from \`{{{extractedData}}}\`, state "MACD not determinable from chart data."

7.  **Advanced Pattern: Second Entry Opportunities (Integrate into \`fullScientificAnalysis\`)**:
    *   Actively look for "second entry" opportunities (long and short) based on sequences in the JSON of \`{{{extractedData}}}\`.
    *   **Long Second Entry**: Initial strong bullish impulse, corrective pullback to *confirmed support* (e.g., prior resistance, trendline, MA details from \`{{{extractedData}}}\`), then *clear bullish confirmation* (strong bullish candle pattern from \`{{{extractedData}}}\`, volume increase noted in 'volumeAnalysis' attribute of \`{{{extractedData}}}\`, higher low).
    *   **Short Second Entry**: Initial strong bearish impulse, corrective bounce to *confirmed resistance*, then *clear bearish confirmation*.
    *   Detail each element. Explain WHY it's a second entry. Provide precise entry, SL, TP in the main output arrays, justified by this pattern.

8.  **Trading Levels & Risk/Reward (\`suggestedEntryPoints\`, \`takeProfitLevels\`, \`stopLossLevels\` - ALL MANDATORY, \`rewardRiskRatio\`, \`riskRewardDetails\`)**:
    *   Provide *specific, actionable* price levels. **These fields must always be populated with at least one string value each.**
    *   **EACH LEVEL MUST BE JUSTIFIED** with robust reasoning from the JSON in \`{{{extractedData}}}\`.
        *   **Stop Loss (SL)**: Identify the most logical point where the trade premise is invalidated (beyond confirmed S/R from details in \`{{{extractedData}}}\`, or below/above low/high of significant reversal candle/pattern from details in \`{{{extractedData}}}\`). Explain *why* this level invalidates the trade.
        *   **Take Profit (TP)**: Target a realistic profit objective. Identify the next significant S/R level (from details in \`{{{extractedData}}}\`). If unclear, apply risk-reward ratios (e.g., 1.5:1 or 2:1 relative to SL) and state this. Explain the target.
    *   If user-defined levels are provided, use them for \`rewardRiskRatio\` and \`riskRewardDetails\`. You can still suggest your own.
    *   If the JSON in \`{{{extractedData}}}\` is insufficient for high-confidence levels, YOU MUST provide conservative, volatility-adjusted estimations. Clearly state the basis and uncertainty.
    *   \`rewardRiskRatio\`: Calculate based on primary suggested TP/SL or user-defined. Ensure 'risk' >= 1.
    *   \`riskRewardDetails.tradeAssessment\`: ('Good', 'Medium', 'Bad', 'Neutral').
    *   \`riskRewardDetails.assessmentReasoning\`: Brief justification.

9.  **Explanation & Justification**:
    *   \`explanationSummary\`: 1-3 sentences MAX of DOMINANT factors from the JSON in \`{{{extractedData}}}\` driving prediction. **CRITICAL: This field MUST NOT exceed 250 characters.**
    *   \`fullScientificAnalysis\`: CRITICAL. Extensive, in-depth, scientific explanation.
        *   Synthesize all findings: how trend, patterns, S/R, volume, momentum, indicators (all from the JSON in \`{{{extractedData}}}\`) converge or diverge.
        *   **Explicitly reference elements from the JSON in \`{{{extractedData}}}\` for each assertion.**
        *   Discuss probabilities, alternative scenarios, and counteracting elements.
        *   **Limiting Factors**: Detail any (e.g., the JSON in \`{{{extractedData}}}\` lacks clarity on indicator X, volume is low per 'volumeAnalysis' attribute in \`{{{extractedData}}}\`).
        *   **Suggestions for Clearer Insights**: If analysis constrained by the JSON in \`{{{extractedData}}}\`, suggest user actions (e.g., 'Provide chart with clearer MA lines,' 'Higher resolution image needed to confirm candle details.').
        *   Tailor language to \`userLevel\`.
        *   **Mandatory Disclaimer**: ALWAYS conclude \`fullScientificAnalysis\` with: "${MANDATORY_DISCLAIMER}"

**Critical Evaluation & Caution**:
*   Be extremely cautious. If the JSON in \`{{{extractedData}}}\` is poor or sparse, state this clearly and reflect it in low confidence and wider TP/SL ranges.
*   Your goal is a responsible, technically sound analysis. 'Neutral' or 'Avoid' are valid if the JSON in \`{{{extractedData}}}\` makes a directional call too risky, but you must still provide reasoned TP/SL levels.
*   Ensure every field in output schema is populated based *only* on the JSON in \`{{{extractedData}}}\`.

**Final Check:** Is \`trendPrediction\` provided with a non-neutral value if evidence supports it? Are \`suggestedEntryPoints\`, \`takeProfitLevels\`, and \`stopLossLevels\` ALL provided with at least one string entry each, and is EACH level clearly justified using specifics from the JSON in \`{{{extractedData}}}\`? Is second entry analysis (if applicable) fully detailed?
`,
});

const predictMarketTrendFlow_v5_expert_analyst = ai.defineFlow(
    {
      name: 'predictMarketTrendFlow_v5_expert_analyst',
      inputSchema: PredictMarketTrendInputSchema,
      outputSchema: PredictMarketTrendOutputSchema,
    },
    async (input): Promise<PredictMarketTrendOutputType> => {
      const {output: aiOutput} = await prompt(input);
  
      // Define a comprehensive base output that satisfies ALL REQUIRED FIELDS
      const baseOutput: PredictMarketTrendOutputType = {
        // REQUIRED FIELDS - these must always be present
        trendPrediction: 'neutral', 
        confidence: 0.1,
        riskLevel: 'high',
        opportunityScore: 0.1,
        tradingRecommendation: 'avoid',
        
        trendAnalysis: {
            direction: 'Neutral',
            candleCountBasis: 5, // Min 5 as per schema
            trendlineDescription: "Trend analysis details were not explicitly provided by the AI or are inconclusive based on current data.",
        },
        
        candlestickAnalysis: {
            patterns: [], 
            summary: "Candlestick analysis summary not provided by AI or patterns are inconclusive.",
        },
        
        volumeAndMomentum: {
            volumeStatus: 'Missing',
            volumeInterpretation: "Volume data or interpretation not provided by AI or insufficient for analysis.",
            rsiEstimate: "RSI not determinable from the provided data.",
            macdEstimate: "MACD not determinable from the provided data.",
        },
        
        suggestedEntryPoints: ["Entry levels are speculative due to unclear signals. Consider waiting for clearer confirmation."],
        takeProfitLevels: ["Take profit levels are speculative. Define based on your risk tolerance and S/R zones."],
        stopLossLevels: ["Stop loss levels are speculative. Place based on recent swing lows/highs or volatility."],
        
        riskRewardDetails: {
            tradeAssessment: 'Neutral',
            assessmentReasoning: "Risk/reward assessment could not be reliably performed due to unclear market signals.",
        },
        
        explanationSummary: "Analysis limited by data quality or conflicting signals. Proceed with caution.", // Max 250 char
        fullScientificAnalysis: "The AI model did not provide a full scientific analysis, or the analysis was severely limited. " + MANDATORY_DISCLAIMER,
        
        // OPTIONAL fields can be undefined or have default values
        rewardRiskRatio: undefined,
        keyIndicators: [],
        volatilityLevel: 'normal',
      };
  
      if (!aiOutput) { 
        console.warn("AI output was null for predictMarketTrendFlow_v5. Returning baseOutput.");
        return baseOutput; 
      }
  
      const finalOutput: PredictMarketTrendOutputType = JSON.parse(JSON.stringify(baseOutput));
  
      // Merge primary REQUIRED fields
      if (aiOutput.trendPrediction && ['up', 'down', 'sideways', 'neutral'].includes(aiOutput.trendPrediction)) {
          finalOutput.trendPrediction = aiOutput.trendPrediction;
      }
      if (typeof aiOutput.confidence === 'number' && aiOutput.confidence >= 0 && aiOutput.confidence <= 1) {
          finalOutput.confidence = aiOutput.confidence;
      } else {
          finalOutput.confidence = baseOutput.confidence; // Ensure valid if AI gives bad value
      }
      if (aiOutput.riskLevel && ['low', 'medium', 'high'].includes(aiOutput.riskLevel)) {
          finalOutput.riskLevel = aiOutput.riskLevel;
      }
      if (typeof aiOutput.opportunityScore === 'number' && aiOutput.opportunityScore >= 0 && aiOutput.opportunityScore <= 1) {
          finalOutput.opportunityScore = aiOutput.opportunityScore;
      } else {
          finalOutput.opportunityScore = baseOutput.opportunityScore; // Ensure valid
      }
      if (aiOutput.tradingRecommendation && ['buy', 'hold', 'avoid', 'neutral'].includes(aiOutput.tradingRecommendation)) {
          finalOutput.tradingRecommendation = aiOutput.tradingRecommendation;
      }

      // Merge trendAnalysis (REQUIRED object with required sub-fields)
      if (aiOutput.trendAnalysis) {
          if (aiOutput.trendAnalysis.direction && ['Uptrend', 'Downtrend', 'Sideways', 'Neutral'].includes(aiOutput.trendAnalysis.direction)) {
              finalOutput.trendAnalysis.direction = aiOutput.trendAnalysis.direction;
          }
          if (typeof aiOutput.trendAnalysis.candleCountBasis === 'number' && aiOutput.trendAnalysis.candleCountBasis >= 5) {
              finalOutput.trendAnalysis.candleCountBasis = Math.floor(aiOutput.trendAnalysis.candleCountBasis); // Ensure integer
          } else {
              finalOutput.trendAnalysis.candleCountBasis = baseOutput.trendAnalysis.candleCountBasis; // Ensure min 5
          }
          if (typeof aiOutput.trendAnalysis.trendlineDescription === 'string' && aiOutput.trendAnalysis.trendlineDescription.trim() !== "") {
              finalOutput.trendAnalysis.trendlineDescription = aiOutput.trendAnalysis.trendlineDescription;
          }
      }
  
      // Merge candlestickAnalysis (REQUIRED object)
      if (aiOutput.candlestickAnalysis) {
          if (Array.isArray(aiOutput.candlestickAnalysis.patterns)) {
              const validPatterns = aiOutput.candlestickAnalysis.patterns.filter(p => 
                  p && typeof p.name === 'string' && typeof p.implications === 'string' && 
                  typeof p.candleCount === 'number' && p.candleCount >= 1 && 
                  typeof p.isStatisticallyWeakOrNeutral === 'boolean'
              );
              // No minimum for patterns array, empty is fine
              finalOutput.candlestickAnalysis.patterns = validPatterns;
          }
          if (typeof aiOutput.candlestickAnalysis.summary === 'string' && aiOutput.candlestickAnalysis.summary.trim() !== "") {
              finalOutput.candlestickAnalysis.summary = aiOutput.candlestickAnalysis.summary;
          } else if (!finalOutput.candlestickAnalysis.summary && baseOutput.candlestickAnalysis.summary) { // Ensure summary is not empty string if AI provides empty
              finalOutput.candlestickAnalysis.summary = baseOutput.candlestickAnalysis.summary;
          }
      }
  
      // Merge volumeAndMomentum (REQUIRED object with required sub-fields)
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
  
      // Merge required arrays - these MUST have at least one element
      if (Array.isArray(aiOutput.suggestedEntryPoints) && aiOutput.suggestedEntryPoints.length > 0 && 
          aiOutput.suggestedEntryPoints.every(s => typeof s === 'string' && s.trim() !== "")) {
          finalOutput.suggestedEntryPoints = aiOutput.suggestedEntryPoints;
      }
      
      if (Array.isArray(aiOutput.takeProfitLevels) && aiOutput.takeProfitLevels.length > 0 && 
          aiOutput.takeProfitLevels.every(s => typeof s === 'string' && s.trim() !== "")) {
          finalOutput.takeProfitLevels = aiOutput.takeProfitLevels;
      }
  
      if (Array.isArray(aiOutput.stopLossLevels) && aiOutput.stopLossLevels.length > 0 && 
          aiOutput.stopLossLevels.every(s => typeof s === 'string' && s.trim() !== "")) {
          finalOutput.stopLossLevels = aiOutput.stopLossLevels;
      }
  
      // Merge riskRewardDetails (REQUIRED object with required sub-fields)
      if (aiOutput.riskRewardDetails) {
          if (aiOutput.riskRewardDetails.tradeAssessment && ['Good', 'Medium', 'Bad', 'Neutral'].includes(aiOutput.riskRewardDetails.tradeAssessment)) {
              finalOutput.riskRewardDetails.tradeAssessment = aiOutput.riskRewardDetails.tradeAssessment;
          }
          if (typeof aiOutput.riskRewardDetails.assessmentReasoning === 'string' && aiOutput.riskRewardDetails.assessmentReasoning.trim() !== "") {
              finalOutput.riskRewardDetails.assessmentReasoning = aiOutput.riskRewardDetails.assessmentReasoning;
          }
      }
  
      // Merge required string fields
      if (typeof aiOutput.explanationSummary === 'string' && aiOutput.explanationSummary.trim().length >= 1) {
          finalOutput.explanationSummary = aiOutput.explanationSummary.substring(0, 250); // Ensure max length
      }
      
      if (typeof aiOutput.fullScientificAnalysis === 'string' && aiOutput.fullScientificAnalysis.trim().length >= 1) {
          finalOutput.fullScientificAnalysis = aiOutput.fullScientificAnalysis;
      }
      
      // Ensure disclaimer is always present
      if (!finalOutput.fullScientificAnalysis.includes(MANDATORY_DISCLAIMER)) {
          finalOutput.fullScientificAnalysis = (finalOutput.fullScientificAnalysis.trim() + " " + MANDATORY_DISCLAIMER).trim();
      }
      
      // Merge optional fields
      if (aiOutput.rewardRiskRatio && 
          typeof aiOutput.rewardRiskRatio.reward === 'number' && aiOutput.rewardRiskRatio.reward >= 0 && 
          typeof aiOutput.rewardRiskRatio.risk === 'number' && aiOutput.rewardRiskRatio.risk >= 1) {
          finalOutput.rewardRiskRatio = aiOutput.rewardRiskRatio;
      }
  
      if (Array.isArray(aiOutput.keyIndicators)) {
          finalOutput.keyIndicators = aiOutput.keyIndicators.filter(k => 
              k && typeof k.name === 'string' && typeof k.value === 'string'
          );
      }
  
      if (aiOutput.volatilityLevel && ['low', 'normal', 'high', 'extreme'].includes(aiOutput.volatilityLevel)) {
          finalOutput.volatilityLevel = aiOutput.volatilityLevel;
      }
        
      return finalOutput;
    }
  );
    

    



    
