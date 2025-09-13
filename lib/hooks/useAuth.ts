'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  image?: string;
  nickname?: string;
}

export interface Session {
  user: User | null;
}

// 클라이언트 사이드 세션 훅
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v3/auth/session');
      const data = await response.json();

      if (data.user) {
        setSession({ user: data.user });
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('세션 조회 실패:', error);
      setSession(null);
      setStatus('unauthenticated');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const update = () => {
    return fetchSession();
  };

  return {
    data: session,
    status,
    loading,
    update
  };
}

// 로그아웃 함수
export async function signOut(options?: { callbackUrl?: string }) {
  try {
    const response = await fetch('/api/v3/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // 브라우저에서 토큰 쿠키 제거
      document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // 리다이렉트
      const callbackUrl = options?.callbackUrl || '/';
      window.location.href = callbackUrl;
    }
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
}

// 로그인 상태 확인 훅 (기존 useAuth 호환)
export function useAuth() {
  const { data: session, status, loading, update } = useSession();

  return {
    user: session?.user || null,
    isAuthenticated: status === 'authenticated',
    loading,
    isAdmin: session?.user?.isAdmin || false,
    isSuperAdmin: session?.user?.isSuperAdmin || false,
    refetch: update
  };
}