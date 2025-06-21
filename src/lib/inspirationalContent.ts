
'use client';

// Centralized content for reusability across components.
export type InspirationalContent = { type: 'quote' | 'tip'; text: string; source?: string };

// --- المحتوى العربي ---
export const inspirationalContent: InspirationalContent[] = [
    { type: 'quote', text: '﴿ وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا ﴾', source: 'سورة البقرة: 275' },
    { type: 'quote', text: 'عن أبي هريرة رضي الله عنه أن رسول الله ﷺ قال: "مَنْ غَشَّ فَلَيْسَ مِنِّي"', source: 'صحيح مسلم' },
    { type: 'quote', text: '﴿ وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْـبَاطِلِ ﴾', source: 'سورة البقرة: 188' },
    { type: 'quote', text: 'قال رسول الله ﷺ: "التاجر الصدوق الأمين مع النبيين والصديقين والشهداء"', source: 'سنن الترمذي' },
    { type: 'tip', text: 'Patience in trading is not just about waiting; it is the ability to maintain a calm and sound state of mind under pressure.' },
    { type: 'tip', text: 'Never risk more than you can afford to lose on a single trade. Risk management is the foundation of market survival.' },
    { type: 'tip', text: 'Technical analysis is about reading market psychology through charts. Learn to read them well.' },
    { type: 'tip', text: 'Fear and greed are the two biggest enemies of a trader. Make decisions based on your analysis, not your emotions.'},
];
