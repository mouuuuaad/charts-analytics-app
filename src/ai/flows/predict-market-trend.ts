
'use server';

/**
 * @fileOverview Predicts the market trend (up, down, or sideways) based on extracted chart data,
 * including risk assessment, entry points, take profit, and stop loss levels.
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
  analysisDetails: z.string().describe('A detailed explanation of the analysis, including reasoning for the trend, risk, entry, take-profit, and stop-loss levels.'),
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
  prompt: `You are an expert financial analyst specializing in market trend prediction and technical analysis using chart data.

Based on the provided extracted chart data:
1.  Predict the market trend (up, down, or sideways).
2.  Provide a confidence level (0-1) for your trend prediction.
3.  Assess the risk level associated with a trade based on this trend (low, medium, high).
4.  Suggest potential entry points for a trade. These can be specific prices or descriptive ranges (e.g., "around 150.25-150.50"). Provide as an array of strings.
5.  Provide suggested take-profit levels. These can be specific prices or descriptive ranges. Provide as an array of strings.
6.  Provide suggested stop-loss levels. These can be specific prices or descriptive ranges. Provide as an array of strings.
7.  Offer a detailed explanation in the 'analysisDetails' field, covering your reasoning for the trend prediction, confidence, risk assessment, and the suggested entry, take-profit, and stop-loss levels. This should be a comprehensive analysis.
8.  Provide a very concise summary of the main driver for the predicted trend in the 'reason' field.

Extracted Data: {{{extractedData}}}

Ensure your output strictly adheres to the JSON schema provided for 'PredictMarketTrendOutputSchema'.
The arrays for entry points, take profit, and stop loss levels should contain strings.
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
      throw new Error('AI failed to generate a prediction.');
    }
    // Ensure arrays are not null, default to empty arrays if AI omits them (though schema should prevent this)
    return {
      ...output,
      suggestedEntryPoints: output.suggestedEntryPoints || [],
      takeProfitLevels: output.takeProfitLevels || [],
      stopLossLevels: output.stopLossLevels || [],
    };
  }
);

