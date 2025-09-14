'use client';

import { useState, useEffect } from 'react';

// Session 관련 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'gp_vip' | 'gp_regular' | 'gp_user' | 'restricted';
  image?: string;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface UseSessionReturn {
  data: Session | null;
  status: SessionStatus;
  loading: boolean;
  update: () => Promise<void>;
}

/**
 * JWT 기반 인증 시스템용 useSession hook
 * NextAuth useSession과 호환되는 인터페이스를 제공합니다.
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const fetchSession = async () => {
    try {
      setLoading(true);
      setStatus('loading');

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          const sessionData: Session = {
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role || 'gp_user',
              image: data.user.image,
              nickname: data.user.nickname,
              createdAt: data.user.createdAt ? new Date(data.user.createdAt) : new Date(),
              updatedAt: data.user.updatedAt ? new Date(data.user.updatedAt) : new Date(),
            }
          };

          setSession(sessionData);
          setStatus('authenticated');
        } else {
          setSession(null);
          setStatus('unauthenticated');
        }
      } else {
        // 401, 403 등의 경우 인증되지 않은 상태로 처리
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

  const update = async () => {
    await fetchSession();
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return {
    data: session,
    status,
    loading,
    update,
  };
}

/**
 * NextAuth 호환성을 위한 기본 export
 */
export default useSession;