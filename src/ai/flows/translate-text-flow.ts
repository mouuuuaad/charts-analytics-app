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
  targetLanguageCode: z.string().describe('The ISO 639-1 code of the language to translate the text into (e.g., "es" for Spanish, "fr" for French, "ar" for Arabic).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text into {{targetLanguageCode}}:

Text:
{{{textToTranslate}}}

Provide only the translated text.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // For very short language codes (e.g. "ar", "en"), the model might sometimes just repeat the code.
    // Providing a more descriptive target language name can help.
    // This is a simple mapping, a more robust solution might involve a larger library or service.
    const languageMap: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'ar': 'Arabic',
        'de': 'German',
        'ja': 'Japanese',
        'zh-CN': 'Simplified Chinese',
        // Add other languages as needed
    };
    const targetLanguageName = languageMap[input.targetLanguageCode] || input.targetLanguageCode;

    const {output} = await prompt({
        textToTranslate: input.textToTranslate,
        targetLanguageCode: targetLanguageName, // Use the more descriptive name
    });
    
    if (!output || !output.translatedText) {
      throw new Error('Translation failed. The AI model did not provide a translated text.');
    }
    return output;
  }
);
