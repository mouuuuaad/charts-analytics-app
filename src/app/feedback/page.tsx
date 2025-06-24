'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, MessageSquare, ThumbsUp, Heart, MessageCircle, ShieldCheck, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function getInitials(displayName: string | null | undefined): string {
    if (displayName) {
        const names = displayName.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : displayName.substring(0, 2).toUpperCase();
    }
    return '...';
}

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
    <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-gray-100">
            <AvatarImage src={localItem.photoURL || undefined} alt={localItem.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
              {getInitials(localItem.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 truncate">{localItem.username}</h4>
              <time className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDistanceToNow(localItem.createdAt, { addSuffix: true })}
              </time>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{localItem.text}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 px-3 rounded-full transition-all duration-200",
                hasReacted('like') 
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                  : "hover:bg-gray-100"
              )}
              onClick={() => handleReaction('like')} 
              disabled={!!isReacting}
            >
              {isReacting === 'like' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className={cn("h-4 w-4", hasReacted('like') && "fill-current")} />
              )}
              <span className="text-xs ml-1.5 font-medium">{localItem.reactions.like?.length || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 px-3 rounded-full transition-all duration-200",
                hasReacted('love') 
                  ? "bg-red-50 text-red-600 hover:bg-red-100" 
                  : "hover:bg-gray-100"
              )}
              onClick={() => handleReaction('love')} 
              disabled={!!isReacting}
            >
              {isReacting === 'love' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn("h-4 w-4", hasReacted('love') && "fill-current")} />
              )}
              <span className="text-xs ml-1.5 font-medium">{localItem.reactions.love?.length || 0}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {localItem.replyCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-xs rounded-full hover:bg-gray-100 transition-colors duration-200" 
                onClick={handleToggleReplies}
              >
                {isLoadingReplies ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                <span className="ml-1.5">{repliesVisible ? "Hide" : "View"} {localItem.replyCount}</span>
              </Button>
            )}
            
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs rounded-full border-gray-200 hover:bg-gray-50 transition-colors duration-200" 
                onClick={() => setIsReplying(!isReplying)}
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </Button>
            )}
          </div>
        </div>

        {repliesVisible && (
          <div className="mt-4 pt-3 border-t space-y-3">
            {replies.map(reply => (
              <div key={reply.id} className="flex items-start space-x-3 pl-2">
                <Avatar className="h-8 w-8 ring-2 ring-gray-100">
                  <AvatarImage src={reply.photoURL || undefined} alt={reply.username} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-medium">
                    {getInitials(reply.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-900">{reply.username}</span>
                      {reply.isAdmin && (
                        <ShieldCheck className="h-3.5 w-3.5 ml-1.5 text-blue-600" title="Admin"/>
                      )}
                    </div>
                    <time className="text-xs text-gray-500">
                      {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                    </time>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isReplying && (
          <div className="mt-4 pt-3 border-t">
            <div className="bg-gray-50 rounded-xl p-3">
              <Textarea
                placeholder="Write your reply as an admin..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSubmittingReply}
                className="border-0 bg-white shadow-sm resize-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={handleReplySubmit} 
                  disabled={isSubmittingReply || !replyText.trim()} 
                  size="sm" 
                  className="h-8 px-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  {isSubmittingReply && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Post Reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
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
            await fetchFeedback();
        } else {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your feedback.' });
        }
        setIsSubmitting(false);
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading feedback...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            <div className="container mx-auto py-6 px-4 max-w-3xl">
                <div className="space-y-6">
                    {/* Header Card */}
                    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <MessageSquare className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold text-gray-900">Community Feedback</CardTitle>
                                    <CardDescription className="text-gray-600 mt-1">
                                        Share your thoughts and help us improve together
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                <Textarea
                                    placeholder="What's on your mind? Share your feedback, suggestions, or report any issues..."
                                    value={newFeedback}
                                    onChange={(e) => setNewFeedback(e.target.value)}
                                    disabled={isSubmitting}
                                    className="min-h-[100px] border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                <div className="flex justify-end">
                                    <Button 
                                        onClick={handleFeedbackSubmit} 
                                        disabled={isSubmitting || !newFeedback.trim()}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 transform hover:scale-105"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        {isSubmitting ? 'Posting...' : 'Post Feedback'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feedback List */}
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
                            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
                                <CardContent className="py-16 text-center">
                                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback yet</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Be the first to share your thoughts and help shape our community!
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}