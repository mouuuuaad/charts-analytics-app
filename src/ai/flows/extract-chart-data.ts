
'use server';

/**
 * @fileOverview A flow to extract data from a chart image, determine if it's a trading chart, and assess image quality.
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
  imageQualitySufficient: z.boolean().describe('Whether the image quality is sufficient for analysis (clear, good resolution, not obscured). Default to true if not a trading chart, as quality is secondary then.'),
  extractedData: z
    .string()
    .nullable()
    .describe('The extracted data from the chart image in JSON format. Null if not a trading chart, if quality is insufficient, or if extraction fails.'),
  warningMessage: z.string().optional().describe('A warning message if the image is not a trading chart.'),
  qualityWarningMessage: z.string().optional().describe('A warning message if the image quality is poor for a trading chart.'),
});
export type ExtractChartDataOutput = z.infer<typeof ExtractChartDataOutputSchema>;

export async function extractChartData(input: ExtractChartDataInput): Promise<ExtractChartDataOutput> {
  return extractChartDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractChartDataPrompt',
  input: {schema: ExtractChartDataInputSchema},
  output: {schema: ExtractChartDataOutputSchema},
  prompt: `You are an expert data extraction specialist focusing on financial trading charts. Your tasks are:

1.  **Examine the provided image:** {{media url=chartImage}}

2.  **Determine if this image is a financial trading chart.**
    A financial trading chart specifically displays price movements of financial instruments (stocks, forex, crypto, commodities) over time. Common elements: candlesticks, line graphs showing price, OHLC bars, volume bars, time axes. Images of tables, reports, or general diagrams are NOT trading charts.
    *   If NO (it's NOT a trading chart):
        Set 'isTradingChart' to false.
        Set 'imageQualitySufficient' to true (as quality isn't the primary failure point here).
        Set 'extractedData' to null.
        Provide a concise warning in 'warningMessage' (e.g., "The uploaded image does not appear to be a financial trading chart. This tool analyzes charts related to stock prices, forex, cryptocurrencies, etc., displaying price over time.").
        Set 'qualityWarningMessage' to undefined or null.
        STOP HERE.
    *   If YES (it IS a trading chart): Proceed to step 3.

3.  **Assess the quality of the trading chart image.**
    Consider clarity, resolution, legibility of text/numbers, and absence of significant obstructions or blurriness that would hinder accurate data extraction.
    *   If Quality is POOR (unclear, blurry, low-resolution, obstructed):
        Set 'isTradingChart' to true.
        Set 'imageQualitySufficient' to false.
        Set 'extractedData' to null.
        Provide a concise warning in 'qualityWarningMessage' (e.g., "The image quality is too low for reliable analysis. Please upload a clearer, higher-resolution chart image with no obstructions.").
        Set 'warningMessage' to undefined or null.
    *   If Quality is SUFFICIENT:
        Set 'isTradingChart' to true.
        Set 'imageQualitySufficient' to true.
        Extract relevant data suitable for trend analysis and return it in JSON format in the 'extractedData' field.
        Leave 'warningMessage' and 'qualityWarningMessage' empty or undefined.

Be very critical in your assessment. If unsure, err on the side of classifying an image as not a trading chart or as poor quality.
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
            imageQualitySufficient: true, // Default to true if no AI response, primary error is lack of response
            extractedData: null,
            warningMessage: "Failed to analyze the image. The AI model did not provide a response.",
        }
    }
    // Ensure defaults if AI misses some fields, though the prompt is quite specific
    return {
        isTradingChart: output.isTradingChart ?? false,
        imageQualitySufficient: output.imageQualitySufficient ?? (output.isTradingChart ? false : true),
        extractedData: output.extractedData ?? null,
        warningMessage: output.warningMessage,
        qualityWarningMessage: output.qualityWarningMessage,
    };
  }
);
