
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Charts',
  description: 'Use live, interactive charts to practice your technical analysis skills.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
