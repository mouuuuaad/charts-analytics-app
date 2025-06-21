
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import {
  addFeedback,
  getAllFeedback,
  toggleFeedbackReaction,
  addReplyToFeedback,
  getRepliesForFeedback
} from '@/services/firestore';
import type { Feedback, FeedbackReply, ReactionType } from '@/types';
import { ADMIN_EMAIL } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, Send, ThumbsUp, Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function getInitials(displayName: string | null | undefined): string {
    if (displayName) {
        const names = displayName.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
    }
    return '...';
};

const FeedbackItem = ({
  item,
  currentUser,
  isAdmin,
}: {
  item: Feedback;
  currentUser: any;
  isAdmin: boolean;
}) => {
  const [localItem, setLocalItem] = useState(item);
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isReacting, setIsReacting] = useState<ReactionType | null>(null);

  const { toast } = useToast();

  const handleToggleReplies = async () => {
    if (!repliesVisible) {
      setIsLoadingReplies(true);
      const fetchedReplies = await getRepliesForFeedback(localItem.id);
      setReplies(fetchedReplies);
      setIsLoadingReplies(false);
    }
    setRepliesVisible(!repliesVisible);
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (!currentUser || isReacting) return;
    setIsReacting(reactionType);

    const originalReactions = { ...localItem.reactions };
    const currentReactionList = originalReactions[reactionType] || [];
    const userHasReacted = currentReactionList.includes(currentUser.uid);

    // Optimistic update
    const newReactionList = userHasReacted
      ? currentReactionList.filter(uid => uid !== currentUser.uid)
      : [...currentReactionList, currentUser.uid];
    
    setLocalItem(prev => ({
      ...prev,
      reactions: {
        ...prev.reactions,
        [reactionType]: newReactionList,
      }
    }));

    try {
      await toggleFeedbackReaction(localItem.id, currentUser.uid, reactionType);
    } catch (error) {
      // Revert on error
      setLocalItem(prev => ({ ...prev, reactions: originalReactions }));
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save your reaction.' });
    } finally {
      setIsReacting(null);
    }
  };
  
  const handleReplySubmit = async () => {
    if (!replyText.trim() || !currentUser || !isAdmin) return;
    setIsSubmittingReply(true);

    const resultId = await addReplyToFeedback(
      localItem.id,
      currentUser.uid,
      currentUser.displayName || 'Admin',
      currentUser.photoURL,
      replyText,
      true
    );

    if (resultId) {
        const newReply: FeedbackReply = {
            id: resultId,
            userId: currentUser.uid,
            username: currentUser.displayName || 'Admin',
            photoURL: currentUser.photoURL,
            text: replyText,
            isAdmin: true,
            createdAt: new Date(),
        };
        setReplies(prev => [...prev, newReply]);
        setLocalItem(prev => ({ ...prev, replyCount: (prev.replyCount || 0) + 1 }));
        setReplyText('');
        setIsReplying(false);
        toast({ title: 'Reply posted!' });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not post reply.' });
    }
    setIsSubmittingReply(false);
  };

  const hasReacted = (reaction: ReactionType) => localItem.reactions[reaction]?.includes(currentUser?.uid);

  return (
    <Card className="p-3">
      <div className="flex items-start space-x-3">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={localItem.photoURL || undefined} alt={localItem.username} />
          <AvatarFallback>{getInitials(localItem.username)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">{localItem.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(localItem.createdAt, { addSuffix: true })}
            </p>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{localItem.text}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={() => handleReaction('like')} disabled={!!isReacting}>
             {isReacting === 'like' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
             {isReacting !== 'like' && <ThumbsUp className={cn("h-3.5 w-3.5", hasReacted('like') ? "text-primary fill-primary" : "text-muted-foreground")} />}
            <span className="text-xs ml-1">{localItem.reactions.like?.length || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={() => handleReaction('love')} disabled={!!isReacting}>
             {isReacting === 'love' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
             {isReacting !== 'love' && <Heart className={cn("h-3.5 w-3.5", hasReacted('love') ? "text-destructive fill-destructive" : "text-muted-foreground")} />}
            <span className="text-xs ml-1">{localItem.reactions.love?.length || 0}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
            {localItem.replyCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 px-1.5 text-xs" onClick={handleToggleReplies}>
                    {isLoadingReplies ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
                    <span className="ml-1">{repliesVisible ? "Hide" : "View"} {localItem.replyCount} Replies</span>
                </Button>
            )}
            {isAdmin && (
                <Button variant="outline" size="sm" className="h-7 px-1.5 text-xs" onClick={() => setIsReplying(!isReplying)}>
                    {isReplying ? 'Cancel' : 'Reply'}
                </Button>
            )}
        </div>
      </div>
      {repliesVisible && (
        <div className="mt-2 pt-2 border-t pl-6 space-y-2">
            {replies.map(reply => (
                <div key={reply.id} className="flex items-start space-x-2">
                    <Avatar className="h-7 w-7 border">
                        <AvatarImage src={reply.photoURL || undefined} alt={reply.username} />
                        <AvatarFallback className="text-xs">{getInitials(reply.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 p-1.5 rounded-md">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold flex items-center">
                                {reply.username}
                                {reply.isAdmin && <ShieldCheck className="h-3 w-3 ml-1 text-primary" title="Admin"/>}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(reply.createdAt, { addSuffix: true })}</p>
                        </div>
                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{reply.text}</p>
                    </div>
                </div>
            ))}
        </div>
      )}
      {isReplying && (
        <div className="mt-2 pt-2 border-t pl-6">
            <Textarea
                placeholder="Write your reply as an admin..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSubmittingReply}
                className="text-sm"
            />
            <Button onClick={handleReplySubmit} disabled={isSubmittingReply || !replyText.trim()} size="sm" className="mt-1 h-7 text-xs">
                {isSubmittingReply && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                Post Reply
            </Button>
        </div>
      )}
    </Card>
  );
};


export default function FeedbackPage() {
    useRequireAuth();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [newFeedback, setNewFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

    const fetchFeedback = useCallback(async () => {
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
        if (user) {
            fetchFeedback();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchFeedback]);

    const handleFeedbackSubmit = async () => {
        if (!newFeedback.trim() || !user) return;
        setIsSubmitting(true);
        const username = user.displayName || user.email || 'Anonymous';
        const photoURL = user.photoURL;

        const resultId = await addFeedback(user.uid, username, photoURL, newFeedback);

        if (resultId) {
            toast({ title: 'Feedback Submitted', description: 'Thank you for your thoughts!' });
            setNewFeedback('');
            // Refetch feedback for simplicity, or optimistically add to list
            await fetchFeedback();
        } else {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your feedback.' });
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
                            <Button onClick={handleFeedbackSubmit} disabled={isSubmitting || !newFeedback.trim()}>
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
                                <FeedbackItem
                                    key={item.id}
                                    item={item}
                                    currentUser={user}
                                    isAdmin={isAdmin}
                                />
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
