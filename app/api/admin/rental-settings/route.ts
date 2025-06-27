import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 대여 설정 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceTypeId = searchParams.get('deviceTypeId')

    if (!deviceTypeId) {
      return NextResponse.json({ error: 'Device type ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('rental_settings')
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
    const { device_type_id, max_rental_units } = body

    if (!device_type_id) {
      return NextResponse.json({ error: 'Device type ID is required' }, { status: 400 })
    }

    // 먼저 기존 설정이 있는지 확인
    const { data: existing } = await supabaseAdmin
      .from('rental_settings')
      .select('id')
      .eq('device_type_id', device_type_id)
      .single()

    let result
    if (existing) {
      // 업데이트
      const { data, error } = await supabaseAdmin
        .from('rental_settings')
        .update({
          max_rental_units: max_rental_units || null,
          updated_at: new Date().toISOString()
        })
        .eq('device_type_id', device_type_id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // 새로 생성
      const { data, error } = await supabaseAdmin
        .from('rental_settings')
        .insert({
          device_type_id,
          max_rental_units: max_rental_units || null
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // device_types 테이블도 업데이트 (호환성을 위해)
    await supabaseAdmin
      .from('device_types')
      .update({
        rental_settings: {
          max_rental_units: max_rental_units || null
        }
      })
      .eq('id', device_type_id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating rental settings:', error)
    return NextResponse.json({ error: 'Failed to update rental settings' }, { status: 500 })
  }
}