// 크론잡 - 예약 시작 시간 체크 및 기기 상태 업데이트
// 비전공자 설명: 체크인은 되었지만 아직 예약 시간이 되지 않은 기기들을 확인하고,
// 예약 시간이 되면 자동으로 '대여 중' 상태로 변경하는 API입니다.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    // 보안: Authorization 헤더 확인 (GitHub Actions에서만 호출 가능)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
    // 1. 예약 시작 시간이 된 체크인 예약들의 기기 상태 업데이트
    const { error: updateError } = await supabase
      .rpc('check_rental_start_times');
    
    if (updateError) {
      console.error('Error updating device status on rental start:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update device status',
        details: updateError.message 
      }, { status: 500 });
    }
    
    // 2. 업데이트된 예약 수 조회
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const { data: updatedReservations, error: queryError } = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'checked_in')
      .eq('date', now.toISOString().split('T')[0])
      .lte('start_time', currentTime)
      .not('actual_start_time', 'is', null);
    
    if (queryError) {
      console.error('Error querying updated reservations:', queryError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rental start times checked successfully',
      timestamp: new Date().toISOString(),
      updatedCount: updatedReservations?.length || 0,
      currentTime: currentTime
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}