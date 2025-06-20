
'use client';

import { Button } from '@/components/ui/button';
import { BotMessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FloatingAIButton() {
  const { toast } = useToast();

  const handleAISummary = () => {
    toast({
      title: 'AI Market Summary',
      description: 'AI analyzing market... (Coming soon!)',
      duration: 3000, // Shorter duration
    });
    // console.log("AI Summary button clicked."); // Keep for debugging if needed
  };

  return (
    <div className="fixed bottom-3 right-3 z-50"> {/* Simplified positioning */}
      <Button
        onClick={handleAISummary}
        size="sm" // Smaller button
        className="rounded-full pl-2.5 pr-3 py-2 h-9" // Adjusted padding for smaller size
        aria-label="Ask AI to summarize market"
      >
        <BotMessageSquare className="mr-1 h-3.5 w-3.5" /> {/* Smaller icon/margin */}
        Ask AI
      </Button>
    </div>
  );
}
