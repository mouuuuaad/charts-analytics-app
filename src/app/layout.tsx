
'use client'; // Required for usePathname

// Removed Metadata import as title/meta tags are directly in <head>
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { usePathname } from 'next/navigation';

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
        <title>ChartSight AI</title> {/* Simplified title */}
        <meta name="description" content="AI chart analysis" /> {/* Simplified description */}
        {/* Removing Google Fonts for a more "system" feel */}
      </head>
      <body className="antialiased"> {/* Removed font-body as it's set in globals.css now */}
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
