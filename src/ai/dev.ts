
'use server';
// Removed: import { config } from 'dotenv';
// Removed: config();

import '@/ai/flows/extract-chart-data.ts';
// import '@/ai/flows/predict-market-trend.ts'; // Old flow, keep commented or remove if no longer needed for reference
import '@/ai/flows/predict-market-trend.ts'; // References the updated file with v4 logic
import '@/ai/flows/generate-quiz-questions-flow.ts';


    