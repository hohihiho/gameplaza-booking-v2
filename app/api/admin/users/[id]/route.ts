import { NextRequest, NextResponse } from 'next/server';
import { getDB, supabase } from '@/lib/db'
import { withAuth } from '@/lib/auth';
import { d1GetUserById, d1ListUserRoles, d1ListRecentReservationsByUser, d1CountReservationsByUser, d1CountReservationsByUserWithStatus } from '@/lib/db/d1'

async function handler(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = params.id;

  try {
    // 사용자 정보
    const user = await d1GetUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 역할 정보 확인 (super_admin 여부)
    const roles = await d1ListUserRoles(userId)
    const isSuperAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')

    // 예약 정보(+기기/기종) 최근 50건
    const reservations = await d1ListRecentReservationsByUser(userId, 50)

    // 예약 통계
    const totalReservations = await d1CountReservationsByUser(userId)
    const completedReservations = await d1CountReservationsByUserWithStatus(userId, 'completed')
    const cancelledReservations = await d1CountReservationsByUserWithStatus(userId, 'cancelled')

    return NextResponse.json({
      user: {
        ...user,
        isAdmin: isSuperAdmin,
        isSuperAdmin: isSuperAdmin
      },
      reservations: reservations || [],
      stats: {
        total: totalReservations || 0,
        completed: completedReservations || 0,
        cancelled: cancelledReservations || 0
      }
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, { requireAdmin: true });
