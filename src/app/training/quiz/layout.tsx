
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Training Quiz',
  description: 'Test your trading knowledge with our AI-powered quiz.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
