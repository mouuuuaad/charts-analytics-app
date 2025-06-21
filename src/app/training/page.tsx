
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, RefreshCw, SkipForward, Award, Loader2, Lightbulb, BookHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuizQuestions, type QuizQuestion, type GenerateQuizInput } from '@/ai/flows/generate-quiz-questions-flow';
import { useToast } from '@/hooks/use-toast';
import { inspirationalContent, type InspirationalContent } from '@/lib/inspirationalContent';

type QuizStatus = 'not_started' | 'loading_questions' | 'error_loading' | 'in_progress' | 'feedback_shown' | 'completed';
type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Not Assessed';

const correctFeedbackMessages = [
  "Excellent! That's the right answer.",
  "Great job! You're on the right track.",
  "Perfect! Keep up the great work.",
  "Correct! Your knowledge is impressive.",
  "Well done! You nailed it.",
  "Fantastic! That's exactly right.",
  "Brilliant! Keep it up.",
  "You're doing amazing!",
  "Spot on! That's correct.",
  "Impressive work!",
  "You got it right!",
  "Right on! Keep going.",
  "Awesome job!",
  "Correct answer, well done.",
  "You’re mastering this!",
  "Superb! Keep it going.",
  "Good work! That’s right.",
  "Nice! You’re getting better.",
  "Exactly! You’re doing great.",
  "Right answer, excellent!",
  "You’re crushing it!",
  "Perfectly answered!",
  "That’s the way to do it!",
  "Great effort, correct answer!",
  "Keep up the excellent work!",
  "You’re on fire!",
  "Correct! You’re progressing well.",
  "Nice going!",
  "Fantastic effort!",
  "You’ve got it!",
  "Excellent understanding!",
  "Keep it up, you’re right.",
  "Great knowledge!",
  "Right answer, fantastic!",
  "Excellent job, keep learning.",
  "Perfect response!",
  "You’re doing superbly!",
  "Spot on, keep it up!",
  "Well done, that’s correct!",
  "Good job, you nailed it!",
  "Right choice!",
  "You’re doing really well!",
  "Awesome, that’s right!",
  "Correct! You’re doing great.",
  "Excellent answer!",
  "Great going!",
  "Right answer, excellent work!",
  "You’re doing fantastic!",
  "Perfectly done!",
  "Well done, keep it going!",
  "Nice work, you’re right!",
  "Good job, keep it up!",
  "You’re making progress!",
  "Excellent choice!",
  "Great answer!",
  "Correct, well done!",
  "Keep learning, you’re right!",
  "Awesome work!",
  "That’s right, keep going!",
  "Perfect! You’re learning well.",
  "Good going!",
  "Excellent! You got it!",
  "Great knowledge shown!",
  "Right answer, nice job!",
  "Superb work!",
  "Well done, keep it up!",
  "You’re correct!",
  "Excellent, keep practicing!",
  "Nice! That’s correct.",
  "Good job, you got it right!",
  "Right on!",
  "You’re doing excellent!",
  "Perfect answer!",
  "Great! Keep it up!",
  "Well done, you’re correct!",
  "Excellent work!",
  "Good going, keep learning!",
  "Awesome, that’s right!",
  "Right answer, great job!",
  "You’re doing amazing!",
  "Perfectly answered!",
  "Well done, that’s correct!",
  "Good job, you nailed it!",
  "Excellent choice!",
  "Great going!",
  "Correct! Keep it up!",
  "Awesome work!",
  "Right answer, nice job!",
  "You’re progressing well!",
  "Perfect response!",
  "Well done, keep learning!",
  "Good job, keep it up!",
  "You’re doing great!",
  "Excellent answer!",
  "Great work!",
  "Correct! Nice going!",
  "Perfect! Keep learning!",
  "Well done, you got it!",
];

