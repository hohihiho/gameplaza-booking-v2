import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { CreateAdminUseCase } from '@/src/application/use-cases/admin/create-admin.use-case';
import { ListAdminsUseCase } from '@/src/application/use-cases/admin/list-admins.use-case';
import { AdminSupabaseRepository } from '@/src/infrastructure/repositories/admin.supabase.repository';
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository';
import {
  CreateAdminRequestDto,
  ListAdminsRequestDto,
  SuperAdminCheckDto
} from '@/src/application/dtos/admin.dto';

/**
 * GET /api/admin/admins
 * 관리자 목록 조회 (슈퍼관리자만 가능)
 */
export async function GET(request: NextRequest) {
  try {
    // 슈퍼관리자 권한 확인
    const superAdminCheck = await requireSuperAdmin(request);
    if (!superAdminCheck.isSuperAdmin) {
      return NextResponse.json(
        { error: superAdminCheck.error },
        { status: 403 }
      );
    }

    // Query parameters 파싱
    const { searchParams } = new URL(request.url);
    const includeSuperAdmins = searchParams.get('includeSuperAdmins') !== 'false';
    const includeRegularAdmins = searchParams.get('includeRegularAdmins') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 리포지토리 및 유스케이스 초기화
    const supabase = createAdminClient();
    const adminRepository = new AdminSupabaseRepository(supabase);
    const userRepository = new UserSupabaseRepository(supabase);
    const listAdminsUseCase = new ListAdminsUseCase(adminRepository, userRepository);

    // 관리자 목록 조회
    const listRequest: ListAdminsRequestDto = {
      includeSuperAdmins,
      includeRegularAdmins,
      limit,
      offset
    };

    const superAdminCheckDto: SuperAdminCheckDto = {
      executorId: superAdminCheck.adminId!,
      executorUserId: superAdminCheck.userId!
    };

    const result = await listAdminsUseCase.execute(listRequest, superAdminCheckDto);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admins
 * 관리자 생성 (슈퍼관리자만 가능)
 */
export async function POST(request: NextRequest) {
  try {
    // 슈퍼관리자 권한 확인
    const superAdminCheck = await requireSuperAdmin(request);
    if (!superAdminCheck.isSuperAdmin) {
      return NextResponse.json(
        { error: superAdminCheck.error },
        { status: 403 }
      );
    }

    // Request body 파싱
    const body = await request.json();
    const { userId, permissions, isSuperAdmin } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 리포지토리 및 유스케이스 초기화
    const supabase = createAdminClient();
    const adminRepository = new AdminSupabaseRepository(supabase);
    const userRepository = new UserSupabaseRepository(supabase);
    const createAdminUseCase = new CreateAdminUseCase(adminRepository, userRepository);

    // 관리자 생성
    const createRequest: CreateAdminRequestDto = {
      userId,
      permissions: permissions || {
        reservations: true,
        users: true,
        devices: true,
        cms: true,
        settings: false
      },
      isSuperAdmin: isSuperAdmin || false
    };

    const superAdminCheckDto: SuperAdminCheckDto = {
      executorId: superAdminCheck.adminId!,
      executorUserId: superAdminCheck.userId!
    };

    const result = await createAdminUseCase.execute(createRequest, superAdminCheckDto);

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Create admin error:', error);
    
    // 에러 메시지에 따른 적절한 상태 코드 반환
    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('이미')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('권한')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}