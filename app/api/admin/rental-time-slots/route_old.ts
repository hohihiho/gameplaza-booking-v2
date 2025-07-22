import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// 시간대 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceTypeId = searchParams.get('deviceTypeId')

    if (!deviceTypeId) {
      return NextResponse.json({ error: 'Device type ID is required' }, { status: 400 })
    }

    // 임시로 device_time_slots 테이블 사용
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_time_slots')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .eq('date', new Date().toISOString().split('T')[0])
      .order('start_time', { ascending: true })

    if (error) throw error

    // 응답 데이터 변환
    const formattedData = (data || []).map(slot => {
      let parsedNotes: any = {}
      try {
        parsedNotes = slot.notes ? JSON.parse(slot.notes) : {}
      } catch (e) {
        console.error('Error parsing notes:', e)
      }

      return {
        id: slot.id,
        device_type_id: slot.device_type_id,
        slot_type: slot.slot_type === 'early' || slot.slot_type === 'overnight' ? slot.slot_type : 'early',
        start_time: slot.start_time,
        end_time: slot.end_time,
        credit_options: parsedNotes.credit_options || [],
        enable_2p: parsedNotes.enable_2p || false,
        price_2p_extra: parsedNotes.price_2p_extra,
        is_youth_time: parsedNotes.is_youth_time || false
      }
    })

    return NextResponse.json(formattedData)
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
    if (!device_type_id || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 크레딧 옵션이 최소 1개는 있어야 함
    if (!credit_options || credit_options.length === 0) {
      return NextResponse.json({ error: 'At least one credit option is required' }, { status: 400 })
    }

    // 임시 가격 계산 (첫 번째 옵션의 첫 번째 시간 가격)
    const basePrice = credit_options[0]?.prices[credit_options[0]?.hours[0]] || 30000

    // device_time_slots 테이블에 저장 (임시)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_time_slots')
      .insert({
        date: new Date().toISOString().split('T')[0],
        device_type_id,
        start_time,
        end_time,
        available_devices: [1, 2, 3], // 임시 기본값
        price: basePrice,
        slot_type: slot_type || 'regular',
        notes: JSON.stringify({
          credit_options,
          enable_2p,
          price_2p_extra,
          is_youth_time
        })
      })
      .select()
      .single()

    if (error) throw error

    // 응답 포맷 변환
    const formattedData = {
      ...data,
      slot_type,
      credit_options,
      enable_2p: enable_2p || false,
      price_2p_extra,
      is_youth_time: is_youth_time || false
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error creating time slot:', error)
    return NextResponse.json({ error: 'Failed to create time slot' }, { status: 500 })
  }
}

