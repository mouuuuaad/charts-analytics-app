
'use server';
/**
 * @fileOverview A flow to distill a complex market analysis into a clear, actionable strategy session.
 *
 * - generateStrategySession - A function that creates a strategy plan from a market prediction.
 * - StrategySessionOutput - The return type for the generateStrategySession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { PredictMarketTrendOutput } from '@/types';
import { PredictMarketTrendOutputSchema } from '@/ai/schemas';

// The input for this flow is the entire output from the market trend prediction flow.
const StrategySessionInputSchema = PredictMarketTrendOutputSchema;
export type StrategySessionInput = PredictMarketTrendOutput;

const StrategySessionOutputSchema = z.object({
  primarySignal: z.object({
    title: z.string().describe("The single most important bullish or bearish signal driving the analysis. E.g., 'Strong Bullish Engulfing Pattern' or 'Break of Key Support'."),
    description: z.string().describe("A one-sentence explanation of why this signal is critical."),
  }),
  conflictingSignals: z.array(z.object({
    title: z.string().describe("The name of a conflicting signal or risk factor. E.g., 'RSI Nearing Overbought' or 'Low Volume'."),
    description: z.string().describe("A one-sentence explanation of why this factor is a risk or conflicts with the primary signal."),
  })).describe("A list of 1-3 key risks or signals that conflict with the primary analysis."),
  actionPlan: z.array(z.object({
    step: z.number().int().describe("The step number in the plan (1, 2, 3...)."),
    instruction: z.string().describe("A clear, direct instruction. E.g., 'Set entry order at 150.50' or 'Place stop-loss at 148.00'."),
    rationale: z.string().describe("The reason behind the instruction. E.g., 'To capture the breakout' or 'To protect against a failure of the support level'."),
  })).describe("A step-by-step action plan with 3-5 steps for executing the trade."),
  psychologicalBriefing: z.object({
    title: z.string().describe("A title for the psychological advice, e.g., 'Mindset for this Trade'."),
    advice: z.string().describe("A short paragraph of psychological advice tailored to the specific trade's risks (e.g., advice on avoiding greed if the target is far, or avoiding fear if volatility is high)."),
    islamicPrinciple: z.object({
      name: z.enum(['Sabr (Patience)', 'Shukr (Gratitude)', 'Tawakkul (Trust in Allah)', 'Ihsan (Excellence)']).describe("The most relevant Islamic principle for this trade scenario."),
      application: z.string().describe("How to apply this Islamic principle to the current trade. E.g., 'Practice Sabr by waiting for the price to reach the entry point without chasing it.'"),
    }),
  }),
});
export type StrategySessionOutput = z.infer<typeof StrategySessionOutputSchema>;

export async function generateStrategySession(input: StrategySessionInput): Promise<StrategySessionOutput> {
  return generateStrategySessionFlow(input);
}

// Define a specific input schema for the prompt that takes a single JSON string.
const PromptInputSchema = z.object({
  analysisJson: z.string().describe("The full market analysis as a JSON string."),
});

const prompt = ai.definePrompt({
  name: 'generateStrategySessionPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: StrategySessionOutputSchema},
  prompt: `You are an elite trading strategist and psychologist. Your task is to take a dense, technical market analysis and distill it into a crystal-clear, actionable "Strategy Session" for a trader. The goal is to provide clarity, a concrete plan, and the psychological fortitude needed to execute the trade successfully.

**Input Analysis:**
\`\`\`json
{{{analysisJson}}}
\`\`\`

**Your Distillation Task:**

1.  **Identify the Primary Signal:** From the entire analysis, find the single most dominant technical reason for the trade recommendation. This is the lynchpin of the entire strategy.
2.  **Identify Conflicting Signals:** Find the top 1-3 risk factors or technical signals that challenge the primary signal. This tempers expectations and prepares the trader for adverse movement.
3.  **Create an Action Plan:** Convert the suggested entry, stop-loss, and take-profit levels into a simple, step-by-step plan. Each step must have a clear instruction and a simple rationale.
4.  **Provide a Psychological Briefing:** Based on the specific risks and opportunities in the analysis (e.g., high confidence vs. high risk, clear trend vs. choppy), provide targeted advice on managing emotions like greed, fear, or impatience.
5.  **Connect to an Islamic Principle:** Select the *most relevant* Islamic principle for this specific trade scenario and explain how the trader can apply it. For example:
    *   If the trade requires waiting for a pullback, choose **Sabr (Patience)**.
    *   If the trade is high-risk and uncertain, relate it to **Tawakkul (Trust in Allah)** after doing due diligence.
    *   If a trade is successful, it's a moment for **Shukr (Gratitude)**.
    *   If the setup is complex and requires careful execution, it's about **Ihsan (Excellence)**.

Produce a valid JSON object matching the output schema.
`,
});

const generateStrategySessionFlow = ai.defineFlow(
  {
    name: 'generateStrategySessionFlow',
    inputSchema: StrategySessionInputSchema,
    outputSchema: StrategySessionOutputSchema,
  },
  async (input) => {
    // Stringify the input object to pass to the prompt
    const analysisJson = JSON.stringify(input, null, 2);

    // Call the prompt with the stringified JSON
    const {output} = await prompt({ analysisJson });
    
    if (!output) {
      throw new Error('AI failed to generate a strategy session. The model did not provide a response.');
    }
    return output;
  }
);
