import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';
import { autoCheckDeviceStatus } from '@/lib/device-status-manager';

export async function GET(request: NextRequest) {
  try {
    // 🔄 자동 기기 상태 체크 실행
    await autoCheckDeviceStatus()
    
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URL 파라미터에서 mode 가져오기 (past: 과거 예약, today: 오늘 예약)
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'today';

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

  const { data: adminData } = await supabaseAdmin.from('admins')
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

    // mode에 따라 다른 쿼리 실행
    let query = supabaseAdmin.from('reservations')
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
      `);

    if (mode === 'past') {
      // 과거 날짜의 미결제 예약 (결제 완료되지 않은 모든 예약)
      query = query
        .in('status', ['approved', 'checked_in'])  // 승인됨 또는 체크인됨
        .or('payment_status.is.null,payment_status.neq.paid')  // 결제 상태가 null이거나 paid가 아닌 경우
        .lt('date', today)
        .order('date', { ascending: false })
        .order('start_time', { ascending: true });
    } else {
      // 오늘의 승인된/체크인된/완료된 예약 조회
      query = query
        .in('status', ['approved', 'checked_in', 'completed'])
        .eq('date', today)
        .order('start_time', { ascending: true });
    }
    
    const { data: reservations, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    // 과거 예약은 필터링하지 않고, 오늘 예약만 시간별로 필터링
    let filteredReservations = reservations || [];
    
    if (mode !== 'past') {
      // 예약을 시간별로 필터링 (7시~29시 기준)
      filteredReservations = filteredReservations.filter(reservation => {
        const startHour = parseInt(reservation.start_time.split(':')[0]);
        
        // 7시~23시 또는 0시~5시(24시~29시로 표시) 예약만 포함
        return (startHour >= 7 && startHour <= 23) || (startHour >= 0 && startHour <= 5);
      });
    }

    return NextResponse.json({ 
      data: filteredReservations,
      today,
      mode
    });

  } catch (error) {
    console.error('Checkin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}