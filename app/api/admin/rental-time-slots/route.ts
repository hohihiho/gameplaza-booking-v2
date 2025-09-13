import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

// 시간대 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceTypeId = searchParams.get('deviceTypeId')

    if (!deviceTypeId) {
      return NextResponse.json({ error: 'Device type ID is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('rental_time_slots')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .order('slot_type', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return NextResponse.json({ error: 'Failed to fetch time slots' }, { status: 500 })
  }
}

// 시간대 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_type_id, slot_type, start_time, end_time, credit_options, enable_2p, price_2p_extra, is_youth_time } = body

    // 필수 필드 검증
    if (!device_type_id || !slot_type || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 크레딧 옵션이 최소 1개는 있어야 함
    if (!credit_options || credit_options.length === 0) {
      return NextResponse.json({ error: 'At least one credit option is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('rental_time_slots')
      .insert({
        device_type_id,
        slot_type,
        start_time,
        end_time,
        credit_options,
        enable_2p,
        price_2p_extra: enable_2p ? price_2p_extra : null,
        is_youth_time: is_youth_time || false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating time slot:', error)
    return NextResponse.json({ error: 'Failed to create time slot' }, { status: 500 })
  }
}