
'use client';

// Centralized content for reusability across components.
export type InspirationalContent = { type: 'quote' | 'tip'; text: string; source?: string };

// --- المحتوى العربي ---
export const inspirationalContent: InspirationalContent[] = [
    { type: 'quote', text: '﴿ وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ ﴾', source: 'سورة البقرة: 43' },
    { type: 'quote', text: 'قال رسول الله ﷺ: "أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ"', source: 'صحيح مسلم' },
    { type: 'quote', text: '﴿ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا ﴾', source: 'سورة النساء: 103' },
    { type: 'quote', text: 'عن أبي هريرة رضي الله عنه أن رسول الله ﷺ قال: "مَنْ غَشَّ فَلَيْسَ مِنِّي"', source: 'صحيح مسلم' },
    { type: 'quote', text: '﴿ وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْـبَاطِلِ ﴾', source: 'سورة البقرة: 188' },
    { type: 'tip', text: 'Patience in trading is not just about waiting; it is the ability to maintain a calm and sound state of mind under pressure.' },
    { type: 'tip', text: 'Remember that all provision comes from Allah. Trade honestly and trust in His plan.' },
    { type: 'tip', text: 'Make decisions based on your analysis, not your emotions. Greed and fear are the two biggest enemies of a trader.'},
];
