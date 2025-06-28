import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getKSTNow } from '@/lib/utils/date'

// 예약 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { data: reservation, error } = await supabase
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ reservation })

  } catch (error) {
    console.error('Get reservation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 예약 취소
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 예약 정보 확인
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        device_time_slots!inner(
          date,
          start_time
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
    }

    // 취소 가능 여부 확인
    if (!['pending', 'approved'].includes(reservation.status)) {
      return NextResponse.json({ error: '취소할 수 없는 예약입니다' }, { status: 400 })
    }

    // 예약 시간 24시간 전까지만 취소 가능
    const reservationTime = new Date(`${reservation.device_time_slots.date}T${reservation.device_time_slots.start_time}`)
    const now = new Date()
    const hoursUntilReservation = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilReservation < 24) {
      return NextResponse.json({ 
        error: '예약 시간 24시간 전까지만 취소 가능합니다' 
      }, { status: 400 })
    }

    // 예약 취소 처리
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: getKSTNow()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Cancel reservation error:', updateError)
      return NextResponse.json({ error: '예약 취소에 실패했습니다' }, { status: 500 })
    }

    // 실시간 업데이트를 위한 브로드캐스트
    await supabase
      .channel('reservations')
      .send({
        type: 'broadcast',
        event: 'cancelled_reservation',
        payload: { 
          reservationId: id,
          timeSlotId: reservation.device_time_slot_id,
          deviceNumber: reservation.device_number
        }
      })

    return NextResponse.json({ 
      success: true,
      message: '예약이 취소되었습니다'
    })

  } catch (error) {
    console.error('Cancel reservation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}