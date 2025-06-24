
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { BotMessageSquare, ExternalLink, Newspaper, AlertTriangle } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FloatingAIButtonProps {
  articles: NewsArticle[];
}

export function FloatingAIButton({ articles }: FloatingAIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-3 right-3 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="rounded-full pl-2.5 pr-3 py-2 h-9 shadow-lg"
          aria-label="Show breaking news"
        >
          <BotMessageSquare className="mr-1 h-3.5 w-3.5" />
          Breaking News
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Newspaper className="mr-2 h-5 w-5" />
              Latest Breaking News
            </DialogTitle>
            <DialogDescription>
              The most recent urgent updates from financial markets.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {articles.length > 0 ? (
                articles.map(article => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-semibold text-sm leading-tight">{article.headline}</p>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                      <span>{article.source}</span>
                      <span>{formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true })}</span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 border rounded-md">
                  <AlertTriangle className="h-6 w-6 mb-2 text-muted-foreground"/>
                  <p className="text-sm font-medium">No Breaking News Found</p>
                  <p className="text-xs text-muted-foreground">Could not fetch breaking news at this time.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
