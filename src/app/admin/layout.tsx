
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Manage the application and view feedback.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
