import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 사용자 정보 가져오기
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 예약 통계 가져오기
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('status')
      .eq('user_id', userProfile.id);

    if (reservationError) {
      console.error('예약 통계 조회 오류:', reservationError);
      return NextResponse.json(
        { error: '예약 통계를 불러올 수 없습니다' },
        { status: 500 }
      );
    }

    // 통계 계산
    const stats = {
      total: reservations?.length || 0,
      completed: reservations?.filter(r => r.status === 'completed').length || 0,
      pending: reservations?.filter(r => r.status === 'pending').length || 0,
      approved: reservations?.filter(r => r.status === 'approved').length || 0,
      cancelled: reservations?.filter(r => r.status === 'cancelled' || r.status === 'rejected').length || 0
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('예약 통계 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}