
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { GraduationCap, BookOpen, Zap, Brain, BarChartBig, Video, FileText, Puzzle, ShieldCheck, Target, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';

type UserLevel = 'beginner' | 'intermediate' | 'advanced';

interface TrainingItem {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'article' | 'exercise';
  icon: React.ElementType;
  contentUrl?: string;
  image?: string;
  imageHint?: string;
}

interface TrainingModule {
  id: string;
  title: string;
  moduleIcon: React.ElementType;
  items: TrainingItem[];
}

const beginnerModules: TrainingModule[] = [
  {
    id: 'b_basics',
    title: 'أساسيات سوق التداول',
    moduleIcon: BookOpen,
    items: [
      { id: 'b1_1', title: 'ما هو سوق الأسهم؟', description: 'مقدمة شاملة عن سوق الأسهم وكيف يعمل.', contentType: 'video', icon: Video, image: 'https://placehold.co/300x150.png', imageHint: 'market basics' },
      { id: 'b1_2', title: 'فهم الرسوم البيانية للمبتدئين', description: 'تعلم قراءة الشموع اليابانية والرسوم البيانية الخطية.', contentType: 'article', icon: FileText, image: 'https://placehold.co/300x150.png', imageHint: 'chart basics' },
      { id: 'b1_3', title: 'أولى خطواتك: فتح حساب تجريبي', description: 'دليل عملي لفتح حساب تداول تجريبي والبدء دون مخاطر.', contentType: 'exercise', icon: Puzzle, image: 'https://placehold.co/300x150.png', imageHint: 'demo account' },
    ],
  },
  {
    id: 'b_risk',
    title: 'مقدمة في إدارة المخاطر',
    moduleIcon: ShieldCheck,
    items: [
      { id: 'b2_1', title: 'لماذا إدارة المخاطر مهمة؟', description: 'فهم أهمية حماية رأس مالك.', contentType: 'article', icon: FileText },
      { id: 'b2_2', title: 'مفهوم وقف الخسارة (Stop Loss)', description: 'كيفية استخدام أوامر وقف الخسارة بفعالية.', contentType: 'video', icon: Video },
    ],
  },
];

const intermediateModules: TrainingModule[] = [
  {
    id: 'i_strategies',
    title: 'استراتيجيات تداول شائعة',
    moduleIcon: Target,
    items: [
      { id: 'i1_1', title: 'شرح استراتيجية التداول المتأرجح (Swing Trading)', description: 'تعمق في كيفية عمل استراتيجية التداول المتأرجح ومتى تستخدم.', contentType: 'video', icon: Video, image: 'https://placehold.co/300x150.png', imageHint: 'swing trading' },
      { id: 'i1_2', title: 'مقدمة في المضاربة السريعة (Scalping)', description: 'استكشف أساسيات المضاربة السريعة وما إذا كانت تناسبك.', contentType: 'article', icon: FileText, image: 'https://placehold.co/300x150.png', imageHint: 'scalping basics' },
      { id: 'i1_3', title: 'استخدام المتوسطات المتحركة في التداول', description: 'تطبيق عملي على المتوسطات المتحركة لاتخاذ قرارات تداول.', contentType: 'exercise', icon: Puzzle, image: 'https://placehold.co/300x150.png', imageHint: 'moving average' },
    ],
  },
  {
    id: 'i_indicators',
    title: 'المؤشرات الفنية الأساسية',
    moduleIcon: BarChartBig,
    items: [
      { id: 'i2_1', title: 'مؤشر القوة النسبية (RSI)', description: 'كيفية تفسير واستخدام مؤشر القوة النسبية لتحديد مناطق الشراء والبيع.', contentType: 'video', icon: Video },
      { id: 'i2_2', title: 'مؤشر الماكد (MACD)', description: 'فهم إشارات مؤشر الماكد وكيفية دمجه في تحليلك.', contentType: 'article', icon: FileText },
    ],
  },
];

const advancedModules: TrainingModule[] = [
  {
    id: 'a_analysis',
    title: 'التحليل الفني المتقدم',
    moduleIcon: Brain,
    items: [
      { id: 'a1_1', title: 'نماذج الرسوم البيانية المعقدة', description: 'تحديد وتحليل نماذج مثل الرأس والكتفين، الأوتاد، والمزيد.', contentType: 'exercise', icon: Puzzle, image: 'https://placehold.co/300x150.png', imageHint: 'chart patterns' },
      { id: 'a1_2', title: 'مقدمة في التحليل الكمي', description: 'فهم أساسيات التحليل الكمي وتطبيقاته في التداول.', contentType: 'article', icon: FileText, image: 'https://placehold.co/300x150.png', imageHint: 'quantitative analysis' },
      { id: 'a1_3', title: 'استراتيجيات التداول باستخدام موجات إليوت', description: 'نظرة متعمقة على نظرية موجات إليوت وتطبيقها.', contentType: 'video', icon: Video, image: 'https://placehold.co/300x150.png', imageHint: 'elliott wave' },
    ],
  },
  {
    id: 'a_risk_management',
    title: 'إدارة المخاطر المتقدمة',
    moduleIcon: TrendingUp,
    items: [
      { id: 'a2_1', title: 'تقنيات تحويط المحفظة (Portfolio Hedging)', description: 'استراتيجيات لحماية محفظتك من تقلبات السوق.', contentType: 'article', icon: FileText },
      { id: 'a2_2', title: 'تحديد حجم الصفقة المتقدم', description: 'أساليب متقدمة لتحديد حجم صفقاتك بناءً على المخاطر والعائد.', contentType: 'exercise', icon: Puzzle },
    ],
  },
];

const TrainingContentDisplay: React.FC<{ level: UserLevel, modules: TrainingModule[] }> = ({ level, modules }) => {
  if (!level) return null;

  return (
    <div className="space-y-6">
      {modules.map((module) => (
        <Card key={module.id} className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary">
              <module.moduleIcon className="mr-3 h-6 w-6" />
              {module.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {module.items.map((item) => (
                <AccordionItem value={item.id} key={item.id}>
                  <AccordionTrigger className="text-base hover:no-underline">
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-5 w-5 text-accent" />
                      {item.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                    <p>{item.description}</p>
                    {item.image && (
                      <div className="my-2 overflow-hidden rounded-md border">
                        <Image src={item.image} alt={item.title} width={300} height={150} className="object-cover" data-ai-hint={item.imageHint || 'training material'}/>
                      </div>
                    )}
                    {item.contentUrl && (
                      <Button variant="link" asChild className="px-0">
                        <a href={item.contentUrl} target="_blank" rel="noopener noreferrer">
                          {item.contentType === 'video' ? 'شاهد الفيديو' : item.contentType === 'article' ? 'اقرأ المقال' : 'ابدأ التمرين'}
                        </a>
                      </Button>
                    )}
                     {!item.contentUrl && (
                        <p className="text-xs italic"> (محتوى نموذجي - لا يوجد رابط فعلي)</p>
                     )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


export default function TrainingPage() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('userTradingLevel') as UserLevel;
      if (savedLevel && ['beginner', 'intermediate', 'advanced'].includes(savedLevel)) {
        setUserLevel(savedLevel);
        setShowSurveyModal(false);
      } else {
        setShowSurveyModal(true); // Show survey if no valid level or level is null/invalid
      }
    }
    setIsLoading(false);
  }, []);

  const handleSurveyComplete = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setUserLevel(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userTradingLevel', level);
    }
    setShowSurveyModal(false);
  };

  const handleRetakeAssessment = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userTradingLevel');
    }
    setUserLevel(null);
    setShowSurveyModal(true);
  };
  
  const getLevelDisplayName = (level: UserLevel): string => {
    if (level === 'beginner') return 'المبتدئ';
    if (level === 'intermediate') return 'المتوسط';
    if (level === 'advanced') return 'المحترف';
    return 'غير محدد';
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <LevelAssessmentModal
        isOpen={showSurveyModal && !userLevel}
        onComplete={handleSurveyComplete}
      />

      {!showSurveyModal && userLevel ? (
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="text-3xl font-headline text-primary flex items-center">
                    <GraduationCap className="mr-3 h-8 w-8" />
                    مسار التعلم المخصص لك
                    </CardTitle>
                    <CardDescription className="mt-1 text-md">
                    مرحباً بك، أيها المتداول <span className="font-semibold text-accent">{getLevelDisplayName(userLevel)}</span>! هذا هو المحتوى المقترح لك.
                    </CardDescription>
                </div>
                <Button onClick={handleRetakeAssessment} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    إعادة التقييم
                </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {userLevel === 'beginner' && <TrainingContentDisplay level={userLevel} modules={beginnerModules} />}
            {userLevel === 'intermediate' && <TrainingContentDisplay level={userLevel} modules={intermediateModules} />}
            {userLevel === 'advanced' && <TrainingContentDisplay level={userLevel} modules={advancedModules} />}
          </CardContent>
        </Card>
      ) : !showSurveyModal && !userLevel ? (
         <div className="flex flex-col items-center justify-center text-center min-h-[300px] bg-card p-6 rounded-lg shadow-xl">
            <Zap className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">مرحبًا بك في مركز التدريب!</h2>
            <p className="text-muted-foreground mb-6">
              يبدو أنه لم يتم تحديد مستواك بعد. يرجى إجراء التقييم للبدء.
            </p>
            <Button onClick={() => setShowSurveyModal(true)}>
              ابدأ تقييم المستوى
            </Button>
          </div>
      ) : null}
      {/* If showSurveyModal is true and userLevel is null, modal will be shown. If userLevel becomes non-null, this section will be replaced by content or loader.*/}
       {showSurveyModal && !userLevel && !isLoading && (
         <div className="flex h-[calc(100vh-theme(spacing.28))] items-center justify-center">
            <Card className="w-full max-w-lg text-center p-8">
                <CardTitle className="text-2xl mb-2">تقييم المستوى مطلوب</CardTitle>
                <CardDescription className="mb-4">الرجاء إكمال التقييم للوصول إلى المحتوى التدريبي المخصص.</CardDescription>
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                 <p className="text-sm text-muted-foreground mt-2">سيظهر نموذج التقييم قريباً...</p>
            </Card>
         </div>
       )}
    </div>
  );
}

    