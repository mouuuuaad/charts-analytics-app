
'use client';

import type { PredictMarketTrendOutput, KeyIndicator } from '@/ai/flows/predict-market-trend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Using standard img tag now
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import {
  AlertTriangle, CheckCircle2, Eye, HelpCircle, Lightbulb, LinkIcon, ListChecks, Loader2, LogIn, MinusCircle, OctagonX, ShieldAlert, ShieldCheck, ShieldQuestion, Target, TrendingDown, TrendingUp, ZoomIn, Edit3, DollarSign, Info, Brain
} from 'lucide-react'; // Removed Zap, BarChartBig
import React from 'react';
import Link from 'next/link';


interface TrendDisplayProps {
  prediction: PredictMarketTrendOutput | null;
  isLoading: boolean;
  error?: string | null;
  currentChartImage?: string | null;
  userLevel?: string | null;
}

const TrendIcon: React.FC<{ trend: PredictMarketTrendOutput['trendPrediction'] }> = ({ trend }) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-6 h-6 text-green-600" />;
    case 'down': return <TrendingDown className="w-6 h-6 text-red-600" />;
    case 'sideways': return <MinusCircle className="w-6 h-6 text-yellow-600" />;
    case 'neutral': return <HelpCircle className="w-6 h-6 text-gray-500" />;
    default: return <HelpCircle className="w-6 h-6 text-gray-500" />;
  }
};

const RecommendationIcon: React.FC<{ recommendation: PredictMarketTrendOutput['tradingRecommendation'] }> = ({ recommendation }) => {
  switch (recommendation) {
    case 'buy': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'hold': return <Eye className="w-4 h-4 text-blue-600" />;
    case 'avoid': return <ShieldAlert className="w-4 h-4 text-red-600" />;
    case 'neutral': return <HelpCircle className="w-4 h-4 text-gray-500" />;
    default: return <HelpCircle className="w-4 h-4 text-gray-500" />;
  }
};

const RiskLevelBadge: React.FC<{ level: PredictMarketTrendOutput['riskLevel'] }> = ({ level }) => {
  let riskClasses = "border-gray-300 text-gray-700 bg-gray-100";
  let Icon = ShieldQuestion;
  let text = "Unknown Risk";

  switch (level) {
    case 'low':
      riskClasses = "border-green-400 text-green-700 bg-green-100";
      Icon = ShieldCheck;
      text = "Low Risk";
      break;
    case 'medium':
      riskClasses = "border-yellow-400 text-yellow-700 bg-yellow-100";
      Icon = ShieldQuestion;
      text = "Medium Risk";
      break;
    case 'high':
      riskClasses = "border-red-400 text-red-700 bg-red-100";
      Icon = ShieldAlert;
      text = "High Risk";
      break;
  }
  return <Badge variant="outline" className={`${riskClasses} text-xs px-2 py-0.5`}><Icon className="mr-1 h-3 w-3" />{text}</Badge>;
};

const VolatilityBadge: React.FC<{ level?: PredictMarketTrendOutput['volatilityLevel'] }> = ({ level }) => {
  if (!level || level === 'normal' || level === 'low') return null;
  let badgeClasses = "border-yellow-400 text-yellow-700 bg-yellow-100";
  let text = `High Volatility`;
  if (level === 'extreme') {
    badgeClasses = "border-red-400 text-red-700 bg-red-100"; // Removed animation
    text = `Extreme Volatility!`;
  }
  return <Badge variant="outline" className={`${badgeClasses} text-xs px-2 py-0.5`}><AlertTriangle className="mr-1 h-3 w-3" />{text}</Badge>;
};

const KeyIndicatorDisplay: React.FC<{ indicator: KeyIndicator }> = ({ indicator }) => {
  let sentimentColor = 'text-muted-foreground';
  if (indicator.sentiment === 'positive') sentimentColor = 'text-green-600';
  if (indicator.sentiment === 'negative') sentimentColor = 'text-red-600';

  return (
    <div className="py-1.5 px-2 bg-muted/60 rounded border text-xs">
      <span className="font-medium text-foreground">{indicator.name}:</span>{' '}
      <span className={indicator.sentiment ? sentimentColor : 'text-muted-foreground'}>{indicator.value}</span>
    </div>
  );
};

