// 크론잡 - 기기 상태 업데이트
// 비전공자 설명: 예약이 끝난 기기들을 자동으로 '사용가능' 상태로 되돌리는 API입니다

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 보안: Authorization 헤더 확인 (GitHub Actions에서만 호출 가능)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // 1. 종료된 예약의 기기 상태 업데이트 함수 호출
    const { data: _updateResult, error: updateError } = await supabase
      .rpc('update_device_status_on_rental_end');
    
    if (updateError) {
      console.error('Error updating device status:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update device status',
        details: updateError.message 
      }, { status: 500 });
    }
    
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
      devicesChecked: count || 0
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}