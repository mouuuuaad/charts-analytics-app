
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
  prompt: `You are an expert multilingual translation service.
Your primary task is to translate the 'Input Text' provided below into the 'Target Language Name' specified.

Input Text:
{{{textToTranslate}}}

Target Language Name: {{targetLanguageCode}}

You MUST produce a JSON object as your output, strictly conforming to this schema:
{
  "translatedText": "string"
}

The 'translatedText' field in the JSON object MUST contain the translated version of the 'Input Text' in the 'Target Language Name'.
It is crucial that the 'translatedText' is DIFFERENT from the 'Input Text' if the 'Target Language Name' is different from the source language of the 'Input Text'.
If the 'Input Text' is already in the 'Target Language Name', then 'translatedText' should be the same as 'Input Text'.
If the 'Input Text' is empty, 'translatedText' should also be empty.

For example, if Input Text is "Hello World" and Target Language Name is "Spanish", your response MUST be:
{
  "translatedText": "Hola Mundo"
}

If Input Text is "Hola Mundo" and Target Language Name is "Spanish", your response MUST be:
{
  "translatedText": "Hola Mundo"
}

If Input Text is "" and Target Language Name is "French", your response MUST be:
{
  "translatedText": ""
}

Do not include any other text, explanations, or apologies in your response. Only the JSON object.`,
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

