'use client';

import type { PredictMarketTrendOutput, TrendAnalysisDetails, CandlestickPatternInfo, VolumeAndMomentumInfo, RiskRewardAnalysis, StrategySessionOutput } from '@/types';
import { generateStrategySession } from '@/ai/flows/generate-strategy-flow';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle, CheckCircle2, Eye, HelpCircle, ListChecks, Loader2, MinusCircle, ShieldAlert, ShieldCheck, ShieldQuestion, Target, TrendingDown, TrendingUp, Maximize, BarChartHorizontal, Activity, Wind, CandlestickChart, BookOpen, BookHeart, Bot, ChevronsUpDown, Scaling, Brain
} from 'lucide-react';
import React, { useState } from 'react';
import { cn } from "@/lib/utils";

interface TrendDisplayProps {
  prediction: PredictMarketTrendOutput | null;
  isLoading: boolean;
  error?: string | null;
  currentChartImage?: string | null;
  userLevel?: string | null;
}

const TrendIcon: React.FC<{ trend: PredictMarketTrendOutput['trendPrediction'] | TrendAnalysisDetails['direction'] }> = ({ trend }) => {
  const normalizedTrend = typeof trend === 'string' ? trend.toLowerCase() : 'neutral';
  switch (normalizedTrend) {
    case 'up': case 'uptrend': return <TrendingUp className="w-5 h-5 text-success" />;
    case 'down': case 'downtrend': return <TrendingDown className="w-5 h-5 text-destructive" />;
    case 'sideways': return <MinusCircle className="w-5 h-5 text-warning" />;
    case 'neutral': return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
    default: return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
  }
};

const RecommendationIcon: React.FC<{ recommendation: PredictMarketTrendOutput['tradingRecommendation'], className?: string }> = ({ recommendation, className }) => {
  switch (recommendation) {
    case 'buy': return <CheckCircle2 className={cn("w-3.5 h-3.5", className)} />;
    case 'hold': return <Eye className={cn("w-3.5 h-3.5", className)} />;
    case 'avoid': return <ShieldAlert className={cn("w-3.5 h-3.5", className)} />;
    case 'neutral': return <HelpCircle className={cn("w-3.5 h-3.5", className)} />;
    default: return <HelpCircle className={cn("w-3.5 h-3.5", className)} />;
  }
};

const RiskLevelBadge: React.FC<{ level: PredictMarketTrendOutput['riskLevel'] }> = ({ level }) => {
  let Icon = ShieldQuestion;
  let text = "Unknown Risk";
  let className = "border-muted-foreground text-muted-foreground";
  switch (level) {
    case 'low': 
      Icon = ShieldCheck; 
      text = "Low Risk"; 
      className="border-success/80 text-success";
      break;
    case 'medium': 
      Icon = ShieldQuestion; 
      text = "Medium Risk"; 
      className="border-warning/80 text-warning";
      break;
    case 'high': 
      Icon = ShieldAlert; 
      text = "High Risk"; 
      className="border-destructive/80 text-destructive";
      break;
  }
  return <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", className)}><Icon className="mr-1 h-3 w-3" />{text}</Badge>;
};


const VolatilityBadge: React.FC<{ level?: PredictMarketTrendOutput['volatilityLevel'] }> = ({ level }) => {
  if (!level || level === 'normal') return null;
  let text = `Volatility: ${level.charAt(0).toUpperCase() + level.slice(1)}`;
  if (level === 'low') text = "Low Volatility";
  else if (level === 'high') text = `High Volatility`;
  else if (level === 'extreme') text = `Extreme Volatility!`;
  return <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-info text-info-foreground"><Wind className="mr-1 h-3 w-3" />{text}</Badge>;
};

const TradeAssessmentBar: React.FC<{ assessment: RiskRewardAnalysis['tradeAssessment'] }> = ({ assessment }) => {
  let barColor = 'bg-muted-foreground';
  let text = 'Neutral';
  let width = 'w-1/2'; 

  switch (assessment) {
    case 'Good': barColor = 'bg-success'; text = 'Good'; width = 'w-full'; break;
    case 'Medium': barColor = 'bg-warning'; text = 'Medium'; width = 'w-2/3'; break;
    case 'Bad': barColor = 'bg-destructive'; text = 'Bad'; width = 'w-1/3'; break;
    case 'Neutral': barColor = 'bg-muted-foreground'; text = 'Neutral'; width = 'w-1/2'; break;
  }
  return (
    <div>
        <div className="flex justify-between items-center mb-0.5">
            <Label className="text-xs text-muted-foreground">Trade Setup Assessment</Label>
            <span className="text-xs font-semibold">{text}</span>
        </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden border">
        <div className={`h-full rounded-full ${barColor} ${width} transition-all duration-300`}></div>
      </div>
    </div>
  );
};


