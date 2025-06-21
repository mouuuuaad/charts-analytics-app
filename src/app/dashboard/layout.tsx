
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Upload or capture a chart for instant AI-powered technical analysis.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