const incorrectFeedbackMessages = [
  "That's okay, every mistake is a learning opportunity.",
  "Not quite, but don't give up. Try again!",
  "This is a good point to learn from. Check the explanation.",
  "No worries, persistence is the key to success.",
  "Almost there! Keep trying.",
  "Don’t be discouraged. Keep practicing.",
  "Mistakes help you improve!",
  "Keep going! You’re learning.",
  "Try again, you’re getting closer.",
  "Incorrect, but you can do it!",
  "Almost right, keep it up!",
  "Keep at it, you’ll get it next time.",
  "Every error teaches you something new.",
  "Don’t give up, keep pushing.",
  "Almost! Review the material and try again.",
  "Not quite, but you’re improving!",
  "Mistakes are stepping stones.",
  "Try once more, you’re on the right track.",
  "Keep practicing, it will click soon.",
  "Wrong answer, but good effort.",
  "You’re learning from every attempt.",
  "Almost there, keep trying!",
  "Don't worry, you'll get it!",
  "Not correct, but you’re getting better.",
  "Stay motivated and try again.",
  "Almost correct! Keep up the good work.",
  "You can improve with practice!",
  "Keep going, you're doing fine.",
  "Incorrect, but don't lose heart.",
  "Review and try again.",
  "Not quite right, but close.",
  "Keep at it, success is near.",
  "Mistakes help you learn.",
  "Try again, you’re almost there.",
  "Not correct, but keep pushing.",
  "Every attempt counts.",
  "Stay positive and try again.",
  "Wrong answer, but keep trying.",
  "Keep practicing, you’re improving.",
  "Almost right, keep learning.",
  "Don’t give up, try once more.",
  "Wrong answer, but good try.",
  "Keep working at it!",
  "Almost correct, review and retry.",
  "You’re learning with each attempt.",
  "Mistakes are part of progress.",
  "Try again, you’re close!",
  "Incorrect, but keep moving forward.",
  "Keep at it, you'll succeed.",
  "Wrong answer, keep trying!",
  "Keep practicing, success will come.",
  "Almost there, don’t quit!",
  "Not right this time, but soon.",
  "Keep up the effort!",
  "Try again, you’re improving.",
  "Wrong answer, but keep going.",
  "Keep working, you’ll get it!",
  "Almost correct, keep it up!",
  "Don’t lose hope, try again.",
  "Incorrect, but good effort.",
  "Try once more, you’re learning.",
  "Wrong answer, keep pushing!",
  "Keep practicing, you’re close.",
  "Almost right, keep trying.",
  "Don’t give up, keep going.",
  "Wrong this time, but keep at it.",
  "Try again, success is near.",
  "Incorrect, but learning happens.",
  "Keep at it, you’re doing fine.",
  "Wrong answer, keep practicing.",
  "Almost there, keep learning.",
  "Don’t quit, try once more.",
  "Incorrect, but good job trying.",
  "Try again, you’re getting closer.",
  "Wrong answer, keep at it!",
  "Keep practicing, you’re improving.",
  "Almost right, don’t give up.",
  "Don’t lose heart, try again.",
  "Wrong answer, keep going.",
  "Try once more, you’re learning.",
  "Incorrect, but keep trying.",
  "Keep practicing, success will come.",
  "Almost correct, keep trying.",
  "Don’t give up, you’ll get it.",
  "Wrong this time, keep practicing.",
  "Try again, progress is being made.",
  "Incorrect, keep pushing forward.",
  "Keep going, you’re improving.",
  "Almost there, keep it up!",
  "Don’t quit, you’ll succeed.",
  "Wrong answer, but keep trying.",
  "Try again, you’re on the right path.",
  "Incorrect, but don’t give up.",
  "Keep practicing, it will get easier.",
  "Almost right, keep trying.",
  "Don’t lose hope, keep going.",
  "Wrong answer, keep trying again.",
];

