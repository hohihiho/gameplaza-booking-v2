import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isSuperAdmin } from '@/lib/auth';
import { d1GetUserById, d1GetUserByEmail, d1ListUserRoles, d1AddUserRole, d1RemoveUserRole } from '@/lib/db/d1';

/**
 * GET /api/admin/admins/[id]
 * 관리자 상세 조회 (슈퍼관리자만 가능)
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: { user: any; params: Promise<{ id: string }> }
) => {
  try {
    // 슈퍼관리자 권한 확인
    if (!isSuperAdmin(context.user)) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // params 추출
    const { id } = await context.params;

    // 사용자 정보 조회
    const user = await d1GetUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자의 역할 조회
    const roles = await d1ListUserRoles(id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: roles.map(r => r.role_type),
      created_at: user.created_at,
      updated_at: user.updated_at
    });

  } catch (error) {
    console.error('Get admin detail error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAdmin: true });

/**
 * PATCH /api/admin/admins/[id]
 * 관리자 권한 수정 (슈퍼관리자만 가능)
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  context: { user: any; params: Promise<{ id: string }> }
) => {
  try {
    // 슈퍼관리자 권한 확인
    if (!isSuperAdmin(context.user)) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // params 추출
    const { id } = await context.params;

    // Request body 파싱
    const body = await request.json();
    const { roles } = body;

    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: '역할 정보가 필요합니다' },
        { status: 400 }
      );
    }

    // 사용자 확인
    const user = await d1GetUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 기존 역할 제거
    const currentRoles = await d1ListUserRoles(id);
    for (const role of currentRoles) {
      await d1RemoveUserRole(id, role.role_type);
    }

    // 새로운 역할 추가
    for (const roleType of roles) {
      await d1AddUserRole(id, roleType, context.user.id);
    }

    // 업데이트된 역할 조회
    const updatedRoles = await d1ListUserRoles(id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: updatedRoles.map(r => r.role_type),
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update admin permissions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAdmin: true });

/**
 * DELETE /api/admin/admins/[id]
 * 관리자 삭제 (슈퍼관리자만 가능)
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { user: any; params: Promise<{ id: string }> }
) => {
  try {
    // 슈퍼관리자 권한 확인
    if (!isSuperAdmin(context.user)) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // params 추출
    const { id } = await context.params;

    // 자기 자신 삭제 방지
    if (id === context.user.id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다' },
        { status: 400 }
      );
    }

    // 사용자 확인
    const user = await d1GetUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 모든 역할 제거 (사실상 삭제)
    const currentRoles = await d1ListUserRoles(id);
    for (const role of currentRoles) {
      await d1RemoveUserRole(id, role.role_type);
    }

    return NextResponse.json({
      message: '관리자가 삭제되었습니다',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAdmin: true });