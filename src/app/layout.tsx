
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import NextNProgress from 'nextjs-toploader';
import { LayoutClientWrapper } from './layout-client-wrapper';
import { PrayerTimeProvider } from '@/contexts/prayer-time-context';

export const metadata: Metadata = {
  title: {
    template: '%s | Oday Ai',
    default: 'Oday Ai - Unlock Market Insights',
  },
  description: 'Use AI to analyze financial charts, predict trends, and assess risk. Your expert trading co-pilot.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased">
      <NextNProgress color="#2563EB" height={4} showSpinner={false} />
      <AuthProvider>
        <PrayerTimeProvider>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </PrayerTimeProvider>
      </AuthProvider>
      </body>
    </html>
  );
}
