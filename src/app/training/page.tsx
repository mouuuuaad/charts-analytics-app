
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, RefreshCw, SkipForward, Award, Brain, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // For animations

interface QuizOption {
  value: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
}

const initialQuestionBank: QuizQuestion[] = [
  {
    id: 'q1',
    questionText: 'ماذا يعني "مستوى الدعم" عادة في التحليل الفني؟',
    options: [
      { value: 'a', text: 'سقف سعري تكون فيه ضغوط البيع قوية.' },
      { value: 'b', text: 'أرضية سعرية يُتوقع أن يكون فيها اهتمام بالشراء.' },
      { value: 'c', text: 'فترة يكون فيها حجم التداول منخفضًا.' },
    ],
    correctAnswer: 'b',
    explanation: 'مستوى الدعم هو مستوى سعر يتوقع أن يجد فيه السهم أو الأصل المالي مشترين، مما يمنع السعر من الانخفاض أكثر.',
  },
  {
    id: 'q2',
    questionText: 'أي من هذه المؤشرات يُعتبر مؤشرًا شائعًا لاتباع الاتجاه؟',
    options: [
      { value: 'a', text: 'مؤشر القوة النسبية (RSI)' },
      { value: 'b', text: 'المتوسط المتحرك (Moving Average)' },
      { value: 'c', text: 'تصحيحات فيبوناتشي (Fibonacci Retracement)' },
    ],
    correctAnswer: 'b',
    explanation: 'المتوسطات المتحركة تساعد في تحديد وتأكيد الاتجاهات السائدة في السوق عن طريق تمهيد بيانات السعر.',
  },
  {
    id: 'q3',
    questionText: 'ماذا يعني "الشراء على المكشوف" (Going Long) في التداول؟',
    options: [
      { value: 'a', text: 'المراهنة على أن السعر سينخفض.' },
      { value: 'b', text: 'المراهنة على أن السعر سيرتفع.' },
      { value: 'c', text: 'الاحتفاظ بمركز تداول لفترة طويلة.' },
    ],
    correctAnswer: 'b',
    explanation: 'الشراء على المكشوف يعني شراء أصل مالي مع توقع ارتفاع قيمته لتحقيق ربح عند بيعه بسعر أعلى.',
  },
  {
    id: 'q4',
    questionText: 'يُستخدم أمر "إيقاف الخسارة" (Stop-Loss) بشكل أساسي لـ:',
    options: [
      { value: 'a', text: 'تأمين الأرباح.' },
      { value: 'b', text: 'الحد من الخسائر المحتملة.' },
      { value: 'c', text: 'الدخول في صفقة بسعر محدد.' },
    ],
    correctAnswer: 'b',
    explanation: 'أمر إيقاف الخسارة هو أداة لإدارة المخاطر تغلق الصفقة تلقائيًا عند وصول السعر لمستوى محدد للحد من الخسائر.',
  },
  {
    id: 'q5',
    questionText: 'ما هي السمة المشتركة لنموذج شمعة "الدوجي" (Doji)؟',
    options: [
      { value: 'a', text: 'جسم طويل مع ظلال قصيرة.' },
      { value: 'b', text: 'أسعار الافتتاح والإغلاق متقاربة جدًا أو متطابقة.' },
      { value: 'c', text: 'يشير إلى استمرار قوي للاتجاه الحالي.' },
    ],
    correctAnswer: 'b',
    explanation: 'شمعة الدوجي تتميز بأن سعر الافتتاح والإغلاق متساويان أو متقاربان جدًا، مما يشير إلى حيرة أو توازن في السوق.',
  },
  {
    id: 'q6',
    questionText: 'يهدف "التنويع" في المحفظة الاستثمارية إلى:',
    options: [
      { value: 'a', text: 'تركيز الاستثمارات لتحقيق عوائد أعلى.' },
      { value: 'b', text: 'تقليل المخاطر الإجمالية عن طريق توزيع الاستثمارات.' },
      { value: 'c', text: 'ضمان تحقيق الأرباح.' },
    ],
    correctAnswer: 'b',
    explanation: 'التنويع هو استراتيجية لإدارة المخاطر تتضمن توزيع الاستثمارات عبر فئات أصول مختلفة لتقليل تأثير أداء أي استثمار فردي سيء.',
  },
];

type QuizStatus = 'not_started' | 'in_progress' | 'feedback_shown' | 'completed';
type UserLevel = 'مبتدئ' | 'متوسط' | 'محترف' | 'غير محدد';

