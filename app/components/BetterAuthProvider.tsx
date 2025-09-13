'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  nickname?: string;
  role: string;
  is_blacklisted: boolean;
  is_restricted: boolean;
  restricted_until?: string;
}

interface Session {
  user: User;
  expires: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (provider: string) => Promise<void>;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refetch: async () => {}
});

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 세션 가져오기
  const fetchSession = async () => {
    try {
      const response = await fetch('/api/v3/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setSession({
            user: data.user,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후
          });
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchSession();
  }, []);

  // 경로 변경 시 세션 재확인
  useEffect(() => {
    if (!loading) {
      fetchSession();
    }
  }, [pathname]);

  // Google 로그인
  const signIn = async (provider: string) => {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // 쿠키 삭제
        document.cookie = 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setSession(null);
        router.push('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 세션 새로고침
  const refetch = async () => {
    await fetchSession();
  };

  // 제재 상태 체크
  useEffect(() => {
    if (!loading && session?.user) {
      // 정지 상태 체크
      if (session.user.is_blacklisted) {
        signOut();
        router.push('/auth/banned');
        return;
      }

      // 제한 상태 체크
      if (session.user.is_restricted && session.user.restricted_until) {
        const now = new Date();
        const restrictedUntil = new Date(session.user.restricted_until);
        
        if (now >= restrictedUntil) {
          // 제한 기간 만료 - 자동 해제 API 호출
          fetch('/api/auth/unrestrict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session.user.id })
          }).then(() => {
            refetch();
          });
        }
      }
    }
  }, [session, loading]);

  return (
    <AuthContext.Provider 
      value={{
        session,
        user: session?.user || null,
        loading,
        signIn,
        signOut,
        refetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within BetterAuthProvider');
  }
  return context;
}

// 관리자 체크 Hook
export function useIsAdmin() {
  const { user, loading } = useAuth();
  
  const roleHierarchy: Record<string, number> = {
    'user': 0,
    'restricted': -1,
    'banned': -2,
    'staff': 1,
    'admin': 2,
    'superadmin': 3
  };
  
  const isAdmin = user ? (roleHierarchy[user.role] || 0) >= 2 : false;
  const isSuperAdmin = user?.role === 'superadmin';
  
  return { isAdmin, isSuperAdmin, loading };
}

// 권한 체크 Hook
export function usePermission(requiredRole: string) {
  const { user, loading } = useAuth();
  
  const roleHierarchy: Record<string, number> = {
    'user': 0,
    'restricted': -1,
    'banned': -2,
    'staff': 1,
    'admin': 2,
    'superadmin': 3
  };
  
  const userLevel = user ? (roleHierarchy[user.role] || 0) : -3;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  const hasPermission = userLevel >= requiredLevel;
  
  return { hasPermission, loading };
}