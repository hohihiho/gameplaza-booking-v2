import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';
import { ExtendedSession, ExtendedUser, AuthResponse, AuthenticatedRequest } from './types';

export type { AuthenticatedRequest };

/**
 * 세션에서 현재 사용자 정보를 가져옵니다.
 * @returns 확장된 세션 정보 또는 null
 */
export async function getSession(): Promise<ExtendedSession | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return null;
    }
    
    return session as ExtendedSession;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

/**
 * 현재 사용자의 상세 정보를 가져옵니다.
 * @returns 확장된 사용자 정보 또는 null
 */
export async function getCurrentUser(): Promise<ExtendedUser | null> {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return null;
    }

    const supabaseAdmin = createAdminClient();
    
    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, nickname, phone, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return null;
    }

    // 관리자 권한 확인
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      nickname: userData.nickname || undefined,
      phone: userData.phone || undefined,
      image: session.user.image,
      role: adminData ? 'admin' : 'user',
      isAdmin: !!adminData,
      isSuperAdmin: adminData?.is_super_admin || false
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * 인증이 필요한 경우 사용합니다.
 * @returns 인증된 사용자 정보
 * @throws 인증되지 않은 경우 예외 발생
 */
export async function requireAuth(): Promise<ExtendedUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * 관리자 권한이 필요한 경우 사용합니다.
 * @returns 관리자 사용자 정보
 * @throws 관리자가 아닌 경우 예외 발생
 */
export async function requireAdmin(): Promise<ExtendedUser> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * 슈퍼 관리자 권한이 필요한 경우 사용합니다.
 * @returns 슈퍼 관리자 사용자 정보
 * @throws 슈퍼 관리자가 아닌 경우 예외 발생
 */
export async function requireSuperAdmin(): Promise<ExtendedUser> {
  const user = await requireAdmin();
  
  if (!user.isSuperAdmin) {
    throw new Error('Super admin access required');
  }
  
  return user;
}

/**
 * API 라우트용 인증 헬퍼
 * @param handler API 핸들러 함수
 * @param options 인증 옵션
 * @returns 래핑된 API 핸들러
 */
export function withAuth<T = any>(
  handler: (req: NextRequest, context: { user: ExtendedUser }) => Promise<NextResponse<T>>,
  options: {
    requireAdmin?: boolean;
    requireSuperAdmin?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse<AuthResponse<T>>> => {
    try {
      let user: ExtendedUser | null = null;

      if (options.requireSuperAdmin) {
        user = await requireSuperAdmin();
      } else if (options.requireAdmin) {
        user = await requireAdmin();
      } else {
        user = await requireAuth();
      }

      return await handler(req, { user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      
      if (message.includes('Authentication required')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
      
      if (message.includes('Admin access required') || message.includes('Super admin access required')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * 사용자 ID로 사용자 정보를 가져옵니다.
 * @param userId 사용자 ID
 * @returns 사용자 정보 또는 null
 */
export async function getUserById(userId: string): Promise<ExtendedUser | null> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, nickname, phone, role')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return null;
    }

    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userId)
      .single();

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      nickname: userData.nickname || undefined,
      phone: userData.phone || undefined,
      image: null,
      role: adminData ? 'admin' : 'user',
      isAdmin: !!adminData,
      isSuperAdmin: adminData?.is_super_admin || false
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
}

/**
 * 이메일로 사용자 정보를 가져옵니다.
 * @param email 사용자 이메일
 * @returns 사용자 정보 또는 null
 */
export async function getUserByEmail(email: string): Promise<ExtendedUser | null> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, nickname, phone, role')
      .eq('email', email)
      .single();

    if (error || !userData) {
      return null;
    }

    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      nickname: userData.nickname || undefined,
      phone: userData.phone || undefined,
      image: null,
      role: adminData ? 'admin' : 'user',
      isAdmin: !!adminData,
      isSuperAdmin: adminData?.is_super_admin || false
    };
  } catch (error) {
    console.error('Get user by email error:', error);
    return null;
  }
}