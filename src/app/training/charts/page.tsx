
import TradingViewAdvancedChart from '@/components/training/tradingview-advanced-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react'; // Icon for Practice Tips

export default function TrainingChartsPage() {
  return (
    <div className="container mx-auto py-3 px-2 md:px-3 space-y-3">
      <Card className="border">
        <CardHeader className="p-2 md:p-3">
          <CardTitle className="text-lg">Interactive Trading Chart Practice</CardTitle>
          <CardDescription className="text-xs">
            Use this live chart to practice identifying trends, patterns, support/resistance levels, and more.
            You can change the symbol and time interval directly within the chart.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          {/* This outer div defines the space the chart widget can fill */}
          <div style={{ height: '600px', width: '100%' }}>
            <TradingViewAdvancedChart
              symbol="NASDAQ:AAPL" // Default symbol
              interval="D"      // Default interval (Daily)
              theme="light"     // Keep it light for simplicity
              autosize={true}   // Let the widget fill the container
              // height and width props for TradingViewAdvancedChart are for non-autosize scenarios primarily,
              // or to pass through to the widget if it uses them with autosize.
              // For autosize, the div above (with style height: '600px') is key.
            />
          </div>
        </CardContent>
      </Card>
      <Card className="border">
        <CardHeader className="p-2 md:p-3">
            <CardTitle className="text-md flex items-center">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Practice Tips
            </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-3 text-sm space-y-1">
            <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Try different symbols (e.g., BTCUSD, EURUSD, GOOGL, TSLA).</li>
                <li>Switch between timeframes (e.g., 5m, 15m, 1H, 4H, 1D, 1W) to see different perspectives.</li>
                <li>Use the drawing tools (on the left toolbar of the chart) to mark trendlines, support, and resistance levels.</li>
                <li>Add technical indicators like Moving Averages, RSI, or MACD from the &quot;Indicators&quot; menu at the top of the chart.</li>
                <li>Observe how price reacts around key levels or during news events (if visible).</li>
                <li>Practice zooming in and out to get a broader or more detailed view.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}