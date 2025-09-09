import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function POST(
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
    const { type, value, reason, expiresAt } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
    }

    // 제한 타입 유효성 검증
    const validTypes = ['reservation', 'device_access', 'time_limit', 'feature_access'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: '유효하지 않은 제한 타입입니다' }, { status: 400 });
    }

    if (!value || !reason) {
      return NextResponse.json({ error: '제한 값과 사유는 필수입니다' }, { status: 400 });
    }

    // 제한 값 유효성 검증
    const restrictionConfig = {
      reservation: {
        validValues: ['no_reservation', 'max_1_per_day', 'max_2_per_day', 'weekends_only', 'weekdays_only'],
        description: '예약 제한'
      },
      device_access: {
        validValues: ['no_ps5_access', 'no_vr_access', 'no_racing_access', 'basic_only'],
        description: '기기 접근 제한'
      },
      time_limit: {
        validValues: ['1_hour_max', '2_hours_max', '3_hours_max', '4_hours_max'],
        description: '이용 시간 제한'
      },
      feature_access: {
        validValues: ['no_premium_features', 'no_group_booking', 'no_advance_booking'],
        description: '기능 접근 제한'
      }
    };

    const typeConfig = restrictionConfig[type as keyof typeof restrictionConfig];
    if (!typeConfig.validValues.includes(value)) {
      return NextResponse.json({ 
        error: `${typeConfig.description}의 유효하지 않은 값입니다`,
        validValues: typeConfig.validValues 
      }, { status: 400 });
    }

    // 만료일 검증
    if (expiresAt) {
      const expiry = new Date(expiresAt);
      if (expiry <= new Date()) {
        return NextResponse.json({ error: '만료일은 현재 시간보다 이후여야 합니다' }, { status: 400 });
      }
    }

    try {
      // Better Auth 또는 데이터베이스를 통한 제한 추가
      // 현재는 모의 응답, 향후 실제 구현
      const restriction = {
        id: `restriction_${Date.now()}`,
        userId,
        type,
        value,
        reason,
        createdBy: session.user.id,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
        isActive: true
      };

      console.log(`사용자 ${userId}에게 제한 추가:`, restriction);

      // 제한 추가에 따른 추가 작업
      const additionalActions = [];
      
      switch (type) {
        case 'reservation':
          additionalActions.push('기존 예약 검토 및 조정');
          if (value === 'no_reservation') {
            additionalActions.push('모든 예약 취소');
          }
          break;
        
        case 'device_access':
          additionalActions.push('해당 기기 예약 취소');
          additionalActions.push('접근 권한 즉시 차단');
          break;
        
        case 'time_limit':
          additionalActions.push('현재 세션 시간 확인');
          additionalActions.push('초과 시 강제 종료 예약');
          break;
        
        case 'feature_access':
          additionalActions.push('해당 기능 즉시 차단');
          break;
      }

      // 사용자에게 알림 발송
      const notificationMessage = `새로운 제한이 적용되었습니다: ${typeConfig.description} - ${reason}`;
      console.log(`사용자 ${userId}에게 알림 발송: ${notificationMessage}`);

      return NextResponse.json({
        success: true,
        message: '제한이 성공적으로 추가되었습니다',
        data: {
          restriction,
          additionalActions,
          notificationSent: true
        }
      });

    } catch (error) {
      console.error('제한 추가 오류:', error);
      return NextResponse.json(
        { error: '제한 추가 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('사용자 제한 설정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 제한 목록 조회
export async function GET(
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

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
    }

    // 사용자 제한 목록 조회 (모의 데이터)
    const restrictions = [
      {
        id: 'restriction_1',
        userId,
        type: 'reservation',
        value: 'max_2_per_day',
        reason: '노쇼 2회로 인한 예약 제한',
        createdBy: 'admin_1',
        createdAt: '2024-11-15T00:00:00.000Z',
        expiresAt: '2024-12-15T23:59:59.999Z',
        isActive: true
      }
    ];

    return NextResponse.json({
      success: true,
      restrictions
    });

  } catch (error) {
    console.error('제한 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 제한 삭제
export async function DELETE(
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
    const { restrictionId } = await request.json();

    if (!userId || !restrictionId) {
      return NextResponse.json({ error: '사용자 ID와 제한 ID가 필요합니다' }, { status: 400 });
    }

    try {
      // 제한 삭제
      console.log(`사용자 ${userId}의 제한 ${restrictionId} 삭제 - 관리자: ${session.user.name}`);

      return NextResponse.json({
        success: true,
        message: '제한이 성공적으로 삭제되었습니다',
        data: {
          userId,
          restrictionId,
          removedBy: session.user.name,
          removedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('제한 삭제 오류:', error);
      return NextResponse.json(
        { error: '제한 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('제한 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}