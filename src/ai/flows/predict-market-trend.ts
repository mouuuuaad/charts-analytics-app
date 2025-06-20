
'use server';

/**
 * @fileOverview Predicts the market trend (up, down, sideways, or neutral) based on extracted chart data,
 * including risk assessment, opportunity score, trading recommendation, key indicators,
 * reward/risk ratio, volatility level, entry points, take profit, and stop loss levels,
 * tailored to user experience. This flow aims for the highest possible analytical depth.
 *
 * - predictMarketTrend - A function that handles the market trend prediction process.
 * - PredictMarketTrendInput - The input type for the predictMarketTrend function.
 * - PredictMarketTrendOutput - The return type for the predictMarketTrend function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictMarketTrendInputSchema = z.object({
  extractedData: z
    .string()
    .describe('The extracted data from the chart image in JSON format. This data is the SOLE basis for your analysis.'),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The assessed trading experience level of the user (beginner, intermediate, advanced).'),
});
export type PredictMarketTrendInput = z.infer<typeof PredictMarketTrendInputSchema>;

const KeyIndicatorSchema = z.object({
    name: z.string().describe("Name of the key indicator (e.g., 'RSI', 'MACD Crossover', 'Volume Spike', 'Trend Line Support'). Must be directly observable or calculable from the extractedData."),
    value: z.string().describe("Descriptive value or status of the indicator (e.g., '72 - Overbought zone, potential pullback', 'Bullish Crossover above signal line', 'Above Average, confirming up-move', 'Holding at 196.200'). Interpretation must be included."),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional().describe("Sentiment of this indicator for the current prediction (e.g., positive if RSI supports upward trend). Default to neutral if not strongly indicative or mixed.")
});

const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z
    .enum(['up', 'down', 'sideways', 'neutral'])
    .describe('The predicted market trend (up, down, sideways, or neutral if no clear direction). This is your primary output on price direction.'),
  confidence: z.number().min(0).max(1).describe('The confidence level of the trend prediction (0-1). Be realistic and justify this score.'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('The assessed risk level for a trade based on the current analysis (low, medium, high).'),
  opportunityScore: z.number().min(0).max(1).describe('A score from 0 to 1 representing the perceived opportunity based on the analysis (higher means better perceived opportunity). Justify this score.'),
  tradingRecommendation: z.enum(['buy', 'hold', 'avoid', 'neutral']).describe("The suggested trading action ('buy' for potential upward movement, 'hold' if already in position or waiting for confirmation, 'avoid' if unfavorable, 'neutral' if unclear). Directly linked to trendPrediction."),
  keyIndicators: z.array(KeyIndicatorSchema).optional().describe("An array of 2-4 most relevant technical indicators observed from {{{extractedData}}} and their status with interpretation (e.g., 'RSI (72) - Overbought', 'MACD - Bullish Crossover'). Mention divergences if seen."),
  rewardRiskRatio: z.object({
    reward: z.number().min(0),
    risk: z.number().min(1), 
  }).optional().describe("Potential reward to risk ratio as numerical values (e.g., reward: 2, risk: 1 for a 2:1 ratio). Calculated based on suggested take profit and stop loss levels vs entry."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart (e.g., 'low', 'normal', 'high', 'extreme')."),
  suggestedEntryPoints: z.array(z.string()).describe('An array of specific suggested price levels or descriptive ranges for entering a trade, with justification from the chart data.'),
  takeProfitLevels: z.array(z.string()).describe('An array of specific suggested price levels or ranges for taking profit, with justification from the chart data.'),
  stopLossLevels: z.array(z.string()).describe('An array of specific suggested price levels or ranges for placing a stop-loss, with justification from the chart data.'),
  analysisDetails: z.string().describe('A highly detailed, scientific, and comprehensive explanation of the analysis. This is the core of your output. It must cover all technical aspects mentioned in the prompt, justify every conclusion with evidence from {{{extractedData}}}, and be tailored to the userLevel. Include identification of candlestick patterns, chart patterns, S/R levels, and volume analysis. Acknowledge probabilities and potential alternative scenarios.'),
  reason: z.string().describe('A very concise summary (1-2 sentences MAX) of the single most dominant factor or pattern driving the predicted trend and recommendation.'),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;

export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt',
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PredictMarketTrendOutputSchema},
  prompt: `You are a world-class, highly experienced, and meticulous financial analyst AI. Your sole purpose is to provide an extremely deep, scientific, and evidence-based technical analysis of financial charts. Your analysis MUST be based *exclusively* on the provided 'extractedData'. Do NOT invent data or make assumptions beyond what is present in the 'extractedData'. While striving for the most accurate indications, acknowledge that financial markets are probabilistic.

Based on the provided extracted chart data: {{{extractedData}}}
And considering the user's trading experience level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Your output MUST conform to the 'PredictMarketTrendOutputSchema' JSON structure. Every field must be thoughtfully filled.

Core Analytical Tasks (to be detailed in 'analysisDetails' and reflected in other fields):

1.  **Predict Market Trend & Confidence**:
    *   Determine the most likely market trend: 'up', 'down', 'sideways', or 'neutral'. This is your main directional call.
    *   Provide a 'confidence' score (0.0 to 1.0) for this prediction. Justify this score based on the strength and convergence of signals from {{{extractedData}}}.
    *   The 'tradingRecommendation' ('buy', 'hold', 'avoid', 'neutral') must align directly with your trend prediction.
    *   The 'reason' field should be a 1-2 sentence encapsulation of the primary driver for your prediction.

2.  **Deep Technical Breakdown (for 'analysisDetails')**:
    *   **Overall Market Structure**: Briefly describe the current market structure based on {{{extractedData}}} (e.g., "short-term uptrend within a broader consolidation phase," "clear downtrend with signs of potential reversal").
    *   **Candlestick Pattern Analysis**:
        *   Identify any significant candlestick patterns (e.g., Doji, Hammer, Inverted Hammer, Bullish/Bearish Engulfing, Piercing Line, Dark Cloud Cover, Morning/Evening Star, Three White Soldiers/Black Crows, Marubozu, Pin Bars) visible in recent price action *as described or implied by {{{extractedData}}}*.
        *   For each identified pattern, explain its textbook implication and how it specifically applies to the current chart context.
    *   **Chart Pattern Analysis**:
        *   Identify common chart patterns (e.g., triangles (ascending, descending, symmetrical), channels (bullish, bearish, horizontal), flags, pennants, wedges, head and shoulders (direct or inverse), double/triple tops/bottoms) if discernible or described in {{{extractedData}}}.
        *   Explain the pattern's formation, its bullish/bearish implications, and any potential price targets derived from it. State clearly if a pattern is still forming or confirmed.
    *   **Support and Resistance (S/R) Levels**:
        *   Identify multiple, key S/R levels inferable from {{{extractedData}}}. Justify each level (e.g., "previous swing high/low," "significant congestion area," "round number," "trendline touchpoint," "pivot point implied by data").
        *   Explain how price has reacted to these levels previously, if evident in {{{extractedData}}}.
    *   **Volume Analysis**:
        *   If volume information is present in {{{extractedData}}}, analyze its relationship with price action. Is volume confirming the trend (e.g., increasing on up-moves in an uptrend)? Is there divergence (e.g., price making new highs on declining volume, suggesting weakening momentum)? Note any volume spikes and their context.
    *   **Technical Indicator Deep Dive (for 'keyIndicators' and 'analysisDetails')**:
        *   From {{{extractedData}}}, identify 2-4 of the *most relevant* technical indicators.
        *   For each, provide its name, current value/status, and a detailed interpretation *in the context of the current chart*. For example, "RSI (72) - Indicates overbought conditions, suggesting a heightened probability of a pullback or consolidation, especially if accompanied by bearish price action." or "MACD - Bullish crossover above the signal line and zero line, indicating strengthening upward momentum."
        *   Crucially, identify any **divergences** between price and indicators (e.g., "Price is making higher highs while RSI is making lower highs, a bearish divergence signaling potential exhaustion of the uptrend.").
    *   **Convergence of Signals & Conflicting Signals**:
        *   Explain how different pieces of evidence (candlesticks, chart patterns, S/R levels, indicators, volume) **converge** to support your overall trend prediction and trading recommendation. A strong analysis relies on multiple confluent signals.
        *   If there are **conflicting signals** (e.g., a bullish chart pattern but bearish indicator divergence), acknowledge and discuss them. Explain which signals you are prioritizing and why, and how this impacts your confidence level.
    *   **Timeframe Consideration**:
        *   If the timeframe of the chart (e.g., 1-minute, 5-minute, 1-hour, daily) is evident from {{{extractedData}}}, ensure your analysis, pattern recognition, and trade parameters (entry, stop, profit targets) are appropriate for that timeframe. Explain implications (e.g., "On this 5-minute chart, the identified flag pattern suggests a short-term continuation...").
    *   **Justification for Trading Levels (for 'suggestedEntryPoints', 'takeProfitLevels', 'stopLossLevels')**:
        *   These levels MUST be directly derived from your technical analysis of S/R levels, pattern-derived targets, Fibonacci levels (if calculable from data), pivot points, or other clear technical rationale from {{{extractedData}}}. Explain the logic for each suggested level. For example, "Stop-loss placed just below the recent swing low at X, which also aligns with the identified support level."
    *   **Risk and Opportunity Assessment (for 'riskLevel', 'opportunityScore', 'rewardRiskRatio')**:
        *   Systematically assess the 'riskLevel' and 'opportunityScore'. Justify these based on the clarity of signals, volatility, and proximity to strong S/R.
        *   If 'takeProfitLevels' and 'stopLossLevels' are set, calculate and provide the 'rewardRiskRatio'.
    *   **Tailor Language to 'userLevel'**:
        *   'beginner': "Explain all technical terms (e.g., 'support level,' 'RSI,' 'bullish engulfing') simply. Focus on the 'why' behind each observation. For example, 'A support level is like a price floor where buyers tend to step in. We see this at price X because...'."
        *   'intermediate': "Use standard terminology. Emphasize confluence of signals and rationale for trade parameters."
        *   'advanced': "Discuss nuanced interpretations, strength of confluences, invalidation points for patterns, and probabilistic outcomes. Consider broader market context if {{{extractedData}}} hints at it."
    *   **Mandatory Disclaimer**: ALWAYS conclude 'analysisDetails' with: "This analysis is based on the provided chart data for educational and informational purposes only. It should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results. The predictions herein are based on technical analysis of the provided data and are probabilistic, not guaranteed."

Extracted Data: {{{extractedData}}}
User Level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Ensure your output strictly adheres to the JSON schema provided for 'PredictMarketTrendOutputSchema'. Do not invent data. If specific data for optional fields cannot be reliably determined from {{{extractedData}}}, omit them or provide sensible defaults (e.g., empty arrays for levels if none can be determined). Be extremely thorough.
`,
});

const predictMarketTrendFlow = ai.defineFlow(
  {
    name: 'predictMarketTrendFlow',
    inputSchema: PredictMarketTrendInputSchema,
    outputSchema: PredictMarketTrendOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback if AI fails to return structured output
      return {
        trendPrediction: 'neutral',
        confidence: 0.1,
        riskLevel: 'high',
        opportunityScore: 0.1,
        tradingRecommendation: 'avoid',
        keyIndicators: [],
        suggestedEntryPoints: [],
        takeProfitLevels: [],
        stopLossLevels: [],
        analysisDetails: "The AI model was unable to provide a detailed analysis for the provided chart data at this time. This could be due to unusual data patterns or a temporary issue. Please try again with a clear, standard financial chart.",
        reason: "AI analysis could not be completed.",
      };
    }
    // Ensure defaults for potentially missing fields from AI, especially arrays
    return {
      trendPrediction: output.trendPrediction || 'neutral',
      confidence: output.confidence ?? 0.5,
      riskLevel: output.riskLevel || 'medium',
      opportunityScore: output.opportunityScore ?? 0.5,
      tradingRecommendation: output.tradingRecommendation || 'neutral',
      keyIndicators: output.keyIndicators || [],
      rewardRiskRatio: output.rewardRiskRatio, 
      volatilityLevel: output.volatilityLevel, 
      suggestedEntryPoints: output.suggestedEntryPoints || [],
      takeProfitLevels: output.takeProfitLevels || [],
      stopLossLevels: output.stopLossLevels || [],
      analysisDetails: output.analysisDetails || "No detailed analysis provided by the AI. Ensure the chart data was clear and sufficient.",
      reason: output.reason || "No concise reason provided.",
    };
  }
);

