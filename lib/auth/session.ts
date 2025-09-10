import getNextAuthSession from 'next-auth';
import { authOptions } from "@/lib/auth/server";
import { cache } from 'react';
import { ExtendedSession } from './types';

/**
 * 캐시된 세션 가져오기 (React Server Component에서 사용)
 * 동일한 요청에서 여러 번 호출되어도 한 번만 실행됩니다.
 */
export const getServerSession = cache(async (): Promise<ExtendedSession | null> => {
  try {
    const session = await getNextAuthSession(authOptions);
    return session as ExtendedSession;
  } catch (error) {
    console.error('Get server session error:', error);
    return null;
  }
});

/**
 * 세션 유효성 검사
 */
export function isSessionValid(session: ExtendedSession | null): boolean {
  if (!session?.user?.email) {
    return false;
  }
  
  // 세션 만료 확인
  if (session.expires) {
    const expiryDate = new Date(session.expires);
    if (expiryDate < new Date()) {
      return false;
    }
  }
  
  return true;
}

/**
 * 세션에서 사용자 ID 추출
 */
export function getUserIdFromSession(session: ExtendedSession | null): string | null {
  if (!isSessionValid(session)) {
    return null;
  }
  
  return session?.user?.id || null;
}

/**
 * 세션에서 관리자 여부 확인
 */
export function isAdminSession(session: ExtendedSession | null): boolean {
  if (!isSessionValid(session)) {
    return false;
  }
  
  return session?.user?.isAdmin || false;
}

/**
 * 세션에서 슈퍼 관리자 여부 확인
 */
export function isSuperAdminSession(session: ExtendedSession | null): boolean {
  if (!isSessionValid(session)) {
    return false;
  }
  
  return session?.user?.isSuperAdmin || false;
}