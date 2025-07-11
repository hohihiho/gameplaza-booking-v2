import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 관리자용 예약 목록 조회
export async function GET() {
  try {
    const { data: reservationsData, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        *,
        users:user_id (
          id,
          name,
          phone,
          email,
          nickname
        ),
        devices:device_id (
          device_number,
          device_types (
            name,
            model_name,
            version_name,
            category_id,
            device_categories (
              name
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('예약 데이터 조회 에러:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: reservationsData || [] });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// 예약 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      // approved_by는 UUID 타입이므로 제외 (향후 실제 관리자 ID 사용)
    }
    
    if (status === 'rejected' && notes) {
      updateData.admin_notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('예약 상태 업데이트 에러:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}