
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analysis History',
  description: 'Review your past chart analyses and AI predictions.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
