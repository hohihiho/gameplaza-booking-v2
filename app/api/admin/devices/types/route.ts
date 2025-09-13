import { getDB, supabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'
import { withCache, cacheConfigs, invalidateCache } from '@/lib/cache/middleware'

// 기기 타입 목록 조회 핸들러
const getDeviceTypesHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  const supabaseAdmin = createAdminClient();

  console.log('🔍 [Device Types API] 요청 시작:', { categoryId });

  let query = supabaseAdmin
    .from('device_types')
    .select(`
      *,
      device_categories(id, name),
      devices(id, device_number, status)
    `)
    .order('created_at', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  console.log('🔍 [Device Types API] Supabase 쿼리 실행 중...');
  const { data, error } = await query;

  if (error) {
    console.error('❌ [Device Types API] Supabase 에러:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('✅ [Device Types API] 데이터 조회 완료:', data?.length, '건');

  // 데이터 포맷팅
  const formattedData = data?.map(type => ({
    id: type.id,
    name: type.name,
    category_id: type.category_id,
    category_name: type.device_categories?.name || '',
    description: type.description,
    model_name: type.model_name,
    version_name: type.version_name,
    display_order: type.display_order,
    is_rentable: type.is_rentable,
    play_modes: type.play_modes ?
      (Array.isArray(type.play_modes) ? type.play_modes : [])
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      : [],
    rental_settings: type.rental_settings || {},
    created_at: type.created_at,
    updated_at: type.updated_at,
    device_count: type.devices?.length || 0,
    active_count: type.devices?.filter((d: any) => d.status === 'available').length || 0
  }));

  return NextResponse.json(formattedData || []);
};

// 캐시가 적용된 GET 핸들러
export const GET = withCache(getDeviceTypesHandler, {
  ...cacheConfigs.deviceTypes,
  keyGenerator: (req) => {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get('categoryId');
    return categoryId ? `device-types-${categoryId}` : 'device-types-all';
  }
});

// 기기 타입 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category_id, name, description, device_count } = body
    
    console.log('Creating device type with:', { category_id, name, device_count })

    // 기기 타입 생성
    const supabaseAdmin = createAdminClient();
    const { data: deviceType, error: typeError } = await supabaseAdmin.from('device_types')
      .insert({ category_id, name, description })
      .select()
      .single()

    if (typeError) throw typeError

    // 개별 기기 생성 (device_count만큼)
    if (device_count && device_count > 0) {
      console.log(`Creating ${device_count} devices for type ${deviceType.id}`)
      
      const devicesData = Array.from({ length: device_count }, (_, index) => ({
        device_type_id: deviceType.id,  // 개발 DB는 device_type_id 사용
        device_number: index + 1,       // 개발 DB는 device_number 사용
        name: `${name} #${index + 1}`,
        status: 'available' as const
      }))

      const { data: createdDevices, error: devicesError } = await supabaseAdmin.from('devices')
        .insert(devicesData)
        .select()

      if (devicesError) {
        console.error('Error creating devices:', devicesError)
        throw devicesError
      }
      
      console.log(`Created ${createdDevices?.length || 0} devices`)
    }

    // 캐시 무효화
    invalidateCache(['device-types', 'admin']);

    return NextResponse.json(deviceType)
  } catch (error) {
    console.error('Error creating device type:', error)
    return NextResponse.json({ error: 'Failed to create device type' }, { status: 500 })
  }
}

// 기기 타입 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, display_order } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (display_order !== undefined) updateData.display_order = display_order

    const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from('device_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 캐시 무효화
    invalidateCache(['device-types', 'admin']);

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating device type:', error)
    return NextResponse.json({ error: 'Failed to update device type' }, { status: 500 })
  }
}