export default function TrainingQuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('not_started');
  const [score, setScore] = useState(0);
  const [userLevel, setUserLevel] = useState<UserLevel>('Not Assessed');
  const { toast } = useToast();

  const [motivationalMessage, setMotivationalMessage] = useState<string>('');
  const [currentInspiration, setCurrentInspiration] = useState<InspirationalContent | null>(null);

  const shuffleArray = <T extends {}>(array: T[]): T[] => {
    if (!array || array.length === 0) return [];
    return [...array].sort(() => Math.random() - 0.5);
  };
  
  const getRandomItem = <T extends {}>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const loadQuestions = useCallback(async () => {
    setQuizStatus('loading_questions');
    try {
      const input: GenerateQuizInput = { topic: "Technical Analysis Basics", numQuestions: 5, language: "English" };
      const generatedQuestions = await generateQuizQuestions(input);
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(shuffleArray(generatedQuestions)); 
        setCurrentQuestionIndex(0); setSelectedOption(null); setAnswers({});
        setIsCorrect(null); setScore(0); setUserLevel('Not Assessed');
        setQuizStatus('in_progress');
      } else { throw new Error("AI returned no questions."); }
    } catch (error: any) {
      console.error("Failed to load AI questions:", error);
      toast({ variant: 'destructive', title: 'Error Loading Questions', description: error.message || 'Failed to load quiz questions.', duration: 5000 });
      setQuizStatus('error_loading');
    }
  }, [toast]);

  const startQuiz = useCallback(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    if (quizStatus === 'not_started') { startQuiz(); }
  }, [quizStatus, startQuiz]);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const progressPercentage = useMemo(() => questions.length === 0 ? 0 : ((currentQuestionIndex) / questions.length) * 100, [currentQuestionIndex, questions.length]);

  const handleOptionSelect = (optionValue: string) => {
    if (quizStatus === 'in_progress') {
      setSelectedOption(optionValue);
      const correct = optionValue === currentQuestion.correctAnswer;
      setIsCorrect(correct);
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionValue }));
      if (correct) {
          setScore(prevScore => prevScore + 1);
          setMotivationalMessage(getRandomItem(correctFeedbackMessages));
      } else {
          setMotivationalMessage(getRandomItem(incorrectFeedbackMessages));
      }
      setCurrentInspiration(getRandomItem(inspirationalContent));
      setQuizStatus('feedback_shown');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null); setIsCorrect(null); setMotivationalMessage(''); setCurrentInspiration(null);
      setQuizStatus('in_progress');
    } else {
      setQuizStatus('completed'); calculateUserLevel();
    }
  };
  
  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const calculateUserLevel = () => {
    const percentageScore = (score / questions.length) * 100;
    if (percentageScore >= 75) setUserLevel('Advanced');
    else if (percentageScore >= 40) setUserLevel('Intermediate');
    else setUserLevel('Beginner');
  };

  if (quizStatus === 'not_started' || quizStatus === 'loading_questions') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3">
        <Card className="w-full max-w-xs text-center border p-3">
          <CardHeader className="p-2">
            <CardTitle className="text-lg">Trading Quiz</CardTitle>
            <CardDescription className="text-xs">The AI is preparing your quiz...</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="mt-1.5 text-xs text-muted-foreground">Loading...</p>
          </CardContent>
           <CardFooter className="p-2">
            <Button onClick={startQuiz} size="sm" className="w-full text-sm h-8" disabled>Start</Button>
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
            <CardTitle className="text-lg text-destructive">An Error Occurred</CardTitle>
            <CardDescription className="text-xs">Failed to load quiz questions.</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-1.5" />
            <p className="text-xs text-muted-foreground">Please try again.</p>
          </CardContent>
          <CardFooter className="p-2">
            <Button onClick={startQuiz} size="sm" className="w-full text-sm h-8">
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizStatus === 'completed') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3">
        <Card className="w-full max-w-xs text-center border p-3">
          <CardHeader className="p-2"> <CardTitle className="text-lg">Quiz Result</CardTitle> </CardHeader>
          <CardContent className="space-y-3 p-2">
            <Award className="w-16 h-16 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">
              Your Score: {score} / {questions.length} ( {questions.length > 0 ? ((score / questions.length) * 100).toFixed(0) : 0}% )
            </p>
            <p className="text-md"> Your Level: <span className="font-semibold">{userLevel}</span> </p>
            <div className="flex flex-col sm:flex-row gap-1.5 justify-center">
              <Button onClick={startQuiz} variant="outline" size="sm" className="text-sm h-8"><RefreshCw className="mr-1 h-3.5 w-3.5" /> Retake Quiz</Button>
              <Button size="sm" disabled className="text-sm h-8"> Start Learning <ChevronRight className="ml-1 h-3.5 w-3.5" /> </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (!currentQuestion && quizStatus === 'in_progress') {
     return ( <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-3"> <Loader2 className="w-10 h-10 animate-spin" /> <p className="mt-1.5 text-xs text-muted-foreground">Preparing question...</p> </div> );
  }

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-md">
      <Card className="overflow-hidden border">
        <CardHeader className="pb-2 p-2 md:p-3">
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-md"> Question {currentQuestionIndex + 1} of {questions.length} </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSkipQuestion} disabled={quizStatus === 'feedback_shown'} className="text-xs h-7 px-1.5"> Skip <SkipForward className="ml-0.5 h-3 w-3" /> </Button>
          </div>
          <Progress value={progressPercentage} className="w-full h-1" />
        </CardHeader>

        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
            <CardContent className="pt-3 p-2 md:p-3 space-y-3">
              <p className="text-md font-medium leading-normal text-left"> {currentQuestion.questionText} </p>
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.value;
                  let buttonVariant: "default" | "outline" | "secondary" = "outline";
                  let customClasses = "";
                  if (quizStatus === 'feedback_shown') {
                    if (option.value === currentQuestion.correctAnswer) { buttonVariant = "default"; customClasses = "bg-foreground text-background hover:bg-foreground/90"; }
                    else if (isSelected) { buttonVariant = "destructive"; customClasses = "bg-destructive text-destructive-foreground hover:bg-destructive/90 line-through"; }
                  } else if (isSelected) {
                     customClasses = "ring-1 ring-foreground";
                  }
                  return (
                    <Button
                      key={option.value} variant={buttonVariant} size="sm"
                      className={`w-full justify-start text-left py-2 h-auto whitespace-normal text-sm ${customClasses}`}
                      onClick={() => handleOptionSelect(option.value)} disabled={quizStatus === 'feedback_shown'}
                    >
                      {quizStatus === 'feedback_shown' && option.value === currentQuestion.correctAnswer && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      {quizStatus === 'feedback_shown' && option.value !== currentQuestion.correctAnswer && isSelected && <AlertCircle className="mr-1.5 h-3.5 w-3.5" />}
                      {option.text}
                    </Button>
                  );
                })}
              </div>

              {quizStatus === 'feedback_shown' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.15 }}
                  className={`p-2 rounded border text-xs space-y-2.5 ${ isCorrect ? 'border-foreground/50 bg-background' : 'border-destructive/50 bg-destructive/10' }`}
                >
                  <div className="flex items-start">
                    {isCorrect ? <CheckCircle2 className="h-4 w-4 mr-1.5 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mr-1.5 mt-0.5 text-destructive shrink-0" />}
                    <div>
                      <span className={`font-semibold ${isCorrect ? 'text-foreground' : 'text-destructive'}`}>{motivationalMessage}</span>
                      <p className={`mt-1 text-left ${isCorrect ? 'text-foreground' : 'text-destructive'}`}>{currentQuestion.explanation}</p>
                    </div>
                  </div>
                  
                  {currentInspiration && (
                      <div className="pt-2.5 border-t border-dashed">
                          {currentInspiration.type === 'quote' ? (
                            <div dir="rtl" className="flex items-start text-right">
                                <BookHeart className="h-4 w-4 ml-1.5 mt-0.5 text-muted-foreground shrink-0"/>
                                <div>
                                    <p className="italic">"{currentInspiration.text}"</p>
                                    {currentInspiration.source && <p className="text-xs text-muted-foreground mt-0.5">[{currentInspiration.source}]</p>}
                                </div>
                            </div>
                          ) : (
                            <div className="flex items-start">
                                <Lightbulb className="h-4 w-4 mr-1.5 mt-0.5 text-muted-foreground shrink-0"/>
                                <div>
                                    <span className="font-semibold">Tip:</span>
                                    <p className="italic">{currentInspiration.text}</p>
                                </div>
                            </div>
                          )}
                      </div>
                  )}

                </motion.div>
              )}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="pt-3 p-2 md:p-3">
          {quizStatus === 'feedback_shown' && (
            <Button onClick={handleNextQuestion} size="sm" className="w-full text-sm h-8">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ChevronRight className="mr-1 h-3.5 w-3.5" />
            </Button>
          )}
        </CardFooter>
      </Card>
       <p className="text-xs text-center text-muted-foreground mt-2 px-1">
         Note: This is an educational quiz. Questions are generated by an AI and may contain errors.
       </p>
    </div>
  );
}
