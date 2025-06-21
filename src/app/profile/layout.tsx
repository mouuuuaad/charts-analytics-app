
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Manage your user profile, subscription, and trading level.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
