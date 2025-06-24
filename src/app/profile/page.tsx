'use client';

import { Suspense } from 'react';
import { ProfilePageContent } from './ProfilePageContent';
import { Loader2 } from 'lucide-react';

// Loading component
function ProfileLoading() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

// Main profile page component with Suspense wrapper
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePageContent />
    </Suspense>
  );
}