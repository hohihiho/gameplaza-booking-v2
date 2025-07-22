import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { ScheduleService } from '@/lib/services/schedule.service';

// 스케줄 생성/업데이트 헬퍼 함수
async function createOrUpdateSchedule(
  date: string, 
  type: 'early' | 'overnight',
  reservations: any[]
) {
  try {
    let startTime: string;
    let endTime: string;
    let title: string;
    
    if (type === 'early') {
      // 조기영업: 가장 빠른 예약 시작 시간
      const earlyReservations = reservations.filter(r => {
        const hour = parseInt(r.start_time.split(':')[0]);
        return hour >= 7 && hour < 12;
      });
      
      if (earlyReservations.length === 0) return;
      
      const earliest = earlyReservations.reduce((prev, curr) => 
        prev.start_time < curr.start_time ? prev : curr
      );
      
      startTime = earliest.start_time;
      endTime = '12:00';
      title = '조기영업 (자동)';
    } else {
      // 밤샘영업: 가장 늦은 예약 종료 시간
      const overnightReservations = reservations.filter(r => {
        const hour = parseInt(r.start_time.split(':')[0]);
        return hour >= 0 && hour <= 5;
      });
      
      if (overnightReservations.length === 0) return;
      
      const latest = overnightReservations.reduce((prev, curr) => 
        prev.end_time > curr.end_time ? prev : curr
      );
      
      startTime = '22:00';
      endTime = latest.end_time;
      title = '밤샘영업 (자동)';
    }
    
    // 기존 자동 생성 일정 확인
    const supabaseAdmin = createAdminClient();
  const { data: scheduleeventsData } = await supabaseAdmin.from('schedule_events')
      .select('id')
      .eq('date', date)
      .eq('type', type === 'early' ? 'early_open' : 'overnight')
      .eq('is_auto_generated', true)
      .single();
    
    if (existingSchedule) {
      // 업데이트
      await supabaseAdmin
        .from('schedule_events')
        .update({
          start_time: startTime,
          end_time: endTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSchedule.id);
        
      console.log(`${date} ${type} 일정 업데이트됨`);
    } else {
      // 수동 일정이 있는지 확인
      
  const { data: scheduleeventsData2 } = await supabaseAdmin.from('schedule_events')
        .select('id')
        .eq('date', date)
        .eq('type', type === 'early' ? 'early_open' : 'overnight')
        .eq('is_auto_generated', false)
        .single();
        
      if (!manualSchedule) {
        // 새로 생성
        await supabaseAdmin
          .from('schedule_events')
          .insert({
            date,
            title,
            type: type === 'early' ? 'early_open' : 'overnight',
            start_time: startTime,
            end_time: endTime,
            is_auto_generated: true,
            source_type: 'reservation_auto',
            affects_reservation: false,
            description: '예약 승인에 따라 자동으로 생성된 영업 일정입니다.'
          });
          
        console.log(`${date} ${type} 일정 생성됨`);
      }
    }
  } catch (error) {
    console.error(`${date} ${type} 스케줄 처리 오류:`, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dates } = body; // ['2025-07-16', '2025-07-17']

    if (!dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: '날짜 배열이 필요합니다' }, { status: 400 });
    }

    const results = [];

    for (const date of dates) {
      console.log(`${date} 예약 동기화 시작`);
      
      // 해당 날짜의 승인된 예약 조회
      const supabaseAdmin = createAdminClient();
  const { data: reservationsData } = await supabaseAdmin.from('reservations')
        .select(`
          id,
          date,
          start_time,
          end_time,
          status
        `)
        .eq('date', date)
        .eq('status', 'approved');

      if (error) {
        console.error(`${date} 예약 조회 오류:`, error);
        results.push({ date, status: 'error', message: error.message });
        continue;
      }

      console.log(`${date} 승인된 예약:`, reservations);

      // 조기/밤샘 예약 필터링 및 처리
      let earlyCount = 0;
      let overnightCount = 0;
      
      for (const reservation of reservations || []) {
        const startHour = parseInt(reservation.start_time.split(':')[0]);
        
        // 조기영업 시간대 (7-12시)
        if (startHour >= 7 && startHour < 12) {
          earlyCount++;
        }
        // 밤샘영업 시간대 (24-29시 = 0-5시)
        else if (startHour >= 0 && startHour <= 5) {
          overnightCount++;
        }
      }

      // 조기영업 일정 생성/업데이트
      if (earlyCount > 0) {
        await createOrUpdateSchedule(date, 'early', reservations);
      }

      // 밤샘영업 일정 생성/업데이트
      if (overnightCount > 0) {
        await createOrUpdateSchedule(date, 'overnight', reservations);
      }

      results.push({
        date,
        status: 'success',
        totalReservations: reservations?.length || 0,
        earlyCount,
        overnightCount
      });
    }

    return NextResponse.json({
      message: '예약 동기화 완료',
      results
    });
  } catch (error) {
    console.error('예약 동기화 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// 특정 날짜의 예약 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: '날짜가 필요합니다' }, { status: 400 });
    }

    // 해당 날짜의 예약 조회
    const supabaseAdmin = createAdminClient();
  const { data: reservationsData2 } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        date,
        start_time,
        end_time,
        status
      `)
      .eq('date', date)
      .order('start_time');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 해당 날짜의 스케줄 이벤트 조회
    
  const { data: scheduleeventsData3 } = await supabaseAdmin.from('schedule_events')
      .select('*')
      .eq('date', date);

    return NextResponse.json({
      date,
      reservations,
      scheduleEvents,
      summary: {
        totalReservations: reservations?.length || 0,
        approved: reservations?.filter(r => r.status === 'approved').length || 0,
        early: reservations?.filter(r => {
          const hour = parseInt(r.start_time.split(':')[0]);
          return hour >= 7 && hour < 12;
        }).length || 0,
        overnight: reservations?.filter(r => {
          const hour = parseInt(r.start_time.split(':')[0]);
          return hour >= 0 && hour <= 5;
        }).length || 0
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}