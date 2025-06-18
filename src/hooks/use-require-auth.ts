'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth(redirectUrl = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      if (pathname !== '/login' && pathname !== '/signup') {
         router.push(redirectUrl);
      }
    }
  }, [user, loading, router, redirectUrl, pathname]);

  return { user, loading };
}
