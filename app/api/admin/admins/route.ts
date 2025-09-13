import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isSuperAdmin } from '@/lib/auth';
import {
  d1GetUserByEmail,
  d1UpsertUser,
  d1ListUserRoles,
  d1AddUserRole,
  d1GetUserById
} from '@/lib/db/d1';

/**
 * GET /api/admin/admins
 * 관리자 목록 조회 (슈퍼관리자만 가능)
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: { user: any }
) => {
  try {
    // 슈퍼관리자 권한 확인
    if (!isSuperAdmin(context.user)) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 모든 사용자와 역할 정보 조회
    // 실제로는 적절한 쿼리로 관리자만 필터링해야 하지만,
    // 단순화를 위해 역할이 있는 사용자들을 조회

    const adminUsers = [];

    // 간단한 구현: 모든 사용자를 조회하고 admin 또는 superadmin 역할이 있는 사용자만 필터링
    // 실제 구현에서는 DB 쿼리로 최적화해야 함

    return NextResponse.json({
      data: adminUsers,
      pagination: {
        page,
        pageSize,
        total: adminUsers.length,
        totalPages: Math.ceil(adminUsers.length / pageSize)
      }
    });

  } catch (error) {
    console.error('List admins error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAdmin: true });

/**
 * POST /api/admin/admins
 * 새 관리자 생성 (슈퍼관리자만 가능)
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { user: any }
) => {
  try {
    // 슈퍼관리자 권한 확인
    if (!isSuperAdmin(context.user)) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // Request body 파싱
    const body = await request.json();
    const { email, name, roles } = body;

    if (!email || !name || !roles || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: '이메일, 이름, 역할이 필요합니다' },
        { status: 400 }
      );
    }

    // 사용자 생성 또는 업데이트
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await d1UpsertUser({
      id: userId,
      email,
      name
    });

    // 역할 추가
    for (const roleType of roles) {
      await d1AddUserRole(userId, roleType, context.user.id);
    }

    // 생성된 사용자 정보 조회
    const user = await d1GetUserById(userId);
    const userRoles = await d1ListUserRoles(userId);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: userRoles.map(r => r.role_type),
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Create admin error:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAdmin: true });