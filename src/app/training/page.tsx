
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, RefreshCw, SkipForward, Award, Brain, Lightbulb, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuizQuestions, type QuizQuestion, type GenerateQuizInput } from '@/ai/flows/generate-quiz-questions-flow';
import { useToast } from '@/hooks/use-toast';


type QuizStatus = 'not_started' | 'loading_questions' | 'error_loading' | 'in_progress' | 'feedback_shown' | 'completed';
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
  const { toast } = useToast();

  const shuffleArray = <T extends {}>(array: T[]): T[] => {
    if (!array || array.length === 0) return [];
    return [...array].sort(() => Math.random() - 0.5);
  };

  const loadQuestions = useCallback(async () => {
    setQuizStatus('loading_questions');
    try {
      const input: GenerateQuizInput = {
        topic: "أساسيات التداول والتحليل الفني", // Trading Basics and Technical Analysis
        numQuestions: 6,
        language: "Arabic",
      };
      const generatedQuestions = await generateQuizQuestions(input);
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(shuffleArray(generatedQuestions)); // Shuffle questions after fetching
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setAnswers({});
        setFeedback(null);
        setIsCorrect(null);
        setScore(0);
        setUserLevel('غير محدد');
        setQuizStatus('in_progress');
      } else {
        throw new Error("AI returned no questions or an invalid format.");
      }
    } catch (error: any) {
      console.error("Failed to load AI questions:", error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تحميل الأسئلة',
        description: error.message || 'لم يتمكن الذكاء الاصطناعي من إنشاء أسئلة الاختبار. حاول مرة أخرى.',
        duration: 7000,
      });
      setQuizStatus('error_loading');
    }
  }, [toast]);

  const startQuiz = () => {
    loadQuestions();
  };

  useEffect(() => {
    // Automatically start loading questions when the component mounts for the first time
    // or if returning to 'not_started' state (e.g. after an error and user wants to retry)
    if (quizStatus === 'not_started') {
        startQuiz();
    }
  }, [quizStatus, loadQuestions]);


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
      setQuizStatus('completed');
      calculateUserLevel();
    }
  };

  const handleSkipQuestion = () => {
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

  if (quizStatus === 'not_started' || quizStatus === 'loading_questions') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">اختبار معلومات التداول</CardTitle>
            <CardDescription>يقوم الذكاء الاصطناعي بإعداد الاختبار لك...</CardDescription>
          </CardHeader>
          <CardContent className="h-32 flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="mt-3 text-muted-foreground">جاري تحميل الأسئلة...</p>
          </CardContent>
           <CardFooter>
            <Button onClick={startQuiz} size="lg" className="w-full" disabled>
              ابدأ الاختبار
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (quizStatus === 'error_loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-destructive">حدث خطأ</CardTitle>
            <CardDescription>فشل تحميل أسئلة الاختبار من الذكاء الاصطناعي.</CardDescription>
          </CardHeader>
          <CardContent className="h-32 flex flex-col items-center justify-center">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <p className="text-muted-foreground">يرجى المحاولة مرة أخرى.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={startQuiz} size="lg" className="w-full">
              <RefreshCw className="mr-2 h-5 w-5" /> حاول مجددًا
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
              نتيجتك: {score} من {questions.length} ( {questions.length > 0 ? ((score / questions.length) * 100).toFixed(0) : 0}% )
            </p>
            <p className="text-xl">
              المستوى المقترح: <span className="font-bold text-primary">{userLevel}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={startQuiz} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-5 w-5" /> أعد الاختبار
              </Button>
              <Button size="lg" disabled>
                ابدأ وحدات التعلم <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (!currentQuestion && quizStatus === 'in_progress') {
     // This might happen briefly if questions array is cleared unexpectedly
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="mt-3 text-muted-foreground">إعداد السؤال...</p>
        </div>
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
                      buttonVariant = "default"; 
                      icon = <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />;
                    } else if (isSelected) {
                      buttonVariant = "destructive"; 
                      icon = <AlertCircle className="mr-2 h-5 w-5 text-red-500" />;
                    }
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
         ملاحظة: هذا الاختبار لأغراض تعليمية فقط ولا يشكل نصيحة استثمارية. يتم إنشاء الأسئلة بواسطة الذكاء الاصطناعي وقد تحتوي على أخطاء.
       </p>
    </div>
  );
}
