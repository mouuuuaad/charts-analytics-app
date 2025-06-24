
'use client';

// Centralized content for reusability across components.
export type InspirationalContent = { type: 'quote' | 'tip'; text: string; source?: string };

// --- المحتوى العربي ---
export const inspirationalContent = [
  // Islamic quotes
  { type: 'quote', text: '﴿ وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا ﴾', source: 'سورة البقرة: 275' },
  { type: 'quote', text: 'عن أبي هريرة رضي الله عنه أن رسول الله ﷺ قال: "مَنْ غَشَّ فَلَيْسَ مِنِّي"', source: 'صحيح مسلم' },
  { type: 'quote', text: '﴿ وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْـبَاطِلِ ﴾', source: 'سورة البقرة: 188' },
  { type: 'quote', text: 'قال رسول الله ﷺ: "التاجر الصدوق الأمين مع النبيين والصديقين والشهداء"', source: 'سنن الترمذي' },
  { type: 'quote', text: 'التجارة أمانة وصدق، فالتزم بالأمانة في كل صفقة.', source: 'حديث نبوي' },
  { type: 'quote', text: 'التاجر الذي يخسر صبره يخسر تجارته.', source: 'حكمة تداولية' },

  // Trading tips
  { type: 'tip', text: 'Patience in trading is not just about waiting; it is the ability to maintain a calm and sound state of mind under pressure.' },
  { type: 'tip', text: 'Never risk more than you can afford to lose on a single trade. Risk management is the foundation of market survival.' },
  { type: 'tip', text: 'Technical analysis is about reading market psychology through charts. Learn to read them well.' },
  { type: 'tip', text: 'Fear and greed are the two biggest enemies of a trader. Make decisions based on your analysis, not your emotions.' },
  { type: 'tip', text: 'Always define your stop-loss before entering a trade.' },
  { type: 'tip', text: 'A good trader knows when to stay out of the market.' },
  { type: 'tip', text: 'Successful trading is about consistency, not quick wins.' },
  { type: 'tip', text: 'Keep a trading journal. Review your mistakes and successes regularly.' },
  { type: 'tip', text: 'Market trends often repeat. Use history as a guide but don’t rely solely on it.' },
  { type: 'tip', text: 'Avoid revenge trading; learn from your losses instead.' },

  // More Islamic and ethical reminders for trade
  { type: 'quote', text: 'إن أصدق التجارة أن يكون البائع صادقاً والمشتري راضيًا.', source: 'حديث شريف' },
  { type: 'quote', text: 'البَيعُ حَلالٌ، والرِّبا حَرامٌ.', source: 'القرآن الكريم' },
  { type: 'quote', text: 'من أخذ أموال الناس بالباطل يوم القيامة تلبسه نار جهنم.', source: 'حديث نبوي' },
  { type: 'quote', text: 'التقوى رأس المال الحقيقي في التجارة.', source: 'حكمة إسلامية' },

  // More practical trading tips
  { type: 'tip', text: 'Don’t chase the market. Wait for clear signals before entering trades.' },
  { type: 'tip', text: 'Diversify your portfolio to spread risk.' },
  { type: 'tip', text: 'Avoid trading based on rumors or unverified information.' },
  { type: 'tip', text: 'Use leverage carefully — it can amplify losses as well as gains.' },
  { type: 'tip', text: 'Keep emotions out of trading decisions.' },
  { type: 'tip', text: 'Always have a trading plan and stick to it.' },
  { type: 'tip', text: 'The best traders continuously learn and adapt.' },
  { type: 'tip', text: 'Protect your capital at all costs.' },
  { type: 'tip', text: 'Avoid overtrading; quality over quantity.' },
  { type: 'tip', text: 'Respect the market; it’s unpredictable and powerful.' },

  // Motivational quotes for traders
  { type: 'quote', text: '“The goal of a successful trader is to make the best trades. Money is secondary.”', source: 'Alexander Elder' },
  { type: 'quote', text: '“In trading, it’s not about being right or wrong, but how much money you make when you’re right and how much you lose when you’re wrong.”', source: 'George Soros' },
  { type: 'quote', text: '“It’s not whether you’re right or wrong that’s important, but how much money you make when you’re right and how much you lose when you’re wrong.”', source: 'George Soros' },
  { type: 'quote', text: '“The trend is your friend until it ends.”', source: 'Unknown' },
  { type: 'quote', text: '“Risk comes from not knowing what you’re doing.”', source: 'Warren Buffett' },
  { type: 'quote', text: '“An investment in knowledge pays the best interest.”', source: 'Benjamin Franklin' },
  { type: 'quote', text: '“Every trader has strengths and weaknesses. The key is to manage the weaknesses.”', source: 'Anonymous' },
  { type: 'quote', text: '“The market can stay irrational longer than you can stay solvent.”', source: 'John Maynard Keynes' },
  { type: 'quote', text: '“Don’t focus on making money, focus on protecting what you have.”', source: 'Paul Tudor Jones' },
  { type: 'quote', text: '“Discipline is the bridge between goals and accomplishment.”', source: 'Jim Rohn' },

  // Practical tips (continued)
  { type: 'tip', text: 'Use multiple time frames to confirm trade setups.' },
  { type: 'tip', text: 'Set realistic goals for each trading session.' },
  { type: 'tip', text: 'Don’t trade based on hope or fear.' },
  { type: 'tip', text: 'Develop your own trading style and stick to it.' },
  { type: 'tip', text: 'Avoid impulsive trades after a loss.' },
  { type: 'tip', text: 'Stay updated with economic news that impacts markets.' },
  { type: 'tip', text: 'Practice risk-reward ratio of at least 1:2.' },
  { type: 'tip', text: 'Use limit orders to control entry price.' },
  { type: 'tip', text: 'Avoid trading during highly volatile news events unless experienced.' },
  { type: 'tip', text: 'Backtest strategies before using real money.' },

  // More Islamic teachings related to trust & fairness
  { type: 'quote', text: 'البيع بالغلِّ منهي عنه.', source: 'حديث نبوي' },
  { type: 'quote', text: 'لا يغشُّ المسلم المسلم.', source: 'حديث نبوي' },
  { type: 'quote', text: 'التاجر الذي يصدق في كلامه، ويوفي بعهده، يجعله الله في ظلاله يوم القيامة.', source: 'حديث نبوي' },
  { type: 'quote', text: 'التجارة الطيبة بركة.', source: 'قول مأثور' },

  // Practical tips continued
  { type: 'tip', text: 'Always know why you enter a trade and why you exit it.' },
  { type: 'tip', text: 'Avoid adding to losing positions (averaging down) unless part of a proven strategy.' },
  { type: 'tip', text: 'Use position sizing to protect your capital.' },
  { type: 'tip', text: 'Don’t let small losses turn into big losses.' },
  { type: 'tip', text: 'Know when to take profits; don’t be greedy.' },
  { type: 'tip', text: 'Maintain emotional control at all times.' },
  { type: 'tip', text: 'Learn from your mistakes, don’t repeat them.' },
  { type: 'tip', text: 'Stay humble; the market can humble anyone.' },
  { type: 'tip', text: 'Understand that losses are part of trading.' },
  { type: 'tip', text: 'Keep your trading strategy simple and effective.' },

  // Motivational quotes continued
  { type: 'quote', text: '“Trading doesn’t just reveal your character, it also builds it.”', source: 'Yvan Byeajee' },
  { type: 'quote', text: '“The market rewards the patient and punishes the impatient.”', source: 'Anonymous' },
  { type: 'quote', text: '“The best traders have no ego.”', source: 'Anonymous' },
  { type: 'quote', text: '“Cut your losses quickly and let your profits run.”', source: 'Warren Buffett' },
  { type: 'quote', text: '“The key to trading success is emotional discipline.”', source: 'Alexander Elder' },
  { type: 'quote', text: '“Plan your trade and trade your plan.”', source: 'Unknown' },
  { type: 'quote', text: '“Every loss is a lesson.”', source: 'Anonymous' },
  { type: 'quote', text: '“Consistency is more important than being right.”', source: 'Anonymous' },
  { type: 'quote', text: '“It’s not about being right, it’s about making money.”', source: 'Anonymous' },
  { type: 'quote', text: '“Risk management is your best friend in trading.”', source: 'Anonymous' },

  // More tips
  { type: 'tip', text: 'Keep emotions separate from trading decisions.' },
  { type: 'tip', text: 'Avoid trading when tired or distracted.' },
  { type: 'tip', text: 'Use demo accounts to test new strategies.' },
  { type: 'tip', text: 'Review your trades weekly to improve.' },
  { type: 'tip', text: 'Keep learning continuously.' },
  { type: 'tip', text: 'Avoid overconfidence after a win.' },
  { type: 'tip', text: 'Stay humble regardless of results.' },
  { type: 'tip', text: 'Use trailing stops to protect profits.' },
  { type: 'tip', text: 'Avoid trading without a clear strategy.' },
  { type: 'tip', text: 'Respect market volatility.' },

  // Ethical trading quotes
  { type: 'quote', text: 'التجارة بأمانة تبارك فيها البركة.', source: 'حكمة إسلامية' },
  { type: 'quote', text: 'الصدق في البيع يجلب الرزق.', source: 'حديث نبوي' },
  { type: 'quote', text: 'لا يجوز الغش في البيع.', source: 'الشريعة الإسلامية' },
  { type: 'quote', text: 'احترام الحقوق في التجارة أساس الأمانة.', source: 'قول مأثور' },

  // More practical tips continued
  { type: 'tip', text: 'Avoid trading based on tips without verification.' },
  { type: 'tip', text: 'Use alerts to manage your trades effectively.' },
  { type: 'tip', text: 'Be patient when waiting for trade setups.' },
  { type: 'tip', text: 'Do not try to predict the market; react to what it shows.' },
  { type: 'tip', text: 'Keep your charts clean and uncluttered.' },
  { type: 'tip', text: 'Use stop losses every trade, no exceptions.' },
  { type: 'tip', text: 'Understand market cycles and phases.' },
  { type: 'tip', text: 'Focus on high-probability trades.' },
  { type: 'tip', text: 'Avoid trading after large news releases without proper analysis.' },
  { type: 'tip', text: 'Review and adjust your strategy regularly.' },

  // Motivational / mindset quotes
  { type: 'quote', text: '“Your mindset is the most important tool in trading.”', source: 'Anonymous' },
  { type: 'quote', text: '“The best traders embrace losses as part of the process.”', source: 'Anonymous' },
  { type: 'quote', text: '“Discipline separates the successful traders from the rest.”', source: 'Anonymous' },
  { type: 'quote', text: '“Patience and persistence conquer all.”', source: 'Unknown' },
  { type: 'quote', text: '“The market is a teacher, not a gambler.”', source: 'Anonymous' },
  { type: 'quote', text: '“Emotions will always be present; control is the key.”', source: 'Anonymous' },
  { type: 'quote', text: '“Every trader faces losses; how you respond matters.”', source: 'Anonymous' },
  { type: 'quote', text: '“The journey is more important than the destination.”', source: 'Unknown' },
  { type: 'quote', text: '“Learn to lose before you learn to win.”', source: 'Anonymous' },
  { type: 'quote', text: '“Consistency beats perfection.”', source: 'Anonymous' },

  // Last set of tips
  { type: 'tip', text: 'Keep a daily routine for your trading activities.' },
  { type: 'tip', text: 'Review charts before the market opens.' },
  { type: 'tip', text: 'Avoid trading on low volume stocks or assets.' },
  { type: 'tip', text: 'Keep up with global economic indicators.' },
  { type: 'tip', text: 'Practice mindfulness to reduce trading stress.' },
  { type: 'tip', text: 'Set realistic expectations for returns.' },
  { type: 'tip', text: 'Focus on process, not just profits.' },
  { type: 'tip', text: 'Develop patience to wait for the right setup.' },
  { type: 'tip', text: 'Avoid emotional decisions under stress.' },
  { type: 'tip', text: 'Celebrate small wins to build confidence.' },
];
