import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json({ error: '세션 ID가 필요합니다' }, { status: 400 });
    }

    // Better Auth API를 통해 세션 종료
    // 현재는 모의 응답을 반환하고, 향후 실제 Better Auth API 호출로 개선
    try {
      // await auth.api.revokeSession(sessionId);
      console.log(`세션 ${sessionId} 종료 요청 - 관리자: ${session.user.name}`);
      
      return NextResponse.json({
        success: true,
        message: '세션이 성공적으로 종료되었습니다'
      });
    } catch (error) {
      console.error('세션 종료 오류:', error);
      return NextResponse.json(
        { error: '세션 종료 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Better Auth 세션 종료 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 세션 상세 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json({ error: '세션 ID가 필요합니다' }, { status: 400 });
    }

    // Better Auth API를 통해 세션 상세 정보 조회
    // 현재는 모의 데이터를 반환하고, 향후 실제 Better Auth API 호출로 개선
    const sessionDetail = {
      id: sessionId,
      user: {
        id: 'user_1',
        name: '김민수',
        email: 'minsu@example.com',
        role: 'user'
      },
      loginMethod: 'google',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isActive: true,
      location: {
        country: '대한민국',
        city: '광주',
        region: '광주광역시'
      },
      device: {
        os: 'Windows 10',
        browser: 'Chrome 120.0',
        isMobile: false
      }
    };

    return NextResponse.json({
      success: true,
      session: sessionDetail
    });

  } catch (error) {
    console.error('Better Auth 세션 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}