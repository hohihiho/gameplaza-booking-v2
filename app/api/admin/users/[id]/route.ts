import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

async function handler(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient();
  const userId = params.id;

  try {
    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('사용자 조회 오류:', userError);
      return NextResponse.json(
        { error: userError.message },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 관리자 정보 확인
    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 예약 정보 조회
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        devices(
          id,
          device_number,
          device_types(
            id,
            name,
            model_name
          )
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(50);

    if (reservationError) {
      console.error('예약 조회 오류:', reservationError);
    }

    // 예약 통계
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: completedReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const { count: cancelledReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'cancelled');

    return NextResponse.json({
      user: {
        ...user,
        isAdmin: !!adminData,
        isSuperAdmin: adminData?.is_super_admin || false
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