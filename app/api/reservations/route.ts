import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 예약 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인 (Next-Auth 사용)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    console.log('예약 요청 데이터:', body)
    
    const { 
      date,
      startTime,
      endTime,
      deviceId,
      playerCount = 1,
      hourlyRate,
      totalAmount,
      userNotes
    } = body

    // 1. 사용자 정보 조회 또는 생성
    let { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    // 사용자가 없으면 생성
    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          role: 'user'
        })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('사용자 생성 에러:', createError)
        return NextResponse.json({ error: '사용자 정보를 생성할 수 없습니다' }, { status: 400 })
      }
      
      userData = newUser
    }

    // 2. 선택한 기기가 devices에 있는지 확인
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single()

    if (deviceError || !device) {
      console.error('기기 조회 에러:', deviceError)
      return NextResponse.json({ error: '유효하지 않은 기기입니다' }, { status: 400 })
    }

    // 3. 해당 시간대에 이미 예약이 있는지 확인
    const { data: existingReservations, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('device_id', deviceId)
      .eq('date', date)
      .in('status', ['pending', 'approved', 'checked_in'])
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)

    if (checkError) {
      console.error('예약 확인 에러:', checkError)
      return NextResponse.json({ error: '예약 확인 중 오류가 발생했습니다' }, { status: 500 })
    }

    if (existingReservations && existingReservations.length > 0) {
      return NextResponse.json({ error: '해당 시간대에 이미 예약이 있습니다' }, { status: 400 })
    }

    // 4. 예약 시간 계산
    const startHour = parseInt(startTime.split(':')[0])
    const startMin = parseInt(startTime.split(':')[1])
    const endHour = parseInt(endTime.split(':')[0])
    const endMin = parseInt(endTime.split(':')[1])
    const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60

    // 5. 예약 생성
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: userData.id,
        device_id: deviceId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        hours: hours,
        player_count: playerCount,
        hourly_rate: hourlyRate,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: 'cash',
        payment_status: 'pending',
        user_notes: userNotes || null
      })
      .select(`
        *,
        devices!inner(
          device_number,
          status,
          device_types(
            name,
            category
          )
        )
      `)
      .single()

    if (reservationError) {
      console.error('Reservation error:', reservationError)
      return NextResponse.json({ 
        error: '예약 생성에 실패했습니다',
        details: reservationError.message || reservationError
      }, { status: 500 })
    }

    // 6. 실시간 업데이트를 위한 브로드캐스트
    await supabase
      .channel('reservations')
      .send({
        type: 'broadcast',
        event: 'new_reservation',
        payload: { 
          date,
          deviceId,
          reservationId: reservation.id,
          startTime,
          endTime
        }
      })

    return NextResponse.json({ 
      success: true, 
      reservation,
      message: '예약이 접수되었습니다. 관리자 승인을 기다려주세요.'
    })

  } catch (error: any) {
    console.error('Reservation API error:', error)
    return NextResponse.json({ 
      error: error.message || '서버 오류가 발생했습니다',
      details: error
    }, { status: 500 })
  }
}

// 내 예약 목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인 (Next-Auth 사용)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 사용자 정보 조회 또는 생성
    let { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    // 사용자가 없으면 생성
    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          role: 'user'
        })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('사용자 생성 에러:', createError)
        return NextResponse.json({ error: '사용자 정보를 생성할 수 없습니다' }, { status: 400 })
      }
      
      userData = newUser
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // 예약 목록 조회 쿼리
    let query = supabase
      .from('reservations')
      .select(`
        *,
        rental_machines!inner(
          name,
          description,
          hourly_rate,
          min_hours,
          max_hours,
          device_types(
            name,
            category
          )
        ),
        users(
          name,
          email,
          phone
        )
      `)
      .eq('user_id', userData.id)
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