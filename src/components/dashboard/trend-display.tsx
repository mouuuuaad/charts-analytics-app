'use client';

import type { PredictMarketTrendOutput, TrendAnalysisDetails, CandlestickPatternInfo, VolumeAndMomentumInfo, RiskRewardAnalysis } from '@/types'; // Updated import
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, CheckCircle2, Eye, HelpCircle, ListChecks, Loader2, LogIn, MinusCircle, OctagonX, ShieldAlert, ShieldCheck, ShieldQuestion, Target, TrendingDown, TrendingUp, ZoomIn, Edit3, DollarSign, Info, Brain, ChevronsUpDown, Maximize, BarChartHorizontal, Users, Activity, Wind, CandlestickChart, BookOpen, Scaling
} from 'lucide-react';
import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from "@/lib/utils"; // Added import for cn

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
    case 'up': case 'uptrend': return <TrendingUp className="w-5 h-5 text-green-500" />;
    case 'down': case 'downtrend': return <TrendingDown className="w-5 h-5 text-red-500" />;
    case 'sideways': return <MinusCircle className="w-5 h-5 text-yellow-500" />;
    case 'neutral': return <HelpCircle className="w-5 h-5 text-gray-500" />;
    default: return <HelpCircle className="w-5 h-5 text-gray-500" />;
  }
};

const RecommendationIcon: React.FC<{ recommendation: PredictMarketTrendOutput['tradingRecommendation'] }> = ({ recommendation }) => {
  switch (recommendation) {
    case 'buy': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    case 'hold': return <Eye className="w-3.5 h-3.5 text-yellow-600" />;
    case 'avoid': return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
    case 'neutral': return <HelpCircle className="w-3.5 h-3.5 text-gray-500" />;
    default: return <HelpCircle className="w-3.5 h-3.5 text-gray-500" />;
  }
};

const RiskLevelBadge: React.FC<{ level: PredictMarketTrendOutput['riskLevel'] }> = ({ level }) => {
  let Icon = ShieldQuestion; let text = "Unknown Risk"; let color = "text-gray-500 border-gray-400";
  switch (level) {
    case 'low': Icon = ShieldCheck; text = "Low Risk"; color="text-green-600 border-green-500 bg-green-50"; break;
    case 'medium': Icon = ShieldQuestion; text = "Medium Risk"; color="text-yellow-600 border-yellow-500 bg-yellow-50"; break;
    case 'high': Icon = ShieldAlert; text = "High Risk"; color="text-red-600 border-red-500 bg-red-50"; break;
  }
  return <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${color}`}><Icon className="mr-1 h-3 w-3" />{text}</Badge>;
};

const VolatilityBadge: React.FC<{ level?: PredictMarketTrendOutput['volatilityLevel'] }> = ({ level }) => {
  if (!level || level === 'normal') return null;
  let text = `Volatility: ${level.charAt(0).toUpperCase() + level.slice(1)}`;
  let color = "text-gray-500 border-gray-400";
  if (level === 'low') { text = "Low Volatility"; color="text-sky-600 border-sky-500 bg-sky-50"; }
  else if (level === 'high') { text = `High Volatility`; color="text-orange-600 border-orange-500 bg-orange-50"; }
  else if (level === 'extreme') { text = `Extreme Volatility!`; color="text-red-700 border-red-600 bg-red-100"; }
  return <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${color}`}><Wind className="mr-1 h-3 w-3" />{text}</Badge>;
};

const TradeAssessmentBar: React.FC<{ assessment: RiskRewardAnalysis['tradeAssessment'] }> = ({ assessment }) => {
  let barColor = 'bg-gray-300';
  let text = 'Neutral';
  let width = 'w-1/2'; // Default for neutral/medium

  switch (assessment) {
    case 'Good': barColor = 'bg-green-500'; text = 'Good'; width = 'w-full'; break;
    case 'Medium': barColor = 'bg-yellow-500'; text = 'Medium'; width = 'w-2/3'; break;
    case 'Bad': barColor = 'bg-red-500'; text = 'Bad'; width = 'w-1/3'; break;
    case 'Neutral': barColor = 'bg-slate-400'; text = 'Neutral'; width = 'w-1/2'; break;
  }
  return (
    <div>
        <div className="flex justify-between items-center mb-0.5">
            <Label className="text-xs text-muted-foreground">Trade Setup Assessment</Label>
            <span className={`text-xs font-semibold ${assessment === 'Good' ? 'text-green-600' : assessment === 'Medium' ? 'text-yellow-600' : assessment === 'Bad' ? 'text-red-600' : 'text-slate-500'}`}>{text}</span>
        </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden border">
        <div className={`h-full rounded-full ${barColor} ${width} transition-all duration-300`}></div>
      </div>
    </div>
  );
};


