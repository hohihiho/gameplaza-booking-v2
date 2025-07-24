import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { GetAdminDetailUseCase } from '@/src/application/use-cases/admin/get-admin-detail.use-case';
import { UpdateAdminPermissionsUseCase } from '@/src/application/use-cases/admin/update-admin-permissions.use-case';
import { DeleteAdminUseCase } from '@/src/application/use-cases/admin/delete-admin.use-case';
import { AdminSupabaseRepository } from '@/src/infrastructure/repositories/admin.supabase.repository';
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository';
import {
  GetAdminDetailRequestDto,
  UpdateAdminPermissionsRequestDto,
  DeleteAdminRequestDto,
  SuperAdminCheckDto
} from '@/src/application/dtos/admin.dto';

/**
 * GET /api/admin/admins/[id]
 * 관리자 상세 조회 (슈퍼관리자만 가능)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 슈퍼관리자 권한 확인
    const superAdminCheck = await requireSuperAdmin(request);
    if (!superAdminCheck.isSuperAdmin) {
      return NextResponse.json(
        { error: superAdminCheck.error },
        { status: 403 }
      );
    }

    // 리포지토리 및 유스케이스 초기화
    const supabase = createAdminClient();
    const adminRepository = new AdminSupabaseRepository(supabase);
    const userRepository = new UserSupabaseRepository(supabase);
    const getAdminDetailUseCase = new GetAdminDetailUseCase(adminRepository, userRepository);

    // 관리자 상세 조회
    const getDetailRequest: GetAdminDetailRequestDto = {
      adminId: params.id
    };

    const superAdminCheckDto: SuperAdminCheckDto = {
      executorId: superAdminCheck.adminId!,
      executorUserId: superAdminCheck.userId!
    };

    const result = await getAdminDetailUseCase.execute(getDetailRequest, superAdminCheckDto);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get admin detail error:', error);
    
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/admins/[id]
 * 관리자 권한 수정 (슈퍼관리자만 가능)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { permissions } = body;

    if (!permissions) {
      return NextResponse.json(
        { error: '권한 정보가 필요합니다' },
        { status: 400 }
      );
    }

    // 리포지토리 및 유스케이스 초기화
    const supabase = createAdminClient();
    const adminRepository = new AdminSupabaseRepository(supabase);
    const userRepository = new UserSupabaseRepository(supabase);
    const updatePermissionsUseCase = new UpdateAdminPermissionsUseCase(adminRepository, userRepository);

    // 권한 수정
    const updateRequest: UpdateAdminPermissionsRequestDto = {
      adminId: params.id,
      permissions
    };

    const superAdminCheckDto: SuperAdminCheckDto = {
      executorId: superAdminCheck.adminId!,
      executorUserId: superAdminCheck.userId!
    };

    const result = await updatePermissionsUseCase.execute(updateRequest, superAdminCheckDto);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Update admin permissions error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('슈퍼관리자의 권한')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/admins/[id]
 * 관리자 삭제 (슈퍼관리자만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 슈퍼관리자 권한 확인
    const superAdminCheck = await requireSuperAdmin(request);
    if (!superAdminCheck.isSuperAdmin) {
      return NextResponse.json(
        { error: superAdminCheck.error },
        { status: 403 }
      );
    }

    // 리포지토리 및 유스케이스 초기화
    const supabase = createAdminClient();
    const adminRepository = new AdminSupabaseRepository(supabase);
    const deleteAdminUseCase = new DeleteAdminUseCase(adminRepository);

    // 관리자 삭제
    const deleteRequest: DeleteAdminRequestDto = {
      adminId: params.id
    };

    const superAdminCheckDto: SuperAdminCheckDto = {
      executorId: superAdminCheck.adminId!,
      executorUserId: superAdminCheck.userId!
    };

    const result = await deleteAdminUseCase.execute(deleteRequest, superAdminCheckDto);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Delete admin error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('슈퍼관리자는 삭제')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('자기 자신')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}