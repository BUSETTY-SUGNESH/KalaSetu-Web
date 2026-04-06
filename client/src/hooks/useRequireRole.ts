'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

/**
 * Hook to protect routes by role.
 * Redirects to login if not authenticated,
 * or to /dashboard if authenticated but wrong role.
 */
export function useRequireRole(allowedRoles: UserRole[]) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const hasAllowed = allowedRoles.some((r) => hasRole(r));
    if (!hasAllowed) {
      router.replace('/dashboard');
    }
  }, [user, loading, hasRole, allowedRoles, router]);

  return {
    user,
    loading,
    authorized: user ? allowedRoles.some((r) => hasRole(r)) : false,
  };
}
