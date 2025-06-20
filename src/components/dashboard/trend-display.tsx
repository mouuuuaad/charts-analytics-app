
'use client';

import type { PredictMarketTrendOutput, KeyIndicator } from '@/ai/flows/predict-market-trend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import {
  AlertTriangle, CheckCircle2, Eye, HelpCircle, ListChecks, Loader2, LogIn, MinusCircle, OctagonX, ShieldAlert, ShieldCheck, ShieldQuestion, Target, TrendingDown, TrendingUp, ZoomIn, Edit3, DollarSign, Info, Brain
} from 'lucide-react';
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
  // Removed color classes, relying on default icon color or foreground
  switch (trend) {
    case 'up': return <TrendingUp className="w-5 h-5" />;
    case 'down': return <TrendingDown className="w-5 h-5" />;
    case 'sideways': return <MinusCircle className="w-5 h-5" />;
    case 'neutral': return <HelpCircle className="w-5 h-5" />;
    default: return <HelpCircle className="w-5 h-5" />;
  }
};

const RecommendationIcon: React.FC<{ recommendation: PredictMarketTrendOutput['tradingRecommendation'] }> = ({ recommendation }) => {
  // Removed color classes
  switch (recommendation) {
    case 'buy': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'hold': return <Eye className="w-3.5 h-3.5" />;
    case 'avoid': return <ShieldAlert className="w-3.5 h-3.5" />;
    case 'neutral': return <HelpCircle className="w-3.5 h-3.5" />;
    default: return <HelpCircle className="w-3.5 h-3.5" />;
  }
};

const RiskLevelBadge: React.FC<{ level: PredictMarketTrendOutput['riskLevel'] }> = ({ level }) => {
  // Simplified badge, no custom colors, relying on default Badge variant='outline'
  let Icon = ShieldQuestion;
  let text = "Unknown Risk";
  switch (level) {
    case 'low': Icon = ShieldCheck; text = "Low Risk"; break;
    case 'medium': Icon = ShieldQuestion; text = "Medium Risk"; break;
    case 'high': Icon = ShieldAlert; text = "High Risk"; break;
  }
  return <Badge variant="outline" className="text-xs px-1.5 py-0.5"><Icon className="mr-1 h-3 w-3" />{text}</Badge>;
};

const VolatilityBadge: React.FC<{ level?: PredictMarketTrendOutput['volatilityLevel'] }> = ({ level }) => {
  if (!level || level === 'normal' || level === 'low') return null;
  let text = `High Volatility`;
  if (level === 'extreme') text = `Extreme Volatility!`;
  return <Badge variant="outline" className="text-xs px-1.5 py-0.5"><AlertTriangle className="mr-1 h-3 w-3" />{text}</Badge>;
};

const KeyIndicatorDisplay: React.FC<{ indicator: KeyIndicator }> = ({ indicator }) => {
  // Removed sentimentColor logic, text will use foreground
  return (
    <div className="py-1 px-1.5 bg-muted/50 rounded border text-xs">
      <span className="font-medium">{indicator.name}:</span>{' '}
      <span>{indicator.value}</span>
    </div>
  );
};

const RewardRiskRatioChart: React.FC<{ ratio?: { reward: number; risk: number } }> = ({ ratio }) => {
  if (!ratio || ratio.risk === 0) return <p className="text-xs text-muted-foreground">R/R N/A.</p>;
  const totalParts = ratio.reward + ratio.risk;
  const rewardPercent = totalParts > 0 ? (ratio.reward / totalParts) * 100 : 0;
  const riskPercent = totalParts > 0 ? (ratio.risk / totalParts) * 100 : 0;
  return (
    <div>
      <p className="text-xs font-medium mb-0.5">
        Reward : Risk ({ratio.reward}:{ratio.risk})
      </p>
      <div className="flex h-1.5 w-full rounded-sm overflow-hidden border"> {/* Simpler bar */}
        <div style={{ width: `${rewardPercent}%` }} className="bg-foreground"></div> {/* Use foreground for "positive" part */}
        <div style={{ width: `${riskPercent}%` }} className="bg-muted"></div> {/* Use muted for "risk" part */}
      </div>
    </div>
  );
};