export default function TrainingQuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('not_started');
  const [score, setScore] = useState(0);
  const [userLevel, setUserLevel] = useState<UserLevel>('غير محدد');

  const shuffleArray = <T>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    startQuiz();
  }, []);

  const startQuiz = () => {
    setQuestions(shuffleArray([...initialQuestionBank]));
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setFeedback(null);
    setIsCorrect(null);
    setScore(0);
    setUserLevel('غير محدد');
    setQuizStatus('in_progress');
  };

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const progressPercentage = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex) / questions.length) * 100;
  }, [currentQuestionIndex, questions.length]);

  const handleOptionSelect = (optionValue: string) => {
    if (quizStatus === 'in_progress') {
      setSelectedOption(optionValue);
      const correct = optionValue === currentQuestion.correctAnswer;
      setIsCorrect(correct);
      setFeedback(currentQuestion.explanation);
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionValue }));
      if (correct) {
        setScore(prevScore => prevScore + 1);
      }
      setQuizStatus('feedback_shown');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setFeedback(null);
      setIsCorrect(null);
      setQuizStatus('in_progress');
    } else {
      // Quiz finished
      setQuizStatus('completed');
      calculateUserLevel();
    }
  };

  const handleSkipQuestion = () => {
    // Mark as skipped implicitly by not answering
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedOption(null);
        setFeedback(null);
        setIsCorrect(null);
        setQuizStatus('in_progress');
    } else {
        setQuizStatus('completed');
        calculateUserLevel();
    }
  };

  const calculateUserLevel = () => {
    const percentageScore = (score / questions.length) * 100;
    if (percentageScore >= 80) {
      setUserLevel('محترف');
    } else if (percentageScore >= 50) {
      setUserLevel('متوسط');
    } else {
      setUserLevel('مبتدئ');
    }
  };

  if (quizStatus === 'not_started' || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">اختبار معلومات التداول</CardTitle>
            <CardDescription>اختبر معلوماتك في أساسيات التداول والتحليل الفني.</CardDescription>
          </CardHeader>
          <CardContent>
            <Brain className="w-24 h-24 text-primary mx-auto mb-6 opacity-70" />
          </CardContent>
          <CardFooter>
            <Button onClick={startQuiz} size="lg" className="w-full">
              ابدأ الاختبار
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizStatus === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4"
      >
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">نتيجة الاختبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Award className="w-24 h-24 mx-auto text-accent animate-pulse" />
            <p className="text-2xl font-semibold">
              نتيجتك: {score} من {questions.length} ( {((score / questions.length) * 100).toFixed(0)}% )
            </p>
            <p className="text-xl">
              المستوى المقترح: <span className="font-bold text-primary">{userLevel}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={startQuiz} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-5 w-5" /> أعد الاختبار
              </Button>
              <Button size="lg" disabled> {/* Placeholder */}
                ابدأ وحدات التعلم <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0 max-w-2xl">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-xl font-headline text-primary">
              سؤال {currentQuestionIndex + 1} من {questions.length}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSkipQuestion} disabled={quizStatus === 'feedback_shown'}>
              تخطى السؤال <SkipForward className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="w-full h-2" />
        </CardHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-6 space-y-6">
              <p className="text-lg font-semibold leading-relaxed text-right" dir="rtl">
                {currentQuestion.questionText}
              </p>
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.value;
                  let buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link" = "outline";
                  let icon = null;

                  if (quizStatus === 'feedback_shown') {
                    if (option.value === currentQuestion.correctAnswer) {
                      buttonVariant = "default"; // Correct answer is always 'default' (greenish if theme supports)
                       // Apply green directly for feedback
                      icon = <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />;
                    } else if (isSelected) {
                      buttonVariant = "destructive"; // Incorrect and selected
                      icon = <AlertCircle className="mr-2 h-5 w-5 text-red-500" />;
                    }
                  } else if (isSelected) {
                     // buttonVariant = "secondary"; // User has selected this, before feedback
                  }

                  return (
                    <Button
                      key={option.value}
                      variant={buttonVariant}
                      size="lg"
                      className={`w-full justify-start text-right py-3 h-auto whitespace-normal
                        ${quizStatus === 'feedback_shown' && option.value === currentQuestion.correctAnswer ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600' : ''}
                        ${quizStatus === 'feedback_shown' && option.value !== currentQuestion.correctAnswer && isSelected ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600' : ''}
                        ${quizStatus === 'in_progress' && isSelected ? 'ring-2 ring-primary' : ''}
                      `}
                      onClick={() => handleOptionSelect(option.value)}
                      disabled={quizStatus === 'feedback_shown'}
                      dir="rtl"
                    >
                      {quizStatus === 'feedback_shown' && icon}
                      {option.text}
                    </Button>
                  );
                })}
              </div>

              {quizStatus === 'feedback_shown' && feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-md border text-sm ${
                    isCorrect ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' : 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                  }`}
                  dir="rtl"
                >
                  <div className="flex items-center mb-1">
                    {isCorrect ? <CheckCircle2 className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                    <span className="font-semibold">{isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة.'}</span>
                  </div>
                  {currentQuestion.explanation}
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="pt-6">
          {quizStatus === 'feedback_shown' && (
            <Button onClick={handleNextQuestion} size="lg" className="w-full">
              {currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </CardFooter>
      </Card>
       <p className="text-xs text-center text-muted-foreground mt-4 px-2">
         ملاحظة: هذا الاختبار لأغراض تعليمية فقط ولا يشكل نصيحة استثمارية.
       </p>
    </div>
  );
}
