import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';

// 조기개장 자동 스케줄 조정 API
// 예약 취소 시 조기개장 스케줄을 자동으로 조정하는 기능
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: '날짜가 필요합니다' }, { status: 400 });
    }

    console.log(`${date} 조기개장 스케줄 조정 시작`);

    // 해당 날짜의 활성 예약 조회 (pending, approved, checked_in 상태)
    const supabaseAdmin = createAdminClient();
  const { data: activeReservations, error: reservationError } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        date,
        start_time,
        end_time,
        status
      `)
      .eq('date', date)
      .in('status', ['pending', 'approved', 'checked_in']);

    if (reservationError) {
      console.error(`${date} 예약 조회 오류:`, reservationError);
      return NextResponse.json({ error: reservationError.message }, { status: 500 });
    }

    // 조기영업 시간대 예약 필터링 (7-12시)
    const earlyReservations = (activeReservations || []).filter((r: any) => {
      const hour = parseInt(r.start_time.split(':')[0]);
      return hour >= 7 && hour < 12;
    });

    console.log(`${date} 조기영업 시간대 활성 예약:`, earlyReservations);

    // 자동 생성된 조기영업 스케줄 조회
    
  const { data: autoSchedule, error: scheduleError } = await supabaseAdmin.from('schedule_events')
      .select('*')
      .eq('date', date)
      .eq('type', 'early_open')
      .eq('is_auto_generated', true)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error(`${date} 스케줄 조회 오류:`, scheduleError);
      return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    }

    let action = 'none';
    let adjustedTime = null;

    // 조기영업 예약이 없으면 자동 스케줄 삭제
    if (earlyReservations.length === 0) {
      if (autoSchedule) {
        await supabaseAdmin
          .from('schedule_events')
          .delete()
          .eq('id', autoSchedule.id);
        
        action = 'deleted';
        console.log(`${date} 조기영업 스케줄 삭제됨`);
      }
    } 
    // 조기영업 예약이 1개만 남았으면 해당 시간으로 조정
    else if (earlyReservations.length === 1) {
      const singleReservation = earlyReservations[0];
      const newStartTime = singleReservation?.start_time;
      
      if (autoSchedule) {
        // 기존 스케줄의 시작 시간과 다른 경우에만 업데이트
        if (autoSchedule.start_time !== newStartTime) {
          await supabaseAdmin
            .from('schedule_events')
            .update({
              start_time: newStartTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', autoSchedule.id);
          
          action = 'adjusted';
          adjustedTime = newStartTime;
          console.log(`${date} 조기영업 스케줄 시간 조정: ${newStartTime}`);
        }
      } else {
        // 수동 생성 스케줄이 있는지 확인
        
  const { data: manualSchedule } = await supabaseAdmin.from('schedule_events')
          .select('id')
          .eq('date', date)
          .eq('type', 'early_open')
          .eq('is_auto_generated', false)
          .single();
        
        // 수동 스케줄이 없으면 새로 생성
        if (!manualSchedule) {
          await supabaseAdmin
            .from('schedule_events')
            .insert({
              date,
              title: '조기영업',
              type: 'early_open',
              start_time: newStartTime,
              end_time: '12:00',
              is_auto_generated: true,
              source_type: 'reservation_auto',
              affects_reservation: false,
              description: '예약에 따라 자동으로 조정된 조기영업 일정입니다.'
            });
          
          action = 'created';
          adjustedTime = newStartTime;
          console.log(`${date} 조기영업 스케줄 새로 생성: ${newStartTime}`);
        }
      }
    }
    // 조기영업 예약이 여러 개 있으면 가장 빠른 시간으로 조정
    else if (earlyReservations.length > 1) {
      const earliest = earlyReservations.reduce((prev: any, curr: any) => 
        prev.start_time < curr.start_time ? prev : curr
      );
      const newStartTime = earliest.start_time;
      
      if (autoSchedule) {
        // 기존 스케줄의 시작 시간과 다른 경우에만 업데이트
        if (autoSchedule.start_time !== newStartTime) {
          await supabaseAdmin
            .from('schedule_events')
            .update({
              start_time: newStartTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', autoSchedule.id);
          
          action = 'adjusted';
          adjustedTime = newStartTime;
          console.log(`${date} 조기영업 스케줄 시간 조정: ${newStartTime}`);
        }
      } else {
        // 수동 생성 스케줄이 있는지 확인
        
  const { data: manualSchedule } = await supabaseAdmin.from('schedule_events')
          .select('id')
          .eq('date', date)
          .eq('type', 'early_open')
          .eq('is_auto_generated', false)
          .single();
        
        // 수동 스케줄이 없으면 새로 생성
        if (!manualSchedule) {
          await supabaseAdmin
            .from('schedule_events')
            .insert({
              date,
              title: '조기영업',
              type: 'early_open',
              start_time: newStartTime,
              end_time: '12:00',
              is_auto_generated: true,
              source_type: 'reservation_auto',
              affects_reservation: false,
              description: '예약에 따라 자동으로 조정된 조기영업 일정입니다.'
            });
          
          action = 'created';
          adjustedTime = newStartTime;
          console.log(`${date} 조기영업 스케줄 새로 생성: ${newStartTime}`);
        }
      }
    }

    return NextResponse.json({
      message: '조기개장 스케줄 조정 완료',
      date,
      action,
      adjustedTime,
      earlyReservationsCount: earlyReservations.length,
      earlyReservations: earlyReservations.map((r: any) => ({
        id: r.id,
        start_time: r.start_time,
        status: r.status
      }))
    });

  } catch (error) {
    console.error('조기개장 스케줄 조정 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}