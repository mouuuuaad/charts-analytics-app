
'use client';

import type { PredictMarketTrendOutput } from '@/ai/flows/predict-market-trend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowUpCircle, ArrowDownCircle, MinusCircle, HelpCircle, 
  TrendingUp, TrendingDown, AlertTriangle, ShieldAlert, 
  LogIn, Target, StopCircle, Coins, OctagonX, CheckCircle2, ShieldQuestion,
  Loader2, Lightbulb, BarChartBig
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image'; // Added for image preview during loading

interface TrendDisplayProps {
  prediction: PredictMarketTrendOutput | null;
  isLoading: boolean;
  error?: string | null;
  currentChartImage?: string | null; // For preview during loading
  userLevel?: string | null; // For tailoring loading message
}

const RiskLevelIndicator: React.FC<{ level: 'low' | 'medium' | 'high' }> = ({ level }) => {
  switch (level) {
    case 'low':
      return <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600"><CheckCircle2 className="mr-1 h-4 w-4" />Low Risk</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600"><ShieldQuestion className="mr-1 h-4 w-4" />Medium Risk</Badge>;
    case 'high':
      return <Badge className="bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600"><ShieldAlert className="mr-1 h-4 w-4" />High Risk</Badge>;
    default:
      return <Badge variant="outline">{level}</Badge>;
  }
};

const LevelsList: React.FC<{ title: string; levels: string[]; icon?: React.ElementType }> = ({ title, levels, icon: Icon }) => {
  if (!levels || levels.length === 0) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-md font-semibold mb-1 text-foreground flex items-center">
          {Icon && <Icon className="mr-2 h-5 w-5 text-primary animate-float" />}
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">Not specified by AI.</p>
      </div>
    );
  }
  return (
    <div className="p-4 bg-muted/30 rounded-lg border">
      <h3 className="text-md font-semibold mb-2 text-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-5 w-5 text-primary animate-float" />}
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground pl-2">
        {levels.map((level, index) => (
          <li key={index} className="leading-relaxed">{level}</li>
        ))}
      </ul>
    </div>
  );
};


