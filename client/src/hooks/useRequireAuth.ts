'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, redirectTo, router]);

  return { user, loading };
};
