
'use client';
import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { inspirationalContent } from '@/lib/inspirationalContent';
import { Bot, BookHeart, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const getRandomItem = <T extends {}>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
};

export function GlobalInspirationNotifier() {
    const { toast } = useToast();
    const { user, loading } = useAuth();

    const showInspirationalToast = useCallback(() => {
        const item = getRandomItem(inspirationalContent);
        const isArabic = item.source?.includes('سورة') || item.source?.includes('صحيح');
        
        toast({
            title: (
                <div className="flex items-center">
                    {item.type === 'quote' ? 
                        <BookHeart className="mr-2 h-5 w-5 text-primary" /> : 
                        <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                    }
                    <span>{item.type === 'quote' ? 'Moment of Reflection' : 'Quick Tip'}</span>
                </div>
            ),
            description: (
                <div className="space-y-1">
                    <p dir={isArabic ? 'rtl' : 'ltr'} className={`w-full text-left ${isArabic ? 'text-right font-serif' : ''}`}>
                        {item.text}
                    </p>
                    {item.source && (
                        <p dir={isArabic ? 'rtl' : 'ltr'} className={`text-xs text-muted-foreground w-full text-left ${isArabic ? 'text-right' : ''}`}>
                            - {item.source}
                        </p>
                    )}
                </div>
            ),
            duration: 10000, // 10 seconds
        });
    }, [toast]);

    useEffect(() => {
        // Only run the notifier if the user is logged in
        if (user && !loading) {
            const intervalId = setInterval(showInspirationalToast, 120000); // 2 minutes
            return () => clearInterval(intervalId);
        }
    }, [user, loading, showInspirationalToast]);

    return null; // This component doesn't render anything itself
}
