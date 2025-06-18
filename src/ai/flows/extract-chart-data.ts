
'use server';

/**
 * @fileOverview A flow to extract data from a chart image and determine if it's a trading chart.
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
  isTradingChart: z.boolean().describe('Whether the uploaded image is a financial trading chart or not.'),
  extractedData: z
    .string()
    .nullable()
    .describe('The extracted data from the chart image in JSON format. Null if not a trading chart or if extraction fails.'),
  warningMessage: z.string().optional().describe('A warning message if the image is not a trading chart or if there are other issues.'),
});
export type ExtractChartDataOutput = z.infer<typeof ExtractChartDataOutputSchema>;

export async function extractChartData(input: ExtractChartDataInput): Promise<ExtractChartDataOutput> {
  return extractChartDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractChartDataPrompt',
  input: {schema: ExtractChartDataInputSchema},
  output: {schema: ExtractChartDataOutputSchema},
  prompt: `You are an expert data extraction specialist with a focus on financial trading charts.

Your first task is to determine if the provided image is a financial trading chart (e.g., stock chart, forex chart, cryptocurrency chart with candlesticks, lines, or bars indicating price over time).

If the image IS a financial trading chart:
1. Set 'isTradingChart' to true.
2. Extract the relevant data from the chart image. The data should be suitable for trend analysis.
3. Return the extracted data in JSON format in the 'extractedData' field.
4. Leave 'warningMessage' empty or undefined.

If the image IS NOT a financial trading chart:
1. Set 'isTradingChart' to false.
2. Set the 'extractedData' field to null.
3. Provide a warning message in the 'warningMessage' field explaining that this application is designed to analyze financial trading charts only. For example: "The uploaded image does not appear to be a financial trading chart. This application can only analyze charts related to stock prices, forex, cryptocurrencies, etc."

Chart Image: {{media url=chartImage}}
`,
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

