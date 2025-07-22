import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const GET = withAuth(async (req, { user }) => {
  try {
    const supabaseAdmin = createAdminClient();

    // 오늘 영업일 날짜 (KST 기준, 06시 이전은 전날 영업일)
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const now = new Date();
    const kstNow = new Date(now.getTime() + kstOffset);
    
    // 현재 시간이 06시 이전이면 전날을 영업일로 간주
    const currentHour = kstNow.getHours();
    const businessDay = new Date(kstNow);
    if (currentHour < 6) {
      businessDay.setDate(businessDay.getDate() - 1);
    }
    const todayStr = businessDay.toISOString().split('T')[0];

    // 1. 오늘 매출 계산 (실제 이용시간 기준)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('adjusted_amount')
      .eq('date', todayStr)
      .eq('status', 'completed')
      .not('adjusted_amount', 'is', null);

    const revenue = todayRevenue?.reduce((sum, r) => sum + (r.adjusted_amount || 0), 0) || 0;

    // 어제 영업일과 비교 (06시 기준 전날)
    const yesterday = new Date(businessDay);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('adjusted_amount')
      .eq('date', yesterdayStr)
      .eq('status', 'completed');

    const yesterdayTotal = yesterdayRevenue?.reduce((sum, r) => sum + (r.adjusted_amount || 0), 0) || 0;
    const revenueTrend = yesterdayTotal > 0 
      ? Math.round((revenue - yesterdayTotal) / yesterdayTotal * 100)
      : 0;

    // 2. 오늘 예약 현황
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('status')
      .eq('date', todayStr);

    const totalReservations = todayReservations?.length || 0;
    
    // 전체 승인 대기 건수 (날짜 무관)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('id')
      .eq('status', 'pending');
    
    const pendingReservations = allPendingReservations?.length || 0;

    // 어제와 비교
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('id')
      .eq('date', yesterdayStr);

    const yesterdayCount = yesterdayReservations?.length || 0;
    const reservationTrend = yesterdayCount > 0
      ? Math.round((totalReservations - yesterdayCount) / yesterdayCount * 100)
      : 0;

    // 3. 현재 이용중 (체크인된 예약)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('id')
      .eq('date', todayStr)
      .eq('status', 'checked_in');

    const usingCount = currentlyUsing?.length || 0;

    // 체크인 대기중 (승인됐지만 체크인 안된 예약 중 시작 30분 전부터 시작 시간까지)
    // KST 기준 현재 시간
    const currentMinute = kstNow.getMinutes();
    
    // 30분 전의 시간 계산
    const thirtyMinutesBefore = new Date(kstNow);
    thirtyMinutesBefore.setMinutes(thirtyMinutesBefore.getMinutes() - 30);
    const beforeHour = thirtyMinutesBefore.getHours();
    const beforeMinute = thirtyMinutesBefore.getMinutes();
    
    const thirtyMinutesBeforeTime = `${String(beforeHour).padStart(2, '0')}:${String(beforeMinute).padStart(2, '0')}`;
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // 시작 시간이 (현재시간 - 30분) 이후인 모든 승인된 예약 조회 (지각 포함)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('id, start_time')
      .eq('date', todayStr)
      .eq('status', 'approved')
      .gte('start_time', thirtyMinutesBeforeTime + ':00');

    const waitingCount = waitingCheckin?.length || 0;

    // 4. 대여 가능 기기
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('devices')
      .select('status');

    const totalDevices = allDevices?.length || 0;
    const availableDevices = allDevices?.filter(d => d.status === 'available').length || 0;
    const maintenanceDevices = allDevices?.filter(d => d.status === 'maintenance').length || 0;

    // 5. 최근 예약 목록 (최근 10개)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        status,
        date,
        start_time,
        end_time,
        created_at,
        users!inner(name, nickname),
        device_time_slots!inner(
          rental_machines!inner(
            display_name,
            device_types!inner(name, model_name)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. 결제 대기 현황 (체크인 됐지만 결제 안된 건수)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('id')
      .eq('status', 'checked_in')
      .eq('payment_status', 'pending');

    const pendingPaymentCount = pendingPayments?.length || 0;

    // 데이터 형식 변환
    const formattedRecentReservations = recentReservations?.map(r => {
      const rentalMachine = r.device_time_slots?.rental_machines;
      const deviceType = rentalMachine?.device_types;
      const user = r.users;
      
      // created_at 시간 차이 계산
      const createdAt = new Date(r.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      let createdAtText = '';
      if (diffMins < 60) {
        createdAtText = `${diffMins}분 전`;
      } else if (diffHours < 24) {
        createdAtText = `${diffHours}시간 전`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        createdAtText = `${diffDays}일 전`;
      }

      // 기기명 조합
      const deviceName = deviceType?.model_name 
        ? `${deviceType.name} ${deviceType.model_name}` 
        : rentalMachine?.display_name || '알 수 없음';

      return {
        id: r.id,
        user_name: user?.nickname || user?.name || '알 수 없음',
        device_name: deviceName,
        date: r.date,
        time: `${r.start_time.slice(0, 5)}-${r.end_time.slice(0, 5)}`,
        status: r.status,
        created_at: createdAtText
      };
    }) || [];

    return NextResponse.json({
      stats: {
        revenue: {
          value: revenue,
          trend: revenueTrend
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
          trend: reservationTrend
        },
        currentlyUsing: {
          using: usingCount,
          waiting: waitingCount
        },
        devices: {
          available: availableDevices,
          total: totalDevices,
          maintenance: maintenanceDevices
        }
      },
      recentReservations: formattedRecentReservations,
      pendingPayments: pendingPaymentCount
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAdmin: true });