import { NextResponse } from 'next/server';
import { ScheduleService } from '@/lib/services/schedule.service';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 모든 pending 상태의 예약을 찾아서 자동 스케줄 생성 테스트
    const supabaseAdmin = createAdminClient();
    const { data: pendingReservations } = await supabaseAdmin.from('reservations')
      .select('id, date, start_time, end_time')
      .eq('status', 'pending')
      .order('date', { ascending: true });

    if (!pendingReservations || pendingReservations.length === 0) {
      return NextResponse.json({ 
        message: '처리할 대기 중인 예약이 없습니다'
      });
    }

    const results = [];

    for (const reservation of pendingReservations) {
      console.log(`\n=== 예약 처리 중 ===`);
      console.log(`ID: ${reservation.id}`);
      console.log(`날짜: ${reservation.date}`);
      console.log(`시간: ${reservation.start_time} - ${reservation.end_time}`);
      
      // 예약 승인 처리
      const { error } = await supabaseAdmin.from('reservations')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (!error) {
        // 자동 스케줄 생성
        await ScheduleService.handleReservationApproved(reservation.id);
        results.push({ 
          id: reservation.id, 
          date: reservation.date,
          processed: true 
        });
      } else {
        results.push({ 
          id: reservation.id, 
          date: reservation.date,
          processed: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({ 
      message: `${results.length}개의 예약을 처리했습니다`,
      results 
    });
  } catch (error) {
    console.error('테스트 중 오류:', error);
    return NextResponse.json({ 
      error: '테스트 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}