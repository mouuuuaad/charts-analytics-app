
'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from './image-uploader';
import { TrendDisplay } from './trend-display';
import { extractChartData, ExtractChartDataOutput } from '@/ai/flows/extract-chart-data';
import { predictMarketTrend, PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import type { Analysis } from '@/types';

type UserLevel = 'beginner' | 'intermediate' | 'advanced';
const MAX_HISTORY_ITEMS = 20; // Max number of history items in localStorage

export function AnalysisSection() {
  const [prediction, setPrediction] = useState<PredictMarketTrendOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentChartImage, setCurrentChartImage] = useState<string | null>(null);
  const [currentChartFileName, setCurrentChartFileName] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();

  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('userTradingLevel') as UserLevel | null;
      if (savedLevel) {
        setUserLevel(savedLevel);
      } else {
        setShowSurveyModal(true);
      }
    }
  }, []);

  const handleSurveyComplete = (level: UserLevel) => {
    setUserLevel(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userTradingLevel', level);
    }
    setShowSurveyModal(false);
  };

  const addAnalysisToLocalStorage = (analysisResult: PredictMarketTrendOutput, chartImage: string, chartFileName?: string, extractedChartData?: string | null) => {
    if (typeof window === 'undefined') return;

    const newAnalysis: Analysis = {
      id: Date.now().toString(), // Simple unique ID
      imageUrl: chartImage,
      prediction: analysisResult,
      extractedData: extractedChartData,
      createdAt: new Date().toISOString(),
      chartFileName: chartFileName || `analysis-${Date.now()}`,
    };

    try {
      const historyString = localStorage.getItem('chartSightAnalysesHistory');
      let history: Analysis[] = historyString ? JSON.parse(historyString) : [];
      history.unshift(newAnalysis); // Add new analysis to the beginning
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS); // Keep only the latest N items
      }
      localStorage.setItem('chartSightAnalysesHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save analysis to localStorage:", e);
      toast({
        variant: 'destructive',
        title: 'History Error',
        description: 'Could not save analysis to local history.',
      });
    }
  };

  const handleImageAnalysis = async (file: File, dataUrl: string) => {
    if (!userLevel && typeof window !== 'undefined' && !localStorage.getItem('userTradingLevel')) {
      setShowSurveyModal(true);
      toast({
        variant: 'destructive',
        title: 'Assessment Required',
        description: 'Please complete the trading knowledge assessment before analyzing charts.',
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setCurrentError(null);
    setCurrentChartImage(dataUrl);
    setCurrentChartFileName(file.name);


    try {
      const chartDataInput = { chartImage: dataUrl };
      const extractedDataResult: ExtractChartDataOutput = await extractChartData(chartDataInput);
      
      if (!extractedDataResult) {
        throw new Error('Failed to get a response from the data extraction service.');
      }

      if (!extractedDataResult.isTradingChart) {
        const warning = extractedDataResult.warningMessage || 'The uploaded image is not a financial trading chart.';
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
      
      if (!extractedDataResult.imageQualitySufficient) {
        const qualityWarning = extractedDataResult.qualityWarningMessage || 'The image quality is insufficient for analysis.';
        setCurrentError(qualityWarning);
        setPrediction(null);
        toast({
            variant: 'destructive',
            title: 'Poor Image Quality',
            description: qualityWarning,
        });
        setIsLoading(false);
        return;
      }

      if (!extractedDataResult.extractedData && extractedDataResult.isTradingChart && extractedDataResult.imageQualitySufficient) {
        const dataWarning = 'Could not extract data from the chart, even if it is a trading chart with good quality. The AI may not have been able to process it.';
        setCurrentError(dataWarning);
        setPrediction(null);
        toast({
            variant: 'destructive',
            title: 'Data Extraction Failed',
            description: dataWarning,
        });
        setIsLoading(false);
        return;
      }
      
      const trendInput = { 
        extractedData: extractedDataResult.extractedData || "{}", // Ensure extractedData is a string, even if null from AI
        userLevel: userLevel || 'intermediate'
      };
      const trendPredictionResult: PredictMarketTrendOutput = await predictMarketTrend(trendInput);
      
      if (!trendPredictionResult) {
        throw new Error('Failed to predict market trend. The AI model may not have been able to process the extracted data.');
      }
      
      setPrediction(trendPredictionResult);
      addAnalysisToLocalStorage(trendPredictionResult, dataUrl, file.name, extractedDataResult.extractedData);

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
    <>
      <LevelAssessmentModal 
        isOpen={showSurveyModal} 
        onComplete={handleSurveyComplete} 
      />
      <div className="container mx-auto py-8 px-4 md:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ImageUploader onImageUpload={handleImageAnalysis} isProcessing={isLoading} />
          <div className="sticky top-20"> 
            {isLoading && !currentError && (
               <Card className="w-full shadow-lg">
                 <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <p className="text-lg font-medium text-muted-foreground">Performing enhanced analysis...</p>
                   <p className="text-sm text-muted-foreground">This may take a few moments, tailored for {userLevel || 'intermediate'} level.</p>
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
    </>
  );
}
