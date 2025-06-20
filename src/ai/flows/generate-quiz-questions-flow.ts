
'use server';
/**
 * @fileOverview A Genkit flow to generate quiz questions on a given trading topic.
 *
 * - generateQuizQuestions - A function that handles the quiz question generation process.
 * - GenerateQuizInput - The input type for the generateQuizQuestions function.
 * - QuizQuestion - The structure for a single quiz question.
 * - GenerateQuizOutput - The return type (array of QuizQuestions) for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuizQuestionSchema = z.object({
  id: z.string().describe("A unique identifier for the question (e.g., 'q1', 'q2')."),
  questionText: z.string().describe('The text of the quiz question.'),
  options: z.array(z.object({
    value: z.string().describe("A short identifier for the option (e.g., 'a', 'b', 'c')."),
    text: z.string().describe('The text of the answer option.'),
  })).min(3).max(4).describe('An array of 3 to 4 answer options.'),
  correctAnswer: z.string().describe("The 'value' of the correct answer option."),
  explanation: z.string().describe('A brief explanation for why the correct answer is correct.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz questions (e.g., "Technical Analysis", "Trading Basics").'),
  numQuestions: z.number().int().min(1).max(10).describe('The number of questions to generate.'),
  language: z.string().describe('The language in which to generate the quiz (e.g., "Arabic", "English").'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.array(QuizQuestionSchema);
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert quiz generator specializing in financial trading topics.
Your task is to generate {{{numQuestions}}} multiple-choice quiz questions about "{{{topic}}}" in the {{{language}}} language.

For each question, provide:
1.  A unique "id" (e.g., "q1", "q2", ... "qN" where N is numQuestions).
2.  "questionText": The question itself.
3.  "options": An array of 3 to 4 answer choices. Each option should have a "value" (like 'a', 'b', 'c', 'd') and "text".
4.  "correctAnswer": The "value" of the single correct option.
5.  "explanation": A concise explanation for the correct answer.

Ensure the questions are clear, relevant to the topic, and the options provide plausible distractors.
The output MUST be a valid JSON array of question objects matching the provided schema.
Do not include any conversational text or markdown formatting in your response, only the JSON.
Make sure the options values ('a', 'b', 'c', 'd') are unique for each question.
`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate quiz questions. The model did not provide a response.');
    }
    // Ensure IDs are truly unique if AI doesn't guarantee it, or add them if AI doesn't provide them
    return output.map((q, index) => ({
        ...q,
        id: q.id || `gen_q${index + 1}` // Fallback ID generation
    }));
  }
);
