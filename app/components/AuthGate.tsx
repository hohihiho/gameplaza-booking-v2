'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { useRouter, usePathname } from 'next/navigation';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  shouldShowSignup: boolean;
}

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean; // 인증이 필요한 페이지인지
}

export default function AuthGate({ children, requireAuth = false }: AuthGateProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    isProfileComplete: false,
    shouldShowSignup: false,
  });

  useEffect(() => {
    async function checkAuthState() {
      // 세션 로딩 중이면 대기
      if (isPending) {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      // 인증되지 않은 경우
      if (!session?.user) {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          isProfileComplete: false,
          shouldShowSignup: false,
        });
        
        // 인증이 필요한 페이지면 로그인 페이지로 이동
        if (requireAuth && pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      // 인증된 경우 프로필 상태 확인
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          const isProfileComplete = data.exists && !data.incomplete;
          
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
            isProfileComplete,
            shouldShowSignup: data.exists && data.incomplete, // 프로필이 불완전한 경우
          });
        } else {
          // 프로필 API 실패 시 기본값
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
            isProfileComplete: false,
            shouldShowSignup: true,
          });
        }
      } catch (error) {
        console.error('Profile check error:', error);
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          isProfileComplete: false,
          shouldShowSignup: true,
        });
      }
    }

    checkAuthState();
  }, [session, isPending, router, pathname, requireAuth]);

  // 로딩 중
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 홈페이지에서 로그인한 사용자가 회원가입이 필요한 경우
  if (pathname === '/' && authState.isAuthenticated && authState.shouldShowSignup) {
    // 회원가입 페이지로 즉시 교체 (리다이렉트 없이)
    router.replace('/signup');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">회원가입 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 회원가입 페이지에서 프로필이 완전한 경우
  if (pathname === '/signup' && authState.isAuthenticated && authState.isProfileComplete) {
    // 홈페이지로 즉시 교체 (리다이렉트 없이)
    router.replace('/');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">홈페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 페이지에서 이미 인증된 경우
  if (pathname === '/login' && authState.isAuthenticated) {
    if (authState.shouldShowSignup) {
      router.replace('/signup');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">회원가입 페이지로 이동 중...</p>
          </div>
        </div>
      );
    } else {
      router.replace('/');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">홈페이지로 이동 중...</p>
          </div>
        </div>
      );
    }
  }

  // 모든 조건을 통과한 경우 children 렌더링
  return <>{children}</>;
}