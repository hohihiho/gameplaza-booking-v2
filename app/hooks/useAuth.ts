'use client';

import { useAuth as useBetterAuth, useIsAdmin, usePermission } from '../components/BetterAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 인증 관련 커스텀 훅 - Better Auth 버전
 */
export function useAuth(requireAuth = false) {
  const { user, session, loading, signIn, signOut } = useBetterAuth();
  const router = useRouter();
  const { isAdmin, isSuperAdmin } = useIsAdmin();

  useEffect(() => {
    if (requireAuth && !loading && !session) {
      router.push('/login');
    }
  }, [requireAuth, loading, session, router]);

  return {
    user: user || null,
    isAuthenticated: !!session?.user,
    isAdmin,
    isSuperAdmin,
    loading,
    status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated',
    signIn,
    signOut
  };
}

/**
 * 관리자 권한이 필요한 경우 사용
 */
export function useRequireAdmin() {
  const { isAdmin, loading } = useIsAdmin();
  const { session } = useBetterAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, session, router]);

  return { isAdmin, loading };
}

/**
 * 슈퍼 관리자 권한이 필요한 경우 사용
 */
export function useRequireSuperAdmin() {
  const { isSuperAdmin, loading } = useIsAdmin();
  const { session } = useBetterAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, loading, session, router]);

  return { isSuperAdmin, loading };
}

/**
 * 특정 권한이 필요한 경우 사용
 */
export function useRequirePermission(requiredRole: string) {
  const { hasPermission, loading } = usePermission(requiredRole);
  const { session } = useBetterAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session && !hasPermission) {
      router.push('/');
    }
  }, [hasPermission, loading, session, router]);

  return { hasPermission, loading };
}

/**
 * 제재 상태 체크 훅
 */
export function useSanctionCheck() {
  const { user, loading } = useBetterAuth();
  
  const isBanned = user?.is_blacklisted || false;
  const isRestricted = user?.is_restricted || false;
  
  let restrictedUntil: Date | null = null;
  if (user?.restricted_until) {
    restrictedUntil = new Date(user.restricted_until);
  }
  
  const isCurrentlyRestricted = isRestricted && restrictedUntil && restrictedUntil > new Date();
  
  return {
    isBanned,
    isRestricted: isCurrentlyRestricted,
    restrictedUntil,
    loading
  };
}