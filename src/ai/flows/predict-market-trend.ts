
'use server';

/**
 * @fileOverview Predicts the market trend (up, down, sideways, or neutral) based on extracted chart data,
 * including risk assessment, opportunity score, trading recommendation, key indicators,
 * reward/risk ratio, volatility level, entry points, take profit, and stop loss levels,
 * tailored to user experience.
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
    .describe('The extracted data from the chart image in JSON format.'),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The assessed trading experience level of the user (beginner, intermediate, advanced).'),
});
export type PredictMarketTrendInput = z.infer<typeof PredictMarketTrendInputSchema>;

const KeyIndicatorSchema = z.object({
    name: z.string().describe("Name of the key indicator (e.g., 'RSI', 'MACD Crossover', 'Volume Spike', 'Trend Line Support')."),
    value: z.string().describe("Descriptive value or status of the indicator (e.g., '72 - Overbought zone, potential pullback', 'Bullish Crossover above signal line', 'Above Average, confirming up-move', 'Holding at 196.200')."),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional().describe("Sentiment of this indicator for the current prediction (e.g., positive if RSI supports upward trend). Default to neutral if not strongly indicative or mixed.")
});

const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z
    .enum(['up', 'down', 'sideways', 'neutral'])
    .describe('The predicted market trend (up, down, sideways, or neutral if no clear direction).'),
  confidence: z.number().min(0).max(1).describe('The confidence level of the trend prediction (0-1).'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('The assessed risk level for a trade based on the current analysis (low, medium, high).'),
  opportunityScore: z.number().min(0).max(1).describe('A score from 0 to 1 representing the perceived opportunity based on the analysis (higher means better perceived opportunity).'),
  tradingRecommendation: z.enum(['buy', 'hold', 'avoid', 'neutral']).describe("The suggested trading action ('buy' for potential upward movement, 'hold' if already in position or waiting for confirmation, 'avoid' if unfavorable, 'neutral' if unclear)."),
  keyIndicators: z.array(KeyIndicatorSchema).optional().describe("An array of 2-4 most relevant technical indicators observed and their status. Include interpretation (e.g., 'RSI (72) - Overbought', 'MACD - Bullish Crossover'). Mention divergences if seen."),
  rewardRiskRatio: z.object({
    reward: z.number().min(0),
    risk: z.number().min(1), // Risk part should be at least 1 for ratio calculation (e.g. 2:1 means risk is 1)
  }).optional().describe("Potential reward to risk ratio as numerical values (e.g., reward: 2, risk: 1 for a 2:1 ratio). Calculated based on suggested take profit and stop loss levels vs entry."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart (e.g., 'low', 'normal', 'high', 'extreme')."),
  suggestedEntryPoints: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for entering a trade.'),
  takeProfitLevels: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for taking profit.'),
  stopLossLevels: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for placing a stop-loss.'),
  analysisDetails: z.string().describe('A detailed explanation of the analysis, including reasoning for the trend, risk, entry, take-profit, and stop-loss levels, tailored to the user level. Must include identification of candlestick patterns, chart patterns, S/R levels, and volume analysis if data permits.'),
  reason: z.string().describe('A concise summary (1-2 sentences) of the main driver for the predicted trend and recommendation.'),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;

export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt',
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PredictMarketTrendOutputSchema},
  prompt: `You are an expert financial analyst AI specializing in market trend prediction, risk assessment, and technical analysis using chart data. Your analysis MUST be highly detailed, scientific, well-reasoned, acknowledge the inherent risks of trading, and be suitable for a financial SaaS application.

Based on the provided extracted chart data: {{{extractedData}}}
And considering the user's trading experience level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Provide a comprehensive market analysis. Your output MUST conform to the 'PredictMarketTrendOutputSchema' JSON structure.

Analysis Tasks:
1.  **Predict Market Trend**: Determine if the likely trend is 'up', 'down', 'sideways', or 'neutral'.
2.  **Confidence Level**: Provide a confidence score (0.0 to 1.0).
3.  **Risk Assessment**: Assess risk as 'low', 'medium', or 'high'.
4.  **Opportunity Score**: Assign a score from 0.0 to 1.0.
5.  **Trading Recommendation**: Recommend 'buy', 'hold', 'avoid', or 'neutral'.
6.  **Key Indicators**:
    *   Identify 2-4 key technical indicators *evident or inferable from the {{{extractedData}}}*.
    *   For each: provide its name, a descriptive current value/status (e.g., "RSI (72) - Overbought zone, suggesting potential for a pullback or consolidation.", "MACD - Bullish crossover confirmed above signal line.", "Volume - Increasing on up-moves, confirming buying interest."), and its sentiment (positive, negative, neutral).
    *   If identifiable from {{{extractedData}}}, mention any **divergences** (e.g., "Price making higher highs while RSI makes lower highs, indicating potential bearish divergence.").
7.  **Reward/Risk Ratio**: Calculate and provide numerical reward and risk values if possible.
8.  **Volatility Level**: Assess current market volatility.
9.  **Suggested Entry Points**: Provide specific price levels or descriptive ranges.
10. **Take-Profit Levels**: Provide specific price levels or ranges.
11. **Stop-Loss Levels**: Provide specific price levels or ranges.
12. **Concise Reason (reason)**: A brief (1-2 sentences) summary justifying the main trend prediction and trading recommendation.
13. **Detailed Analysis (analysisDetails)**: This is CRUCIAL. Provide a comprehensive explanation covering:
    *   **Overall Market Structure**: Briefly describe the current market structure based on {{{extractedData}}} (e.g., "short-term uptrend," "consolidation phase," "ranging market").
    *   **Candlestick Analysis**: Identify and explain any significant candlestick patterns (e.g., Doji, Hammer, Inverted Hammer, Engulfing patterns, Marubozu, Pin Bars, Morning/Evening Star) visible in the recent price action described or implied by {{{extractedData}}}. Explain their implications for short-term price movement.
    *   **Chart Pattern Analysis**: If any common chart patterns (e.g., triangles, channels, flags, pennants, wedges, head and shoulders, double/triple tops/bottoms) are discernible or described in {{{extractedData}}}, identify them. Explain their formation, potential targets, and how they influence the prediction.
    *   **Support and Resistance**: Identify key support and resistance levels inferable from {{{extractedData}}}. Explain why these levels are significant (e.g., "previous swing high," "round number," "trendline touch").
    *   **Volume Analysis**: If volume information is present in {{{extractedData}}}, analyze its relationship with price action (e.g., "Volume confirms trend as it increases with price advances," "Declining volume on a rally suggests weakening momentum," "Volume spike on reversal pattern").
    *   **Indicator Interpretation**: Elaborate on how the identified Key Indicators (from step 6) contribute to the overall analysis and prediction. Explain their signals in context.
    *   **Convergence of Signals**: Explain how different pieces of evidence (candlesticks, chart patterns, S/R levels, indicators, volume) converge to support your trend prediction and trading recommendation. If there are conflicting signals, acknowledge and discuss them, explaining which signals you are prioritizing and why.
    *   **Reasoning for Levels**: Justification for chosen entry, take-profit, and stop-loss levels MUST be tied directly to identified support/resistance levels, pattern-derived targets, Fibonacci levels (if data allows calculation), pivot points, or other clear technical rationale. Explain the logic for each level.
    *   **Timeframe Consideration**: If the timeframe of the chart (e.g., 1-minute, 5-minute, 1-hour, daily) is evident from {{{extractedData}}}, ensure your analysis, pattern recognition, and trade parameters are appropriate for that timeframe. Short-term patterns and tighter stops are more relevant on shorter timeframes.
    *   **Tailor the language and depth to the userLevel**:
        *   'beginner': "Explain technical concepts like 'support level,' 'RSI overbought,' or 'bullish engulfing pattern' in simple, clear terms. For each identified pattern or indicator, state what it typically suggests and *why* it implies a certain price movement. Focus on the fundamental logic and risk management."
        *   'intermediate': "Use standard technical analysis terminology. Focus on the interplay of multiple signals (confluence) and how they form a cohesive trading thesis. Explain the rationale behind pattern targets, risk/reward calculations, and stop-loss placements."
        *   'advanced': "Discuss nuanced interpretations, the strength and reliability of confluences, potential invalidation points for patterns/signals, and the probabilities of different scenarios. If applicable, consider the context of the broader market structure if hints are available in the data. Discuss risk management strategies in relation to the analysis."
    *   **ALWAYS conclude analysisDetails with a clear disclaimer**: "This analysis is for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results."

Extracted Data: {{{extractedData}}}
User Level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Ensure your output strictly adheres to the JSON schema provided for 'PredictMarketTrendOutputSchema'.
If specific data for optional fields cannot be reliably determined, omit them or provide sensible defaults.
Do not invent data if it's not present or clearly inferable from the chart data.
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
      throw new Error('AI failed to generate a prediction. The model may not have been able to process the extracted data.');
    }
    // Ensure defaults for potentially missing fields from AI, especially arrays
    return {
      trendPrediction: output.trendPrediction || 'neutral',
      confidence: output.confidence ?? 0.5,
      riskLevel: output.riskLevel || 'medium',
      opportunityScore: output.opportunityScore ?? 0.5,
      tradingRecommendation: output.tradingRecommendation || 'neutral',
      keyIndicators: output.keyIndicators || [],
      rewardRiskRatio: output.rewardRiskRatio, // Optional, so can be undefined
      volatilityLevel: output.volatilityLevel, // Optional
      suggestedEntryPoints: output.suggestedEntryPoints || [],
      takeProfitLevels: output.takeProfitLevels || [],
      stopLossLevels: output.stopLossLevels || [],
      analysisDetails: output.analysisDetails || "No detailed analysis provided by the AI.",
      reason: output.reason || "No concise reason provided.",
    };
  }
);

