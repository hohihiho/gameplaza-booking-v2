import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    // Better Auth 세션 확인
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 관리자 권한 확인 (추후 Better Auth의 권한 시스템으로 개선)
    if (!session.user.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    // Better Auth API를 통해 통계 정보 수집
    // 현재는 모의 데이터를 반환하고, 향후 실제 Better Auth API 호출로 개선
    const stats = {
      totalUsers: 1248,
      activeUsers: 89,
      sessionsToday: 156,
      passkeysEnabled: 342,
      twoFactorEnabled: 89,
      organizationMembers: 23
    };

    // 최근 세션 정보 (모의 데이터)
    const recentSessions = [
      {
        id: 'session_1',
        user: {
          name: '김민수',
          email: 'minsu@example.com'
        },
        loginMethod: 'google' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7일 후
        isActive: true
      },
      {
        id: 'session_2',
        user: {
          name: '이지영',
          email: 'jiyoung@example.com'
        },
        loginMethod: 'passkey' as const,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        isActive: true
      },
      {
        id: 'session_3',
        user: {
          name: '박현우',
          email: 'hyunwoo@example.com'
        },
        loginMethod: '2fa' as const,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6시간 전
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        isActive: true
      },
      {
        id: 'session_4',
        user: {
          name: '최서연',
          email: 'seoyeon@example.com'
        },
        loginMethod: 'google' as const,
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
        expiresAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1시간 전 만료
        isActive: false
      },
      {
        id: 'session_5',
        user: {
          name: '정도현',
          email: 'dohyun@example.com'
        },
        loginMethod: 'passkey' as const,
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10분 전
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        isActive: true
      }
    ];

    return NextResponse.json({
      success: true,
      stats,
      recentSessions
    });

  } catch (error) {
    console.error('Better Auth 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}