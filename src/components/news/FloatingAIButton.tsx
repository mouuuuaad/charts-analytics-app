
'use client';

import { Button } from '@/components/ui/button';
import { BotMessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FloatingAIButton() {
  const { toast } = useToast();

  const handleAISummary = () => {
    toast({
      title: 'AI Market Summary',
      description: 'AI analyzing market... (Coming soon!)', // Simplified
      duration: 4000,
    });
    console.log("AI Summary button clicked.");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50"> {/* Adjusted positioning */}
      <Button
        onClick={handleAISummary}
        size="default" // Standard size
        className="rounded-full pl-4 pr-5 py-2.5" // Adjusted padding
        aria-label="Ask AI to summarize market"
      >
        <BotMessageSquare className="mr-1.5 h-4 w-4" /> {/* Adjusted icon size/margin */}
        Ask AI
      </Button>
    </div>
  );
}
