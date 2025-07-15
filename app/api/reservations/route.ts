import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 예약 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인 (NextAuth 사용)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    console.log('예약 요청 데이터:', body)
    
    const { 
      date,
      startTime,
      start_time,
      endTime,
      end_time,
      deviceId,
      device_id,
      playerCount,
      player_count,
      hourlyRate,
      totalAmount,
      total_amount,
      userNotes,
      user_notes,
      creditType,
      credit_type
    } = body
    
    // 필드 이름 통일 (snake_case 우선)
    const finalStartTime = start_time || startTime
    const finalEndTime = end_time || endTime
    const finalDeviceId = device_id || deviceId
    const finalPlayerCount = player_count || playerCount || 1
    const finalTotalAmount = total_amount || totalAmount
    const finalUserNotes = user_notes || userNotes
    const finalCreditType = credit_type || creditType || 'freeplay'
    
    // hourly_rate 처리
    // 실제로는 시간대별 고정 가격을 사용하지만, DB 스키마상 NOT NULL이므로 임시로 설정
    // total_amount가 실제 청구 금액
    const finalHourlyRate = hourlyRate || finalTotalAmount || 0
    
    // 필수 필드 검증
    if (!date || !finalStartTime || !finalEndTime || !finalDeviceId) {
      console.error('필수 필드 누락:', { date, finalStartTime, finalEndTime, finalDeviceId })
      return NextResponse.json({ 
        error: '필수 정보가 누락되었습니다',
        missing: {
          date: !date,
          startTime: !finalStartTime,
          endTime: !finalEndTime,
          deviceId: !finalDeviceId
        }
      }, { status: 400 })
    }

    // 1. 사용자 정보 조회 또는 생성 (Admin 권한으로)
    let { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    // 사용자가 없으면 생성 (Admin 권한으로)
    if (!userData) {
      // NextAuth ID 사용
      const userId = session.user.id || crypto.randomUUID()
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: session.user.email,
          name: session.user.name || session.user.email?.split('@')[0] || 'User',
          role: 'user',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('사용자 생성 에러:', createError)
        return NextResponse.json({ error: '사용자 정보를 생성할 수 없습니다' }, { status: 400 })
      }
      
      userData = newUser
    }

    // 2. 관리자 여부 확인
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', userData.id)
      .single()

    const isAdmin = !!adminData

    // 3. 일반 사용자의 경우 활성 예약 개수 제한 확인 (관리자는 제외)
    if (!isAdmin) {
      const { data: activeReservations, error: countError } = await supabaseAdmin
        .from('reservations')
        .select('id', { count: 'exact' })
        .eq('user_id', userData.id)
        .in('status', ['pending', 'approved'])

      if (countError) {
        console.error('활성 예약 조회 에러:', countError)
        return NextResponse.json({ error: '예약 상태 확인 중 오류가 발생했습니다' }, { status: 500 })
      }

      const activeCount = activeReservations?.length || 0
      const MAX_ACTIVE_RESERVATIONS = 3

      if (activeCount >= MAX_ACTIVE_RESERVATIONS) {
        return NextResponse.json({ 
          error: `현재 ${activeCount}개의 활성 예약이 있습니다. 최대 ${MAX_ACTIVE_RESERVATIONS}개까지만 예약 가능합니다.`,
          activeCount,
          maxCount: MAX_ACTIVE_RESERVATIONS
        }, { status: 400 })
      }
    }

    // 4. 선택한 기기가 devices에 있는지 확인
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('id', finalDeviceId)
      .single()

    if (deviceError || !device) {
      console.error('기기 조회 에러:', deviceError)
      return NextResponse.json({ error: '유효하지 않은 기기입니다' }, { status: 400 })
    }

    // 5. 해당 시간대에 이미 예약이 있는지 확인
    // 시간이 겹치는 경우: 새 예약의 시작이 기존 예약 끝 전이고, 새 예약의 끝이 기존 예약 시작 후
    const { data: existingReservations, error: checkError } = await supabaseAdmin
      .from('reservations')
      .select('id, start_time, end_time')
      .eq('device_id', finalDeviceId)
      .eq('date', date)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (checkError) {
      console.error('예약 확인 에러:', checkError)
      return NextResponse.json({ error: '예약 확인 중 오류가 발생했습니다' }, { status: 500 })
    }

    // 시간 중복 체크 (JavaScript로 처리)
    if (existingReservations && existingReservations.length > 0) {
      const hasOverlap = existingReservations.some(reservation => {
        // 시간 문자열을 비교 가능한 형태로 변환
        const existingStart = reservation.start_time;
        const existingEnd = reservation.end_time;
        
        // 시간이 겹치는지 확인
        return (finalStartTime < existingEnd && finalEndTime > existingStart);
      });
      
      if (hasOverlap) {
        return NextResponse.json({ error: '해당 시간대에 이미 예약이 있습니다' }, { status: 400 })
      }
    }

    // 6. 예약 번호 생성 (YYMMDD-순서)
    // 예약 날짜 기준으로 순서 생성
    const reservationDate = new Date(date)
    const dateStr = reservationDate.toLocaleDateString('ko-KR', { 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }).replace(/\. /g, '').replace('.', '')
    
    // 해당 날짜의 예약 개수 조회
    const { count } = await supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('date', date)
    
    const sequence = (count || 0) + 1
    const reservationNumber = `${dateStr}-${String(sequence).padStart(3, '0')}`

    // 7. 예약 생성
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: userData.id,
        device_id: finalDeviceId,
        reservation_number: reservationNumber,
        date: date,
        start_time: finalStartTime,
        end_time: finalEndTime,
        player_count: finalPlayerCount,
        hourly_rate: finalHourlyRate,
        total_amount: finalTotalAmount,
        status: 'pending',
        payment_method: 'cash',
        payment_status: 'pending',
        user_notes: finalUserNotes || null,
        credit_type: finalCreditType,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        devices!inner(
          device_number,
          status,
          device_types(
            name,
            category_id,
            device_categories(
              name
            )
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

    // 8. 실시간 업데이트를 위한 브로드캐스트 (클라이언트 supabase 사용)
    try {
      await supabase
        .channel('reservations')
        .send({
          type: 'broadcast',
          event: 'new_reservation',
          payload: { 
            date,
            deviceId: finalDeviceId,
            reservationId: reservation.id,
            startTime: finalStartTime,
            endTime: finalEndTime
          }
        })
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError)
      // 브로드캐스트 실패는 무시하고 계속 진행
    }

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
    // 현재 사용자 확인 (Next-Auth 사용)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 사용자 정보 조회 또는 생성 (Admin 권한으로)
    let { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    // 사용자가 없으면 생성 (Admin 권한으로)
    if (!userData) {
      // NextAuth ID 사용
      const userId = session.user.id || crypto.randomUUID()
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: session.user.email,
          name: session.user.name || session.user.email?.split('@')[0] || 'User',
          role: 'user',
          created_at: new Date().toISOString()
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

    // 예약 목록 조회 쿼리 (rental_machines 대신 devices 사용)
    let query = supabaseAdmin
      .from('reservations')
      .select(`
        *,
        devices!inner(
          device_number,
          status,
          device_types(
            name,
            model_name,
            version_name,
            category_id,
            device_categories(
              name
            )
          )
        ),
        users!reservations_user_id_fkey(
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