export function TrendDisplay({ prediction, isLoading, error, currentChartImage, userLevel }: TrendDisplayProps) {
  const [showChartModal, setShowChartModal] = React.useState(false);

  if (isLoading && !error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-3"> {/* Simplified padding */}
          <CardTitle className="text-md flex items-center"> {/* Simpler font */}
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {/* Smaller loader */}
            Analyzing Chart...
          </CardTitle>
          <CardDescription className="text-xs">Tailoring for {userLevel || 'default'} level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 px-3 pb-3"> {/* Simplified padding */}
          {currentChartImage && (
            <div className="my-2 p-1.5 border rounded"> {/* Simplified margin/padding */}
                <img src={currentChartImage} alt="Processing chart" style={{maxHeight: '120px', width: 'auto', margin: '0 auto', borderRadius: '0.1rem'}} data-ai-hint="chart diagram"/>
                <p className="text-xs text-center text-muted-foreground mt-0.5">Your chart</p>
            </div>
          )}
          <div className="p-1.5 border rounded text-xs text-muted-foreground">
            Patience is key. Wait for confirmations and manage risk. AI provides insights, not guarantees.
          </div>
        </CardContent>
        <CardFooter className="p-2"> {/* Simplified padding */}
          <p className="text-xs text-muted-foreground text-center w-full">Generating insights...</p>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="w-full border-destructive bg-destructive/10 p-3"> {/* Simplified */}
          <CardTitle className="text-sm font-medium flex items-center text-destructive">
            <AlertTriangle className="mr-1.5 h-4 w-4" /> Analysis Error
          </CardTitle>
          <p className="text-sm mt-1">{error}</p> {/* Simplified */}
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="w-full p-3"> {/* Simplified */}
        <CardHeader className="pb-2 pt-0 px-0">
          <CardTitle className="text-md">Financial AI Analysis</CardTitle>
          <CardDescription className="text-xs">Upload a chart for AI insights.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[200px] pt-3">
          <Info className="w-10 h-10 text-muted-foreground mb-2" /> {/* Simplified */}
          <p className="text-sm text-muted-foreground">Awaiting chart data.</p>
        </CardContent>
      </Card>
    );
  }

  const opportunityPercent = Math.round((prediction.opportunityScore || 0) * 100);

  return (
    <>
    <Card className="w-full border"> {/* Removed conditional border colors */}
      <CardHeader className="pb-1.5 pt-2 px-2 rounded-t-md"> {/* Simplified padding */}
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-sm font-medium flex items-center">
                    <TrendIcon trend={prediction.trendPrediction} />
                    <span className="ml-1">AI: <span className="capitalize font-semibold">{prediction.trendPrediction}</span>
                    </span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                    {prediction.reason || "No concise reason provided."}
                </CardDescription>
            </div>
            {currentChartImage && (
                <Dialog open={showChartModal} onOpenChange={setShowChartModal}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Zoom chart">
                            <ZoomIn className="h-3.5 w-3.5" /> {/* Smaller icon */}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl p-0.5"> {/* Simplified padding */}
                        <DialogHeader className="sr-only"><DialogTitle>Chart</DialogTitle></DialogHeader>
                        <img src={currentChartImage} alt="Chart Preview" style={{borderRadius: '0.25rem', objectFit: 'contain', maxHeight: '75vh', width: '100%' }} data-ai-hint="chart financial"/>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        <div className="flex items-center space-x-1.5 mt-1 pt-1 border-t"> {/* Simplified spacing */}
            <RiskLevelBadge level={prediction.riskLevel} />
            <VolatilityBadge level={prediction.volatilityLevel} />
        </div>
      </CardHeader>
      <CardContent className="p-2 space-y-2"> {/* Simplified padding & spacing */}
        <div className="grid grid-cols-2 gap-1.5 items-center p-1.5 border rounded"> {/* Simplified */}
            <div>
                <Label htmlFor="opportunityScore" className="text-xs text-muted-foreground">Opportunity</Label>
                <div className="text-lg font-semibold"> {/* Removed text-primary */}
                    {opportunityPercent}%
                </div>
                <Progress value={opportunityPercent} id="opportunityScore" className="h-1 mt-0.5" />
            </div>
            <div className="text-right">
                <Label className="text-xs text-muted-foreground block mb-0.5">Action</Label>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 capitalize"> {/* Simpler badge */}
                    <RecommendationIcon recommendation={prediction.tradingRecommendation} />
                    <span className="ml-1">{prediction.tradingRecommendation}</span>
                </Badge>
            </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="key-indicators">
                <AccordionTrigger className="text-xs font-medium hover:no-underline py-1 px-1.5 rounded [&[data-state=open]]:bg-muted/50"> {/* Simplified */}
                    <div className="flex items-center"><ListChecks className="h-3.5 w-3.5 mr-1" />Key Indicators</div>
                </AccordionTrigger>
                <AccordionContent className="pt-0.5 pb-0 px-0 text-xs">
                    {prediction.keyIndicators && prediction.keyIndicators.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-0.5"> {/* Simplified */}
                            {prediction.keyIndicators.map(ind => <KeyIndicatorDisplay key={ind.name} indicator={ind} />)}
                        </div>
                    ) : (
                        <p className="text-muted-foreground p-1 text-xs">No specific key indicators.</p>
                    )}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="levels">
                <AccordionTrigger className="text-xs font-medium hover:no-underline py-1 px-1.5 rounded [&[data-state=open]]:bg-muted/50">
                     <div className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-1" />Trading Levels</div>
                </AccordionTrigger>
                <AccordionContent className="pt-0.5 pb-0 px-0 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1"> {/* Simplified */}
                        <div className="p-1 border rounded">
                            <h4 className="font-medium mb-0 text-xs flex items-center"><LogIn className="h-3 w-3 mr-0.5"/>Entry</h4>
                            {prediction.suggestedEntryPoints.length > 0 ? prediction.suggestedEntryPoints.map((ep, i) => <p key={i} className="text-muted-foreground text-xs">- {ep}</p>) : <p className="text-muted-foreground text-xs">N/A</p>}
                        </div>
                         <div className="p-1 border rounded">
                            <h4 className="font-medium mb-0 text-xs flex items-center"><Target className="h-3 w-3 mr-0.5"/>Take Profit</h4>
                            {prediction.takeProfitLevels.length > 0 ? prediction.takeProfitLevels.map((tp, i) => <p key={i} className="text-muted-foreground text-xs">- {tp}</p>) : <p className="text-muted-foreground text-xs">N/A</p>}
                        </div>
                         <div className="p-1 border rounded">
                            <h4 className="font-medium mb-0 text-xs flex items-center"><OctagonX className="h-3 w-3 mr-0.5"/>Stop Loss</h4>
                            {prediction.stopLossLevels.length > 0 ? prediction.stopLossLevels.map((sl, i) => <p key={i} className="text-muted-foreground text-xs">- {sl}</p>) : <p className="text-muted-foreground text-xs">N/A</p>}
                        </div>
                    </div>
                    {prediction.rewardRiskRatio && (
                        <div className="mt-1 p-1 border rounded">
                            <RewardRiskRatioChart ratio={prediction.rewardRiskRatio} />
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="full-analysis">
                <AccordionTrigger className="text-xs font-medium hover:no-underline py-1 px-1.5 rounded [&[data-state=open]]:bg-muted/50">
                     <div className="flex items-center"><Info className="h-3.5 w-3.5 mr-1" />Full AI Analysis</div>
                </AccordionTrigger>
                <AccordionContent className="pt-0.5 pb-0 px-0.5 text-xs"> {/* Reduced padding */}
                    <div className="text-muted-foreground space-y-1 prose prose-xs max-w-none"> {/* Simplified */}
                         {(prediction.analysisDetails || "No detailed analysis provided.").split('\n').map((paragraph, index) => (
                            paragraph.trim() ? <p key={index}>{paragraph}</p> : null
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="pt-1.5 border-t"> {/* Simplified */}
            <h4 className="text-xs font-medium mb-0.5 text-muted-foreground">Simulate Entry (Soon)</h4>
            <div className="flex items-center space-x-1">
                <Input type="number" placeholder="Price" className="h-7 text-xs" disabled /> {/* Smaller input */}
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled><Edit3 className="h-3 w-3 mr-0.5"/>Recalculate</Button>
            </div>
        </div>

      </CardContent>
      <CardFooter className="p-1.5 border-t flex space-x-1.5"> {/* Simplified */}
        <Button size="sm" className="flex-1 text-xs h-7" disabled>Trade (Demo)</Button> {/* Smaller button */}
        <Button variant="outline" size="sm" className="flex-1 text-xs h-7" asChild>
          <Link href="/training" legacyBehavior passHref>
            <a>
              <span className="flex items-center gap-0.5">
                <Brain className="h-3 w-3"/>Training
              </span>
            </a>
          </Link>
        </Button>
      </CardFooter>
    </Card>
     <p className="text-xs text-muted-foreground text-center w-full mt-2 px-1"> {/* Simplified */}
        <strong>Disclaimer:</strong> Trading involves risk. Info is for education, not financial advice. DYOR.
    </p>
    </>
  );
}
