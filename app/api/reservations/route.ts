import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 예약 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      date, 
      deviceTypeId, 
      timeSlotId,
      deviceNumber, 
      playerCount = 1,
      totalPrice 
    } = body

    // 1. 선택한 시간대가 유효한지 확인
    const { data: timeSlot, error: slotError } = await supabase
      .from('device_time_slots')
      .select('*, device_types(*)')
      .eq('id', timeSlotId)
      .single()

    if (slotError || !timeSlot) {
      return NextResponse.json({ error: '유효하지 않은 시간대입니다' }, { status: 400 })
    }

    // 2. 선택한 기기 번호가 예약 가능한지 확인
    if (!timeSlot.available_devices.includes(deviceNumber)) {
      return NextResponse.json({ error: '선택한 기기는 예약할 수 없습니다' }, { status: 400 })
    }

    // 3. 해당 시간대에 이미 예약이 있는지 확인
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('device_number')
      .eq('device_time_slot_id', timeSlotId)
      .in('status', ['pending', 'approved'])

    const reservedDevices = existingReservations?.map(r => r.device_number) || []
    if (reservedDevices.includes(deviceNumber)) {
      return NextResponse.json({ error: '이미 예약된 기기입니다' }, { status: 400 })
    }

    // 4. 기기 정보 가져오기
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('device_type_id', deviceTypeId)
      .eq('device_number', deviceNumber)
      .single()

    // 5. 예약 생성
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        device_time_slot_id: timeSlotId,
        device_id: device?.id,
        device_number: deviceNumber,
        total_price: totalPrice,
        player_count: playerCount,
        status: 'pending',
        payment_method: 'cash' // 기본값
      })
      .select()
      .single()

    if (reservationError) {
      console.error('Reservation error:', reservationError)
      return NextResponse.json({ error: '예약 생성에 실패했습니다' }, { status: 500 })
    }

    // 6. 실시간 업데이트를 위한 브로드캐스트
    await supabase
      .channel('reservations')
      .send({
        type: 'broadcast',
        event: 'new_reservation',
        payload: { 
          timeSlotId,
          deviceNumber,
          reservationId: reservation.id 
        }
      })

    return NextResponse.json({ 
      success: true, 
      reservation,
      message: '예약이 접수되었습니다. 관리자 승인을 기다려주세요.'
    })

  } catch (error) {
    console.error('Reservation API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 내 예약 목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // 예약 목록 조회 쿼리
    let query = supabase
      .from('reservations')
      .select(`
        *,
        device_time_slots!inner(
          date,
          start_time,
          end_time,
          price,
          slot_type,
          notes,
          device_types(
            name,
            category
          )
        ),
        devices(
          device_number,
          location
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: reservations, error } = await query

    if (error) {
      console.error('Get reservations error:', error)
      return NextResponse.json({ error: '예약 목록을 불러올 수 없습니다' }, { status: 500 })
    }

    return NextResponse.json({ reservations })

  } catch (error) {
    console.error('Reservations API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}