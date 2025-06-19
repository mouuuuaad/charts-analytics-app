
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth(redirectUrl = '/') { // Default redirect to landing page
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Only redirect if not already on a public page that might be the redirect target
      // For example, if redirectUrl is '/' (landing page), don't redirect if already on '/'.
      // This handles cases where auth state changes while on a public page.
      if (pathname !== redirectUrl) { 
         router.push(redirectUrl);
      }
    }
  }, [user, loading, router, redirectUrl, pathname]);

  return { user, loading };
}
