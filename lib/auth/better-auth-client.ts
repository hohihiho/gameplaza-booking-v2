'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Session {
  user: User;
  expires: string;
}

interface UseSessionReturn {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

// Better Auth 세션 훅
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        const response = await fetch('/api/better-auth/session', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!mounted) return;
        
        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData && sessionData.user) {
            setSession({
              user: {
                id: sessionData.user.id,
                name: sessionData.user.name || sessionData.user.email,
                email: sessionData.user.email,
                image: sessionData.user.image
              },
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일
            });
            setStatus('authenticated');
          } else {
            setSession(null);
            setStatus('unauthenticated');
          }
        } else {
          setSession(null);
          setStatus('unauthenticated');
        }
      } catch (error) {
        console.error('세션 확인 오류:', error);
        if (mounted) {
          setSession(null);
          setStatus('unauthenticated');
        }
      }
    };

    checkSession();
    
    // 주기적으로 세션 상태 확인 (5분마다)
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    data: session,
    status
  };
}

// Better Auth 로그인 함수
export async function signIn(email: string, password: string) {
  try {
    const response = await fetch('/api/better-auth/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      window.location.reload(); // 세션 상태 새로고침
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || '로그인 실패' };
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, error: '네트워크 오류' };
  }
}

// Better Auth 로그아웃 함수  
export async function signOut() {
  try {
    const response = await fetch('/api/better-auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (response.ok) {
      window.location.href = '/'; // 홈으로 리다이렉트
    }
  } catch (error) {
    console.error('로그아웃 오류:', error);
    // 에러가 발생해도 홈으로 이동
    window.location.href = '/';
  }
}

// Better Auth 회원가입 함수
export async function signUp(email: string, password: string, name: string) {
  try {
    const response = await fetch('/api/better-auth/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name })
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || '회원가입 실패' };
    }
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { success: false, error: '네트워크 오류' };
  }
}