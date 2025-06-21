
'use client'; // Required for usePathname

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { usePathname } from 'next/navigation';
import { GlobalInspirationNotifier } from '@/components/layout/GlobalInspirationNotifier';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ChartSight AI</title>
        <meta name="description" content="AI chart analysis" />
        {/* Removing Google Fonts for a more "system" feel */}
      </head>
      <body className="antialiased">
        <AuthProvider>
          {isLandingPage ? (
            <>
              {children}
            </>
          ) : (
            <AppShell>
              {children}
            </AppShell>
          )}
          <GlobalInspirationNotifier />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
