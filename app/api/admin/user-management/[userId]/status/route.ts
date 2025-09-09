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
    const { status, reason = '관리자 조치' } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
    }

    // 상태 유효성 검증
    const validStatuses = ['active', 'restricted', 'suspended', 'banned'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다' }, { status: 400 });
    }

    // 영구차단은 슈퍼관리자만 가능
    if (status === 'banned' && session.user.role !== 'super_admin') {
      return NextResponse.json({ 
        error: '영구차단은 슈퍼관리자만 가능합니다' 
      }, { status: 403 });
    }

    try {
      // Better Auth API를 통한 상태 변경
      // 현재는 모의 응답, 향후 실제 구현
      console.log(`사용자 ${userId}의 상태를 ${status}로 변경 - 관리자: ${session.user.name}, 사유: ${reason}`);

      // 상태 변경에 따른 추가 작업
      const additionalActions = [];
      
      switch (status) {
        case 'suspended':
          // 활성 세션 모두 종료
          additionalActions.push('모든 활성 세션 종료');
          // 진행 중인 예약 취소 알림
          additionalActions.push('진행 중인 예약 취소 안내');
          break;
        
        case 'banned':
          // 모든 데이터 비활성화
          additionalActions.push('모든 세션 및 토큰 무효화');
          additionalActions.push('예약 내역 아카이브');
          additionalActions.push('포인트 동결');
          break;
        
        case 'active':
          // 제한 해제 시 알림
          additionalActions.push('제한 해제 알림 발송');
          break;
        
        case 'restricted':
          // 제한 안내
          additionalActions.push('제한 내용 안내 발송');
          break;
      }

      // 상태 변경 로그 기록
      const statusChangeLog = {
        userId,
        previousStatus: 'unknown', // 실제 구현 시 기존 상태 조회
        newStatus: status,
        reason,
        changedBy: session.user.id,
        changedAt: new Date().toISOString(),
        additionalActions
      };

      console.log('상태 변경 로그:', statusChangeLog);

      // 사용자에게 알림 발송 (향후 구현)
      if (status === 'suspended') {
        console.log(`사용자 ${userId}에게 계정 정지 알림 발송`);
      } else if (status === 'banned') {
        console.log(`사용자 ${userId}에게 계정 영구차단 알림 발송`);
      } else if (status === 'active') {
        console.log(`사용자 ${userId}에게 계정 활성화 알림 발송`);
      }

      return NextResponse.json({
        success: true,
        message: '사용자 상태가 성공적으로 변경되었습니다',
        data: {
          userId,
          newStatus: status,
          reason,
          changedBy: session.user.name,
          changedAt: statusChangeLog.changedAt,
          additionalActions
        }
      });

    } catch (error) {
      console.error('상태 변경 오류:', error);
      return NextResponse.json(
        { error: '상태 변경 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('사용자 상태 변경 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}