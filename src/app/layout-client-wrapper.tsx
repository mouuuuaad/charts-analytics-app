
'use client';

import { AppShell } from '@/components/layout/app-shell';
import { GlobalInspirationNotifier } from '@/components/layout/GlobalInspirationNotifier';
import { PrayerReminderOverlay } from '@/components/prayer/PrayerReminderOverlay';
import { PrayerTimeModal } from '@/components/prayer/PrayerTimeModal';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <>
      {isLandingPage ? <>{children}</> : <AppShell>{children}</AppShell>}
      <GlobalInspirationNotifier />
      <Toaster />
      <PrayerTimeModal />
      <PrayerReminderOverlay />
    </>
  );
}
