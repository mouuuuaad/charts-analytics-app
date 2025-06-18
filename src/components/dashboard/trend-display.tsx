'use client';

import type { PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowUpCircle, ArrowDownCircle, HelpCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrendDisplayProps {
  prediction: PredictMarketTrendOutput | null;
  isLoading: boolean;
  error?: string | null;
}

export function TrendDisplay({ prediction, isLoading, error }: TrendDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full shadow-lg animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-12 w-12 bg-muted rounded-full"></div>
            <div className="h-8 bg-muted rounded w-24"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/5"></div>
            </div>
            <div className="h-6 bg-muted rounded w-full"></div>
          </div>
          <div className="space-y-1">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="w-full shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/10 p-3 rounded-md">{error}</p>
        </CardContent>
      </Card>
    );
  }


  if (!prediction) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Market Trend Prediction</CardTitle>
          <CardDescription>Upload a chart image to see the AI-powered prediction.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[200px]">
          <HelpCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No analysis performed yet.</p>
        </CardContent>
      </Card>
    );
  }

  const isUp = prediction.trendPrediction === 'up';
  const confidencePercent = Math.round(prediction.confidence * 100);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Market Trend Prediction</CardTitle>
        <CardDescription>AI-powered insights based on your uploaded chart.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-2">
          {isUp ? (
            <ArrowUpCircle className="w-16 h-16 text-green-500" />
          ) : (
            <ArrowDownCircle className="w-16 h-16 text-red-500" />
          )}
          <Badge variant={isUp ? "default" : "destructive"} className={`text-xl px-4 py-2 ${isUp ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
            Trend: {prediction.trendPrediction.toUpperCase()}
            {isUp ? <TrendingUp className="ml-2 h-5 w-5" /> : <TrendingDown className="ml-2 h-5 w-5" />}
          </Badge>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Confidence</span>
            <span className={`text-sm font-semibold ${
              confidencePercent >= 75 ? 'text-green-600' : confidencePercent >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className={`h-3 ${
            isUp ? (confidencePercent >= 75 ? '[&>div]:bg-green-500' : confidencePercent >=50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500') 
                 : (confidencePercent >= 75 ? '[&>div]:bg-red-500' : confidencePercent >=50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500')
          }`} />
        </div>

        <div>
          <h3 className="text-md font-semibold mb-1 text-foreground">Reasoning:</h3>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">{prediction.reason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
