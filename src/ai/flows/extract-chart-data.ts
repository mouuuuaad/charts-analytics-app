
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
  prompt: `You are an expert data extraction specialist with a strong focus on financial trading charts. Your primary responsibility is to accurately determine if an image is a financial trading chart and, if so, extract its data.

IMPORTANT: A financial trading chart specifically displays price movements of financial instruments (like stocks, forex, cryptocurrencies, commodities) over time. Common visual elements include candlesticks, line graphs showing price, OHLC bars, volume bars, and time axes. Images of tables, reports, news articles, or general diagrams are NOT trading charts.

Your tasks are:
1.  Examine the provided image: {{media url=chartImage}}
2.  Determine if this image is a financial trading chart.
    *   If YES: Set 'isTradingChart' to true. Extract relevant data suitable for trend analysis and return it in JSON format in the 'extractedData' field. Leave 'warningMessage' empty or undefined.
    *   If NO: Set 'isTradingChart' to false. Set 'extractedData' to null. Provide a concise warning message in the 'warningMessage' field, stating that the image is not a financial trading chart and this tool only analyzes such charts. For example: "The uploaded image does not appear to be a financial trading chart. This application is designed to analyze charts related to stock prices, forex, cryptocurrencies, etc., displaying price over time."

Be very critical in your assessment. If you are not highly confident it's a trading chart, err on the side of caution and classify it as not a trading chart.
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
    if (!output) {
        return {
            isTradingChart: false,
            extractedData: null,
            warningMessage: "Failed to analyze the image. The AI model did not provide a response."
        }
    }
    return output;
  }
);

