import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    if (!year || !month) {
      return NextResponse.json({ error: '년월 정보가 필요합니다' }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    
    // 월의 시작일과 종료일 계산
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    const startStr = `${year}-${month.padStart(2, '0')}-01`;
    const endStr = `${year}-${month.padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
    
    // 1. 운영 일정 가져오기
    const { data: scheduleEvents, error: scheduleError } = await supabase
      .from('schedule_events')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date');
    
    if (scheduleError) {
      console.error('일정 조회 오류:', scheduleError);
      return NextResponse.json({ error: '일정 조회에 실패했습니다' }, { status: 500 });
    }
    
    // 2. 예약 데이터 가져오기 (대기, 취소 제외)
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        device_id,
        player_count,
        status,
        date,
        start_time,
        end_time
      `)
      .in('status', ['approved', 'checked_in', 'completed'])
      .gte('date', startStr)
      .lte('date', endStr);
    
    if (reservationsError) {
      console.error('예약 조회 오류:', reservationsError);
    }
    
    // 3. 기기 정보 가져오기
    let devices: any[] = [];
    if (reservations && reservations.length > 0) {
      const deviceIds = [...new Set(reservations.map(r => r.device_id).filter(Boolean))];
      if (deviceIds.length > 0) {
        const { data: devicesData } = await supabase
          .from('devices')
          .select(`
            id,
            device_number,
            device_types (
              name,
              model_name,
              version_name
            )
          `)
          .in('id', deviceIds);
        
        devices = devicesData || [];
      }
    }
    
    return NextResponse.json({
      scheduleEvents: scheduleEvents || [],
      reservations: reservations || [],
      devices: devices || []
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}