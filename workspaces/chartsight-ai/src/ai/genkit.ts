import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const commonModel = 'googleai/gemini-1.5-flash-latest';

// AI instance for chart analysis and data extraction
// Uses GEMINI_ANALYSIS_API_KEY, falls back to GOOGLE_API_KEY if not set.
export const analysisAi = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_ANALYSIS_API_KEY}),
  ],
  model: commonModel,
});

// AI instance for quiz generation
// Uses GEMINI_QUIZ_API_KEY, falls back to GOOGLE_API_KEY if not set.
export const quizAi = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_QUIZ_API_KEY}),
  ],
  model: commonModel,
});

// AI instance for chatbot features
// Uses GEMINI_CHATBOT_API_KEY, falls back to GOOGLE_API_KEY if not set.
export const chatAi = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_CHATBOT_API_KEY}),
  ],
  model: commonModel,
});
