import { NextRequest, NextResponse } from 'next/server'
import {
  d1ListDeviceTypes,
  d1ListDeviceCategories,
  d1ListDevicesByType,
  d1CreateDeviceType,
  d1UpdateDeviceType,
  d1InsertDevicesForType
} from '@/lib/db/d1'
import { withCache, cacheConfigs, invalidateCache } from '@/lib/cache/middleware'

// 기기 타입 목록 조회 핸들러
const getDeviceTypesHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    console.log('🔍 [Device Types API] 요청 시작:', { categoryId });
    // D1에서 타입/카테고리/디바이스를 조합하여 응답 구성
    const [types, categories] = await Promise.all([
      d1ListDeviceTypes(),
      d1ListDeviceCategories()
    ])
    const catNameById = new Map<string, string>()
    for (const c of categories as any[]) catNameById.set(String(c.id), c.name)

    const filtered = (types as any[]).filter(t => !categoryId || String(t.category_id) === String(categoryId))
    const result = [] as any[]
    for (const t of filtered) {
      const devices = await d1ListDevicesByType(Number(t.id))
      result.push({
        id: t.id,
        name: t.name,
        category_id: t.category_id,
        category_name: catNameById.get(String(t.category_id)) || '',
        description: t.description,
        model_name: t.model_name,
        version_name: t.version_name,
        display_order: t.display_order,
        is_rentable: !!(t.is_rentable ?? 0),
        play_modes: Array.isArray(t.play_modes) ? t.play_modes.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) : [],
        rental_settings: t.rental_settings || {},
        created_at: t.created_at,
        updated_at: t.updated_at,
        device_count: (devices as any[]).length || 0,
        active_count: (devices as any[]).filter((d: any) => d.status === 'available').length || 0
      })
    }

    console.log('✅ [Device Types API] 데이터 조회 완료:', result.length, '건');
    return NextResponse.json(result)
  } catch (error) {
    const message = (error as Error)?.message || ''
    if (process.env.NODE_ENV !== 'production' && message.includes('Database is not configured')) {
      console.warn('[device-types] D1 not configured; returning empty list for development')
      return NextResponse.json([])
    }
    throw error
  }
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

    // 기기 타입 생성 (D1)
    const deviceType = await d1CreateDeviceType({ name, is_rentable: 0, max_rentable_count: 1, color_code: null })

    // 개별 기기 생성 (device_count만큼)
    if (device_count && device_count > 0) {
      console.log(`Creating ${device_count} devices for type ${deviceType.id}`)
      await d1InsertDevicesForType(Number(deviceType.id), Number(device_count), name)
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

    const data = await d1UpdateDeviceType(Number(id), updateData)

    // 캐시 무효화
    invalidateCache(['device-types', 'admin']);

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating device type:', error)
    return NextResponse.json({ error: 'Failed to update device type' }, { status: 500 })
  }
}
