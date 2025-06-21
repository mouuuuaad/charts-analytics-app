
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Training',
  description: 'Test and improve your trading knowledge with our AI-powered quiz and interactive tools.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
