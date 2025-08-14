import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { auth } from '@/auth'
import { CreateReservationV2UseCase } from '@/src/application/use-cases/reservation/create-reservation.v2.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { SupabaseUserRepository } from '@/src/infrastructure/repositories/supabase-user.repository'
import { logRequest, logError } from '@/lib/api/logging'

// 요청 스키마 정의 (시간을 시간 단위로 변경)
const createReservationSchema = z.object({
  device_id: z.string().uuid('올바른 기기 ID 형식이 아닙니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  start_hour: z.number().int().min(0).max(29, '시작 시간은 0-29 사이여야 합니다'),
  end_hour: z.number().int().min(1).max(30, '종료 시간은 1-30 사이여야 합니다'),
  credit_type: z.enum(['fixed', 'freeplay', 'unlimited'], {
    errorMap: () => ({ message: '올바른 크레딧 타입을 선택해주세요' })
  }),
  player_count: z.union([z.literal(1), z.literal(2)], {
    errorMap: () => ({ message: '플레이어 수는 1명 또는 2명이어야 합니다' })
  }).default(1),
  user_notes: z.string().optional()
}).refine(data => data.start_hour < data.end_hour, {
  message: '종료 시간은 시작 시간보다 커야 합니다',
  path: ['end_hour']
})

// POST: 예약 생성
export async function POST(request: NextRequest) {
  try {
    logRequest(request, 'POST /api/v2/reservations')

    // NextAuth 세션 확인
    const session = await auth()
    console.log('POST /api/v2/reservations - NextAuth 세션:', session)

    if (!session?.user?.id) {
      console.log('POST /api/v2/reservations - NextAuth 세션 없음')
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 서비스 롤 키로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createServiceRoleClient()
    const userId = session.user.id

    // 요청 본문 파싱
    const body = await request.json()
    const validationResult = createReservationSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { error: firstError?.message ?? '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 레포지토리 초기화
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const userRepository = new SupabaseUserRepository(supabase)

    // 유스케이스 실행
    const useCase = new CreateReservationV2UseCase(
      reservationRepository,
      deviceRepository as any,
      userRepository as any
    )

    // 슈퍼관리자 여부 확인
    const { data: adminData } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userId)
      .eq('is_super_admin', true)
      .single()
    
    const isSuperAdmin = !!adminData
    
    const result = await useCase.execute({
      userId: userId,
      deviceId: data.device_id,
      date: data.date,
      startHour: data.start_hour,
      endHour: data.end_hour,
      creditType: data.credit_type,
      playerCount: data.player_count,
      userNotes: data.user_notes,
      isAdmin: isSuperAdmin
    })

    // 실시간 업데이트를 위한 브로드캐스트
    try {
      await supabase
        .channel('reservations')
        .send({
          type: 'broadcast',
          event: 'new_reservation',
          payload: { 
            date: data.date,
            deviceId: data.device_id,
            reservationId: result.reservation.id,
            startHour: data.start_hour,
            endHour: data.end_hour
          }
        })
    } catch (broadcastError) {
      logError(broadcastError, 'Broadcast error')
      // 브로드캐스트 실패는 무시하고 계속 진행
    }

    // v2 응답 형식 (snake_case)
    const reservation = {
      id: result.reservation.id,
      reservation_number: result.reservation.reservationNumber || '',
      user_id: result.reservation.userId,
      device_id: result.reservation.deviceId,
      date: result.reservation.date.dateString,
      start_hour: data.start_hour,
      end_hour: data.end_hour,
      status: result.reservation.status.value,
      total_price: 0,
      credit_type: data.credit_type,
      player_count: data.player_count,
      user_notes: data.user_notes,
      created_at: result.reservation.createdAt.toISOString(),
      updated_at: result.reservation.updatedAt.toISOString()
    }

    return NextResponse.json({ reservation }, { status: 201 })

  } catch (error) {
    logError(error, 'POST /api/v2/reservations')

    if (error instanceof Error) {
      // 비즈니스 로직 에러는 400으로 반환
      if (error.message.includes('예약') || 
          error.message.includes('권한') || 
          error.message.includes('시간') ||
          error.message.includes('기기') ||
          error.message.includes('크레딧') ||
          error.message.includes('플레이') ||
          error.message.includes('청소년')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: '예약 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 예약 목록 조회 스키마
const listReservationsSchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'cancelled', 'checked_in', 'completed', 'no_show']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  device_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
})

// GET: 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    logRequest(request, 'GET /api/v2/reservations')

    // NextAuth 세션 확인 (우선순위)
    const session = await auth()
    console.log('GET /api/v2/reservations - NextAuth 세션:', session)

    if (!session?.user?.id) {
      console.log('GET /api/v2/reservations - NextAuth 세션 없음')
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 서비스 롤 키로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createServiceRoleClient()
    const userId = session.user.id

    // 자동 상태 업데이트 실행 (크론잡 없이 조회 시점에 실행)
    try {
      const now = new Date()
      const kstOffset = 9 * 60 * 60 * 1000
      const kstTime = new Date(now.getTime() + kstOffset)
      const currentDate = kstTime.toISOString().split('T')[0]
      const currentTime = kstTime.toTimeString().slice(0, 5)

      // 1. 체크인된 예약 중 시작 시간이 된 예약을 in_use(대여중)로 변경
      await supabase
        .from('reservations')
        .update({ 
          status: 'in_use',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'checked_in')
        .eq('date', currentDate)
        .lte('start_time', currentTime)

      // 2. 종료 시간이 지난 대여중 예약을 완료 처리
      await supabase
        .from('reservations')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'in_use')
        .or(`date.lt.${currentDate},and(date.eq.${currentDate},end_time.lt.${currentTime})`)

    } catch (updateError) {
      console.error('자동 상태 업데이트 실패:', updateError)
      // 업데이트 실패해도 조회는 계속 진행
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const params = {
      status: searchParams.get('status') || undefined,
      date: searchParams.get('date') || undefined,
      device_id: searchParams.get('device_id') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      page_size: searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : 20
    }

    const validationResult = listReservationsSchema.safeParse(params)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { error: firstError?.message ?? '유효하지 않은 요청입니다' },
        { status: 400 }
      )
    }

    const { status, date, device_id, page, page_size } = validationResult.data

    console.log('GET /api/v2/reservations - userId:', userId)
    
    // 먼저 단순 쿼리로 테스트
    console.log('단순 user_id 쿼리 테스트...')
    const simpleTest = await supabase
      .from('reservations')
      .select('id, reservation_number, user_id, date')
      .eq('user_id', userId)
      .limit(3)
    
    console.log('단순 쿼리 결과:', simpleTest)
    
    // 이제 JOIN 쿼리 (일단 device만)
    let query = supabase
      .from('reservations')
      .select(`
        *,
        devices!device_id(
          id,
          device_number,
          device_type_id,
          device_types!device_type_id(
            id,
            name,
            model_name
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (date) {
      query = query.eq('date', date)
    }

    if (device_id) {
      query = query.eq('device_id', device_id)
    }

    // 페이지네이션
    const from = (page - 1) * page_size
    const to = from + page_size - 1
    query = query.range(from, to)

    const { data: reservations, error: queryError, count } = await query
    
    console.log('GET /api/v2/reservations - 쿼리 결과:')
    console.log('- reservations:', reservations)
    console.log('- queryError:', queryError)
    console.log('- count:', count)
    console.log('- reservations length:', reservations?.length)

    if (queryError) {
      console.error('GET /api/v2/reservations - 쿼리 에러:', queryError)
      throw queryError
    }

    // 총 페이지 수 계산
    const total_count = count || 0
    const total_pages = Math.ceil(total_count / page_size)

    // 응답 형식화 (v2 snake_case)
    const formatted_reservations = (reservations || []).map(reservation => {
      // 시간을 시간(hour) 형태로 변환
      const startHour = reservation.start_time ? parseInt(reservation.start_time.split(':')[0]) : 0
      const endHour = reservation.end_time ? parseInt(reservation.end_time.split(':')[0]) : 0
      
      // 기기 정보 안전하게 추출
      const device = reservation.devices
      const deviceType = device?.device_types
      
      return {
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        user_id: reservation.user_id,
        device_id: reservation.device_id,
        device_number: device?.device_number,
        device_name: deviceType?.name,
        device_type: deviceType?.name,
        date: reservation.date,
        start_hour: startHour,
        end_hour: endHour,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        time_slot: `${startHour}:00 - ${endHour}:00`,
        status: reservation.status,
        credit_type: reservation.credit_type,
        player_count: reservation.player_count,
        total_amount: reservation.total_amount || 0,
        user_notes: reservation.user_notes,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at,
        // 기기 정보를 중첩 객체로 제공 (컴포넌트 호환성)
        device: device ? {
          id: device.id,
          device_number: device.device_number,
          device_type: {
            name: deviceType?.name || '기기 정보 없음',
            model_name: deviceType?.model_name
          }
        } : null
      }
    })

    return NextResponse.json({
      reservations: formatted_reservations,
      pagination: {
        page,
        page_size,
        total_count,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1
      }
    })

  } catch (error) {
    console.error('GET /api/v2/reservations - 상세 에러:', error)
    logError(error, 'GET /api/v2/reservations')

    return NextResponse.json(
      { 
        error: '예약 목록 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}