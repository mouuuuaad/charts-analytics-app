
'use client';

import type { PredictMarketTrendOutput, KeyIndicator } from '@/ai/flows/predict-market-trend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle2, ChevronRight, Eye, HelpCircle, Lightbulb, LinkIcon, ListChecks, Loader2, LogIn, MinusCircle, OctagonX, ShieldAlert, ShieldCheck, ShieldQuestion, Target, TrendingDown, TrendingUp, Zap, ZoomIn, Edit3, DollarSign, BarChartBig, Brain, Info
} from 'lucide-react';
import React from 'react';

interface TrendDisplayProps {
  prediction: PredictMarketTrendOutput | null;
  isLoading: boolean;
  error?: string | null;
  currentChartImage?: string | null;
  userLevel?: string | null;
}

const TrendIcon: React.FC<{ trend: PredictMarketTrendOutput['trendPrediction'] }> = ({ trend }) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-7 h-7 text-green-500" />;
    case 'down': return <TrendingDown className="w-7 h-7 text-red-500" />;
    case 'sideways': return <MinusCircle className="w-7 h-7 text-yellow-500" />;
    case 'neutral': return <HelpCircle className="w-7 h-7 text-gray-500" />;
    default: return <HelpCircle className="w-7 h-7 text-gray-500" />;
  }
};

const RecommendationIcon: React.FC<{ recommendation: PredictMarketTrendOutput['tradingRecommendation'] }> = ({ recommendation }) => {
  switch (recommendation) {
    case 'buy': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'hold': return <Eye className="w-5 h-5 text-blue-500" />;
    case 'avoid': return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'neutral': return <HelpCircle className="w-5 h-5 text-gray-500" />;
    default: return <HelpCircle className="w-5 h-5 text-gray-500" />;
  }
};

const RiskLevelBadge: React.FC<{ level: PredictMarketTrendOutput['riskLevel'] }> = ({ level }) => {
  let riskClasses = "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600";
  let Icon = ShieldQuestion;
  let text = "Unknown Risk";

  switch (level) {
    case 'low':
      riskClasses = "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600";
      Icon = ShieldCheck;
      text = "Low Risk";
      break;
    case 'medium':
      riskClasses = "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
      Icon = ShieldQuestion;
      text = "Medium Risk";
      break;
    case 'high':
      riskClasses = "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600";
      Icon = ShieldAlert;
      text = "High Risk";
      break;
  }
  return <Badge className={`${riskClasses} text-xs px-2 py-1`}><Icon className="mr-1 h-3.5 w-3.5" />{text}</Badge>;
};

const VolatilityBadge: React.FC<{ level?: PredictMarketTrendOutput['volatilityLevel'] }> = ({ level }) => {
  if (!level || level === 'normal' || level === 'low') return null;
  let badgeClasses = "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
  let text = `High Volatility`;
  if (level === 'extreme') {
    badgeClasses = "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600 animate-pulse";
    text = `Extreme Volatility!`;
  }
  return <Badge className={`${badgeClasses} text-xs px-2 py-1`}><AlertTriangle className="mr-1 h-3.5 w-3.5" />{text}</Badge>;
};

const KeyIndicatorDisplay: React.FC<{ indicator: KeyIndicator }> = ({ indicator }) => {
  let sentimentColor = 'text-muted-foreground';
  if (indicator.sentiment === 'positive') sentimentColor = 'text-green-500 dark:text-green-400';
  if (indicator.sentiment === 'negative') sentimentColor = 'text-red-500 dark:text-red-400';

  return (
    <div className="py-2 px-3 bg-muted/50 rounded-md border border-border/70 text-xs">
      <span className="font-semibold text-foreground">{indicator.name}:</span>{' '}
      <span className={indicator.sentiment ? sentimentColor : 'text-muted-foreground'}>{indicator.value}</span>
    </div>
  );
};

const RewardRiskRatioChart: React.FC<{ ratio?: { reward: number; risk: number } }> = ({ ratio }) => {
  if (!ratio || ratio.risk === 0) return <p className="text-xs text-muted-foreground">Reward/Risk ratio not available.</p>;

  const totalParts = ratio.reward + ratio.risk;
  const rewardPercent = totalParts > 0 ? (ratio.reward / totalParts) * 100 : 0;
  const riskPercent = totalParts > 0 ? (ratio.risk / totalParts) * 100 : 0;

  return (
    <div>
      <p className="text-sm font-medium mb-1 text-foreground">
        Reward : Risk Ratio <span className="text-primary font-semibold">({ratio.reward} : {ratio.risk})</span>
      </p>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted border">
        <div style={{ width: `${rewardPercent}%` }} className="bg-green-500 transition-all duration-500"></div>
        <div style={{ width: `${riskPercent}%` }} className="bg-red-500 transition-all duration-500"></div>
      </div>
    </div>
  );
};


