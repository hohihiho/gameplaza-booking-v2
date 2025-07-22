import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// 기종 생성
export async function POST(request: Request) {
  try {

    const body = await request.json();
    const { 
      category_id, 
      name, 
      description, 
      model_name, 
      version_name,
      is_rentable, 
      device_count 
    } = body;

    // 같은 카테고리 내 최대 display_order 찾기
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_types')
      .select('display_order')
      .eq('category_id', category_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const display_order = maxOrderData && maxOrderData.length > 0 
      ? (maxOrderData[0]?.display_order || 0) + 1 
      : 1;

    // device_types 테이블에 새 기종 추가
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_types')
      .insert({
        category_id,
        name,
        description,
        model_name,
        version_name,
        is_rentable,
        display_order
      })
      .select()
      .single();

    if (typeError) {
      console.error('Type creation error:', typeError);
      return NextResponse.json({ error: '기종 생성 실패' }, { status: 500 });
    }

    // 지정된 개수만큼 개별 기기 생성
    if (device_count > 0) {
      const devices = Array.from({ length: device_count }, (_, i) => ({
        device_type_id: deviceType.id,
        device_number: i + 1,
        status: 'available' as const
      }));

      const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('devices')
        .insert(devices);

      if (devicesError) {
        console.error('Devices creation error:', devicesError);
        // 기종은 생성되었지만 기기 생성 실패
        return NextResponse.json({ 
          warning: '기종은 생성되었지만 개별 기기 생성에 실패했습니다',
          deviceType 
        }, { status: 207 });
      }
    }

    return NextResponse.json({ 
      ...deviceType,
      device_count,
      active_count: device_count
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}