'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface AdminAuthState {
  isAdmin: boolean;
  role: 'admin' | 'super_admin' | null;
  loading: boolean;
  error: string | null;
}

export function useAdminAuth(requiredRole?: 'admin' | 'super_admin') {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAdmin: false,
    role: null,
    loading: true,
    error: null
  });

  const { isAuthenticated, loading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const checkAdminAuth = async () => {
      try {
        if (!isAuthenticated) {
          setAuthState({
            isAdmin: false,
            role: null,
            loading: false,
            error: '로그인이 필요합니다'
          });
          router.push('/login');
          return;
        }

        const response = await fetch('/api/admin/auth/check', {
          headers: {
            'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)authToken\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
          }
        });
        const data = await response.json();

        if (!response.ok || !data.isAdmin) {
          setAuthState({
            isAdmin: false,
            role: null,
            loading: false,
            error: '관리자 권한이 없습니다'
          });
          router.push('/');
          return;
        }

        // 특정 역할이 필요한 경우 체크
        if (requiredRole && data.role !== requiredRole) {
          setAuthState({
            isAdmin: true,
            role: data.role,
            loading: false,
            error: `${requiredRole === 'super_admin' ? '슈퍼' : ''}관리자 권한이 필요합니다`
          });
          router.push('/admin');
          return;
        }

        setAuthState({
          isAdmin: true,
          role: data.role,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Admin auth check error:', error);
        setAuthState({
          isAdmin: false,
          role: null,
          loading: false,
          error: '권한 확인 중 오류가 발생했습니다'
        });
      }
    };

    checkAdminAuth();
  }, [isAuthenticated, authLoading, router, requiredRole, isAdmin, isSuperAdmin]);

  return authState;
}