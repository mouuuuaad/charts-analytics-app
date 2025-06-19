
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
  prompt: `You are an AI translation service. Your task is to translate text.
You will be given "textToTranslate" and "targetLanguageName".

Output MUST be a JSON object: {"translatedText": "YOUR_TRANSLATION_HERE"}

If "textToTranslate" is empty or consists only of whitespace, "translatedText" must be an empty string.
If "targetLanguageName" is "English", "translatedText" must be the original "textToTranslate".

OTHERWISE (if "targetLanguageName" is NOT "English" AND "textToTranslate" is NOT empty):
You MUST assume "textToTranslate" is in English.
You MUST translate "textToTranslate" into "targetLanguageName".
"translatedText" MUST contain this translation. If you cannot translate it, return the original text but still in the JSON format.

Example if targetLanguageName is "Spanish":
Input: {"textToTranslate": "Hello", "targetLanguageName": "Spanish"}
Output: {"translatedText": "Hola"}

Example if targetLanguageName is "French":
Input: {"textToTranslate": "The market is up.", "targetLanguageName": "French"}
Output: {"translatedText": "Le marché est en hausse."}

Example if targetLanguageName is "English":
Input: {"textToTranslate": "This is a test.", "targetLanguageName": "English"}
Output: {"translatedText": "This is a test."}

Example if textToTranslate is empty:
Input: {"textToTranslate": "", "targetLanguageName": "German"}
Output: {"translatedText": ""}

Input for this request:
textToTranslate: {{{textToTranslate}}}
targetLanguageName: {{targetLanguageCode}}
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
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
    const targetLanguageName = languageMap[input.targetLanguageCode] || input.targetLanguageCode;

    const {output} = await prompt({
        textToTranslate: input.textToTranslate,
        targetLanguageCode: targetLanguageName,
    });
    
    if (!output || typeof output.translatedText !== 'string') {
      console.error('Translation failed or output format incorrect from AI model. Input:', input, 'Output received:', output);
      // Fallback to original text if AI fails to provide a valid string
      // This ensures the function still resolves with the expected schema shape, even if translation itself failed.
      return { translatedText: input.textToTranslate };
    }
    return output;
  }
);
