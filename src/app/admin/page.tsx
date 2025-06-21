
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getAllFeedback } from '@/services/firestore';
import type { Feedback } from '@/types';
import { ADMIN_EMAIL } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ShieldCheck, MessageSquare, ThumbsUp, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const LAST_SEEN_FEEDBACK_KEY = 'lastSeenFeedbackTimestamp';

// Simplified FeedbackItem for Admin view - no actions, just display.
const AdminFeedbackItem = ({ item }: { item: Feedback }) => {
    const getInitials = (displayName: string | null | undefined): string => {
        if (displayName) {
            const names = displayName.split(' ');
            return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
        }
        return '...';
    };

  return (
    <Card className="p-3">
      <div className="flex items-start space-x-3">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={item.photoURL || undefined} alt={item.username} />
          <AvatarFallback>{getInitials(item.username)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">{item.username}</p>
              <p className="text-xs text-muted-foreground">{item.userId}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{item.text}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{item.reactions.like?.length || 0}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Heart className="h-3.5 w-3.5" />
            <span>{item.reactions.love?.length || 0}</span>
          </div>
           <div className="flex items-center gap-0.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{item.replyCount || 0}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};


export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    useRequireAuth();

    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

    // Admin access check
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You do not have permission to view this page.',
            });
            router.push('/dashboard');
        }
    }, [authLoading, isAdmin, router, toast]);

    const fetchFeedback = useCallback(async () => {
        setIsLoading(true);
        try {
            const feedback = await getAllFeedback();
            setFeedbackList(feedback);

            // --- In-App Notification Logic ---
            if (feedback.length > 0 && typeof window !== 'undefined') {
                const lastSeenTimestamp = localStorage.getItem(LAST_SEEN_FEEDBACK_KEY);
                const newestFeedback = feedback[0]; // Assumes feedback is sorted descending
                const newestTimestamp = newestFeedback.createdAt.getTime();

                // Only show notification if there was a previously seen item and the new one is newer.
                if (lastSeenTimestamp && newestTimestamp > parseInt(lastSeenTimestamp, 10)) {
                    toast({
                        title: 'New Feedback Received!',
                        description: `"${newestFeedback.text.substring(0, 50)}..."`,
                        duration: 6000,
                    });
                }
                
                // Always update the last seen timestamp to the latest one.
                localStorage.setItem(LAST_SEEN_FEEDBACK_KEY, newestTimestamp.toString());
            }

        } catch (error) {
            console.error("Error fetching feedback:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load feedback.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (isAdmin) {
            fetchFeedback();
        }
    }, [isAdmin, fetchFeedback]);

    if (authLoading || !isAdmin) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4 px-2 md:px-0 max-w-4xl space-y-4">
            <div className="flex items-center space-x-2">
                <ShieldCheck className="h-7 w-7 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Welcome, Admin!</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><MessageSquare className="mr-2 h-5 w-5" />All User Feedback</CardTitle>
                    <CardDescription>A complete log of all feedback submitted by users.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                         <div className="flex h-[200px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                     ) : (
                        <ScrollArea className="h-[calc(100vh-22rem)] pr-3">
                            <div className="space-y-4">
                                {feedbackList.length > 0 ? (
                                    feedbackList.map((item) => (
                                        <AdminFeedbackItem key={item.id} item={item} />
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-10">
                                        <p>No feedback has been submitted yet.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