export function TrendDisplay({ prediction, isLoading, error, currentChartImage, userLevel }: TrendDisplayProps) {
  const [strategy, setStrategy] = useState<StrategySessionOutput | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showFullAnalysisModal, setShowFullAnalysisModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const { toast } = useToast();

  const handleGenerateStrategy = async () => {
    if (!prediction) return;
      
    setShowStrategyModal(true);
    if (strategy && !isLoadingStrategy) return;

    setIsLoadingStrategy(true);
    setStrategy(null);
    try {
      const strategyResult = await generateStrategySession(prediction);
      if (!strategyResult) throw new Error("The AI returned an empty or invalid strategy.");
      setStrategy(strategyResult);
    } catch (strategyError: any) {
      console.error("Strategy session generation failed:", strategyError);
      toast({ 
          variant: 'destructive', 
          title: 'Strategy Error', 
          description: strategyError.message || "Could not generate the AI strategy session." 
      });
      setShowStrategyModal(false);
    } finally {
      setIsLoadingStrategy(false);
    }
  };

  if (isLoading && !error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-md flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Analyzing Chart...
          </CardTitle>
          <CardDescription className="text-xs">Tailoring insights for {userLevel || 'default'} level. This may take a moment for deep analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 px-3 pb-3">
          {currentChartImage && (
            <div className="my-2 p-1.5 border rounded bg-muted aspect-video flex items-center justify-center">
                <img src={currentChartImage} alt="Processing chart" className="max-h-full max-w-full object-contain rounded-sm" data-ai-hint="chart diagram"/>
            </div>
          )}
          <div className="p-2 border rounded text-xs text-muted-foreground bg-accent/30">
            AI is performing in-depth technical analysis, including trend assessment, candlestick patterns, volume, and momentum indicators.
          </div>
        </CardContent>
        <CardFooter className="p-2">
          <p className="text-xs text-muted-foreground text-center w-full">Generating scientific insights...</p>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="w-full border-destructive bg-destructive/10 p-3">
          <CardTitle className="text-sm font-medium flex items-center text-destructive">
            <AlertTriangle className="mr-1.5 h-4 w-4" /> Analysis Error
          </CardTitle>
          <p className="text-sm mt-1">{error}</p>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="w-full p-3">
        <CardHeader className="pb-2 pt-0 px-0">
          <CardTitle className="text-md">Financial AI Analysis Module</CardTitle>
          <CardDescription className="text-xs">Upload a chart image for deep AI technical analysis.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[200px] pt-3">
          <BarChartHorizontal className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Awaiting chart data for analysis.</p>
          <p className="text-xs text-muted-foreground mt-1">The AI will assess trends, patterns, volume, momentum, and risk/reward.</p>
        </CardContent>
      </Card>
    );
  }

  const recommendation = prediction.tradingRecommendation;
  const recommendationBgClasses = {
      buy: 'bg-success/10 border-success/30',
      avoid: 'bg-destructive/10 border-destructive/30',
      hold: 'bg-warning/10 border-warning/30',
      neutral: 'bg-warning/10 border-warning/30',
  }[recommendation] || 'bg-muted/30 border-border';

  const recommendationTextClasses = {
      buy: 'text-success',
      avoid: 'text-destructive',
      hold: 'text-warning',
      neutral: 'text-warning',
  }[recommendation] || 'text-foreground';
  
  const confidenceColorClass = prediction.confidence > 0.7 ? 'bg-success' : prediction.confidence > 0.4 ? 'bg-warning' : 'bg-destructive';

  return (
    <>
    <Card className="w-full border-0 shadow-lg backdrop-blur-sm bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 overflow-hidden">
      <CardHeader className={cn("pb-3 pt-4 px-4 relative overflow-hidden", recommendationBgClasses, "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700")}>
        <div className="flex justify-between items-center relative z-10">
            <CardTitle className={cn("text-lg font-bold flex items-center gap-2", recommendationTextClasses, "drop-shadow-sm")}>
                <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                    <RecommendationIcon recommendation={recommendation} className="text-current w-5 h-5"/>
                </div>
                <span className="capitalize tracking-wide">{recommendation}</span>
            </CardTitle>
            {currentChartImage && (
                <Dialog open={showChartModal} onOpenChange={setShowChartModal}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-current hover:bg-white/20 dark:hover:bg-black/20 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-2 border-0 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
                        <DialogHeader className="sr-only"><DialogTitle>Chart Preview</DialogTitle></DialogHeader>
                        <img src={currentChartImage} alt="Chart Preview" className="rounded-xl object-contain max-h-[80vh] w-full shadow-lg" data-ai-hint="chart financial"/>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        <CardDescription className="text-sm mt-3 text-gray-600 dark:text-gray-300 font-medium relative z-10">
            {prediction.explanationSummary || "No concise summary provided."}
        </CardDescription>
         <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/30 dark:border-gray-700/50 relative z-10">
            <RiskLevelBadge level={prediction.riskLevel} />
            <VolatilityBadge level={prediction.volatilityLevel} />
        </div>
        <div className="mt-4 relative z-10">
            <Label htmlFor="confidenceScore" className="text-sm text-gray-600 dark:text-gray-300 font-semibold">Confidence: {Math.round(prediction.confidence * 100)}%</Label>
            <Progress value={prediction.confidence * 100} id="confidenceScore" className="h-2 mt-2 bg-white/30 dark:bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden"
             indicatorClassName={cn(confidenceColorClass, "transition-all duration-500 ease-out rounded-full shadow-sm")} />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-sm bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
        
        <Accordion type="multiple" defaultValue={["trend-detection", "risk-reward"]} className="w-full space-y-2">
            <AccordionItem value="trend-detection" className="border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3 px-4 rounded-xl data-[state=open]:bg-gradient-to-r data-[state=open]:from-blue-50/80 data-[state=open]:to-indigo-50/80 dark:data-[state=open]:from-blue-900/30 dark:data-[state=open]:to-indigo-900/30 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2"><ChevronsUpDown className="h-4 w-4" />Trend Detection</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3 px-4 text-sm space-y-3 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/10">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm">
                        <TrendIcon trend={prediction.trendAnalysis.direction} />
                        <span className="font-bold text-base">{prediction.trendAnalysis.direction}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">(basis: {prediction.trendAnalysis.candleCountBasis} candles)</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed"><span className="font-semibold text-gray-900 dark:text-gray-100">Visuals:</span> {prediction.trendAnalysis.trendlineDescription}</p>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="candlestick-analysis" className="border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3 px-4 rounded-xl data-[state=open]:bg-gradient-to-r data-[state=open]:from-green-50/80 data-[state=open]:to-emerald-50/80 dark:data-[state=open]:from-green-900/30 dark:data-[state=open]:to-emerald-900/30 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2"><CandlestickChart className="h-4 w-4" />Candlestick Analysis</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3 px-4 text-sm space-y-3 bg-gradient-to-b from-green-50/30 to-transparent dark:from-green-900/10">
                    {prediction.candlestickAnalysis.summary && <p className="italic text-gray-600 dark:text-gray-300 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-l-4 border-green-400">{prediction.candlestickAnalysis.summary}</p>}
                    {prediction.candlestickAnalysis.patterns.length > 0 ? (
                        prediction.candlestickAnalysis.patterns.map((p, i) => (
                            <div key={i} className={`p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-md ${p.isStatisticallyWeakOrNeutral ? 'border-dashed border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-600' : 'border-green-300 bg-green-50/60 dark:bg-green-900/20 dark:border-green-600'}`}>
                                <span className="font-bold text-base">{p.name}</span> <span className="text-gray-500">({p.candleCount} candles)</span>
                                <p className="mt-1 text-gray-700 dark:text-gray-200">{p.implications}</p>
                                {p.isStatisticallyWeakOrNeutral && <span className="text-amber-600 dark:text-amber-400 text-sm mt-1 block"> (Considered weak/neutral in context)</span>}
                            </div>
                        ))
                    ) : <p className="text-gray-500 dark:text-gray-400 p-3 rounded-lg bg-gray-100/60 dark:bg-gray-700/60 text-center">No specific strong candlestick patterns identified recently.</p>}
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="volume-momentum" className="border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3 px-4 rounded-xl data-[state=open]:bg-gradient-to-r data-[state=open]:from-purple-50/80 data-[state=open]:to-violet-50/80 dark:data-[state=open]:from-purple-900/30 dark:data-[state=open]:to-violet-900/30 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2"><Activity className="h-4 w-4" />Volume & Momentum</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3 px-4 text-sm space-y-3 bg-gradient-to-b from-purple-50/30 to-transparent dark:from-purple-900/10">
                    <div className="space-y-2">
                        <p className="p-2 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm"><span className="font-bold">Volume:</span> {prediction.volumeAndMomentum.volumeStatus}. {prediction.volumeAndMomentum.volumeInterpretation}</p>
                        <p className="p-2 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm"><span className="font-bold">RSI Est:</span> {prediction.volumeAndMomentum.rsiEstimate}</p>
                        <p className="p-2 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm"><span className="font-bold">MACD Est:</span> {prediction.volumeAndMomentum.macdEstimate}</p>
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="risk-reward" className="border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3 px-4 rounded-xl data-[state=open]:bg-gradient-to-r data-[state=open]:from-orange-50/80 data-[state=open]:to-red-50/80 dark:data-[state=open]:from-orange-900/30 dark:data-[state=open]:to-red-900/30 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2"><Scaling className="h-4 w-4" />Risk/Reward Analysis</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3 px-4 text-sm space-y-4 bg-gradient-to-b from-orange-50/30 to-transparent dark:from-orange-900/10">
                    <TradeAssessmentBar assessment={prediction.riskRewardDetails.tradeAssessment} />
                    <p className="text-gray-600 dark:text-gray-300 text-center text-sm p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-l-4 border-orange-400">{prediction.riskRewardDetails.assessmentReasoning}</p>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
                            <Label className="block text-blue-700 dark:text-blue-300 text-sm font-semibold mb-2">Entry</Label>
                            {prediction.suggestedEntryPoints.map((ep,i)=><p key={i} className="font-bold text-sm leading-tight text-blue-900 dark:text-blue-100">{ep}</p>)}
                            {prediction.suggestedEntryPoints.length === 0 && <p className="font-bold text-sm text-gray-400">-</p>}
                        </div>
                        <div className="p-3 rounded-xl bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50">
                            <Label className="block text-green-700 dark:text-green-300 text-sm font-semibold mb-2">Take Profit</Label>
                             {prediction.takeProfitLevels.map((tp,i)=><p key={i} className="font-bold text-green-600 dark:text-green-400 text-sm leading-tight">{tp}</p>)}
                             {prediction.takeProfitLevels.length === 0 && <p className="font-bold text-sm text-gray-400">-</p>}
                        </div>
                        <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50">
                            <Label className="block text-red-700 dark:text-red-300 text-sm font-semibold mb-2">Stop Loss</Label>
                            {prediction.stopLossLevels.map((sl,i)=><p key={i} className="font-bold text-red-600 dark:text-red-400 text-sm leading-tight">{sl}</p>)}
                            {prediction.stopLossLevels.length === 0 && <p className="font-bold text-sm text-gray-400">-</p>}
                        </div>
                    </div>
                    {prediction.rewardRiskRatio && (
                        <div className="text-center p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50">
                            <Label className="text-indigo-700 dark:text-indigo-300 text-sm font-semibold">Reward:Risk Ratio</Label>
                            <p className="font-bold text-lg mt-1 text-indigo-900 dark:text-indigo-100">{prediction.rewardRiskRatio.reward.toFixed(2)} : {prediction.rewardRiskRatio.risk.toFixed(2)}</p>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
            
            {prediction.islamicFinanceConsiderations && (
              <AccordionItem value="islamic-finance" className="border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3 px-4 rounded-xl data-[state=open]:bg-gradient-to-r data-[state=open]:from-teal-50/80 data-[state=open]:to-cyan-50/80 dark:data-[state=open]:from-teal-900/30 dark:data-[state=open]:to-cyan-900/30 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center gap-2"><BookHeart className="h-4 w-4" />Ethical & Islamic Principles</div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3 px-4 text-sm bg-gradient-to-b from-teal-50/30 to-transparent dark:from-teal-900/10">
                      <p className="whitespace-pre-line text-gray-600 dark:text-gray-300 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-l-4 border-teal-400 leading-relaxed">{prediction.islamicFinanceConsiderations}</p>
                  </AccordionContent>
              </AccordionItem>
            )}
        </Accordion>
      </CardContent>

      <CardFooter className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col space-y-3 bg-gradient-to-t from-gray-50/80 to-transparent dark:from-gray-800/80">
        <Button size="sm" className="w-full text-sm h-10 font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200" onClick={handleGenerateStrategy} disabled={isLoadingStrategy}>
            {isLoadingStrategy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            {isLoadingStrategy ? 'Generating Strategy...' : 'AI Strategy Session'}
        </Button>
        <Button size="sm" variant="outline" className="w-full text-sm h-9 font-medium rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200" onClick={() => setShowFullAnalysisModal(true)}>
            <BookOpen className="mr-2 h-4 w-4" /> Detailed Explanation
        </Button>
      </CardFooter>
    </Card>
     <p className="text-xs text-gray-500 dark:text-gray-400 text-center w-full mt-3 px-2 leading-relaxed">
        <strong>Disclaimer:</strong> AI analysis for educational purposes. Not financial advice. Trading involves risk. DYOR.
    </p>

    <Dialog open={showFullAnalysisModal} onOpenChange={setShowFullAnalysisModal}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
                <DialogTitle className="text-lg flex items-center"><BookOpen className="h-5 w-5 mr-2 text-primary"/>Full Scientific AI Analysis</DialogTitle>
                <DialogDescription className="text-xs">
                    User Level Context: <Badge variant="outline" className="text-xs px-1">{userLevel || 'Intermediate'}</Badge>
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-3 text-xs">
                 <div className="prose prose-xs max-w-none dark:prose-invert whitespace-pre-line" dangerouslySetInnerHTML={{ __html: prediction.fullScientificAnalysis.replace(/\\n/g, '<br />') }} />
            </ScrollArea>
            <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline" size="sm">Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl flex items-center"><Bot className="h-6 w-6 mr-2 text-primary"/>AI Strategy Session</DialogTitle>
                <DialogDescription>
                    Your distilled action plan for this trade.
                </DialogDescription>
            </DialogHeader>
            {isLoadingStrategy ? (
                <div className="min-h-[200px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : strategy ? (
                <ScrollArea className="max-h-[70vh] pr-3 text-sm">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center"><Target className="h-4 w-4 mr-2 text-success"/>Primary Signal</h4>
                            <div className="p-2 border-l-4 border-success bg-muted/50 rounded-r-md">
                                <p className="font-bold text-base">{strategy.primarySignal.title}</p>
                                <p className="text-xs text-muted-foreground">{strategy.primarySignal.description}</p>
                            </div>
                        </div>

                        {strategy.conflictingSignals.length > 0 && (
                            <div className="space-y-1">
                                <h4 className="font-semibold flex items-center"><ShieldAlert className="h-4 w-4 mr-2 text-destructive"/>Risks & Conflicting Signals</h4>
                                <ul className="space-y-1 text-xs">
                                    {strategy.conflictingSignals.map((signal, index) => (
                                        <li key={index} className="p-2 border rounded-md">
                                            <p className="font-semibold">{signal.title}</p>
                                            <p className="text-muted-foreground">{signal.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center"><ListChecks className="h-4 w-4 mr-2 text-primary"/>Action Plan</h4>
                            <ol className="space-y-2 text-xs list-inside">
                                {strategy.actionPlan.map(item => (
                                    <li key={item.step} className="flex">
                                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground font-bold text-xs mr-2 shrink-0">{item.step}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.instruction}</p>
                                            <p className="text-muted-foreground italic">Rationale: {item.rationale}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        
                        <div className="space-y-1 pt-2 border-t">
                            <h4 className="font-semibold flex items-center"><Brain className="h-4 w-4 mr-2"/>Psychological Briefing</h4>
                            <div className="p-2 border rounded-md text-xs bg-accent/30">
                                <p className="font-bold">{strategy.psychologicalBriefing.title}</p>
                                <p className="mt-1">{strategy.psychologicalBriefing.advice}</p>
                                <div className="mt-2 pt-2 border-t border-dashed flex items-start">
                                    <BookHeart className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0"/>
                                    <div>
                                        <p className="font-semibold">{strategy.psychologicalBriefing.islamicPrinciple.name}</p>
                                        <p className="text-muted-foreground">{strategy.psychologicalBriefing.islamicPrinciple.application}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            ) : null }
            <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline" size="sm">Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}


const ScrollArea: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("overflow-y-auto", className)}>{children}</div>
);