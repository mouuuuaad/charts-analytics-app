
'use client'; // Required for usePathname

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { usePathname } from 'next/navigation';

// Metadata can be static or dynamic. For simplicity, keeping it static here.
// If dynamic metadata is needed, this component would need to be structured differently
// or metadata handled at page level.
// export const metadata: Metadata = {
// title: 'ChartSight AI',
// description: 'AI-powered chart analysis and trend prediction',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  // Add other public routes if they shouldn't have AppShell
  // const publicRoutes = ['/', '/login', '/signup'];
  // const showAppShell = !publicRoutes.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ChartSight AI</title>
        <meta name="description" content="AI-powered chart analysis and trend prediction" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
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
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
