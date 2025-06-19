
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
    value: z.string().describe("Value or status of the indicator (e.g., '68 - Nearing Overbought', 'Bullish Crossover Confirmed', 'Above Average', 'Holding')."),
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
  keyIndicators: z.array(KeyIndicatorSchema).optional().describe("An array of key technical indicators observed and their status (e.g., RSI, MACD, Volume, Trend Lines). Provide 2-4 most relevant indicators."),
  rewardRiskRatio: z.object({
    reward: z.number().min(0),
    risk: z.number().min(1), // Risk part should be at least 1 for ratio calculation (e.g. 2:1 means risk is 1)
  }).optional().describe("Potential reward to risk ratio as numerical values (e.g., reward: 2, risk: 1 for a 2:1 ratio). Calculated based on suggested take profit and stop loss levels vs entry."),
  volatilityLevel: z.enum(['low', 'normal', 'high', 'extreme']).optional().describe("Assessed market volatility based on the chart (e.g., 'low', 'normal', 'high', 'extreme')."),
  suggestedEntryPoints: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for entering a trade.'),
  takeProfitLevels: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for taking profit.'),
  stopLossLevels: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for placing a stop-loss.'),
  analysisDetails: z.string().describe('A detailed explanation of the analysis, including reasoning for the trend, risk, entry, take-profit, and stop-loss levels, tailored to the user level.'),
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
  prompt: `You are an expert financial analyst AI specializing in market trend prediction, risk assessment, and technical analysis using chart data. Your analysis must be cautious, well-reasoned, and acknowledge the inherent risks of trading.

Based on the provided extracted chart data: {{{extractedData}}}
And considering the user's trading experience level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Provide a comprehensive market analysis. Your output MUST conform to the 'PredictMarketTrendOutputSchema' JSON structure.

Analysis Tasks:
1.  **Predict Market Trend**: Determine if the likely trend is 'up', 'down', 'sideways', or 'neutral' if no clear direction.
2.  **Confidence Level**: Provide a confidence score (0.0 to 1.0) for your trend prediction.
3.  **Risk Assessment**: Assess the risk associated with a trade based on this trend as 'low', 'medium', or 'high'.
4.  **Opportunity Score**: Assign a score from 0.0 to 1.0 representing the perceived opportunity. Higher scores indicate better setups based on your analysis (e.g., strong confluence of indicators, favorable risk/reward).
5.  **Trading Recommendation**: Based on your analysis, recommend 'buy', 'hold', 'avoid', or 'neutral'.
    *   'buy': Strong indication of upward potential.
    *   'hold': If currently in a position aligning with the trend, or if waiting for a minor confirmation.
    *   'avoid': If conditions are unfavorable or too risky.
    *   'neutral': If the market is unclear or lacks strong signals.
6.  **Key Indicators**: Identify 2-4 key technical indicators (e.g., RSI value, MACD status, Volume spike, Trendline break/hold) that support your analysis. For each, specify its name, current value/status, and its sentiment (positive, negative, neutral) towards your prediction.
7.  **Reward/Risk Ratio**: Based on potential entry, take-profit, and stop-loss levels you identify, calculate and provide a numerical reward and risk value (e.g., if entry is 100, stop is 98 (risk 2 points), target is 104 (reward 4 points), then reward: 4, risk: 2). If not calculable, omit this field or provide a sensible default like reward: 1, risk: 1.
8.  **Volatility Level**: Assess the current market volatility as 'low', 'normal', 'high', or 'extreme'.
9.  **Suggested Entry Points**: Provide a list of specific price levels or descriptive ranges.
10. **Take-Profit Levels**: Provide a list of suggested price levels or ranges.
11. **Stop-Loss Levels**: Provide a list of suggested price levels or ranges. These should be logical points.
12. **Concise Reason (reason)**: A very brief (1-2 sentences) summary justifying the main trend prediction and trading recommendation.
13. **Detailed Analysis (analysisDetails)**: This is CRUCIAL. Provide a comprehensive explanation covering:
    *   Your reasoning for ALL the above points (trend, confidence, risk, opportunity, recommendation, indicators, R/R, volatility).
    *   Justification for chosen entry, take-profit, and stop-loss levels, linking them to chart patterns or indicators.
    *   **Tailor the language and depth to the userLevel**:
        *   'beginner': Simpler terms, explain jargon, focus heavily on risk, emphasize learning.
        *   'intermediate': Assume common term familiarity, balanced practical analysis.
        *   'advanced': More technical language, nuanced patterns, potential scenarios.
    *   **ALWAYS conclude analysisDetails with a clear disclaimer**: "This analysis is for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results."

Extracted Data: {{{extractedData}}}
User Level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Ensure your output strictly adheres to the JSON schema provided for 'PredictMarketTrendOutputSchema'.
If specific data for optional fields (like keyIndicators, rewardRiskRatio, volatilityLevel) cannot be reliably determined, omit them or provide sensible defaults as per schema descriptions.
For example, if key indicators are hard to discern, you can return an empty array or omit the field. For rewardRiskRatio, if calculation is not feasible, omit it.
Do not make up data if it's not present or clear in the chart.
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

    