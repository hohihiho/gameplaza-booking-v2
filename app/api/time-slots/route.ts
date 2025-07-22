import { createServerClient as createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const date = searchParams.get('date')
    const deviceTypeId = searchParams.get('deviceTypeId')

    if (!date) {
      return NextResponse.json({ error: '날짜가 필요합니다' }, { status: 400 })
    }

    // 선택한 날짜의 시간대 슬롯 조회
    let query = supabase
      .from('device_time_slots')
      .select(`
        *,
        device_types(
          id,
          name,
          category,
          base_price,
          price_multiplier_2p
        )
      `)
      .eq('date', date)
      .order('start_time', { ascending: true })

    // 특정 기기 타입 필터링
    if (deviceTypeId) {
      query = query.eq('device_type_id', deviceTypeId)
    }

    const { data: timeSlots, error: slotsError } = await query

    if (slotsError) {
      console.error('Time slots error:', slotsError)
      return NextResponse.json({ error: '시간대를 불러올 수 없습니다' }, { status: 500 })
    }

    // 각 시간대별 예약 현황 확인
    const slotsWithAvailability = await Promise.all(
      timeSlots.map(async (slot) => {
        // 해당 시간대의 예약 조회
        const supabase = createClient();
  const { data$1 } = await supabase.from('reservations')
          .select('device_number')
          .eq('rental_time_slot_id', slot.id)
          .in('status', ['pending', 'approved'])

        const reservedDevices = reservations?.map(r => r.device_number) || []
        const availableDevices = slot.available_devices.filter(
          (deviceNum: number) => !reservedDevices.includes(deviceNum)
        )

        return {
          ...slot,
          reserved_devices: reservedDevices,
          available_devices: availableDevices,
          is_available: availableDevices.length > 0
        }
      })
    )

    return NextResponse.json({ timeSlots: slotsWithAvailability })

  } catch (error) {
    console.error('Time slots API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 관리자용: 시간대 슬롯 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const supabase = createClient();
  const { data$1 } = await supabase.from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const body = await request.json()
    const {
      date,
      deviceTypeId,
      startTime,
      endTime,
      availableDevices,
      price,
      slotType = 'regular',
      notes
    } = body

    // 시간대 슬롯 생성
    const supabase = createClient();
  const { data$1 } = await supabase.from('device_time_slots')
      .insert({
        date,
        device_type_id: deviceTypeId,
        start_time: startTime,
        end_time: endTime,
        available_devices: availableDevices,
        price,
        slot_type: slotType,
        notes,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Create time slot error:', error)
      return NextResponse.json({ error: '시간대 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      timeSlot,
      message: '시간대가 생성되었습니다'
    })

  } catch (error) {
    console.error('Time slot API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}