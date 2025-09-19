'use client';

import { ReactNode } from 'react';
import { authClient } from '@/lib/auth/cloudflare-client';

// Better Auth 네이티브 훅들을 그대로 사용
export const { useSession, useListSessions } = authClient;

// 호환성을 위한 wrapper 함수들
export function useAuth() {
  const session = useSession();
  
  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      console.log('🔄 Better Auth: Google 로그인 시작...');
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo || window.location.origin,
      });
      console.log('✅ Better Auth: Google 로그인 요청 완료');
    } catch (error) {
      console.error('❌ Better Auth: Google 로그인 실패:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Better Auth: 로그아웃 중...');
      await authClient.signOut();
      console.log('✅ Better Auth: 로그아웃 완료');
      
      // 페이지 새로고침으로 상태 초기화
      window.location.reload();
    } catch (error) {
      console.error('❌ Better Auth: 로그아웃 실패:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Better Auth: 세션 새로고침...');
      // Better Auth는 자체적으로 세션을 관리하므로 명시적 새로고침이 필요 없음
      // 하지만 호환성을 위해 함수는 유지
      console.log('✅ Better Auth: 세션 새로고침 완료');
    } catch (error) {
      console.error('❌ Better Auth: 세션 새로고침 실패:', error);
    }
  };

  return {
    data: session.data,
    isPending: session.isPending,
    error: session.error,
    signInWithGoogle,
    signOut,
    refreshSession,
  };
}

export function useAuthActions() {
  const auth = useAuth();
  
  return {
    signInWithGoogle: auth.signInWithGoogle,
    signOut: auth.signOut,
    refreshSession: auth.refreshSession,
  };
}

// AuthProvider는 더 이상 필요하지 않음 - Better Auth가 자체 provider 제공
// 하지만 호환성을 위해 빈 wrapper 컴포넌트 제공
export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🚀 Better Auth: 네이티브 provider 사용 중');
  return <>{children}</>;
}