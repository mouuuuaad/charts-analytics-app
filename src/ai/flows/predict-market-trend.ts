'use server';

/**
 * @fileOverview Predicts the market trend (up or down) based on extracted chart data.
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
    .describe('The extracted data from the chart image.'),
});
export type PredictMarketTrendInput = z.infer<typeof PredictMarketTrendInputSchema>;

const PredictMarketTrendOutputSchema = z.object({
  trendPrediction: z
    .enum(['up', 'down'])
    .describe('The predicted market trend (up or down).'),
  confidence: z.number().describe('The confidence level of the prediction (0-1).'),
  reason: z.string().describe('Explanation for the prediction.'),
});
export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;

export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt',
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PredictMarketTrendOutputSchema},
  prompt: `You are an expert financial analyst specializing in market trend prediction.

You will analyze the extracted chart data and predict the market trend (up or down).
Provide a confidence level (0-1) for your prediction and a brief explanation.

Extracted Data: {{{extractedData}}}
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
    return output!;
  }
);
