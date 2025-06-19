
'use client';

import { Button } from '@/components/ui/button';
import { BotMessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FloatingAIButton() {
  const { toast } = useToast();

  const handleAISummary = () => {
    // Placeholder for AI summarization logic
    // In a real app, this would call a Genkit flow
    toast({
      title: 'AI Market Summary',
      description: 'The AI is analyzing today\'s market... (Feature coming soon!)',
      duration: 5000,
    });
    console.log("AI Summary button clicked. Implement Genkit flow here.");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleAISummary}
        size="lg"
        className="rounded-full shadow-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground pl-5 pr-6 py-6 group"
        aria-label="Ask AI to summarize today's market"
      >
        <BotMessageSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        Ask AI
      </Button>
    </div>
  );
}
