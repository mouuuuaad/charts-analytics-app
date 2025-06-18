
'use client';

import type { PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { translateText, TranslateTextInput, TranslateTextOutput } from '@/ai/flows/translate-text-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpCircle, ArrowDownCircle, MinusCircle, HelpCircle, 
  TrendingUp, TrendingDown, AlertTriangle, ShieldAlert, 
  LogIn, Target, StopCircle, Coins, OctagonX, CheckCircle2, ShieldQuestion, Languages, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TrendDisplayProps {
  prediction: PredictMarketTrendOutput | null;
  isLoading: boolean;
  error?: string | null;
}

const languageOptions = [
  { value: 'en', label: 'English (Original)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'zh-CN', label: '简体中文 (Simplified Chinese)' },
];

const RiskLevelIndicator: React.FC<{ level: 'low' | 'medium' | 'high' }> = ({ level }) => {
  switch (level) {
    case 'low':
      return <Badge className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 className="mr-1 h-4 w-4" />Low Risk</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black"><ShieldQuestion className="mr-1 h-4 w-4" />Medium Risk</Badge>;
    case 'high':
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white"><ShieldAlert className="mr-1 h-4 w-4" />High Risk</Badge>;
    default:
      return <Badge variant="outline">{level}</Badge>;
  }
};

const LevelsList: React.FC<{ title: string; levels: string[]; icon?: React.ElementType }> = ({ title, levels, icon: Icon }) => {
  if (!levels || levels.length === 0) {
    return (
      <div>
        <h3 className="text-md font-semibold mb-1 text-foreground flex items-center">
          {Icon && <Icon className="mr-2 h-5 w-5 text-primary" />}
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">Not specified.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-md font-semibold mb-2 text-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-5 w-5 text-primary" />}
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border">
        {levels.map((level, index) => (
          <li key={index}>{level}</li>
        ))}
      </ul>
    </div>
  );
};


export function TrendDisplay({ prediction, isLoading, error }: TrendDisplayProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [displayedAnalysisDetails, setDisplayedAnalysisDetails] = useState<string | null>(null);
  const [displayedReason, setDisplayedReason] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (prediction) {
      setDisplayedAnalysisDetails(prediction.analysisDetails);
      setDisplayedReason(prediction.reason);
      setSelectedLanguage('en'); // Reset language to original on new prediction
      setTranslationError(null);
    } else {
      setDisplayedAnalysisDetails(null);
      setDisplayedReason(null);
    }
  }, [prediction]);

  const handleTranslate = async () => {
    if (!prediction) return;

    if (selectedLanguage === 'en') {
      setDisplayedAnalysisDetails(prediction.analysisDetails);
      setDisplayedReason(prediction.reason);
      setTranslationError(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const detailsToTranslate = prediction.analysisDetails || "";
      const reasonToTranslate = prediction.reason || "";

      const [translatedDetailsResult, translatedReasonResult] = await Promise.all([
        translateText({ textToTranslate: detailsToTranslate, targetLanguageCode: selectedLanguage }),
        translateText({ textToTranslate: reasonToTranslate, targetLanguageCode: selectedLanguage })
      ]);

      if (translatedDetailsResult?.translatedText) {
        setDisplayedAnalysisDetails(translatedDetailsResult.translatedText);
      } else {
        // Fallback or specific error if details translation fails to produce text
         setDisplayedAnalysisDetails(detailsToTranslate); // Revert to original or previous
         throw new Error('Failed to translate analysis details meaningfully.');
      }
       if (translatedReasonResult?.translatedText) {
        setDisplayedReason(translatedReasonResult.translatedText);
      } else {
        // Fallback or specific error if reason translation fails to produce text
        setDisplayedReason(reasonToTranslate); // Revert to original or previous
        throw new Error('Failed to translate reason meaningfully.');
      }

    } catch (err: any) {
      console.error('Translation error:', err);
      const errorMessage = err.message || 'An error occurred during translation.';
      setTranslationError(errorMessage);
      setDisplayedAnalysisDetails(prediction.analysisDetails); // Revert to original on error
      setDisplayedReason(prediction.reason); // Revert to original on error
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: errorMessage,
      });
    } finally {
      setIsTranslating(false);
    }
  };


  if (isLoading) {
    return (
      <Card className="w-full shadow-lg animate-pulse">
        <CardHeader>
          <div className="h-7 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-16 w-16 bg-muted rounded-full"></div>
            <div className="h-10 bg-muted rounded w-28"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-5 bg-muted rounded w-1/4"></div>
              <div className="h-5 bg-muted rounded w-1/5"></div>
            </div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-10 bg-muted rounded w-full"></div>
            </div>
          ))}
        </CardContent>
         <CardFooter>
          <div className="h-6 bg-muted rounded w-full"></div>
        </CardFooter>
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
          <CardTitle className="font-headline text-2xl">Enhanced Market Analysis</CardTitle>
          <CardDescription>Upload a chart image for AI-powered insights, including risk assessment and trading levels.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[300px]">
          <HelpCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No analysis performed yet.</p>
          <p className="text-xs text-muted-foreground mt-2">The AI will provide trend, confidence, risk, entry points, take profit, and stop loss.</p>
        </CardContent>
      </Card>
    );
  }

  const isUp = prediction.trendPrediction === 'up';
  const isDown = prediction.trendPrediction === 'down';
  const isSideways = prediction.trendPrediction === 'sideways';
  const confidencePercent = Math.round(prediction.confidence * 100);

  let trendIcon, trendBadgeColor, trendTextClass;

  if (isUp) {
    trendIcon = <ArrowUpCircle className="w-16 h-16 text-green-500" />;
    trendBadgeColor = 'bg-green-500 hover:bg-green-600';
    trendTextClass = 'text-green-500';
  } else if (isDown) {
    trendIcon = <ArrowDownCircle className="w-16 h-16 text-red-500" />;
    trendBadgeColor = 'bg-red-500 hover:bg-red-600';
    trendTextClass = 'text-red-500';
  } else { // Sideways
    trendIcon = <MinusCircle className="w-16 h-16 text-yellow-500" />;
    trendBadgeColor = 'bg-yellow-500 hover:bg-yellow-600 text-black';
     trendTextClass = 'text-yellow-500';
  }
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl">Enhanced Market Analysis</CardTitle>
            <CardDescription>AI-powered insights with risk assessment and trading levels.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px]" aria-label="Select language">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleTranslate} 
              disabled={isTranslating || (selectedLanguage === 'en' && displayedAnalysisDetails === prediction.analysisDetails && displayedReason === prediction.reason)}
            >
              {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Translate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {translationError && (
          <div className="p-3 bg-destructive/10 text-destructive border border-destructive rounded-md">
            <p>Translation Error: {translationError}</p>
          </div>
        )}
        <div className="flex flex-col items-center space-y-3">
          {trendIcon}
          <Badge variant={isUp ? "default" : isDown ? "destructive" : "secondary"} className={`text-xl px-4 py-2 ${trendBadgeColor} text-white`}>
            Trend: {prediction.trendPrediction.toUpperCase()}
            {isUp && <TrendingUp className="ml-2 h-5 w-5" />}
            {isDown && <TrendingDown className="ml-2 h-5 w-5" />}
            {isSideways && <MinusCircle className="ml-2 h-5 w-5" />}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
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
                        : isDown ? (confidencePercent >= 75 ? '[&>div]:bg-red-500' : confidencePercent >=50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500')
                        : '[&>div]:bg-yellow-500' // Sideways confidence color
                }`} />
            </div>
            <div className="text-right">
                 <RiskLevelIndicator level={prediction.riskLevel} />
            </div>
        </div>
        
        <LevelsList title="Suggested Entry Points" levels={prediction.suggestedEntryPoints} icon={LogIn} />
        <LevelsList title="Take Profit Levels" levels={prediction.takeProfitLevels} icon={Coins} />
        <LevelsList title="Stop Loss Levels" levels={prediction.stopLossLevels} icon={OctagonX} />

        <div>
          <h3 className="text-md font-semibold mb-1 text-foreground">Summary:</h3>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border italic">{displayedReason || "No summary provided."}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Detailed Analysis:</h3>
          <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md border prose prose-sm max-w-none">
            {(displayedAnalysisDetails || "No detailed analysis provided.").split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          <strong>Disclaimer:</strong> Trading involves significant risk of loss and is not suitable for all investors. The information provided by ChartSight AI is for educational and informational purposes only and should not be considered financial advice. Past performance is not indicative of future results. Always conduct your own research and consult with a qualified financial advisor before making any trading decisions.
        </p>
      </CardFooter>
    </Card>
  );
}

