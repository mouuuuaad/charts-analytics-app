
'use client';

import { usePrayerTime } from '@/contexts/prayer-time-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sunrise, Sun, Sunset, Moon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PrayersPage() {
  const { prayerTimes, nextPrayer, city, country, isLoading } = usePrayerTime();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Fetching prayer times for your location...</p>
        </div>
      </div>
    );
  }

  if (!prayerTimes || prayerTimes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center">
        <p className="text-destructive">Could not load prayer times. Please try again later.</p>
      </div>
    );
  }
  
  const prayerIcons = {
    Fajr: <Sunrise className="h-5 w-5" />,
    Dhuhr: <Sun className="h-5 w-5" />,
    Asr: <Sun className="h-5 w-5 text-orange-400" />,
    Maghrib: <Sunset className="h-5 w-5" />,
    Isha: <Moon className="h-5 w-5" />,
  };

  const now = new Date();

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Prayer Times</CardTitle>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1.5" />
            <CardDescription>{city}, {country} - {format(now, 'EEEE, MMMM d, yyyy')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2">
                {prayerTimes.map((prayer) => {
                    const isNext = prayer.name === nextPrayer?.name;
                    const hasPassed = now > prayer.time && !isNext;
                    return (
                        <li key={prayer.name}>
                            <Card className={cn(
                                "p-3 transition-all",
                                isNext && "border-primary ring-2 ring-primary/50 shadow-lg",
                                hasPassed && "bg-muted/50 text-muted-foreground"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-full", isNext ? "bg-primary/10" : "bg-muted")}>
                                            {prayerIcons[prayer.name]}
                                        </div>
                                        <span className={cn("text-lg font-medium", isNext && "text-primary")}>{prayer.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-xl font-bold font-mono", isNext && "text-primary")}>{format(prayer.time, 'hh:mm a')}</p>
                                        {isNext && <p className="text-xs text-primary font-semibold">Next Prayer</p>}
                                        {hasPassed && <p className="text-xs">Passed</p>}
                                    </div>
                                </div>
                            </Card>
                        </li>
                    );
                })}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
