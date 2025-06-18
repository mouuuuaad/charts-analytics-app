'use client';

import { useState } from 'react';
import { ImageUploader } from './image-uploader';
import { TrendDisplay } from './trend-display';
import { extractChartData, ExtractChartDataOutput } from '@/ai/flows/extract-chart-data';
import { predictMarketTrend, PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { useAuth } from '@/contexts/auth-context';
import { addAnalysis } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export function AnalysisSection() {
  const [prediction, setPrediction] = useState<PredictMarketTrendOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentChartImage, setCurrentChartImage] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleImageAnalysis = async (file: File, dataUrl: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to analyze charts.',
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setCurrentError(null);
    setCurrentChartImage(dataUrl);

    try {
      // Step 1: Extract chart data
      const chartDataInput = { chartImage: dataUrl };
      const extractedDataResult: ExtractChartDataOutput = await extractChartData(chartDataInput);
      
      if (!extractedDataResult || !extractedDataResult.extractedData) {
        throw new Error('Failed to extract data from the chart image.');
      }

      // Step 2: Predict market trend
      const trendInput = { extractedData: extractedDataResult.extractedData };
      const trendPredictionResult: PredictMarketTrendOutput = await predictMarketTrend(trendInput);
      
      if (!trendPredictionResult) {
        throw new Error('Failed to predict market trend.');
      }
      
      setPrediction(trendPredictionResult);

      // Step 3: Save analysis to Firestore
      const analysisId = await addAnalysis(
        user.uid,
        dataUrl, // Storing base64 for now. In production, upload to storage and store URL.
        extractedDataResult.extractedData,
        trendPredictionResult,
        file.name
      );

      if (analysisId) {
        toast({
          title: 'Analysis Complete',
          description: 'Market trend prediction is ready and saved to your history.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'Failed to save analysis to history.',
        });
      }
    } catch (error: any) {
      console.error('Analysis pipeline error:', error);
      const errorMessage = error.message || 'An unexpected error occurred during analysis.';
      setCurrentError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ImageUploader onImageUpload={handleImageAnalysis} isProcessing={isLoading} />
        <div className="sticky top-20"> {/* Make TrendDisplay sticky */}
          {isLoading && !currentError && (
             <Card className="w-full shadow-lg">
               <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="text-lg font-medium text-muted-foreground">Analyzing chart, please wait...</p>
                 {currentChartImage && (
                    <img src={currentChartImage} alt="Processing chart" className="mt-4 max-h-40 rounded-md opacity-50" />
                 )}
               </CardContent>
             </Card>
          )}
          {(!isLoading || currentError) && <TrendDisplay prediction={prediction} isLoading={false} error={currentError} />}
        </div>
      </div>
    </div>
  );
}
