import { NextRequest, NextResponse } from 'next/server';
import { D1RepositoryFactory, getD1Database } from '@/lib/repositories/d1';

// GET /api/v2/users/[id] - 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const user = await repos.users.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 관리자 여부 확인
    const isAdmin = await repos.users.isAdmin(params.id);
    const isSuperAdmin = await repos.users.isSuperAdmin(params.id);

    // 예약 수 확인
    const activeReservations = await repos.reservations.countActiveReservations(params.id);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        is_admin: isAdmin,
        is_super_admin: isSuperAdmin,
        active_reservations: activeReservations
      }
    });

  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/v2/users/[id] - 사용자 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, nickname, phone, marketing_agreed } = body;

    const repos = new D1RepositoryFactory(db);
    
    // 사용자 존재 확인
    const existingUser = await repos.users.findById(params.id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (phone !== undefined) updateData.phone = phone;
    
    // 사용자 정보 업데이트
    const updatedUser = await repos.users.update(params.id, updateData);

    // 마케팅 동의 별도 업데이트
    if (marketing_agreed !== undefined) {
      await repos.users.updateMarketingAgreement(params.id, marketing_agreed);
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('사용자 수정 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/users/[id] - 사용자 삭제 (블랙리스트 처리)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    
    // 사용자 존재 확인
    const existingUser = await repos.users.findById(params.id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 블랙리스트 처리 (실제 삭제 대신)
    await repos.users.setBlacklist(params.id, true);

    return NextResponse.json({
      success: true,
      message: 'User blacklisted successfully'
    });

  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}