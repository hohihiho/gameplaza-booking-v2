import { getDB, supabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';
import { ScheduleService } from '@/lib/services/schedule.service';

export async function POST(_request: NextRequest) {
  try {
    console.log('예약 스케줄 동기화 시작...');
    
    // 앞으로 3주간의 모든 승인된 예약 조회
    const today = new Date();
    const threeWeeksLater = new Date(today);
    threeWeeksLater.setDate(today.getDate() + 21);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = threeWeeksLater.toISOString().split('T')[0];

    const supabaseAdmin = createAdminClient();
    const { data: reservations, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, date, start_time, end_time, status')
      .in('status', ['approved', 'checked_in'])
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (reservationError) {
      console.error('예약 조회 실패:', reservationError);
      return NextResponse.json(
        { error: '예약 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    let processedCount = 0;
    let errorCount = 0;
    const processedDates = new Set<string>();
    const dateResults: any[] = [];

    // 각 예약에 대해 스케줄 생성/업데이트 처리
    for (const reservation of reservations || []) {
      try {
        console.log(`예약 처리 중: ${reservation.id} (날짜: ${reservation.date}, 시간: ${reservation.start_time})`);
        
        // 예약 승인 처리 함수 호출 (새로운 ScheduleService 사용)
        await ScheduleService.handleReservationApproved(reservation.id);
        processedCount++;
        
        // 처리된 날짜 기록
        processedDates.add(reservation.date);
      } catch (error) {
        console.error(`예약 ${reservation.id} 처리 실패:`, error);
        errorCount++;
      }
    }

    // 예약이 없어진 날짜의 자동 스케줄 정리
    let cleanupCount = 0;
    for (const date of processedDates) {
      try {
        await ScheduleService.checkAndDeleteAutoSchedules(date);
        cleanupCount++;
        
        // 해당 날짜의 예약 요약 정보 추가
        const dateReservations = reservations?.filter(r => r.date === date) || [];
        dateResults.push({
          date,
          status: 'success',
          totalReservations: dateReservations.length
        });
      } catch (error) {
        console.error(`날짜 ${date} 스케줄 정리 실패:`, error);
        errorCount++;
        dateResults.push({
          date,
          status: 'error',
          message: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    console.log(`예약 스케줄 동기화 완료 - 처리: ${processedCount}개, 정리: ${cleanupCount}개, 오류: ${errorCount}개`);

    return NextResponse.json({
      success: true,
      message: '예약 스케줄 동기화 완료',
      result: {
        processed: processedCount,
        cleaned: cleanupCount,
        errors: errorCount,
        dateRange: `${startDate} ~ ${endDate}`,
        totalReservations: reservations?.length || 0,
        processedDates: processedDates.size
      },
      details: dateResults
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
  const { data: reservations, error } = await supabaseAdmin.from('reservations')
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
    
  const { data: scheduleEvents } = await supabaseAdmin.from('schedule_events')
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