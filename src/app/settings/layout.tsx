
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Customize your application settings and manage your data.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
