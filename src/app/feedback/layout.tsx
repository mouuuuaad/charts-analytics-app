
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Share your feedback and suggestions with the Oday Ai community.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
