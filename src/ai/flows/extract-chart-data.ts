'use server';

/**
 * @fileOverview A flow to extract data from a chart image.
 *
 * - extractChartData - A function that handles the chart data extraction process.
 * - ExtractChartDataInput - The input type for the extractChartData function.
 * - ExtractChartDataOutput - The return type for the extractChartData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractChartDataInputSchema = z.object({
  chartImage: z
    .string()
    .describe(
      "A chart image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractChartDataInput = z.infer<typeof ExtractChartDataInputSchema>;

const ExtractChartDataOutputSchema = z.object({
  extractedData: z
    .string()
    .describe('The extracted data from the chart image in JSON format.'),
});
export type ExtractChartDataOutput = z.infer<typeof ExtractChartDataOutputSchema>;

export async function extractChartData(input: ExtractChartDataInput): Promise<ExtractChartDataOutput> {
  return extractChartDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractChartDataPrompt',
  input: {schema: ExtractChartDataInputSchema},
  output: {schema: ExtractChartDataOutputSchema},
  prompt: `You are an expert data extraction specialist.

You will extract data from the given chart image and return it in JSON format.

Chart Image: {{media url=chartImage}}

Extracted Data (JSON):`,
});

const extractChartDataFlow = ai.defineFlow(
  {
    name: 'extractChartDataFlow',
    inputSchema: ExtractChartDataInputSchema,
    outputSchema: ExtractChartDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
