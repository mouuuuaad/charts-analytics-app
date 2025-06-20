
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, RefreshCw, SkipForward, Award, Loader2 } from 'lucide-react'; // Removed Brain, Lightbulb
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuizQuestions, type QuizQuestion, type GenerateQuizInput } from '@/ai/flows/generate-quiz-questions-flow';
import { useToast } from '@/hooks/use-toast';


type QuizStatus = 'not_started' | 'loading_questions' | 'error_loading' | 'in_progress' | 'feedback_shown' | 'completed';
type UserLevel = 'مبتدئ' | 'متوسط' | 'محترف' | 'غير محدد'; // Kept Arabic for level display

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
        topic: "أساسيات التداول والتحليل الفني", 
        numQuestions: 6,
        language: "Arabic",
      };
      const generatedQuestions = await generateQuizQuestions(input);
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(shuffleArray(generatedQuestions)); 
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setAnswers({});
        setFeedback(null);
        setIsCorrect(null);
        setScore(0);
        setUserLevel('غير محدد');
        setQuizStatus('in_progress');
      } else {
        throw new Error("AI returned no questions."); // Simplified
      }
    } catch (error: any) {
      console.error("Failed to load AI questions:", error);
      toast({
        variant: 'destructive',
        title: 'خطأ تحميل الأسئلة', // Kept Arabic
        description: error.message || 'فشل تحميل الأسئلة. حاول مجددًا.', // Kept Arabic
        duration: 6000,
      });
      setQuizStatus('error_loading');
    }
  }, [toast]);

  const startQuiz = () => {
    loadQuestions();
  };

  useEffect(() => {
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
    if (percentageScore >= 80) setUserLevel('محترف');
    else if (percentageScore >= 50) setUserLevel('متوسط');
    else setUserLevel('مبتدئ');
  };

  if (quizStatus === 'not_started' || quizStatus === 'loading_questions') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <Card className="w-full max-w-sm text-center border"> {/* Simplified card */}
          <CardHeader className="p-4">
            <CardTitle className="text-xl text-primary">اختبار معلومات التداول</CardTitle>
            <CardDescription className="text-xs">الذكاء الاصطناعي يعد الاختبار...</CardDescription>
          </CardHeader>
          <CardContent className="h-28 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-2 text-xs text-muted-foreground">جاري التحميل...</p>
          </CardContent>
           <CardFooter className="p-3">
            <Button onClick={startQuiz} size="default" className="w-full text-sm" disabled> 
              ابدأ
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (quizStatus === 'error_loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <Card className="w-full max-w-sm text-center border">
          <CardHeader className="p-4">
            <CardTitle className="text-xl text-destructive">حدث خطأ</CardTitle>
            <CardDescription className="text-xs">فشل تحميل أسئلة الاختبار.</CardDescription>
          </CardHeader>
          <CardContent className="h-28 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-2" />
            <p className="text-xs text-muted-foreground">يرجى المحاولة مرة أخرى.</p>
          </CardContent>
          <CardFooter className="p-3">
            <Button onClick={startQuiz} size="default" className="w-full text-sm">
              <RefreshCw className="mr-1.5 h-4 w-4" /> حاول مجددًا
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizStatus === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4"
      >
        <Card className="w-full max-w-sm text-center border">
          <CardHeader className="p-4">
            <CardTitle className="text-xl text-primary">نتيجة الاختبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <Award className="w-20 h-20 mx-auto text-accent" /> {/* Removed animation */}
            <p className="text-xl font-medium">
              نتيجتك: {score} / {questions.length} ( {questions.length > 0 ? ((score / questions.length) * 100).toFixed(0) : 0}% )
            </p>
            <p className="text-lg">
              المستوى: <span className="font-semibold text-primary">{userLevel}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={startQuiz} variant="outline" size="default" className="text-sm">
                <RefreshCw className="mr-1.5 h-4 w-4" /> أعد الاختبار
              </Button>
              <Button size="default" disabled className="text-sm">
                ابدأ التعلم <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (!currentQuestion && quizStatus === 'in_progress') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-2 text-xs text-muted-foreground">إعداد السؤال...</p>
        </div>
     );
  }

  return (
    <div className="container mx-auto py-6 px-2 md:px-0 max-w-lg"> {/* Simplified max-width */}
      <Card className="overflow-hidden border">
        <CardHeader className="bg-muted/50 pb-3 p-3 md:p-4">
          <div className="flex justify-between items-center mb-1.5">
            <CardTitle className="text-lg text-primary">
              سؤال {currentQuestionIndex + 1} / {questions.length}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSkipQuestion} disabled={quizStatus === 'feedback_shown'} className="text-xs">
              تخطى <SkipForward className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="w-full h-1.5" /> {/* Thinner progress bar */}
        </CardHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }} // Faster transition
          >
            <CardContent className="pt-4 p-3 md:p-4 space-y-4">
              <p className="text-md font-medium leading-normal text-right" dir="rtl">
                {currentQuestion.questionText}
              </p>
              <div className="space-y-2.5">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.value;
                  let buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link" = "outline";
                  
                  if (quizStatus === 'feedback_shown') {
                    if (option.value === currentQuestion.correctAnswer) buttonVariant = "default"; 
                    else if (isSelected) buttonVariant = "destructive"; 
                  }

                  return (
                    <Button
                      key={option.value}
                      variant={buttonVariant}
                      size="default" // Standard size
                      className={`w-full justify-start text-right py-2.5 h-auto whitespace-normal text-sm
                        ${quizStatus === 'feedback_shown' && option.value === currentQuestion.correctAnswer ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200 dark:bg-green-700/20 dark:text-green-300' : ''}
                        ${quizStatus === 'feedback_shown' && option.value !== currentQuestion.correctAnswer && isSelected ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200 dark:bg-red-700/20 dark:text-red-300' : ''}
                        ${quizStatus === 'in_progress' && isSelected ? 'ring-1 ring-primary' : ''}
                      `}
                      onClick={() => handleOptionSelect(option.value)}
                      disabled={quizStatus === 'feedback_shown'}
                      dir="rtl"
                    >
                      {quizStatus === 'feedback_shown' && option.value === currentQuestion.correctAnswer && <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />}
                      {quizStatus === 'feedback_shown' && option.value !== currentQuestion.correctAnswer && isSelected && <AlertCircle className="mr-2 h-4 w-4 text-red-600" />}
                      {option.text}
                    </Button>
                  );
                })}
              </div>

              {quizStatus === 'feedback_shown' && feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded border text-xs ${
                    isCorrect ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' : 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                  }`}
                  dir="rtl"
                >
                  <div className="flex items-center mb-0.5">
                    {isCorrect ? <CheckCircle2 className="h-4 w-4 mr-1.5" /> : <AlertCircle className="h-4 w-4 mr-1.5" />}
                    <span className="font-medium">{isCorrect ? 'صحيح!' : 'خطأ.'}</span>
                  </div>
                  {currentQuestion.explanation}
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="pt-4 p-3 md:p-4">
          {quizStatus === 'feedback_shown' && (
            <Button onClick={handleNextQuestion} size="default" className="w-full text-sm">
              {currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'النتيجة'}
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
       <p className="text-xs text-center text-muted-foreground mt-3 px-2">
         ملاحظة: هذا الاختبار تعليمي فقط ولا يشكل نصيحة. يتم إنشاء الأسئلة بواسطة AI وقد تحتوي أخطاء.
       </p>
    </div>
  );
}
