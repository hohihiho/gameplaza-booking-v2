import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 슈퍼관리자 권한 확인 유틸리티
 */
export interface SuperAdminCheckResult {
  isSuperAdmin: boolean;
  adminId?: string;
  userId?: string;
  error?: string;
}

/**
 * Request 헤더에서 슈퍼관리자 여부 확인
 */
export function isSuperAdminFromHeaders(request: NextRequest): boolean {
  return request.headers.get('x-is-superadmin') === 'true';
}

/**
 * 사용자 ID로 슈퍼관리자 정보 조회
 */
export async function getSuperAdminInfo(userId: string): Promise<SuperAdminCheckResult> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // admins 테이블에서 슈퍼관리자 정보 조회
    const { data: adminData, error } = await supabaseAdmin
      .from('admins')
      .select('id, user_id, is_super_admin')
      .eq('user_id', userId)
      .eq('is_super_admin', true)
      .single();
    
    if (error || !adminData) {
      return { isSuperAdmin: false, error: '슈퍼관리자가 아닙니다' };
    }
    
    return {
      isSuperAdmin: true,
      adminId: adminData.id,
      userId: adminData.user_id
    };
  } catch (error) {
    console.error('Super admin check error:', error);
    return { isSuperAdmin: false, error: '권한 확인 중 오류가 발생했습니다' };
  }
}

/**
 * API Route에서 슈퍼관리자 권한 확인
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const superAdminCheck = await requireSuperAdmin(request);
 *   if (!superAdminCheck.isSuperAdmin) {
 *     return NextResponse.json(
 *       { error: superAdminCheck.error },
 *       { status: 403 }
 *     );
 *   }
 *   
 *   // 슈퍼관리자만 실행 가능한 로직
 * }
 * ```
 */
export async function requireSuperAdmin(request: NextRequest): Promise<SuperAdminCheckResult> {
  // 1. 미들웨어에서 설정한 헤더 확인
  const isSuperAdminHeader = isSuperAdminFromHeaders(request);
  if (!isSuperAdminHeader) {
    return { isSuperAdmin: false, error: '슈퍼관리자 권한이 필요합니다' };
  }
  
  // 2. 사용자 ID 확인
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return { isSuperAdmin: false, error: '인증 정보가 없습니다' };
  }
  
  // 3. DB에서 슈퍼관리자 정보 재확인 (보안을 위해)
  return await getSuperAdminInfo(userId);
}

/**
 * 특정 경로에 슈퍼관리자 전용 보호 추가
 */
export const superAdminProtectedPaths = [
  '/api/admin/admins',  // 관리자 관리 API
  '/admin/admins',      // 관리자 관리 페이지
];

/**
 * 경로가 슈퍼관리자 전용인지 확인
 */
export function isSuperAdminOnlyPath(pathname: string): boolean {
  return superAdminProtectedPaths.some(path => pathname.startsWith(path));
}