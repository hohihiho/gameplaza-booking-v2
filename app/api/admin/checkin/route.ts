import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // KST 기준 오늘 날짜
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(Date.now() + kstOffset);
    const today = kstNow.toISOString().split('T')[0];

    // 오늘의 승인된/체크인된/완료된 예약 조회 (모든 시간대)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select(`
        *,
        users:user_id (
          id,
          name,
          phone,
          email,
          nickname
        ),
        devices:device_id (
          id,
          device_number,
          device_types:device_type_id (
            id,
            name,
            model_name,
            version_name
          )
        )
      `)
      .in('status', ['approved', 'checked_in', 'completed'])
      .eq('date', today)
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    // 예약을 시간별로 필터링 (7시~29시 기준)
    const filteredReservations = (reservations || []).filter(reservation => {
      const startHour = parseInt(reservation.start_time.split(':')[0]);
      
      // 7시~23시 또는 0시~5시(24시~29시로 표시) 예약만 포함
      return (startHour >= 7 && startHour <= 23) || (startHour >= 0 && startHour <= 5);
    });

    return NextResponse.json({ 
      data: filteredReservations,
      today
    });

  } catch (error) {
    console.error('Checkin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}