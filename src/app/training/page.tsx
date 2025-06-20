
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, RefreshCw, SkipForward, Award, Loader2 } from 'lucide-react';
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
      const input: GenerateQuizInput = { topic: "أساسيات التحليل الفني", numQuestions: 5, language: "Arabic" }; // Simplified topic/num
      const generatedQuestions = await generateQuizQuestions(input);
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(shuffleArray(generatedQuestions)); 
        setCurrentQuestionIndex(0); setSelectedOption(null); setAnswers({});
        setFeedback(null); setIsCorrect(null); setScore(0); setUserLevel('غير محدد');
        setQuizStatus('in_progress');
      } else { throw new Error("AI returned no questions."); }
    } catch (error: any) {
      console.error("Failed to load AI questions:", error);
      toast({ variant: 'destructive', title: 'خطأ تحميل الأسئلة', description: error.message || 'فشل تحميل الأسئلة.', duration: 5000 });
      setQuizStatus('error_loading');
    }
  }, [toast]);

  const startQuiz = useCallback(() => { loadQuestions(); }, [loadQuestions]); // Make startQuiz stable

  useEffect(() => {
    if (quizStatus === 'not_started') { startQuiz(); }
  }, [quizStatus, startQuiz]);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const progressPercentage = useMemo(() => questions.length === 0 ? 0 : ((currentQuestionIndex) / questions.length) * 100, [currentQuestionIndex, questions.length]);

  const handleOptionSelect = (optionValue: string) => {
    if (quizStatus === 'in_progress') {
      setSelectedOption(optionValue);
      const correct = optionValue === currentQuestion.correctAnswer;
      setIsCorrect(correct); setFeedback(currentQuestion.explanation);
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionValue }));
      if (correct) setScore(prevScore => prevScore + 1);
      setQuizStatus('feedback_shown');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null); setFeedback(null); setIsCorrect(null);
      setQuizStatus('in_progress');
    } else {
      setQuizStatus('completed'); calculateUserLevel();
    }
  };
  
  const handleSkipQuestion = () => { // Combined skip and next logic
    handleNextQuestion();
  };

  const calculateUserLevel = () => {
    const percentageScore = (score / questions.length) * 100;
    if (percentageScore >= 75) setUserLevel('محترف'); // Adjusted thresholds
    else if (percentageScore >= 40) setUserLevel('متوسط');
    else setUserLevel('مبتدئ');
  };

  if (quizStatus === 'not_started' || quizStatus === 'loading_questions') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3"> {/* Simplified */}
        <Card className="w-full max-w-xs text-center border p-3"> {/* Simplified */}
          <CardHeader className="p-2">
            <CardTitle className="text-lg">اختبار التداول</CardTitle> {/* Simplified */}
            <CardDescription className="text-xs">الذكاء الاصطناعي يعد الاختبار...</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin" /> {/* Simplified */}
            <p className="mt-1.5 text-xs text-muted-foreground">جاري التحميل...</p>
          </CardContent>
           <CardFooter className="p-2">
            <Button onClick={startQuiz} size="sm" className="w-full text-sm h-8" disabled>ابدأ</Button> {/* Simplified */}
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (quizStatus === 'error_loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3">
        <Card className="w-full max-w-xs text-center border p-3">
          <CardHeader className="p-2">
            <CardTitle className="text-lg text-destructive">حدث خطأ</CardTitle>
            <CardDescription className="text-xs">فشل تحميل أسئلة الاختبار.</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-1.5" />
            <p className="text-xs text-muted-foreground">يرجى المحاولة مرة أخرى.</p>
          </CardContent>
          <CardFooter className="p-2">
            <Button onClick={startQuiz} size="sm" className="w-full text-sm h-8">
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> حاول مجددًا
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizStatus === 'completed') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3"> {/* Simplified */}
        <Card className="w-full max-w-xs text-center border p-3">
          <CardHeader className="p-2"> <CardTitle className="text-lg">نتيجة الاختبار</CardTitle> </CardHeader>
          <CardContent className="space-y-3 p-2"> {/* Simplified */}
            <Award className="w-16 h-16 mx-auto text-muted-foreground" /> {/* Simplified */}
            <p className="text-lg font-medium">
              نتيجتك: {score} / {questions.length} ( {questions.length > 0 ? ((score / questions.length) * 100).toFixed(0) : 0}% )
            </p>
            <p className="text-md"> المستوى: <span className="font-semibold">{userLevel}</span> </p> {/* Simplified */}
            <div className="flex flex-col sm:flex-row gap-1.5 justify-center"> {/* Simplified */}
              <Button onClick={startQuiz} variant="outline" size="sm" className="text-sm h-8"><RefreshCw className="mr-1 h-3.5 w-3.5" /> أعد الاختبار</Button>
              <Button size="sm" disabled className="text-sm h-8"> ابدأ التعلم <ChevronRight className="ml-1 h-3.5 w-3.5" /> </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (!currentQuestion && quizStatus === 'in_progress') {
     return ( <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3"> <Loader2 className="w-10 h-10 animate-spin" /> <p className="mt-1.5 text-xs text-muted-foreground">إعداد السؤال...</p> </div> );
  }

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-md"> {/* Simplified */}
      <Card className="overflow-hidden border">
        <CardHeader className="pb-2 p-2 md:p-3"> {/* Simplified */}
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-md"> سؤال {currentQuestionIndex + 1} / {questions.length} </CardTitle> {/* Simplified */}
            <Button variant="ghost" size="sm" onClick={handleSkipQuestion} disabled={quizStatus === 'feedback_shown'} className="text-xs h-7 px-1.5"> تخطى <SkipForward className="ml-0.5 h-3 w-3" /> </Button> {/* Simplified */}
          </div>
          <Progress value={progressPercentage} className="w-full h-1" /> {/* Thinner */}
        </CardHeader>

        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}> {/* Faster transition */}
            <CardContent className="pt-3 p-2 md:p-3 space-y-3"> {/* Simplified */}
              <p className="text-md font-medium leading-normal text-right" dir="rtl"> {currentQuestion.questionText} </p>
              <div className="space-y-2"> {/* Simplified */}
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.value;
                  let buttonVariant: "default" | "outline" | "secondary" = "outline"; // Simpler variants
                  let customClasses = "";
                  if (quizStatus === 'feedback_shown') {
                    if (option.value === currentQuestion.correctAnswer) { buttonVariant = "default"; customClasses = "bg-foreground text-background hover:bg-foreground/90"; } // Correct: Black bg, white text
                    else if (isSelected) { buttonVariant = "destructive"; customClasses = "bg-destructive text-destructive-foreground hover:bg-destructive/90 line-through"; } // Incorrect selected
                  } else if (isSelected) {
                     customClasses = "ring-1 ring-foreground"; // Selected but not yet submitted
                  }
                  return (
                    <Button
                      key={option.value} variant={buttonVariant} size="sm" // Smaller buttons
                      className={`w-full justify-start text-right py-2 h-auto whitespace-normal text-sm ${customClasses}`}
                      onClick={() => handleOptionSelect(option.value)} disabled={quizStatus === 'feedback_shown'} dir="rtl"
                    >
                      {quizStatus === 'feedback_shown' && option.value === currentQuestion.correctAnswer && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      {quizStatus === 'feedback_shown' && option.value !== currentQuestion.correctAnswer && isSelected && <AlertCircle className="mr-1.5 h-3.5 w-3.5" />}
                      {option.text}
                    </Button>
                  );
                })}
              </div>

              {quizStatus === 'feedback_shown' && feedback && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.15 }}
                  className={`p-2 rounded border text-xs ${ isCorrect ? 'border-foreground bg-background' : 'border-destructive bg-destructive/10 text-destructive' }`} // Simplified feedback box
                  dir="rtl"
                >
                  <div className="flex items-center mb-0.5">
                    {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <AlertCircle className="h-3.5 w-3.5 mr-1" />}
                    <span className="font-medium">{isCorrect ? 'صحيح!' : 'خطأ.'}</span>
                  </div>
                  {currentQuestion.explanation}
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="pt-3 p-2 md:p-3"> {/* Simplified */}
          {quizStatus === 'feedback_shown' && (
            <Button onClick={handleNextQuestion} size="sm" className="w-full text-sm h-8">
              {currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'النتيجة'}
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </CardFooter>
      </Card>
       <p className="text-xs text-center text-muted-foreground mt-2 px-1">
         ملاحظة: هذا الاختبار تعليمي. يتم إنشاء الأسئلة بواسطة AI وقد تحتوي أخطاء.
       </p>
    </div>
  );
}
