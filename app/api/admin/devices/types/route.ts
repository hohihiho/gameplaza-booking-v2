import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// 메모리 캐시 (5분 캐시)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cacheMap: Record<string, CacheEntry> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 기기 타입 목록 조회 (카테고리별 또는 전체)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    // 메모리 캐시 키
    const cacheKey = categoryId ? `device-types-${categoryId}` : 'device-types-all';
    const now = Date.now();
    
    // 5분 캐시 확인
    if (cacheMap[cacheKey] && (now - cacheMap[cacheKey].timestamp) < CACHE_DURATION) {
      return NextResponse.json(cacheMap[cacheKey].data);
    }

    const supabaseAdmin = createAdminClient();
    let query = supabaseAdmin
      .from('device_types')
      .select(`
        *,
        device_categories(id, name),
        devices(id, device_number, status)
      `)
      .order('created_at', { ascending: true })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching device types:', error)
      throw error
    }

    // 데이터 포맷팅
    const formattedData = data?.map(type => ({
      id: type.id,
      name: type.name,
      category_id: type.category_id,
      category_name: type.device_categories?.name || '',
      description: type.description,
      created_at: type.created_at,
      updated_at: type.updated_at,
      device_count: type.devices?.length || 0,
      active_count: type.devices?.filter((d: any) => d.status === 'available').length || 0
    }))

    // 캐시에 저장
    cacheMap[cacheKey] = {
      data: formattedData || [],
      timestamp: now
    };

    return NextResponse.json(formattedData || [])
  } catch (error) {
    console.error('Error in GET /api/admin/devices/types:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch device types',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating device type:', error)
    return NextResponse.json({ error: 'Failed to update device type' }, { status: 500 })
  }
}