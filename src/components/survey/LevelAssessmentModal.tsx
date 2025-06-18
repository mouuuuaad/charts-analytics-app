
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface Question {
  id: string;
  text: string;
  options: { value: string; label: string }[];
  correctAnswer: string;
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'What does a "support level" typically indicate in technical analysis?',
    options: [
      { value: 'a', label: 'A price ceiling where selling pressure is strong.' },
      { value: 'b', label: 'A price floor where buying interest is expected.' },
      { value: 'c', label: 'A period of low trading volume.' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q2',
    text: 'Which of these is a common trend-following indicator?',
    options: [
      { value: 'a', label: 'RSI (Relative Strength Index)' },
      { value: 'b', label: 'Moving Average' },
      { value: 'c', label: 'Fibonacci Retracement' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q3',
    text: 'What does "going long" mean in trading?',
    options: [
      { value: 'a', label: 'Betting the price will go down.' },
      { value: 'b', label: 'Betting the price will go up.' },
      { value: 'c', label: 'Holding a position for an extended period.' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q4',
    text: 'A "stop-loss" order is primarily used to:',
    options: [
      { value: 'a', label: 'Secure profits.' },
      { value: 'b', label: 'Limit potential losses.' },
      { value: 'c', label: 'Enter a trade at a specific price.' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q5',
    text: 'What is a common characteristic of a "Doji" candlestick pattern?',
    options: [
      { value: 'a', label: 'A long body with short wicks.' },
      { value: 'b', label: 'Open and close prices are very close or the same.' },
      { value: 'c', label: 'Indicates a strong continuation of the current trend.' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q6',
    text: '"Diversification" in a portfolio aims to:',
    options: [
      { value: 'a', label: 'Concentrate investments for higher returns.' },
      { value: 'b', label: 'Reduce overall risk by spreading investments.' },
      { value: 'c', label: 'Guarantee profits.' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q7',
    text: 'What does "market capitalization" (market cap) refer to?',
    options: [
      { value: 'a', label: 'The total profit a company made last year.' },
      { value: 'b', label: "The total value of a company's outstanding shares." },
      { value: 'c', label: 'The amount of debt a company has.' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'q8',
    text: 'Which statement about "leverage" in trading is most accurate?',
    options: [
      { value: 'a', label: 'It reduces the risk of your trades.' },
      { value: 'b', label: 'It allows you to control a larger position with a smaller amount of capital, amplifying potential profits and losses.' },
      { value: 'c', label: 'It is only available for stock trading.' },
    ],
    correctAnswer: 'b',
  },
];

type UserLevel = 'beginner' | 'intermediate' | 'advanced';

interface LevelAssessmentModalProps {
  isOpen: boolean;
  onComplete: (level: UserLevel) => void;
}

export function LevelAssessmentModal({ isOpen, onComplete }: LevelAssessmentModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Reset selected option when question changes
    setSelectedOption(answers[questions[currentQuestionIndex].id] || undefined);
  }, [currentQuestionIndex, answers]);

  const handleNext = () => {
    if (selectedOption) {
      setAnswers((prev) => ({ ...prev, [questions[currentQuestionIndex].id]: selectedOption }));
    }
    setSelectedOption(undefined); // Clear for next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    let score = 0;
    // Ensure the last answer is recorded if selected
    const finalAnswers = selectedOption ? { ...answers, [questions[currentQuestionIndex].id]: selectedOption } : answers;

    questions.forEach((q) => {
      if (finalAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    let level: UserLevel;
    if (score <= 3) {
      level = 'beginner';
    } else if (score <= 6) {
      level = 'intermediate';
    } else {
      level = 'advanced';
    }
    onComplete(level);
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Modal should be controlled by parent */ }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Trading Knowledge Assessment</DialogTitle>
          <DialogDescription>
            Answer these questions to help us tailor the analysis to your experience level.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="mb-2">
            <Label className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Label>
            <Progress value={progressPercentage} className="w-full h-2 mt-1" />
          </div>
          <p className="text-md font-semibold">{currentQuestion.text}</p>
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button onClick={handleNext} disabled={!selectedOption}>
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
