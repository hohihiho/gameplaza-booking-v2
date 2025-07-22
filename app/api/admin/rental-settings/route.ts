import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getKSTNow } from '@/lib/utils/date'

// 대여 설정 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceTypeId = searchParams.get('deviceTypeId')

    if (!deviceTypeId) {
      return NextResponse.json({ error: 'Device type ID is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('rental_settings')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
      throw error
    }

    return NextResponse.json(data || null)
  } catch (error) {
    console.error('Error fetching rental settings:', error)
    return NextResponse.json({ error: 'Failed to fetch rental settings' }, { status: 500 })
  }
}

// 대여 설정 생성/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_type_id, max_rental_units, color, display_order } = body
    
    console.log('Rental settings update request:', { device_type_id, max_rental_units, color, display_order })

    if (!device_type_id) {
      return NextResponse.json({ error: 'Device type ID is required' }, { status: 400 })
    }

    // 먼저 기존 설정이 있는지 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('rental_settings')
      .select('*')
      .eq('device_type_id', device_type_id)
      .single()

    let result
    if (existing) {
      // 업데이트
      const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('rental_settings')
        .update({
          max_rental_units: max_rental_units !== undefined ? max_rental_units : existing.max_rental_units,
          updated_at: getKSTNow()
        })
        .eq('device_type_id', device_type_id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // 새로 생성
      const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('rental_settings')
        .insert({
          device_type_id,
          max_rental_units: max_rental_units || null,
          min_rental_hours: 1,  // 기본값
          max_rental_hours: 24  // 기본값
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // device_types 테이블도 업데이트 (호환성을 위해)
    // 기존 rental_settings 가져오기
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_types')
      .select('rental_settings')
      .eq('id', device_type_id)
      .single()

    const updatedSettings = {
      ...(deviceType?.rental_settings || {}),
      max_rental_units: max_rental_units !== undefined ? max_rental_units : (deviceType?.rental_settings?.max_rental_units || null)
    }

    // color와 display_order가 있으면 추가
    if (color !== undefined) {
      updatedSettings.color = color
    }
    if (display_order !== undefined) {
      updatedSettings.display_order = display_order
    }

    const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('device_types')
      .update({
        rental_settings: updatedSettings
      })
      .eq('id', device_type_id)
    
    if (updateError) throw updateError

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating rental settings:', error)
    return NextResponse.json({ error: 'Failed to update rental settings' }, { status: 500 })
  }
}