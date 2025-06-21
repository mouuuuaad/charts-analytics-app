
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { addFeedback, getAllFeedback } from '@/services/firestore';
import type { Feedback } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getInitials(displayName: string | null | undefined): string {
    if (displayName) {
        const names = displayName.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
    }
    return '...';
};

export default function FeedbackPage() {
    useRequireAuth();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [newFeedback, setNewFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchFeedback = useCallback(async () => {
        // No need to set isLoading to true here, as it's handled by the initial state
        try {
            const feedback = await getAllFeedback();
            setFeedbackList(feedback);
        } catch (error) {
            console.error("Error fetching feedback:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load feedback. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        // Only fetch feedback if we have a logged-in user.
        if (user) {
            fetchFeedback();
        } else if (!authLoading) {
            // If auth is done and there's no user, stop the loading spinner.
            // The useRequireAuth hook will handle the redirect.
            setIsLoading(false);
        }
    }, [user, authLoading, fetchFeedback]);

    const handleFeedbackSubmit = async () => {
        if (!newFeedback.trim()) {
            toast({ variant: 'destructive', title: 'Empty Feedback', description: 'Please write something before submitting.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to submit feedback.' });
            return;
        }

        setIsSubmitting(true);
        const username = user.displayName || user.email || 'Anonymous';
        const photoURL = user.photoURL;

        const resultId = await addFeedback(user.uid, username, photoURL, newFeedback);

        if (resultId) {
            toast({ title: 'Feedback Submitted', description: 'Thank you for your thoughts!' });
            setNewFeedback('');
            // Refetch feedback without setting loading to true, for a smoother update
            const updatedFeedback = await getAllFeedback();
            setFeedbackList(updatedFeedback);
        } else {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your feedback. Please try again.' });
        }
        setIsSubmitting(false);
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4 px-2 md:px-0 max-w-2xl">
            <div className="flex flex-col h-[calc(100vh-6rem)]">
                <Card className="flex-shrink-0">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center"><MessageSquare className="mr-2 h-5 w-5" />Public Feedback</CardTitle>
                        <CardDescription>Share your thoughts, suggestions, or bug reports with the community. All feedback is public.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full gap-2">
                            <Textarea
                                placeholder="Type your feedback here..."
                                value={newFeedback}
                                onChange={(e) => setNewFeedback(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <Button onClick={handleFeedbackSubmit} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Feedback
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <ScrollArea className="flex-grow mt-4 pr-3">
                    <div className="space-y-4">
                        {feedbackList.length > 0 ? (
                            feedbackList.map((item) => (
                                <Card key={item.id} className="p-3">
                                    <div className="flex items-start space-x-3">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={item.photoURL || undefined} alt={item.username} />
                                            <AvatarFallback>{getInitials(item.username)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-semibold">{item.username}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                                </p>
                                            </div>
                                            <p className="text-sm mt-1 whitespace-pre-wrap">{item.text}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No feedback yet.</p>
                                <p className="text-sm">Be the first one to share your thoughts!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
