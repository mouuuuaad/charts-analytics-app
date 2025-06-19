
'use server';
/**
 * @fileOverview A flow to translate text to a specified target language.
 *
 * - translateText - A function that handles the text translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguageCode: z.string().describe('The ISO 639-1 code of the language to translate the text into (e.g., "es" for Spanish, "fr" for French, "ar" for Arabic). This will be provided as the full language name to the AI model (e.g., "Spanish").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text. If translation is not possible or the input is already in the target language, this may be the original text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `You are an expert multilingual translation AI. Your primary task is to translate the 'Input Text' into the 'Target Language Name'.

Input Text:
{{{textToTranslate}}}

Target Language Name: {{targetLanguageCode}} <!-- This will be the full language name like "Spanish", "French", etc. -->

You MUST produce a JSON object as your output, strictly conforming to this schema:
{
  "translatedText": "string"
}

Translation Logic:
1.  If the 'Input Text' is empty or contains only whitespace, 'translatedText' in your JSON output MUST be an empty string.
2.  If the 'Input Text' is NOT empty:
    a.  **If the 'Target Language Name' is English:**
        Return the 'Input Text' as is in the 'translatedText' field. (Example: Input "Hello", Target "English" -> Output "Hello")
    b.  **If the 'Target Language Name' is NOT English:**
        You MUST translate the 'Input Text' (which you can assume is in English) into the specified 'Target Language Name'.
        The 'translatedText' field in your JSON output MUST contain this translation.
        (Example: Input "Hello", Target "Spanish" -> Output "Hola Mundo")
        (Example: Input "Hello", Target "French" -> Output "Bonjour")
    c.  **Edge case for non-English input already matching non-English target:** If you determine with high confidence that the 'Input Text' is already in the 'Target Language Name' (and the target is not English), then you can return the 'Input Text' as is. (Example: Input "Hola Mundo", Target "Spanish" -> Output "Hola Mundo"). Exercise this rule cautiously. Prioritize translation if unsure.

Do not include any other text, explanations, or apologies in your response. Only the JSON object.

Example - Translation to Spanish:
Input Text: "The market is volatile."
Target Language Name: "Spanish"
Correct JSON Output:
{
  "translatedText": "El mercado está volátil."
}

Example - Input already in Spanish, Target Spanish:
Input Text: "El mercado está volátil."
Target Language Name: "Spanish"
Correct JSON Output:
{
  "translatedText": "El mercado está volátil."
}

Example - Empty Input:
Input Text: ""
Target Language Name: "German"
Correct JSON Output:
{
  "translatedText": ""
}
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // Handle empty input text directly to avoid unnecessary AI calls
    if (!input.textToTranslate.trim()) {
      return { translatedText: "" };
    }

    const languageMap: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'ar': 'Arabic',
        'de': 'German',
        'ja': 'Japanese',
        'zh-CN': 'Simplified Chinese',
    };
    // The targetLanguageCode from input is 'es', 'fr' etc. We map it to "Spanish", "French" for the prompt.
    const targetLanguageName = languageMap[input.targetLanguageCode] || input.targetLanguageCode;

    const {output} = await prompt({
        textToTranslate: input.textToTranslate,
        targetLanguageCode: targetLanguageName, 
    });
    
    if (!output || typeof output.translatedText !== 'string') {
      // This condition catches null/undefined translatedText.
      // Empty string is a valid translation (e.g. for empty input).
      throw new Error('Translation failed. The AI model did not provide a valid translated text string.');
    }
    return output;
  }
);