export function TrendDisplay({ prediction, isLoading, error, currentChartImage, userLevel }: TrendDisplayProps) {

  const [showChartModal, setShowChartModal] = React.useState(false);

  if (isLoading && !error) {
    return (
      <Card className="w-full shadow-xl border-primary/20 animate-pulse-border-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            AI Analyzing Chart...
          </CardTitle>
          <CardDescription>Tailoring insights for <span className="font-semibold text-accent">{userLevel || 'intermediate'}</span> level. Please wait.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {currentChartImage && (
            <div className="my-4 p-3 border rounded-lg bg-background shadow-sm opacity-70">
                <Image src={currentChartImage} alt="Processing chart" width={400} height={300} className="max-h-48 w-auto mx-auto rounded-md object-contain" data-ai-hint="chart diagram"/>
                <p className="text-xs text-center text-muted-foreground mt-2">Your uploaded chart</p>
            </div>
          )}
          <div className="p-3 bg-muted/40 rounded-lg border">
            <h4 className="font-semibold text-sm mb-1.5 text-foreground flex items-center"><Lightbulb className="h-4 w-4 mr-2 text-yellow-400 animate-pulse-slow" />Pro Tip</h4>
            <p className="text-xs text-muted-foreground">
              Patience is key in trading. Wait for confirmations and manage your risk. AI provides insights, not guarantees.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">Generating futuristic financial insights...</p>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="w-full shadow-lg border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md border border-destructive/40 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="w-full shadow-xl border-border/20">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-xl">Financial Risk & Opportunity AI</CardTitle>
          <CardDescription>Upload or capture a chart for AI-powered insights.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[350px] pt-8">
          <Zap className="w-16 h-16 text-primary/50 mb-6 animate-float" />
          <p className="text-md text-muted-foreground">Awaiting chart data for analysis.</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs">
            The AI will assess risk, opportunity, key indicators, and provide tailored recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const opportunityPercent = Math.round((prediction.opportunityScore || 0) * 100);

  return (
    <>
    <Card className={`w-full shadow-xl border ${prediction.riskLevel === 'high' ? 'border-red-500/50 animate-pulse-border-soft-warning' : prediction.riskLevel === 'low' && prediction.opportunityScore > 0.7 ? 'border-green-500/50 animate-pulse-border-soft-success' : 'border-border/30'}`}>
      <CardHeader className="pb-3 bg-muted/20 rounded-t-lg">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-xl flex items-center">
                    <TrendIcon trend={prediction.trendPrediction} />
                    <span className="ml-2">AI Analysis: <span className={`capitalize ${
                        prediction.trendPrediction === 'up' ? 'text-green-500' :
                        prediction.trendPrediction === 'down' ? 'text-red-500' :
                        prediction.trendPrediction === 'sideways' ? 'text-yellow-500' : 'text-gray-500'
                    }`}>{prediction.trendPrediction}</span>
                    </span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                    {prediction.reason || "Awaiting detailed AI reasoning."}
                </CardDescription>
            </div>
            {currentChartImage && (
                <Dialog open={showChartModal} onOpenChange={setShowChartModal}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label="Zoom chart">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-2">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Chart Preview</DialogTitle>
                        </DialogHeader>
                        <Image src={currentChartImage} alt="Chart Preview" width={800} height={600} className="rounded-md object-contain max-h-[80vh] w-full" data-ai-hint="chart financial"/>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-border/30">
            <RiskLevelBadge level={prediction.riskLevel} />
            <VolatilityBadge level={prediction.volatilityLevel} />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 items-center p-3 bg-background rounded-lg border border-border/50 shadow-sm">
            <div>
                <Label htmlFor="opportunityScore" className="text-xs text-muted-foreground">Opportunity Score</Label>
                <div className="text-2xl font-bold text-primary flex items-center">
                    {opportunityPercent}%
                </div>
                <Progress value={opportunityPercent} id="opportunityScore" className="h-1.5 mt-1" />
            </div>
            <div className="text-right">
                <Label className="text-xs text-muted-foreground block mb-0.5">Recommendation</Label>
                <Badge variant={
                    prediction.tradingRecommendation === 'buy' ? 'default' :
                    prediction.tradingRecommendation === 'avoid' ? 'destructive' :
                    'secondary'
                } className={`text-sm px-3 py-1 capitalize ${
                    prediction.tradingRecommendation === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' :
                    prediction.tradingRecommendation === 'avoid' ? 'bg-red-500 hover:bg-red-600 text-white' :
                    prediction.tradingRecommendation === 'hold' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                    'bg-slate-500 hover:bg-slate-600 text-white'
                }`}>
                    <RecommendationIcon recommendation={prediction.tradingRecommendation} />
                    <span className="ml-1.5">{prediction.tradingRecommendation}</span>
                </Badge>
            </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="key-indicators">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 px-3 rounded-md hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                    <div className="flex items-center"><ListChecks className="h-4 w-4 mr-2 text-primary" />Why this decision? (Key Indicators)</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 px-1 text-xs">
                    {prediction.keyIndicators && prediction.keyIndicators.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {prediction.keyIndicators.map(ind => <KeyIndicatorDisplay key={ind.name} indicator={ind} />)}
                        </div>
                    ) : (
                        <p className="text-muted-foreground p-2">No specific key indicators provided by AI.</p>
                    )}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="levels">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 px-3 rounded-md hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                     <div className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-primary" />Suggested Trading Levels</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 px-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-muted/30 rounded-md border">
                            <h4 className="font-semibold mb-1 text-foreground flex items-center"><LogIn className="h-3.5 w-3.5 mr-1.5 text-blue-500"/>Entry Points</h4>
                            {prediction.suggestedEntryPoints.length > 0 ? prediction.suggestedEntryPoints.map((ep, i) => <p key={i} className="text-muted-foreground">- {ep}</p>) : <p className="text-muted-foreground">Not specified.</p>}
                        </div>
                         <div className="p-2 bg-muted/30 rounded-md border">
                            <h4 className="font-semibold mb-1 text-foreground flex items-center"><Target className="h-3.5 w-3.5 mr-1.5 text-green-500"/>Take Profit</h4>
                            {prediction.takeProfitLevels.length > 0 ? prediction.takeProfitLevels.map((tp, i) => <p key={i} className="text-muted-foreground">- {tp}</p>) : <p className="text-muted-foreground">Not specified.</p>}
                        </div>
                         <div className="p-2 bg-muted/30 rounded-md border">
                            <h4 className="font-semibold mb-1 text-foreground flex items-center"><OctagonX className="h-3.5 w-3.5 mr-1.5 text-red-500"/>Stop Loss</h4>
                            {prediction.stopLossLevels.length > 0 ? prediction.stopLossLevels.map((sl, i) => <p key={i} className="text-muted-foreground">- {sl}</p>) : <p className="text-muted-foreground">Not specified.</p>}
                        </div>
                    </div>
                    {prediction.rewardRiskRatio && (
                        <div className="mt-3 p-2 bg-muted/30 rounded-md border">
                            <RewardRiskRatioChart ratio={prediction.rewardRiskRatio} />
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="full-analysis">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2 px-3 rounded-md hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                     <div className="flex items-center"><Info className="h-4 w-4 mr-2 text-primary" />Full AI Analysis Details</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 px-2 text-xs">
                    <div className="text-muted-foreground space-y-2 prose prose-xs dark:prose-invert max-w-none leading-relaxed">
                         {(prediction.analysisDetails || "No detailed analysis provided.").split('\n').map((paragraph, index) => (
                            paragraph.trim() ? <p key={index}>{paragraph}</p> : null
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="pt-3 border-t border-border/30">
            <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">Simulate Different Entry (Coming Soon)</h4>
            <div className="flex items-center space-x-2">
                <Input type="number" placeholder="Enter Price" className="h-8 text-xs" disabled />
                <Button variant="outline" size="sm" className="text-xs" disabled><Edit3 className="h-3.5 w-3.5 mr-1.5"/>Recalculate Risk</Button>
            </div>
        </div>

      </CardContent>
      <CardFooter className="p-3 bg-muted/20 rounded-b-lg border-t border-border/30 space-x-2 flex-wrap gap-y-2">
        <Button size="sm" className="flex-1 text-xs bg-primary/90 hover:bg-primary shadow-sm transition-all duration-300 ease-in-out hover:shadow-glow-primary-hover focus:shadow-glow-primary-focus"><LinkIcon className="mr-1.5 h-3.5 w-3.5"/>Proceed to Trade (Demo)</Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" asChild><Link href="/training"><Brain className="mr-1.5 h-3.5 w-3.5"/>Back to Training</Link></Button>
        {/* <Button variant="ghost" size="sm" className="flex-1 text-xs"><MessageSquareQuestion className="mr-1.5 h-3.5 w-3.5"/>Ask AI to Explain</Button> */}
      </CardFooter>
    </Card>
     <p className="text-xs text-muted-foreground text-center w-full leading-relaxed mt-4 px-2">
        <strong>Disclaimer:</strong> Trading financial markets involves significant risk. The information provided by ChartSight AI is for educational and informational purposes only and should not be considered financial advice or a guarantee of future results. Always conduct your own thorough research and consult with a qualified financial advisor before making any trading decisions. Past performance is not indicative of future results.
    </p>
    </>
  );
}

    