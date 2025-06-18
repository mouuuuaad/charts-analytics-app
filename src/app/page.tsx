
'use client';

import { AnalysisSection } from '@/components/dashboard/analysis-section';
// import { useRequireAuth } from '@/hooks/use-require-auth'; // Auth disabled
// import { Loader2 } from 'lucide-react'; // Not needed if auth is disabled

export default function DashboardPage() {
  // const { user, loading } = useRequireAuth(); // Auth disabled

  // if (loading || !user) { // Auth disabled
  //   return (
  //     <div className="flex h-[calc(100vh-theme(spacing.14))] items-center justify-center">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //     </div>
  //   );
  // }

  return (
    <div className="w-full">
      <AnalysisSection />
    </div>
  );
}
