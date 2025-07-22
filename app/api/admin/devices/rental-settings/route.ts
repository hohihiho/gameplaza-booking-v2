import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// 대여 설정 업데이트 (생성 또는 수정)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      device_type_id,
      is_rentable,
      base_price,
      credit_types,
      fixed_credits,
      max_players,
      price_multiplier_2p,
      max_rental_units
    } = body

    // max_rental_units만 업데이트하는 경우
    if (is_rentable === undefined && max_rental_units !== undefined) {
      // device_types 테이블에 직접 저장
      const supabaseAdmin = createAdminClient();
  const { data: deviceTypesData } = await supabaseAdmin.from('device_types')
        .update({ 
          rental_settings: {
            max_rental_units: max_rental_units
          }
        })
        .eq('id', device_type_id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // 먼저 device_types의 is_rentable 업데이트
    
  const { error } = await supabaseAdmin.from('device_types')
      .update({ is_rentable })
      .eq('id', device_type_id)

    if (typeError) throw typeError

    if (is_rentable) {
      // 대여 설정 upsert (있으면 수정, 없으면 생성)
      
  const { data: rentalsettingsData } = await supabaseAdmin.from('rental_settings')
        .upsert({
          device_type_id,
          base_price,
          credit_types,
          fixed_credits: credit_types?.includes('fixed') ? fixed_credits : null,
          max_players,
          price_multiplier_2p: max_players > 1 ? price_multiplier_2p : 1.0,
          max_rental_units: max_rental_units || null
        }, {
          onConflict: 'device_type_id'
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // 대여 불가능으로 설정시 rental_settings 삭제
      await supabaseAdmin
        .from('rental_settings')
        .delete()
        .eq('device_type_id', device_type_id)

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error updating rental settings:', error)
    return NextResponse.json({ error: 'Failed to update rental settings' }, { status: 500 })
  }
}