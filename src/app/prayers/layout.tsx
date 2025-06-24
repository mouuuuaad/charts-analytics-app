
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Times',
  description: 'View daily prayer times based on your location.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
