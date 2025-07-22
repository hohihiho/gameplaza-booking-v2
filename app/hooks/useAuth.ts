'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 인증 관련 커스텀 훅
 */
export function useAuth(requireAuth = false) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [requireAuth, status, router]);

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isAdmin: session?.user?.isAdmin || false,
    isSuperAdmin: session?.user?.isSuperAdmin || false,
    loading: status === 'loading',
    status
  };
}

/**
 * 관리자 권한이 필요한 경우 사용
 */
export function useRequireAdmin() {
  const { isAdmin, loading, status } = useAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && status === 'authenticated' && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, status, router]);

  return { isAdmin, loading };
}

/**
 * 슈퍼 관리자 권한이 필요한 경우 사용
 */
export function useRequireSuperAdmin() {
  const { isSuperAdmin, loading, status } = useAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && status === 'authenticated' && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, loading, status, router]);

  return { isSuperAdmin, loading };
}