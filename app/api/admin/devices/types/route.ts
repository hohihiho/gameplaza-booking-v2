import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 기기 타입 목록 조회 (카테고리별 또는 전체)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = supabaseAdmin
      .from('device_types')
      .select(`
        *,
        device_categories(id, name),
        play_modes(id, name, price, display_order),
        devices(id, device_number, status)
      `)
      .order('display_order', { ascending: true })

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
      display_order: type.display_order,
      is_rentable: type.is_rentable,
      play_modes: type.play_modes?.sort((a: any, b: any) => a.display_order - b.display_order) || [],
      rental_settings: type.rental_settings || {},  // JSONB 컬럼에서 직접 가져옴
      device_count: type.devices?.length || 0,
      active_count: type.devices?.filter((d: any) => d.status === 'available').length || 0
    }))

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
    const { category_id, name, description, is_rentable, play_modes, device_count } = body
    
    console.log('Creating device type with:', { category_id, name, device_count })

    // 기기 타입 생성
    const { data: deviceType, error: typeError } = await supabaseAdmin
      .from('device_types')
      .insert({ category_id, name, description, is_rentable })
      .select()
      .single()

    if (typeError) throw typeError

    // 플레이 모드 생성
    if (play_modes && play_modes.length > 0) {
      const modesData = play_modes.map((mode: any, index: number) => ({
        device_type_id: deviceType.id,
        name: mode.name,
        price: mode.price,
        display_order: index + 1
      }))

      const { error: modesError } = await supabaseAdmin
        .from('play_modes')
        .insert(modesData)

      if (modesError) throw modesError
    }

    // 개별 기기 생성 (device_count만큼)
    if (device_count && device_count > 0) {
      console.log(`Creating ${device_count} devices for type ${deviceType.id}`)
      
      const devicesData = Array.from({ length: device_count }, (_, index) => ({
        device_type_id: deviceType.id,
        device_number: index + 1,
        status: 'available' as const
      }))

      const { data: createdDevices, error: devicesError } = await supabaseAdmin
        .from('devices')
        .insert(devicesData)
        .select()

      if (devicesError) {
        console.error('Error creating devices:', devicesError)
        throw devicesError
      }
      
      console.log(`Created ${createdDevices?.length || 0} devices`)
    }

    // 대여 가능한 경우 rental_settings 생성
    if (is_rentable) {
      const { error: rentalError } = await supabaseAdmin
        .from('rental_settings')
        .insert({
          device_type_id: deviceType.id,
          base_price: 40000, // 기본값
          credit_types: ['freeplay'],
          max_players: 1
        })

      if (rentalError) throw rentalError
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

    const { data, error } = await supabaseAdmin
      .from('device_types')
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