const RewardRiskRatioChart: React.FC<{ ratio?: { reward: number; risk: number } }> = ({ ratio }) => {
  if (!ratio || ratio.risk === 0) return <p className="text-xs text-muted-foreground">R/R ratio N/A.</p>;

  const totalParts = ratio.reward + ratio.risk;
  const rewardPercent = totalParts > 0 ? (ratio.reward / totalParts) * 100 : 0;
  const riskPercent = totalParts > 0 ? (ratio.risk / totalParts) * 100 : 0;

  return (
    <div>
      <p className="text-xs font-medium mb-1 text-foreground">
        Reward : Risk <span className="text-primary font-semibold">({ratio.reward}:{ratio.risk})</span>
      </p>
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted border">
        <div style={{ width: `${rewardPercent}%` }} className="bg-green-500"></div>
        <div style={{ width: `${riskPercent}%` }} className="bg-red-500"></div>
      </div>
    </div>
  );
};

export function TrendDisplay({ prediction, isLoading, error, currentChartImage, userLevel }: TrendDisplayProps) {
  const [showChartModal, setShowChartModal] = React.useState(false);

  if (isLoading && !error) {
    return (
      <Card className="w-full"> {/* Removed shadow and pulse */}
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-primary flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            AI Analyzing Chart...
          </CardTitle>
          <CardDescription className="text-xs">Tailoring insights for {userLevel || 'intermediate'} level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {currentChartImage && (
            <div className="my-3 p-2 border rounded bg-background">
                <img src={currentChartImage} alt="Processing chart" style={{maxHeight: '150px', width: 'auto', margin: '0 auto', borderRadius: '0.25rem', objectFit: 'contain'}} data-ai-hint="chart diagram"/>
                <p className="text-xs text-center text-muted-foreground mt-1">Your chart</p>
            </div>
          )}
          <div className="p-2 bg-muted/50 rounded border">
            <h4 className="font-medium text-xs mb-1 text-foreground flex items-center"><Lightbulb className="h-3 w-3 mr-1.5 text-yellow-500" />Tip</h4>
            <p className="text-xs text-muted-foreground">
              Patience is key. Wait for confirmations and manage risk. AI provides insights, not guarantees.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">Generating insights...</p>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="w-full border-destructive bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/10 p-2 rounded border border-destructive/30 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Financial AI Analysis</CardTitle>
          <CardDescription className="text-xs">Upload a chart for AI insights.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[250px] pt-4">
          <Info className="w-12 h-12 text-primary/40 mb-4" />
          <p className="text-sm text-muted-foreground">Awaiting chart data.</p>
        </CardContent>
      </Card>
    );
  }

  const opportunityPercent = Math.round((prediction.opportunityScore || 0) * 100);

  return (
    <>
    <Card className={`w-full border ${prediction.riskLevel === 'high' ? 'border-red-400' : prediction.riskLevel === 'low' && prediction.opportunityScore > 0.7 ? 'border-green-400' : 'border-border'}`}>
      <CardHeader className="pb-2 bg-muted/30 rounded-t-md">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-md font-medium flex items-center">
                    <TrendIcon trend={prediction.trendPrediction} />
                    <span className="ml-1.5">AI: <span className={`capitalize ${
                        prediction.trendPrediction === 'up' ? 'text-green-600' :
                        prediction.trendPrediction === 'down' ? 'text-red-600' :
                        prediction.trendPrediction === 'sideways' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>{prediction.trendPrediction}</span>
                    </span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                    {prediction.reason || "No concise reason provided."}
                </CardDescription>
            </div>
            {currentChartImage && (
                <Dialog open={showChartModal} onOpenChange={setShowChartModal}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Zoom chart">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl p-1">
                        <DialogHeader className="sr-only"><DialogTitle>Chart</DialogTitle></DialogHeader>
                        <img src={currentChartImage} alt="Chart Preview" style={{borderRadius: '0.375rem', objectFit: 'contain', maxHeight: '80vh', width: '100%' }} data-ai-hint="chart financial"/>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        <div className="flex items-center space-x-2 mt-1.5 pt-1.5 border-t">
            <RiskLevelBadge level={prediction.riskLevel} />
            <VolatilityBadge level={prediction.volatilityLevel} />
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 items-center p-2 bg-background rounded border">
            <div>
                <Label htmlFor="opportunityScore" className="text-xs text-muted-foreground">Opportunity</Label>
                <div className="text-xl font-semibold text-primary">
                    {opportunityPercent}%
                </div>
                <Progress value={opportunityPercent} id="opportunityScore" className="h-1 mt-0.5" />
            </div>
            <div className="text-right">
                <Label className="text-xs text-muted-foreground block mb-0.5">Action</Label>
                <Badge variant={
                    prediction.tradingRecommendation === 'buy' ? 'default' :
                    prediction.tradingRecommendation === 'avoid' ? 'destructive' :
                    'secondary'
                } className={`text-xs px-2 py-0.5 capitalize ${
                    prediction.tradingRecommendation === 'buy' ? 'bg-green-500 text-white' :
                    prediction.tradingRecommendation === 'avoid' ? 'bg-red-500 text-white' :
                    prediction.tradingRecommendation === 'hold' ? 'bg-blue-500 text-white' :
                    'bg-slate-500 text-white'
                }`}>
                    <RecommendationIcon recommendation={prediction.tradingRecommendation} />
                    <span className="ml-1">{prediction.tradingRecommendation}</span>
                </Badge>
            </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="key-indicators">
                <AccordionTrigger className="text-xs font-medium hover:no-underline py-1.5 px-2 rounded hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                    <div className="flex items-center"><ListChecks className="h-3.5 w-3.5 mr-1.5 text-primary" />Key Indicators</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0.5 text-xs">
                    {prediction.keyIndicators && prediction.keyIndicators.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                            {prediction.keyIndicators.map(ind => <KeyIndicatorDisplay key={ind.name} indicator={ind} />)}
                        </div>
                    ) : (
                        <p className="text-muted-foreground p-1.5 text-xs">No specific key indicators provided.</p>
                    )}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="levels">
                <AccordionTrigger className="text-xs font-medium hover:no-underline py-1.5 px-2 rounded hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                     <div className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-1.5 text-primary" />Trading Levels</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-0.5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                        <div className="p-1.5 bg-muted/40 rounded border">
                            <h4 className="font-medium mb-0.5 text-foreground flex items-center text-xs"><LogIn className="h-3 w-3 mr-1 text-blue-500"/>Entry</h4>
                            {prediction.suggestedEntryPoints.length > 0 ? prediction.suggestedEntryPoints.map((ep, i) => <p key={i} className="text-muted-foreground">- {ep}</p>) : <p className="text-muted-foreground">N/A</p>}
                        </div>
                         <div className="p-1.5 bg-muted/40 rounded border">
                            <h4 className="font-medium mb-0.5 text-foreground flex items-center text-xs"><Target className="h-3 w-3 mr-1 text-green-500"/>Take Profit</h4>
                            {prediction.takeProfitLevels.length > 0 ? prediction.takeProfitLevels.map((tp, i) => <p key={i} className="text-muted-foreground">- {tp}</p>) : <p className="text-muted-foreground">N/A</p>}
                        </div>
                         <div className="p-1.5 bg-muted/40 rounded border">
                            <h4 className="font-medium mb-0.5 text-foreground flex items-center text-xs"><OctagonX className="h-3 w-3 mr-1 text-red-500"/>Stop Loss</h4>
                            {prediction.stopLossLevels.length > 0 ? prediction.stopLossLevels.map((sl, i) => <p key={i} className="text-muted-foreground">- {sl}</p>) : <p className="text-muted-foreground">N/A</p>}
                        </div>
                    </div>
                    {prediction.rewardRiskRatio && (
                        <div className="mt-2 p-1.5 bg-muted/40 rounded border">
                            <RewardRiskRatioChart ratio={prediction.rewardRiskRatio} />
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="full-analysis">
                <AccordionTrigger className="text-xs font-medium hover:no-underline py-1.5 px-2 rounded hover:bg-muted/50 [&[data-state=open]]:bg-muted/50">
                     <div className="flex items-center"><Info className="h-3.5 w-3.5 mr-1.5 text-primary" />Full AI Analysis</div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0 px-1 text-xs">
                    <div className="text-muted-foreground space-y-1.5 prose prose-xs dark:prose-invert max-w-none">
                         {(prediction.analysisDetails || "No detailed analysis provided.").split('\n').map((paragraph, index) => (
                            paragraph.trim() ? <p key={index}>{paragraph}</p> : null
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="pt-2 border-t">
            <h4 className="text-xs font-medium mb-1 text-muted-foreground">Simulate Entry (Coming Soon)</h4>
            <div className="flex items-center space-x-1.5">
                <Input type="number" placeholder="Price" className="h-8 text-xs" disabled />
                <Button variant="outline" size="sm" className="text-xs" disabled><Edit3 className="h-3 w-3 mr-1"/>Recalculate</Button>
            </div>
        </div>

      </CardContent>
      <CardFooter className="p-2 bg-muted/30 rounded-b-md border-t flex space-x-2">
        <Button size="sm" className="flex-1 text-xs" disabled><LinkIcon className="mr-1 h-3 w-3"/>Trade (Demo)</Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" asChild><Link href="/training"><Brain className="mr-1 h-3 w-3"/>Training</Link></Button>
      </CardFooter>
    </Card>
     <p className="text-xs text-muted-foreground text-center w-full mt-3 px-2">
        <strong>Disclaimer:</strong> Trading involves risk. Info is for education only, not financial advice. DYOR.
    </p>
    </>
  );
}
