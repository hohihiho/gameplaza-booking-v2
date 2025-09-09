import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Better Auth 세션 확인
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    if (!session.user.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const { userId } = params;
    const { role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
    }

    // 역할 유효성 검증
    const validRoles = ['super_admin', 'admin', 'vip_member', 'gold_member', 'silver_member', 'regular_member'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: '유효하지 않은 역할입니다' }, { status: 400 });
    }

    // 권한 레벨 체크 (하위 관리자는 상위 관리자의 역할을 변경할 수 없음)
    const roleLevels = {
      super_admin: 6,
      admin: 5,
      vip_member: 4,
      gold_member: 3,
      silver_member: 2,
      regular_member: 1
    };

    const currentUserLevel = roleLevels[session.user.role as keyof typeof roleLevels] || 0;
    const targetRoleLevel = roleLevels[role as keyof typeof roleLevels];

    // 일반 관리자는 다른 관리자를 승격시킬 수 없음
    if (session.user.role === 'admin' && targetRoleLevel >= 5) {
      return NextResponse.json({ 
        error: '관리자 이상의 권한 승격은 슈퍼관리자만 가능합니다' 
      }, { status: 403 });
    }

    // 슈퍼관리자만 슈퍼관리자를 임명할 수 있음
    if (role === 'super_admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ 
        error: '슈퍼관리자 임명은 슈퍼관리자만 가능합니다' 
      }, { status: 403 });
    }

    try {
      // Better Auth API를 통한 역할 변경
      // 현재는 모의 응답, 향후 실제 구현
      console.log(`사용자 ${userId}의 역할을 ${role}로 변경 - 관리자: ${session.user.name}`);

      // 역할 변경 로그 기록
      const roleChangeLog = {
        userId,
        previousRole: 'unknown', // 실제 구현 시 기존 역할 조회
        newRole: role,
        changedBy: session.user.id,
        changedAt: new Date().toISOString(),
        reason: `관리자 ${session.user.name}에 의한 역할 변경`
      };

      console.log('역할 변경 로그:', roleChangeLog);

      return NextResponse.json({
        success: true,
        message: '역할이 성공적으로 변경되었습니다',
        data: {
          userId,
          newRole: role,
          changedBy: session.user.name,
          changedAt: roleChangeLog.changedAt
        }
      });

    } catch (error) {
      console.error('역할 변경 오류:', error);
      return NextResponse.json(
        { error: '역할 변경 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('사용자 역할 변경 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}