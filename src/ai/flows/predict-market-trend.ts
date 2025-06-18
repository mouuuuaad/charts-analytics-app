
'use server';

/**
 * @fileOverview Predicts the market trend (up, down, or sideways) based on extracted chart data,
 * including risk assessment, entry points, take profit, and stop loss levels, tailored to user experience.
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

const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z
    .enum(['up', 'down', 'sideways'])
    .describe('The predicted market trend (up, down, or sideways).'),
  confidence: z.number().min(0).max(1).describe('The confidence level of the trend prediction (0-1).'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('The assessed risk level for a trade based on the current analysis (low, medium, high).'),
  suggestedEntryPoints: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for entering a trade.'),
  takeProfitLevels: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for taking profit.'),
  stopLossLevels: z.array(z.string()).describe('An array of suggested price levels or descriptive ranges for placing a stop-loss.'),
  analysisDetails: z.string().describe('A detailed explanation of the analysis, including reasoning for the trend, risk, entry, take-profit, and stop-loss levels, tailored to the user level.'),
  reason: z.string().describe('A concise summary of the main driver for the predicted trend.'),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;

export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt',
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PredictMarketTrendOutputSchema},
  prompt: `You are an expert financial analyst specializing in market trend prediction and technical analysis using chart data. Your analysis must be cautious, well-reasoned, and acknowledge the inherent risks of trading.

Based on the provided extracted chart data: {{{extractedData}}}

And considering the user's trading experience level: {{{userLevel}}} (if available, otherwise assume 'intermediate')

1.  **Predict Market Trend**: Determine if the likely trend is 'up', 'down', or 'sideways'.
2.  **Confidence Level**: Provide a confidence score (0.0 to 1.0) for your trend prediction.
3.  **Risk Assessment**: Assess the risk associated with a trade based on this trend as 'low', 'medium', or 'high'. Explain your reasoning for this risk level in the analysisDetails.
4.  **Suggested Entry Points**: Provide a list of specific price levels or descriptive ranges (e.g., "around 150.25-150.50", "on a pullback to the 50-period moving average if it holds").
5.  **Take-Profit Levels**: Provide a list of suggested price levels or ranges for taking profit.
6.  **Stop-Loss Levels**: Provide a list of suggested price levels or ranges for placing a stop-loss. These should be logical points based on your analysis (e.g., "just below the recent swing low at 148.00").
7.  **Concise Reason**: Provide a very concise summary (1-2 sentences) of the main driver for the predicted trend in the 'reason' field.
8.  **Detailed Analysis (analysisDetails)**: This is CRUCIAL. Provide a comprehensive explanation covering:
    *   Your reasoning for the trend prediction (mention any specific patterns, indicators, or price action you are basing this on from the extracted data).
    *   Justification for the confidence level.
    *   Detailed reasoning for the risk assessment.
    *   Explanation for the suggested entry, take-profit, and stop-loss levels. Link them to your chart analysis.
    *   **Tailor the language and depth of this section to the userLevel**:
        *   If 'beginner': Use simpler terms, clearly explain any jargon used (e.g., "A moving average is..."), focus heavily on risk management principles, and be very cautious in suggestions. Emphasize learning and paper trading.
        *   If 'intermediate': Assume familiarity with common terms and indicators. Provide a balanced and practical analysis.
        *   If 'advanced': You can use more technical language, discuss more nuanced patterns or indicators if applicable, and explore potential scenarios.
    *   **ALWAYS conclude the analysisDetails with a clear disclaimer**: "This analysis is for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results."

Extracted Data: {{{extractedData}}}
User Level: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}

Ensure your output strictly adheres to the JSON schema provided for 'PredictMarketTrendOutputSchema'.
The arrays for entry points, take profit, and stop loss levels should contain strings.
If the data is insufficient for a meaningful analysis on any point, explicitly state that in the relevant part of 'analysisDetails' and provide conservative or no suggestions for that aspect.
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
    // Ensure arrays are not null, default to empty arrays if AI omits them
    return {
      ...output,
      suggestedEntryPoints: output.suggestedEntryPoints || [],
      takeProfitLevels: output.takeProfitLevels || [],
      stopLossLevels: output.stopLossLevels || [],
      analysisDetails: output.analysisDetails || "No detailed analysis provided by the AI.",
      reason: output.reason || "No concise reason provided.",
    };
  }
);

