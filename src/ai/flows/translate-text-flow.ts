
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
  prompt: `You are a translation service. Your task is to translate the given text into the specified target language.

Input Text:
{{{textToTranslate}}}

Target Language: {{targetLanguageCode}}

You MUST respond with a JSON object adhering to the following schema:
{
  "translatedText": "string // The translated version of the input text."
}

Example: If translating "Hello" to Spanish, the output should be:
{
  "translatedText": "Hola"
}

Provide only the JSON object as your response.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
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
    
    if (!output || !output.translatedText) {
      // This condition also catches an empty string for translatedText
      throw new Error('Translation failed. The AI model did not provide a translated text or the text was empty.');
    }
    return output;
  }
);

