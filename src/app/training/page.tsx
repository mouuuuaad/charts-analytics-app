
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GraduationCap, LineChart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const trainingOptions = [
  {
    href: '/training/quiz',
    icon: GraduationCap,
    title: 'AI Training Quiz',
    description: 'Test your knowledge with AI-generated questions on technical analysis and trading concepts.',
    cta: 'Start Quiz',
  },
  {
    href: '/training/charts',
    icon: LineChart,
    title: 'Interactive Charts',
    description: 'Use live charts to practice identifying trends, patterns, and key levels in real-time.',
    cta: 'Practice on Charts',
  },
];

export default function TrainingHubPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold">Training Center</h1>
        <p className="text-md text-muted-foreground mt-2">
          Sharpen your skills. Choose a module below to get started.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainingOptions.map((option, index) => (
          <motion.div
            key={option.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 * index }}
            className="h-full"
          >
            <Card className="flex flex-col h-full hover:border-primary/80 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                 <div className="p-3 bg-primary/10 rounded-full">
                    <option.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{option.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                 <CardDescription>{option.description}</CardDescription>
              </CardContent>
              <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={option.href}>
                      {option.cta}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
