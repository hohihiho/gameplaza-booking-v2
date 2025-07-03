import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const deviceTypeId = searchParams.get('deviceTypeId');

    if (!date || !deviceTypeId) {
      return NextResponse.json(
        { error: '날짜와 기기 타입을 지정해주세요' },
        { status: 400 }
      );
    }

    // 관리자 권한으로 예약 조회
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        device_id,
        start_time,
        end_time,
        status,
        devices!inner(
          device_number,
          device_type_id
        )
      `)
      .eq('date', date)
      .eq('devices.device_type_id', deviceTypeId)
      .in('status', ['pending', 'approved', 'checked_in']);

    if (error) {
      console.error('예약 조회 오류:', error);
      return NextResponse.json(
        { error: '예약 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservations: reservations || [] });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}