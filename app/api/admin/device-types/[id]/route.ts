import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

// 기종 정보 업데이트
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params를 await
    const { id } = await params;
    
    // 관리자 API는 별도의 인증 확인 없이 supabaseAdmin 사용
    // TODO: 실제 프로덕션에서는 적절한 인증 미들웨어 추가 필요

    const body = await request.json();
    console.log('[기종 업데이트] 요청 데이터:', body);
    const { name, description, model_name, version_name, is_rentable } = body;

    // device_types 테이블 업데이트
    const updateData = {
      name,
      description: description || null,
      model_name: model_name || null,
      version_name: version_name || null,
      is_rentable,
      updated_at: new Date().toISOString()
    };
    
    console.log('[기종 업데이트] 업데이트 데이터:', updateData);
    
    const { data, error } = await supabaseAdmin
      .from('device_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[기종 업데이트] DB 오류:', error);
      return NextResponse.json({ error: '업데이트 실패', details: error.message }, { status: 500 });
    }

    console.log('[기종 업데이트] 성공:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 기종 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params를 await
    const { id } = await params;

    // 연결된 기기가 있는지 확인
    const { data: devices } = await supabaseAdmin
      .from('devices')
      .select('id')
      .eq('device_type_id', params.id)
      .limit(1);

    if (devices && devices.length > 0) {
      return NextResponse.json({ 
        error: '이 기종에 연결된 기기가 있어 삭제할 수 없습니다' 
      }, { status: 400 });
    }

    // 기종 삭제
    const { error } = await supabaseAdmin
      .from('device_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}