import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 7월 15일 11시 이후 예약들 조회
    const { data: reservations, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('id, start_time, end_time')
      .eq('date', '2025-07-15')
      .gte('start_time', '11:00:00')
      .order('start_time');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    // 각 예약의 시간대 업데이트
    const updates = [];
    for (const reservation of reservations || []) {
      // 11시 시작 -> 9시 시작, 모든 예약 13시 종료
      if (reservation.start_time === '11:00:00') {
        updates.push(
          supabaseAdmin
            .from('reservations')
            .update({ 
              start_time: '09:00:00',
              end_time: '13:00:00'
            })
            .eq('id', reservation.id)
        );
      }
    }

    // 9시 시작하는 예약들도 13시 종료로 변경
    const { data: earlyReservations } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('date', '2025-07-15')
      .eq('start_time', '09:00:00');

    for (const reservation of earlyReservations || []) {
      updates.push(
        supabaseAdmin
          .from('reservations')
          .update({ end_time: '13:00:00' })
          .eq('id', reservation.id)
      );
    }

    // 모든 업데이트 실행
    await Promise.all(updates);

    return NextResponse.json({ 
      success: true, 
      message: `${updates.length}개의 예약 시간이 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('Update times error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}