export function TrendDisplay({ prediction, isLoading, error, currentChartImage, userLevel }: TrendDisplayProps) {

  if (isLoading && !error) { // Enhanced loading state with tips
    return (
      <Card className="w-full shadow-xl border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Analyzing Your Chart...
          </CardTitle>
          <CardDescription>Our AI is diligently working. This may take a few moments, especially for complex charts. Tailored for <span className="font-semibold">{userLevel || 'intermediate'}</span> level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {currentChartImage && (
            <div className="my-4 p-3 border rounded-lg bg-background shadow-sm">
                <Image src={currentChartImage} alt="Processing chart" width={400} height={300} className="max-h-48 w-auto mx-auto rounded-md opacity-80 object-contain" data-ai-hint="chart diagram"/>
                <p className="text-xs text-center text-muted-foreground mt-2">Your uploaded chart</p>
            </div>
          )}
          <div className="p-4 bg-muted/40 rounded-lg border">
            <h4 className="font-semibold text-md mb-2 text-foreground flex items-center"><Lightbulb className="h-5 w-5 mr-2 text-yellow-500 animate-pulse" />Educational Tip</h4>
            <p className="text-sm text-muted-foreground">
              Always cross-reference AI analysis with your own research and understanding of market context. No single tool provides all the answers!
            </p>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg border">
            <h4 className="font-semibold text-md mb-2 text-foreground flex items-center"><BarChartBig className="h-5 w-5 mr-2 text-green-500" />Market Insight</h4>
            <p className="text-sm text-muted-foreground">
              Understanding candlestick patterns can offer valuable insights into potential price movements. Common patterns include Doji, Hammer, and Engulfing patterns.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">Patience is a virtue in trading, and in AI analysis!</p>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="w-full shadow-lg border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-destructive flex items-center">
            <AlertTriangle className="mr-3 h-7 w-7" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/10 p-4 rounded-md border border-destructive/30 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }


  if (!prediction) {
    return (
      <Card className="w-full shadow-xl border-border/20">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-2xl">Enhanced Market Analysis</CardTitle>
          <CardDescription>Upload or capture a chart for AI-powered insights, including risk assessment and potential trading levels.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[300px] pt-8">
          <HelpCircle className="w-20 h-20 text-muted-foreground/50 mb-6 animate-float" />
          <p className="text-lg text-muted-foreground">No analysis performed yet.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            The AI will provide trend predictions, confidence scores, risk assessments, and suggestions for entry, take-profit, and stop-loss levels.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isUp = prediction.trendPrediction === 'up';
  const isDown = prediction.trendPrediction === 'down';
  const isSideways = prediction.trendPrediction === 'sideways';
  const confidencePercent = Math.round(prediction.confidence * 100);

  let trendIcon, trendBadgeClasses, trendTextClass;

  if (isUp) {
    trendIcon = <ArrowUpCircle className="w-16 h-16 text-green-500" />;
    trendBadgeClasses = 'bg-green-500 hover:bg-green-600 text-white';
    trendTextClass = 'text-green-500 dark:text-green-400';
  } else if (isDown) {
    trendIcon = <ArrowDownCircle className="w-16 h-16 text-red-500" />;
    trendBadgeClasses = 'bg-red-500 hover:bg-red-600 text-white';
     trendTextClass = 'text-red-500 dark:text-red-400';
  } else { 
    trendIcon = <MinusCircle className="w-16 h-16 text-yellow-500" />;
    trendBadgeClasses = 'bg-yellow-500 hover:bg-yellow-600 text-black dark:text-yellow-900';
     trendTextClass = 'text-yellow-500 dark:text-yellow-400';
  }
  
  return (
    <Card className="w-full shadow-xl border-border/20">
      <CardHeader className="pb-4 bg-muted/20">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl">Market Analysis Result</CardTitle>
            <CardDescription>AI-powered insights tailored to your chart.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-3 py-4 border-b border-border/50 pb-6">
          {trendIcon}
          <Badge variant="outline" className={`text-xl px-6 py-3 rounded-lg shadow-md ${trendBadgeClasses}`}>
            Trend: {prediction.trendPrediction.toUpperCase()}
            {isUp && <TrendingUp className="ml-2 h-5 w-5" />}
            {isDown && <TrendingDown className="ml-2 h-5 w-5" />}
            {isSideways && <MinusCircle className="ml-2 h-5 w-5" />}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 items-center">
            <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex justify-between mb-1.5 items-baseline">
                    <span className="text-sm font-medium text-foreground">Confidence</span>
                    <span className={`text-lg font-semibold ${
                    confidencePercent >= 75 ? 'text-green-600 dark:text-green-400' : confidencePercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                    {confidencePercent}%
                    </span>
                </div>
                <Progress value={confidencePercent} className={`h-2.5 rounded-full ${
                    isUp ? (confidencePercent >= 75 ? '[&>div]:bg-green-500' : confidencePercent >=50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500') 
                        : isDown ? (confidencePercent >= 75 ? '[&>div]:bg-red-500' : confidencePercent >=50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500')
                        : '[&>div]:bg-yellow-500'
                }`} />
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border flex justify-center sm:justify-end">
                 <RiskLevelIndicator level={prediction.riskLevel} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LevelsList title="Entry Points" levels={prediction.suggestedEntryPoints} icon={LogIn} />
            <LevelsList title="Take Profit" levels={prediction.takeProfitLevels} icon={Coins} />
            <LevelsList title="Stop Loss" levels={prediction.stopLossLevels} icon={OctagonX} />
        </div>

        <div className="p-4 bg-muted/30 rounded-lg border">
          <h3 className="text-md font-semibold mb-1.5 text-foreground">Concise Reason:</h3>
          <p className="text-sm text-muted-foreground italic leading-relaxed">{prediction.reason || "No summary provided."}</p>
        </div>

        <div className="p-4 bg-background rounded-lg border shadow-inner">
          <h3 className="text-lg font-semibold mb-2.5 text-foreground">Detailed Analysis Breakdown:</h3>
          <div className="text-sm text-muted-foreground space-y-3 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
            {(prediction.analysisDetails || "No detailed analysis provided.").split('\n').map((paragraph, index) => (
              paragraph.trim() ? <p key={index}>{paragraph}</p> : null
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 p-4 mt-2">
        <p className="text-xs text-muted-foreground text-center w-full leading-relaxed">
          <strong>Disclaimer:</strong> Trading financial markets involves significant risk. The information provided by ChartSight AI is for educational and informational purposes only and should not be considered financial advice or a guarantee of future results. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results.
        </p>
      </CardFooter>
    </Card>
  );
}