export function TrendDisplay({ prediction, isLoading, error, currentChartImage, userLevel }: TrendDisplayProps) {
  const [showChartModal, setShowChartModal] = useState(false);
  const [showFullAnalysisModal, setShowFullAnalysisModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1D"); // UI Only for now

  // What-if state
  const [whatIfEntry, setWhatIfEntry] = useState('');
  const [whatIfSL, setWhatIfSL] = useState('');
  const [whatIfTP, setWhatIfTP] = useState('');
  const [whatIfRR, setWhatIfRR] = useState<string | null>(null);

  const handleWhatIfCalculate = () => {
    const entry = parseFloat(whatIfEntry);
    const sl = parseFloat(whatIfSL);
    const tp = parseFloat(whatIfTP);
    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && sl !== entry) {
      if ((tp > entry && sl < entry) || (tp < entry && sl > entry)) { // Valid long or short
        const potentialReward = Math.abs(tp - entry);
        const potentialRisk = Math.abs(entry - sl);
        if (potentialRisk > 0) {
          const ratio = potentialReward / potentialRisk;
          setWhatIfRR(`${ratio.toFixed(2)} : 1`);
        } else {
          setWhatIfRR("Risk is zero?");
        }
      } else {
        setWhatIfRR("Invalid levels");
      }
    } else {
      setWhatIfRR(null);
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
          <p className="text-sm mt-1 text-destructive-foreground">{error}</p>
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

  const recommendationColorClasses =
    prediction.tradingRecommendation === 'buy' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
    prediction.tradingRecommendation === 'avoid' ? 'bg-red-500/10 text-red-700 border-red-500/30' :
    prediction.tradingRecommendation === 'hold' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30' :
    'bg-slate-500/10 text-slate-700 border-slate-500/30';

  const opportunityPercent = Math.round((prediction.opportunityScore || 0) * 100);

  return (
    <>
    <Card className="w-full border">
      {/* Chart Preview Area - Simplified */}
      <CardHeader className={`pb-2 pt-2 px-2 rounded-t-md ${recommendationColorClasses}`}>
        <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold flex items-center">
                <RecommendationIcon recommendation={prediction.tradingRecommendation}/>
                <span className="ml-1.5 capitalize">{prediction.tradingRecommendation}</span>
            </CardTitle>
            {currentChartImage && (
                <Dialog open={showChartModal} onOpenChange={setShowChartModal}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-current hover:bg-black/10">
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl p-1">
                        <DialogHeader className="sr-only"><DialogTitle>Chart Preview</DialogTitle></DialogHeader>
                        <img src={currentChartImage} alt="Chart Preview" className="rounded object-contain max-h-[80vh] w-full" data-ai-hint="chart financial"/>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        <CardDescription className={`text-xs mt-1 ${prediction.tradingRecommendation === 'buy' ? 'text-green-600' : prediction.tradingRecommendation === 'avoid' ? 'text-red-600' : prediction.tradingRecommendation === 'hold' ? 'text-yellow-600' : 'text-slate-600'}`}>
            {prediction.explanationSummary || "No concise summary provided."}
        </CardDescription>
         <div className="flex items-center space-x-2 mt-1.5 pt-1.5 border-t border-current/30">
            <RiskLevelBadge level={prediction.riskLevel} />
            <VolatilityBadge level={prediction.volatilityLevel} />
        </div>
        <div className="mt-1.5">
            <Label htmlFor="confidenceScore" className="text-xs text-current/80">Confidence: {Math.round(prediction.confidence * 100)}%</Label>
            <Progress value={prediction.confidence * 100} id="confidenceScore" className="h-1.5 mt-0.5"
             indicatorClassName={
                prediction.confidence > 0.7 ? "bg-green-500" :
                prediction.confidence > 0.4 ? "bg-yellow-500" : "bg-red-500"} />
        </div>
      </CardHeader>

      <CardContent className="p-2 space-y-2 text-sm">
        {/* Timeframe Selector - UI Placeholder */}
        <div className="flex items-center justify-end space-x-1.5 text-xs">
            <Label htmlFor="timeframe-select" className="text-muted-foreground">Chart Timeframe:</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe} disabled>
                <SelectTrigger id="timeframe-select" className="h-7 w-[70px] text-xs focus:ring-0">
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map(tf => <SelectItem key={tf} value={tf} className="text-xs">{tf}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <Accordion type="multiple" defaultValue={["trend-detection", "risk-reward"]} className="w-full">
            {/* Trend Detection Panel */}
            <AccordionItem value="trend-detection">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-1.5 px-2 rounded data-[state=open]:bg-muted/50">
                    <div className="flex items-center"><ChevronsUpDown className="h-4 w-4 mr-1.5" />Trend Detection</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-1 text-xs space-y-1">
                    <div className="flex items-center">
                        <TrendIcon trend={prediction.trendAnalysis.direction} />
                        <span className="ml-1.5 font-semibold">{prediction.trendAnalysis.direction}</span>
                        <span className="ml-1 text-muted-foreground">(basis: {prediction.trendAnalysis.candleCountBasis} candles)</span>
                    </div>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Visuals:</span> {prediction.trendAnalysis.trendlineDescription}</p>
                </AccordionContent>
            </AccordionItem>

            {/* Candlestick Analysis Panel */}
            <AccordionItem value="candlestick-analysis">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-1.5 px-2 rounded data-[state=open]:bg-muted/50">
                    <div className="flex items-center"><CandlestickChart className="h-4 w-4 mr-1.5" />Candlestick Analysis</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-1 text-xs space-y-1.5">
                    {prediction.candlestickAnalysis.summary && <p className="italic text-muted-foreground mb-1">{prediction.candlestickAnalysis.summary}</p>}
                    {prediction.candlestickAnalysis.patterns.length > 0 ? (
                        prediction.candlestickAnalysis.patterns.map((p, i) => (
                            <div key={i} className={`p-1 rounded border ${p.isStatisticallyWeakOrNeutral ? 'border-dashed border-amber-500/50 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
                                <span className="font-semibold">{p.name}</span> ({p.candleCount} candles): {p.implications}
                                {p.isStatisticallyWeakOrNeutral && <span className="text-amber-700"> (Considered weak/neutral in context)</span>}
                            </div>
                        ))
                    ) : <p className="text-muted-foreground">No specific strong candlestick patterns identified recently.</p>}
                </AccordionContent>
            </AccordionItem>

            {/* Volume & Momentum Panel */}
            <AccordionItem value="volume-momentum">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-1.5 px-2 rounded data-[state=open]:bg-muted/50">
                    <div className="flex items-center"><Activity className="h-4 w-4 mr-1.5" />Volume & Momentum</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-1 text-xs space-y-1">
                    <p><span className="font-semibold">Volume:</span> {prediction.volumeAndMomentum.volumeStatus}. {prediction.volumeAndMomentum.volumeInterpretation}</p>
                    <p><span className="font-semibold">RSI Est:</span> {prediction.volumeAndMomentum.rsiEstimate}</p>
                    <p><span className="font-semibold">MACD Est:</span> {prediction.volumeAndMomentum.macdEstimate}</p>
                </AccordionContent>
            </AccordionItem>

            {/* Risk/Reward Logic Panel */}
            <AccordionItem value="risk-reward">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-1.5 px-2 rounded data-[state=open]:bg-muted/50">
                    <div className="flex items-center"><Scaling className="h-4 w-4 mr-1.5" />Risk/Reward Analysis</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-1 text-xs space-y-2">
                    <TradeAssessmentBar assessment={prediction.riskRewardDetails.tradeAssessment} />
                    <p className="text-muted-foreground text-center text-[0.7rem]">{prediction.riskRewardDetails.assessmentReasoning}</p>

                    <div className="grid grid-cols-3 gap-1.5 text-center mt-1">
                        <div>
                            <Label className="block text-muted-foreground text-[0.65rem] mb-0.5">Entry</Label>
                            {prediction.suggestedEntryPoints.map((ep,i)=><p key={i} className="font-semibold text-[0.7rem] leading-tight">{ep}</p>)}
                            {prediction.suggestedEntryPoints.length === 0 && <p className="font-semibold text-[0.7rem]">-</p>}
                        </div>
                        <div>
                            <Label className="block text-muted-foreground text-[0.65rem] mb-0.5">Take Profit</Label>
                             {prediction.takeProfitLevels.map((tp,i)=><p key={i} className="font-semibold text-green-600 text-[0.7rem] leading-tight">{tp}</p>)}
                             {prediction.takeProfitLevels.length === 0 && <p className="font-semibold text-[0.7rem]">-</p>}
                        </div>
                        <div>
                            <Label className="block text-muted-foreground text-[0.65rem] mb-0.5">Stop Loss</Label>
                            {prediction.stopLossLevels.map((sl,i)=><p key={i} className="font-semibold text-red-600 text-[0.7rem] leading-tight">{sl}</p>)}
                            {prediction.stopLossLevels.length === 0 && <p className="font-semibold text-[0.7rem]">-</p>}
                        </div>
                    </div>
                    {prediction.rewardRiskRatio && (
                        <div className="text-center mt-1">
                            <Label className="text-muted-foreground text-[0.65rem]">Reward:Risk Ratio</Label>
                            <p className="font-bold text-sm">{prediction.rewardRiskRatio.reward.toFixed(2)} : {prediction.rewardRiskRatio.risk.toFixed(2)}</p>
                        </div>
                    )}

                    {/* What-if Simulation - UI Only */}
                    <div className="mt-2 pt-2 border-t">
                        <Label className="text-xs font-medium block mb-1">"What-if" Simulation:</Label>
                        <div className="grid grid-cols-3 gap-1 items-end">
                            <Input type="number" placeholder="Entry" value={whatIfEntry} onChange={e => setWhatIfEntry(e.target.value)} className="h-7 text-xs" />
                            <Input type="number" placeholder="Stop Loss" value={whatIfSL} onChange={e => setWhatIfSL(e.target.value)} className="h-7 text-xs" />
                            <Input type="number" placeholder="Take Profit" value={whatIfTP} onChange={e => setWhatIfTP(e.target.value)} className="h-7 text-xs" />
                        </div>
                        <Button onClick={handleWhatIfCalculate} size="sm" variant="outline" className="text-xs h-7 mt-1 w-full">Recalculate R:R</Button>
                        {whatIfRR && <p className="text-center text-xs mt-1">Simulated R:R: <span className="font-semibold">{whatIfRR}</span></p>}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="p-1.5 border-t flex flex-col space-y-1.5">
        <Button size="sm" className="w-full text-xs h-8" onClick={() => setShowFullAnalysisModal(true)}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Detailed AI Explanation
        </Button>
        <div className="flex space-x-1.5 w-full">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" disabled>Simulate Trade</Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs h-7" asChild>
                <Link href="/training" legacyBehavior passHref><a><Brain className="h-3 w-3 mr-1"/>Training</a></Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
     <p className="text-[0.65rem] text-muted-foreground text-center w-full mt-1.5 px-1">
        <strong>Disclaimer:</strong> AI analysis for educational purposes. Not financial advice. Trading involves risk. DYOR.
    </p>

    {/* Full Analysis Modal */}
    <Dialog open={showFullAnalysisModal} onOpenChange={setShowFullAnalysisModal}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
                <DialogTitle className="text-lg flex items-center"><Info className="h-5 w-5 mr-2 text-primary"/>Full Scientific AI Analysis</DialogTitle>
                <DialogDescription className="text-xs">
                    User Level Context: <Badge variant="outline" className="text-xs px-1">{userLevel || 'Intermediate'}</Badge>
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-3 text-xs">
                 <div className="prose prose-xs max-w-none dark:prose-invert whitespace-pre-line" dangerouslySetInnerHTML={{ __html: prediction.fullScientificAnalysis.replace(/\n/g, '<br />') }} />
            </ScrollArea>
            <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline" size="sm">Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}


// Helper component for ScrollArea within Dialog, if needed.
const ScrollArea: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("overflow-y-auto", className)}>{children}</div>
);

// Removed the incorrect cn definition from here
// const { cn } = React.useContext( ... );
// It should use the imported `cn` from "@/lib/utils"`
