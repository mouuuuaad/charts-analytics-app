
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market News',
  description: 'Get the latest financial news on stocks, crypto, forex, and the global economy.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
