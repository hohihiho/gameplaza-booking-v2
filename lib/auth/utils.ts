import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/better-db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * 인증된 사용자 정보를 가져오는 유틸리티 함수
 */
export async function getAuthenticatedUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return null;
    }

    // DB에서 사용자 정보 조회
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}

/**
 * 관리자 권한 확인
 */
export async function requireAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * 슈퍼 관리자 권한 확인
 */
export async function requireSuperAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    );
  }

  if (user.role !== 'super_admin') {
    return NextResponse.json(
      { error: '슈퍼 관리자 권한이 필요합니다' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * 사용자 인증 확인 (일반 사용자 포함)
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    );
  }

  return user;
}

/**
 * 사용자 역할 확인
 */
export function hasRole(user: any, roles: string[]) {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}

/**
 * 사용자가 특정 리소스의 소유자인지 확인
 */
export function isOwner(user: any, resourceOwnerId: string) {
  if (!user || !user.id) return false;
  return user.id === resourceOwnerId;
}

/**
 * 사용자가 리소스에 접근 권한이 있는지 확인
 * (소유자이거나 관리자인 경우)
 */
export function canAccess(user: any, resourceOwnerId: string) {
  if (!user) return false;

  // 관리자는 모든 리소스 접근 가능
  if (hasRole(user, ['admin', 'super_admin'])) {
    return true;
  }

  // 소유자인 경우 접근 가능
  return isOwner(user, resourceOwnerId);
}

/**
 * 세션에서 사용자 ID 추출
 */
export async function getUserIdFromSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    return session?.user?.id || null;
  } catch (error) {
    console.error('getUserIdFromSession error:', error);
    return null;
  }
}

/**
 * API 응답 헬퍼
 */
export const apiResponse = {
  unauthorized: () => NextResponse.json(
    { error: '인증이 필요합니다' },
    { status: 401 }
  ),

  forbidden: () => NextResponse.json(
    { error: '권한이 없습니다' },
    { status: 403 }
  ),

  notFound: (message = '리소스를 찾을 수 없습니다') => NextResponse.json(
    { error: message },
    { status: 404 }
  ),

  badRequest: (message = '잘못된 요청입니다') => NextResponse.json(
    { error: message },
    { status: 400 }
  ),

  serverError: (message = '서버 오류가 발생했습니다') => NextResponse.json(
    { error: message },
    { status: 500 }
  ),

  success: (data: any, status = 200) => NextResponse.json(
    data,
    { status }
  )
};

export default {
  getAuthenticatedUser,
  requireAdmin,
  requireSuperAdmin,
  requireAuth,
  hasRole,
  isOwner,
  canAccess,
  getUserIdFromSession,
  apiResponse
};