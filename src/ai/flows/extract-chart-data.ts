
'use server';

/**
 * @fileOverview A flow to extract detailed data from a chart image, determine if it's a trading chart,
 * and assess image quality for comprehensive analysis.
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
  imageQualitySufficient: z.boolean().describe('Whether the image quality is sufficient for detailed analysis (clear, good resolution, not obscured). Default to true if not a trading chart, as quality is secondary then.'),
  extractedData: z
    .string()
    .nullable()
    .describe('A DETAILED JSON string representing all discernible elements from the chart image. This includes descriptions of price action (candlesticks/bars), volume bars, and any visible technical indicators (e.g., moving averages, RSI, MACD). Null if not a trading chart, if quality is insufficient, or if extraction fails to identify relevant trading elements.'),
  warningMessage: z.string().optional().describe('A warning message if the image is not a trading chart or if critical trading elements are missing.'),
  qualityWarningMessage: z.string().optional().describe('A warning message if the image quality is poor for a trading chart, detailing what is obscured or unclear.'),
});
export type ExtractChartDataOutput = z.infer<typeof ExtractChartDataOutputSchema>;

export async function extractChartData(input: ExtractChartDataInput): Promise<ExtractChartDataOutput> {
  return extractChartDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDetailedChartDataPrompt_v2', // Version updated
  input: {schema: ExtractChartDataInputSchema},
  output: {schema: ExtractChartDataOutputSchema},
  prompt: `You are an expert financial chart data extraction AI. Your primary goal is to meticulously analyze the provided image and extract ALL discernible trading-related information into a structured JSON string.

**Image for Analysis:** {{media url=chartImage}}

**Your tasks are:**

1.  **Determine if this image is a financial trading chart.**
    *   A financial trading chart specifically displays price movements of financial instruments (stocks, forex, crypto, commodities) over time.
    *   **Key elements to look for:** Candlesticks, OHLC bars, line graphs showing price, clearly defined time axis, price axis, volume bars, and potentially technical indicators (lines on chart, sub-panels).
    *   Images of tables, reports, news articles, or general diagrams are NOT trading charts.
    *   If NO (it's NOT a trading chart or lacks essential trading elements):
        *   Set \\\`isTradingChart\\\` to false.
        *   Set \\\`imageQualitySufficient\\\` to true (as quality for non-charts is not the primary failure).
        *   Set \\\`extractedData\\\` to null.
        *   Provide a concise \\\`warningMessage\\\` (e.g., "The uploaded image does not appear to be a financial trading chart. It lacks essential elements like price action over time or identifiable trading indicators.").
        *   Set \\\`qualityWarningMessage\\\` to undefined.
        *   **STOP HERE.**
    *   If YES (it IS a trading chart): Proceed to step 2.

2.  **Assess the quality of the TRADING CHART image for DETAILED analysis.**
    *   Consider:
        *   **Clarity & Resolution:** Are individual candles/bars, numbers, and text legible? Is it high-resolution or blurry?
        *   **Completeness:** Are essential parts of the chart visible (price axis, time axis, most recent price action)?
        *   **Obstructions:** Is the chart significantly covered by drawings, watermarks, or other objects that prevent analysis of underlying data?
    *   If Quality is POOR (unclear, blurry, low-resolution, incomplete, heavily obstructed):
        *   Set \\\`isTradingChart\\\` to true.
        *   Set \\\`imageQualitySufficient\\\` to false.
        *   Set \\\`extractedData\\\` to null.
        *   Provide a concise \\\`qualityWarningMessage\\\` detailing why the quality is insufficient (e.g., "Image is too blurry to discern candle details.", "Key indicators are obscured.", "Price and time axes are unreadable.").
        *   Set \\\`warningMessage\\\` to undefined.
        *   **STOP HERE.**
    *   If Quality is SUFFICIENT: Proceed to step 3.

3.  **Extract DETAILED data into a JSON string for the \\\`extractedData\\\` field.**
    *   Set \\\`isTradingChart\\\` to true.
    *   Set \\\`imageQualitySufficient\\\` to true.
    *   The JSON string MUST be comprehensive. Structure it logically. Examples of what to include if visible:
        *   **Overall Price Action:** Briefly describe the overall shape or recent trend (e.g., "showing an uptrend for the last N candles," "choppy sideways movement," "sharp V-shaped recovery").
        *   **Candlestick/Bar Details (if few and distinct, or key recent ones):** For the most recent or significant visible candles (e.g., last 5-10, or any very large ones), describe their type (e.g., "long bullish candle," "Doji," "Hammer"), approximate open, high, low, close if discernible, and relation to previous candles.
        *   **Volume Analysis:**
            *   \\\`volumePresent\\\`: (boolean) True if volume bars are clearly visible and interpretable.
            *   \\\`recentVolumeDescription\\\`: (string) Describe recent volume (e.g., "increasing," "decreasing," "spiked on last candle," "average," "low relative to previous").
        *   **Technical Indicators (describe EACH visible indicator):**
            *   \\\`movingAverages\\\`: (array of objects) For each visible MA line: \\\`{ "type": "EMA/SMA/etc.", "period": "e.g., 20-period (estimated)", "level": "current price level of MA", "slope": "rising/falling/flat", "interaction": "price is above/below/testing it" }\\\`
            *   \\\`rsi\\\`: (object) If RSI indicator is visible: \\\`{ "isPresent": true, "value": "estimated level (e.g., 65)", "condition": "overbought/oversold/neutral/bullish divergence/bearish divergence" }\\\`
            *   \\\`macd\\\`: (object) If MACD indicator is visible: \\\`{ "isPresent": true, "status": "bullish crossover/bearish crossover/above signal/below signal/histogram positive/histogram negative/bullish divergence/bearish divergence" }\\\`
            *   \\\`bollingerBands\\\`: (object) If visible: \\\`{ "isPresent": true, "pricePosition": "near upper band/near lower band/near middle band", "bandWidth": "expanding/contracting" }\\\`
            *   \\\`otherIndicators\\\`: (array of strings) Describe any other visible indicators and their status.
        *   **Key Horizontal Levels:** If any obvious horizontal support/resistance lines are drawn or clearly implied by price action, list their approximate price levels.
        *   **Timeframe:** If discernible from the chart's x-axis labels or title, estimate the timeframe (e.g., "1-hour", "Daily", "15-minute").
    *   If a specific element (e.g., MACD) is NOT visible, do not include a key for it or explicitly state "not visible" in its description.
    *   Leave \\\`warningMessage\\\` and \\\`qualityWarningMessage\\\` empty or undefined.

Be extremely meticulous. The goal is to provide as much raw, descriptive data about the chart's visual elements as possible for a downstream analysis AI. If unsure about an element, describe it cautiously (e.g., "a line that appears to be a moving average").
`,
});

const extractChartDataFlow = ai.defineFlow(
  {
    name: 'extractDetailedChartDataFlow_v2', // Version updated
    inputSchema: ExtractChartDataInputSchema,
    outputSchema: ExtractChartDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Fallback if AI completely fails to respond
    if (!output) {
        return {
            isTradingChart: false,
            imageQualitySufficient: false, // Default to false if no AI response
            extractedData: null,
            warningMessage: "Failed to analyze the image. The AI model did not provide a response. Please try a different image or try again later.",
            qualityWarningMessage: "Image quality could not be assessed due to AI model failure."
        }
    }
    // Ensure defaults for boolean if AI somehow misses them, though the prompt is quite specific
    return {
        isTradingChart: output.isTradingChart ?? false,
        imageQualitySufficient: output.imageQualitySufficient ?? (output.isTradingChart === false ? true : false), // If not a trading chart, quality is "sufficient" for that determination
        extractedData: output.extractedData ?? null,
        warningMessage: output.warningMessage,
        qualityWarningMessage: output.qualityWarningMessage,
    };
  }
);

    
