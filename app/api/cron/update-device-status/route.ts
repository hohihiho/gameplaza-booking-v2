// 크론잡 - 기기 상태 업데이트
// 비전공자 설명: 예약이 끝난 기기들을 자동으로 '사용가능' 상태로 되돌리는 API입니다

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 보안: Authorization 헤더 확인 (GitHub Actions에서만 호출 가능)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // 1. 현재 시간 기준으로 종료되어야 할 예약들 찾기
    const now = new Date().toISOString();
    
    // 체크인된 상태이면서 종료 시간이 지난 예약들 조회
    const { data: expiredReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, device_id, status, end_time')
      .eq('status', 'checked_in')
      .lt('end_time', now);
    
    if (fetchError) {
      console.error('Error fetching expired reservations:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch expired reservations',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // 2. 각 예약에 대해 처리
    for (const reservation of expiredReservations || []) {
      // 예약 상태를 completed로 변경
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', reservation.id);
      
      if (reservationError) {
        console.error(`Error updating reservation ${reservation.id}:`, reservationError);
        errorCount++;
        continue;
      }
      
      // 기기가 할당된 경우 기기 상태를 available로 변경
      if (reservation.device_id) {
        const { error: deviceError } = await supabase
          .from('devices')
          .update({ status: 'available' })
          .eq('id', reservation.device_id)
          .eq('status', 'in_use'); // in_use 상태인 경우만 변경
        
        if (deviceError) {
          console.error(`Error updating device ${reservation.device_id}:`, deviceError);
          errorCount++;
        } else {
          updatedCount++;
        }
      } else {
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} reservations, ${errorCount} errors`);
    
    // 2. Supabase 활성 상태 유지를 위한 간단한 쿼리
    const { count, error: pingError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });
    
    if (pingError) {
      console.error('Error pinging database:', pingError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Device status updated successfully',
      timestamp: new Date().toISOString(),
      devicesChecked: count || 0,
      reservationsProcessed: updatedCount,
      errors: errorCount
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}