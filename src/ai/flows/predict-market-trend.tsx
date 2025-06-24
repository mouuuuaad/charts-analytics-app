
'use server';

/**
 * @fileOverview Predicts the market trend with expert-level deep technical analysis, including candlestick patterns,
 * volume, momentum, risk/reward, second entries, and provides a detailed scientific explanation.
 * This flow aims for the highest possible analytical depth and caution. (v6 - Ethical Analyst)
 *
 * - predictMarketTrend - A function that handles the market trend prediction process.
 * - PredictMarketTrendInput - The input type for the predictMarketTrend function.
 * - PredictMarketTrendOutput - The return type for the predictMarketTrend function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PredictMarketTrendOutputSchema } from '@/ai/schemas';
import type { PredictMarketTrendOutput as PredictMarketTrendOutputType } from '@/types'; 

const PredictMarketTrendInputSchema = z.object({
  extractedData: z
    .string()
    .describe('A DETAILED JSON string representing all discernible elements from the chart image. This includes descriptions of price action (candlesticks/bars), volume bars, and any visible technical indicators (e.g., moving averages, RSI, MACD). This data is the SOLE basis for your analysis. Assume it contains OHLCV data (or descriptions allowing inference), timestamps, volume data, and details of any visible indicators.'),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The trading experience level of the user.'),
  userDefinedEntry: z.string().optional().describe("Optional user-defined entry price for R/R calculation focus."),
  userDefinedStopLoss: z.string().optional().describe("Optional user-defined stop-loss price."),
  userDefinedTakeProfit: z.string().optional().describe("Optional user-defined take-profit price."),
});
export type PredictMarketTrendInput = z.infer<typeof PredictMarketTrendInputSchema>;


export type PredictMarketTrendOutput = z.infer<typeof PredictMarketTrendOutputSchema>;

// Lenient schema for the prompt output to handle incomplete AI responses gracefully.
const PartialPredictMarketTrendOutputSchema = PredictMarketTrendOutputSchema.deepPartial();


export async function predictMarketTrend(input: PredictMarketTrendInput): Promise<PredictMarketTrendOutput> {
  return predictMarketTrendFlow_v6_ethical_analyst(input);
}

const MANDATORY_DISCLAIMER = "This analysis is based on the provided chart data for educational and informational purposes only and should not be considered financial advice. Trading financial markets involves significant risk of loss. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results. Predictions are probabilistic, not guaranteed.";

const prompt = ai.definePrompt({
  name: 'predictMarketTrendPrompt_v6_ethical_analyst', 
  input: {schema: PredictMarketTrendInputSchema},
  output: {schema: PartialPredictMarketTrendOutputSchema}, // Use the lenient schema for the AI output
  prompt: `You are an **EXPERT-LEVEL financial technical analyst AI**, a master of chart interpretation. You are also knowledgeable in the principles of Islamic finance. Your primary directive is to provide a flawless, comprehensive, and trustworthy assessment that integrates technical skill with ethical guidance. You will receive DETAILED JSON in \\\`{{{extractedData}}}\\\`, which is your SOLE source of truth.

**Core Task:** From the JSON provided in \\\`{{{extractedData}}}\\\`, perform a deep, multi-layered analysis.

Input Data:
- Extracted Chart Data (JSON describing visual elements): \\\`{{{extractedData}}}\\\`
- User Trading Experience: {{#if userLevel}} {{{userLevel}}} {{else}} intermediate {{/if}}
{{#if userDefinedEntry}}- User Defined Entry: {{{userDefinedEntry}}}{{/if}}
{{#if userDefinedStopLoss}}- User Defined Stop Loss: {{{userDefinedStopLoss}}}{{/if}}
{{#if userDefinedTakeProfit}}- User Defined Take Profit: {{{userDefinedTakeProfit}}}{{/if}}

Your output MUST strictly conform to the JSON structure. All fields are mandatory unless marked optional.

**Analytical Requirements & Output Structure:**

1.  **Primary Prediction & Overall Assessment**:
    *   \\\`trendPrediction\\\`: ('up', 'down', 'sideways', 'neutral') Your main directional call.
    *   \\\`confidence\\\`: (0.0-1.0) Justified by signal convergence.
    *   \\\`riskLevel\\\`: ('low', 'medium', 'high') Based on volatility, signal clarity.
    *   \\\`opportunityScore\\\`: (0.0-1.0) Based on clarity, R:R, confirmation.
    *   \\\`tradingRecommendation\\\`: ('buy', 'hold', 'avoid', 'neutral') Align with prediction.
    *   \\\`volatilityLevel\\\`: ('low', 'normal', 'high', 'extreme') Assessed from price action.

2.  **Trend Analysis (\`trendAnalysis\`)**:
    *   \\\`direction\\\`: Dominant trend based on last 5-10 candles.
    *   \\\`candleCountBasis\\\`: Number of candles used (min 5).
    *   \\\`trendlineDescription\\\`: Describe key trendlines, channels, MAs supporting the trend.

3.  **Candlestick Pattern Analysis (\`candlestickAnalysis\`)**:
    *   \\\`patterns\\\`: Identify 2-4 significant, recent patterns. Include name, implications, candleCount, and if it's statistically weak/neutral.
    *   \\\`summary\\\`: Briefly summarize sentiment from recent candlesticks.

4.  **Volume & Momentum (\`volumeAndMomentum\`)**:
    *   \`volumeStatus\`: Assess from extracted data.
    *   \`volumeInterpretation\`: Correlate volume with price action.
    *   \`rsiEstimate\`: Interpret RSI from extracted data.
    *   \`macdEstimate\`: Interpret MACD from extracted data.

5.  **Trading Levels & Risk/Reward**:
    *   \\\`suggestedEntryPoints\\\`, \\\`takeProfitLevels\\\`, \\\`stopLossLevels\\\`: MUST provide at least one specific, justified price level for each. Justify based on technicals in extractedData (S/R, patterns, etc.).
    *   **Take Profit (TP) Goal**: Aim for a high-reward target (e.g., 3:1 R:R), such as a major resistance, pattern projection, or Fibonacci extension. If such a target has low probability, state this but still provide it as an aggressive option. A "safe," low-profit TP is not acceptable.
    *   \`rewardRiskRatio\`: Calculate based on primary suggested levels or user-defined levels.
    *   \`riskRewardDetails.tradeAssessment\`: ('Good', 'Medium', 'Bad', 'Neutral').
    *   \`riskRewardDetails.assessmentReasoning\`: Brief justification.

6.  **Ethical & Islamic Finance Considerations (\`islamicFinanceConsiderations\`)**:
    *   As an AI expert in both technical analysis and Islamic finance, you MUST include this section. It must be at least 3-4 sentences long.
    *   This is PRINCIPLE-BASED guidance, NOT a religious ruling (fatwa).
    *   Discuss the importance of avoiding speculative trades that resemble gambling (Qimar) and trades with excessive uncertainty (Gharar). Frame this in the context of the current chart analysis (e.g., "Given the high volatility and unclear signals, entering a trade now could be seen as having elements of Gharar...").
    *   Mention the virtue of patience (Sabr) in waiting for clear, high-probability setups rather than rushing into trades, relating it to the current chart.
    *   Briefly touch upon the general prohibition of interest (Riba) as a core principle in finance.
    *   **Crucially, you MUST NOT declare any specific asset Halal or Haram.** Your role is to educate on the principles of ethical and responsible trading.

7.  **Explanation & Justification**:
    *   \\\`explanationSummary\\\`: 1-3 sentences MAX of dominant factors. Max 250 characters.
    *   \\\`fullScientificAnalysis\\\`: Extensive, in-depth explanation synthesizing all findings. Explicitly reference elements from \\\`extractedData\\\`. Discuss probabilities, alternatives, and limiting factors.
    *   **Mandatory Disclaimer**: ALWAYS conclude \\\`fullScientificAnalysis\\\` with: "${MANDATORY_DISCLAIMER}"

**Final Check:** Is \\\`islamicFinanceConsiderations\\\` populated with meaningful, principle-based guidance? Are all trading levels justified? Is the TP ambitious but technically reasoned?
`,
});

const predictMarketTrendFlow_v6_ethical_analyst = ai.defineFlow(
    {
      name: 'predictMarketTrendFlow_v6_ethical_analyst',
      inputSchema: PredictMarketTrendInputSchema,
      outputSchema: PredictMarketTrendOutputSchema,
    },
    async (input): Promise<PredictMarketTrendOutputType> => {
      const {output: aiOutput} = await prompt(input);
  
      const baseOutput: PredictMarketTrendOutputType = {
        trendPrediction: 'neutral', 
        confidence: 0.1,
        riskLevel: 'high',
        opportunityScore: 0.1,
        tradingRecommendation: 'avoid',
        trendAnalysis: {
            direction: 'Neutral',
            candleCountBasis: 5,
            trendlineDescription: "Trend analysis details were not explicitly provided by the AI or are inconclusive based on current data.",
        },
        candlestickAnalysis: {
            patterns: [], 
            summary: "Candlestick analysis summary not provided by AI or patterns are inconclusive.",
        },
        volumeAndMomentum: {
            volumeStatus: 'Missing',
            volumeInterpretation: "Volume data or interpretation not provided by AI or insufficient for analysis.",
            rsiEstimate: "RSI not determinable from the provided data.",
            macdEstimate: "MACD not determinable from the provided data.",
        },
        suggestedEntryPoints: ["Entry levels are speculative due to unclear signals."],
        takeProfitLevels: ["Take profit levels are speculative."],
        stopLossLevels: ["Stop loss levels are speculative."],
        riskRewardDetails: {
            tradeAssessment: 'Neutral',
            assessmentReasoning: "Risk/reward assessment could not be reliably performed.",
        },
        explanationSummary: "Analysis limited by data quality or conflicting signals.",
        fullScientificAnalysis: "The AI model did not provide a full scientific analysis. " + MANDATORY_DISCLAIMER,
        islamicFinanceConsiderations: "General Islamic finance principles encourage avoiding excessive uncertainty (Gharar) and transactions resembling gambling (Qimar). Patience (Sabr) is a virtue, especially when waiting for clear trading signals.",
        rewardRiskRatio: undefined,
        keyIndicators: [],
        volatilityLevel: 'normal',
      };
  
      if (!aiOutput) { 
        console.warn("AI output was null. Returning baseOutput.");
        return baseOutput; 
      }
  
      const finalOutput: PredictMarketTrendOutputType = JSON.parse(JSON.stringify(baseOutput));
  
      // Merge primary REQUIRED fields
      if (aiOutput.trendPrediction && ['up', 'down', 'sideways', 'neutral'].includes(aiOutput.trendPrediction)) {
          finalOutput.trendPrediction = aiOutput.trendPrediction;
      }
      if (typeof aiOutput.confidence === 'number' && aiOutput.confidence >= 0 && aiOutput.confidence <= 1) {
          finalOutput.confidence = aiOutput.confidence;
      }
      if (aiOutput.riskLevel && ['low', 'medium', 'high'].includes(aiOutput.riskLevel)) {
          finalOutput.riskLevel = aiOutput.riskLevel;
      }
      if (typeof aiOutput.opportunityScore === 'number' && aiOutput.opportunityScore >= 0 && aiOutput.opportunityScore <= 1) {
          finalOutput.opportunityScore = aiOutput.opportunityScore;
      }
      if (aiOutput.tradingRecommendation && ['buy', 'hold', 'avoid', 'neutral'].includes(aiOutput.tradingRecommendation)) {
          finalOutput.tradingRecommendation = aiOutput.tradingRecommendation;
      }

      // Merge trendAnalysis
      if (aiOutput.trendAnalysis) {
          finalOutput.trendAnalysis.direction = aiOutput.trendAnalysis.direction ?? baseOutput.trendAnalysis.direction;
          finalOutput.trendAnalysis.candleCountBasis = aiOutput.trendAnalysis.candleCountBasis && aiOutput.trendAnalysis.candleCountBasis >= 5 ? Math.floor(aiOutput.trendAnalysis.candleCountBasis) : baseOutput.trendAnalysis.candleCountBasis;
          finalOutput.trendAnalysis.trendlineDescription = aiOutput.trendAnalysis.trendlineDescription || baseOutput.trendAnalysis.trendlineDescription;
      }
  
      // Merge candlestickAnalysis
      if (aiOutput.candlestickAnalysis) {
          if (Array.isArray(aiOutput.candlestickAnalysis.patterns)) {
              finalOutput.candlestickAnalysis.patterns = aiOutput.candlestickAnalysis.patterns.filter(p => p && p.name && p.implications && p.candleCount && typeof p.isStatisticallyWeakOrNeutral === 'boolean');
          }
          finalOutput.candlestickAnalysis.summary = aiOutput.candlestickAnalysis.summary || baseOutput.candlestickAnalysis.summary;
      }
  
      // Merge volumeAndMomentum
      if (aiOutput.volumeAndMomentum) {
          finalOutput.volumeAndMomentum.volumeStatus = aiOutput.volumeAndMomentum.volumeStatus || baseOutput.volumeAndMomentum.volumeStatus;
          finalOutput.volumeAndMomentum.volumeInterpretation = aiOutput.volumeAndMomentum.volumeInterpretation || baseOutput.volumeAndMomentum.volumeInterpretation;
          finalOutput.volumeAndMomentum.rsiEstimate = aiOutput.volumeAndMomentum.rsiEstimate || baseOutput.volumeAndMomentum.rsiEstimate;
          finalOutput.volumeAndMomentum.macdEstimate = aiOutput.volumeAndMomentum.macdEstimate || baseOutput.volumeAndMomentum.macdEstimate;
      }
  
      // Merge required arrays
      if (Array.isArray(aiOutput.suggestedEntryPoints) && aiOutput.suggestedEntryPoints.length > 0 && aiOutput.suggestedEntryPoints.every(s => typeof s === 'string' && s.trim() !== "")) {
          finalOutput.suggestedEntryPoints = aiOutput.suggestedEntryPoints;
      }
      if (Array.isArray(aiOutput.takeProfitLevels) && aiOutput.takeProfitLevels.length > 0 && aiOutput.takeProfitLevels.every(s => typeof s === 'string' && s.trim() !== "")) {
          finalOutput.takeProfitLevels = aiOutput.takeProfitLevels;
      }
      if (Array.isArray(aiOutput.stopLossLevels) && aiOutput.stopLossLevels.length > 0 && aiOutput.stopLossLevels.every(s => typeof s === 'string' && s.trim() !== "")) {
          finalOutput.stopLossLevels = aiOutput.stopLossLevels;
      }
  
      // Merge riskRewardDetails
      if (aiOutput.riskRewardDetails) {
          finalOutput.riskRewardDetails.tradeAssessment = aiOutput.riskRewardDetails.tradeAssessment || baseOutput.riskRewardDetails.tradeAssessment;
          finalOutput.riskRewardDetails.assessmentReasoning = aiOutput.riskRewardDetails.assessmentReasoning || baseOutput.riskRewardDetails.assessmentReasoning;
      }
  
      // Merge required string fields
      if (typeof aiOutput.explanationSummary === 'string' && aiOutput.explanationSummary.trim().length >= 1) {
          finalOutput.explanationSummary = aiOutput.explanationSummary.substring(0, 250);
      }
      if (typeof aiOutput.fullScientificAnalysis === 'string' && aiOutput.fullScientificAnalysis.trim().length >= 1) {
          finalOutput.fullScientificAnalysis = aiOutput.fullScientificAnalysis;
      }
      
      // Merge NEW islamic considerations field
      if (typeof aiOutput.islamicFinanceConsiderations === 'string' && aiOutput.islamicFinanceConsiderations.trim().length >= 1) {
        finalOutput.islamicFinanceConsiderations = aiOutput.islamicFinanceConsiderations;
      }

      // Ensure disclaimer
      if (!finalOutput.fullScientificAnalysis.includes(MANDATORY_DISCLAIMER)) {
          finalOutput.fullScientificAnalysis = (finalOutput.fullScientificAnalysis.trim() + " " + MANDATORY_DISCLAIMER).trim();
      }
      
      // Merge optional fields
      if (aiOutput.rewardRiskRatio && typeof aiOutput.rewardRiskRatio.reward === 'number' && typeof aiOutput.rewardRiskRatio.risk === 'number' && aiOutput.rewardRiskRatio.risk >= 1) {
          finalOutput.rewardRiskRatio = aiOutput.rewardRiskRatio;
      }
      if (Array.isArray(aiOutput.keyIndicators)) {
          finalOutput.keyIndicators = aiOutput.keyIndicators.filter(k => k && k.name && k.value);
      }
      if (aiOutput.volatilityLevel && ['low', 'normal', 'high', 'extreme'].includes(aiOutput.volatilityLevel)) {
          finalOutput.volatilityLevel = aiOutput.volatilityLevel;
      }
        
      return finalOutput;
    }
  );
