
'use client';

import { useState } from 'react';
import { ImageUploader } from './image-uploader';
import { TrendDisplay } from './trend-display';
import { extractChartData, ExtractChartDataOutput } from '@/ai/flows/extract-chart-data';
import { predictMarketTrend, PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { useAuth } from '@/contexts/auth-context'; 
// import { addAnalysis } from '@/services/firestore'; // Firestore not used when auth disabled
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function AnalysisSection() {
  const [prediction, setPrediction] = useState<PredictMarketTrendOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentChartImage, setCurrentChartImage] = useState<string | null>(null);

  const { user } = useAuth(); // user will be null if auth is disabled
  const { toast } = useToast();

  const handleImageAnalysis = async (file: File, dataUrl: string) => {
    setIsLoading(true);
    setPrediction(null);
    setCurrentError(null);
    setCurrentChartImage(dataUrl);

    try {
      const chartDataInput = { chartImage: dataUrl };
      const extractedDataResult: ExtractChartDataOutput = await extractChartData(chartDataInput);
      
      if (!extractedDataResult) {
        throw new Error('Failed to get a response from the data extraction service.');
      }

      if (!extractedDataResult.isTradingChart) {
        const warning = extractedDataResult.warningMessage || 'The uploaded image does not appear to be a financial trading chart. This application only analyzes charts related to trading (stocks, forex, crypto, etc.).';
        setCurrentError(warning);
        setPrediction(null); 
        toast({
          variant: 'destructive',
          title: 'Invalid Image Type',
          description: warning,
        });
        setIsLoading(false);
        return;
      }
      
      if (!extractedDataResult.extractedData) {
        // This case might indicate an issue even if it's a trading chart but data couldn't be extracted.
        // The AI prompt for extraction already handles this by setting extractedData to null if it's not a trading chart.
        // So this specific error might be redundant if the AI follows instructions perfectly.
        // However, keeping it as a fallback.
        const extractionFailureMsg = "The image appears to be a trading chart, but data extraction failed. Please try a clearer image or a different chart.";
        setCurrentError(extractionFailureMsg);
        setPrediction(null);
        toast({
          variant: 'destructive',
          title: 'Data Extraction Failed',
          description: extractionFailureMsg,
        });
        setIsLoading(false);
        return;
      }

      const trendInput = { extractedData: extractedDataResult.extractedData };
      const trendPredictionResult: PredictMarketTrendOutput = await predictMarketTrend(trendInput);
      
      if (!trendPredictionResult) {
        throw new Error('Failed to predict market trend. The AI model may not have been able to process the extracted data.');
      }
      
      setPrediction(trendPredictionResult);

      // Saving to Firestore is disabled if auth is off
      // if (user) { 
      //   const analysisId = await addAnalysis(
      //     user.uid, 
      //     dataUrl, 
      //     extractedDataResult.extractedData,
      //     trendPredictionResult,
      //     file.name
      //   );

      //   if (analysisId) {
      //     toast({
      //       title: 'Analysis Complete',
      //       description: 'Market trend prediction is ready and saved to your history.',
      //     });
      //   } else {
      //     toast({
      //       variant: 'destructive',
      //       title: 'Save Error',
      //       description: 'Failed to save analysis to history.',
      //     });
      //   }
      // } else {
         toast({ // Toast is only for errors, this is a success message
          title: 'Analysis Complete',
          description: 'Market trend prediction is ready. (Saving to history is disabled as authentication is off).',
        });
      // }
    } catch (error: any) {
      console.error('Analysis pipeline error:', error);
      let errorMessage = 'An unexpected error occurred during analysis.';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setCurrentError(errorMessage);
      setPrediction(null);
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
        <div className="sticky top-20"> 
          {isLoading && !currentError && (
             <Card className="w-full shadow-lg">
               <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="text-lg font-medium text-muted-foreground">Performing enhanced analysis...</p>
                 <p className="text-sm text-muted-foreground">This may take a few moments.</p>
                 {currentChartImage && (
                    <img src={currentChartImage} alt="Processing chart" className="mt-4 max-h-48 rounded-md opacity-50" data-ai-hint="chart diagram"/>
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

