import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
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

    // 사용자 목록 조회 (모의 데이터)
    // 향후 Better Auth API나 데이터베이스 연동으로 개선
    const users = [
      {
        id: 'user_1',
        name: '김민수',
        nickname: '민수짱',
        email: 'minsu@example.com',
        phone: '010-1234-5678',
        role: 'vip_member',
        status: 'active',
        createdAt: '2024-01-15T00:00:00.000Z',
        lastLoginAt: '2024-12-08T10:30:00.000Z',
        totalReservations: 45,
        completedReservations: 42,
        cancelledReservations: 2,
        noShowCount: 1,
        points: 2500,
        restrictions: [],
        membershipExpiry: '2024-12-31T23:59:59.999Z'
      },
      {
        id: 'user_2',
        name: '이지영',
        nickname: '지영이',
        email: 'jiyoung@example.com',
        phone: '010-2345-6789',
        role: 'gold_member',
        status: 'active',
        createdAt: '2024-02-20T00:00:00.000Z',
        lastLoginAt: '2024-12-07T15:45:00.000Z',
        totalReservations: 28,
        completedReservations: 26,
        cancelledReservations: 1,
        noShowCount: 1,
        points: 1800,
        restrictions: [],
        membershipExpiry: '2024-11-30T23:59:59.999Z'
      },
      {
        id: 'user_3',
        name: '박현우',
        email: 'hyunwoo@example.com',
        phone: '010-3456-7890',
        role: 'regular_member',
        status: 'restricted',
        createdAt: '2024-03-10T00:00:00.000Z',
        lastLoginAt: '2024-12-05T09:20:00.000Z',
        totalReservations: 12,
        completedReservations: 8,
        cancelledReservations: 2,
        noShowCount: 2,
        points: 450,
        restrictions: [
          {
            type: 'reservation',
            value: 'max_2_per_day',
            reason: '노쇼 2회로 인한 예약 제한',
            createdBy: 'admin_1',
            createdAt: '2024-11-15T00:00:00.000Z',
            expiresAt: '2024-12-15T23:59:59.999Z'
          }
        ]
      },
      {
        id: 'user_4',
        name: '최서연',
        nickname: '서연맘',
        email: 'seoyeon@example.com',
        phone: '010-4567-8901',
        role: 'silver_member',
        status: 'suspended',
        createdAt: '2024-04-05T00:00:00.000Z',
        lastLoginAt: '2024-11-20T14:30:00.000Z',
        totalReservations: 22,
        completedReservations: 15,
        cancelledReservations: 4,
        noShowCount: 3,
        points: 320,
        restrictions: [
          {
            type: 'device_access',
            value: 'no_vr_access',
            reason: 'VR 기기 손상 사고',
            createdBy: 'admin_1',
            createdAt: '2024-11-20T00:00:00.000Z'
          },
          {
            type: 'time_limit',
            value: '2_hours_max',
            reason: '장시간 이용으로 인한 제재',
            createdBy: 'admin_2',
            createdAt: '2024-11-25T00:00:00.000Z',
            expiresAt: '2024-12-25T23:59:59.999Z'
          }
        ]
      },
      {
        id: 'user_5',
        name: '정도현',
        email: 'dohyun@example.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLoginAt: '2024-12-08T08:00:00.000Z',
        totalReservations: 3,
        completedReservations: 3,
        cancelledReservations: 0,
        noShowCount: 0,
        points: 100,
        restrictions: []
      },
      {
        id: 'user_6',
        name: '한미래',
        nickname: '미래',
        email: 'mirae@example.com',
        phone: '010-5678-9012',
        role: 'regular_member',
        status: 'banned',
        createdAt: '2024-05-20T00:00:00.000Z',
        lastLoginAt: '2024-10-15T12:00:00.000Z',
        totalReservations: 8,
        completedReservations: 2,
        cancelledReservations: 3,
        noShowCount: 3,
        points: 0,
        restrictions: [
          {
            type: 'reservation',
            value: 'permanent_ban',
            reason: '반복적인 무단 취소 및 타 이용자 방해',
            createdBy: 'admin_1',
            createdAt: '2024-10-15T00:00:00.000Z'
          }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      users: users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}