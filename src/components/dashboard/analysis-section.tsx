
'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from './image-uploader';
import { TrendDisplay } from './trend-display';
import { extractChartData, ExtractChartDataOutput } from '@/ai/flows/extract-chart-data';
import { predictMarketTrend, PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { useToast } from '@/hooks/use-toast';
// Card import removed as it's not directly used for layout here.
import { Loader2, AlertTriangle } from 'lucide-react';
import { LevelAssessmentModal } from '@/components/survey/LevelAssessmentModal';
import type { Analysis } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type UserLevel = 'beginner' | 'intermediate' | 'advanced';
const MAX_HISTORY_ITEMS = 20;
const MAX_FREE_ATTEMPTS = 2;

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
      if (savedLevel && ['beginner', 'intermediate', 'advanced'].includes(savedLevel)) {
        setUserLevel(savedLevel);
        setShowSurveyModal(false);
      }
    }
  }, []);

  const handleSurveyComplete = (level: UserLevel) => {
    setUserLevel(level);
    if (typeof window !== 'undefined') localStorage.setItem('userTradingLevel', level);
    setShowSurveyModal(false);
    toast({ title: "Assessment Complete!", description: `Your trading level: ${level}. You can now analyze charts.` });
  };

  const addAnalysisToLocalStorage = (analysisResult: PredictMarketTrendOutput, chartImage: string, chartFileName?: string, extractedChartData?: string | null) => {
    if (typeof window === 'undefined') return;
    const newAnalysis: Analysis = {
      id: Date.now().toString(), imageUrl: chartImage, prediction: analysisResult,
      extractedData: extractedChartData, createdAt: new Date().toISOString(),
      chartFileName: chartFileName || `analysis-${Date.now()}`,
    };
    try {
      const historyString = localStorage.getItem('chartSightAnalysesHistory');
      let history: Analysis[] = historyString ? JSON.parse(historyString) : [];
      history.unshift(newAnalysis); 
      if (history.length > MAX_HISTORY_ITEMS) history = history.slice(0, MAX_HISTORY_ITEMS); 
      localStorage.setItem('chartSightAnalysesHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save analysis to localStorage:", e);
      toast({ variant: 'destructive', title: 'History Error', description: 'Could not save analysis to local history.' });
    }
  };

  const handleImageAnalysis = async (file: File, dataUrl: string) => {
    let currentLevel = userLevel;
    if (typeof window !== 'undefined') {
        const savedLevel = localStorage.getItem('userTradingLevel') as UserLevel | null;
        if (!savedLevel) {
            setShowSurveyModal(true);
            toast({ variant: 'destructive', title: 'Assessment Required', description: 'Please complete assessment before analyzing.' });
            return;
        }
        currentLevel = savedLevel; setUserLevel(savedLevel);
    }

    if (typeof window !== 'undefined') {
        const isPremium = localStorage.getItem('isUserPremium') === 'true';
        if (!isPremium) {
            const attemptsString = localStorage.getItem('analysisAttempts');
            let attempts = attemptsString ? parseInt(attemptsString, 10) : 0;
            if (attempts >= MAX_FREE_ATTEMPTS) {
                toast({
                    variant: 'destructive', title: 'Free Limit Reached',
                    description: ( <div className="flex flex-col gap-1.5"> <p>Used all {MAX_FREE_ATTEMPTS} free attempts. Upgrade for unlimited.</p> <Button size="sm" asChild className="h-7 text-xs"> <Link href="/profile">Upgrade</Link> </Button> </div> ),
                    duration: 8000,
                }); return;
            }
        }
    }

    setIsLoading(true); setPrediction(null); setCurrentError(null);
    setCurrentChartImage(dataUrl); setCurrentChartFileName(file.name);

    try {
      const chartDataInput = { chartImage: dataUrl };
      const extractedDataResult: ExtractChartDataOutput = await extractChartData(chartDataInput);
      
      if (!extractedDataResult) throw new Error('Failed to get response from data extraction service.');
      if (!extractedDataResult.isTradingChart) {
        const warning = extractedDataResult.warningMessage || 'Uploaded image is not a financial trading chart.';
        setCurrentError(warning); setPrediction(null); 
        toast({ variant: 'destructive', title: 'Invalid Image', description: warning });
        setIsLoading(false); return;
      }
      if (!extractedDataResult.imageQualitySufficient) {
        const qualityWarning = extractedDataResult.qualityWarningMessage || 'Image quality insufficient for analysis.';
        setCurrentError(qualityWarning); setPrediction(null);
        toast({ variant: 'destructive', title: 'Poor Quality', description: qualityWarning });
        setIsLoading(false); return;
      }
      if (!extractedDataResult.extractedData && extractedDataResult.isTradingChart && extractedDataResult.imageQualitySufficient) {
        const dataWarning = 'Could not extract data from the chart.';
        setCurrentError(dataWarning); setPrediction(null);
        toast({ variant: 'destructive', title: 'Data Extraction Failed', description: dataWarning });
        setIsLoading(false); return;
      }
      
      const trendInput = { extractedData: extractedDataResult.extractedData || "{}", userLevel: currentLevel || 'intermediate' };
      const trendPredictionResult: PredictMarketTrendOutput = await predictMarketTrend(trendInput);
      
      if (!trendPredictionResult) throw new Error('Failed to predict market trend.');
      
      setPrediction(trendPredictionResult);
      addAnalysisToLocalStorage(trendPredictionResult, dataUrl, file.name, extractedDataResult.extractedData);

      if (typeof window !== 'undefined') {
        const isPremium = localStorage.getItem('isUserPremium') === 'true';
        if (!isPremium) {
            let attempts = parseInt(localStorage.getItem('analysisAttempts') || '0', 10) + 1;
            localStorage.setItem('analysisAttempts', attempts.toString());
             if (attempts === MAX_FREE_ATTEMPTS) toast({ title: "Last Free Attempt", description: "Upgrade for unlimited access.", action: (<Button size="sm" asChild className="h-7 text-xs"><Link href="/profile">Upgrade</Link></Button>), duration: 7000 });
             else if (attempts < MAX_FREE_ATTEMPTS) toast({ title: "Analysis Successful", description: `${MAX_FREE_ATTEMPTS - attempts} free attempts remaining.`, duration: 4000 });
        } else {
             toast({ title: "Analysis Successful!", description: "Premium insights generated.", duration: 4000 });
        }
      }

    } catch (error: any) {
      console.error('Analysis pipeline error:', error);
      let errorMessage = error.message || 'An unexpected error occurred.';
      setCurrentError(errorMessage); setPrediction(null);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LevelAssessmentModal isOpen={showSurveyModal} onComplete={handleSurveyComplete} />
      <div className="container mx-auto py-4 px-2 md:px-0"> {/* Simplified padding */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,450px] gap-4 items-start"> {/* Simplified gap and width */}
          <ImageUploader onImageUpload={handleImageAnalysis} isProcessing={isLoading} />
          <div className="sticky top-16"> {/* Simplified top */}
             <TrendDisplay 
                prediction={prediction} isLoading={isLoading} error={currentError} 
                currentChartImage={currentChartImage} userLevel={userLevel}
              />
          </div>
        </div>
      </div>
    </>
  );
}
