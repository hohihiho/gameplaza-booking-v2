import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/server/auth/supabase'
import { CreateReservationUseCase } from '@/src/application/use-cases/reservation/create-reservation.use-case'
import { SupabaseReservationRepository } from '@/src/infrastructure/repositories/supabase-reservation.repository'
import { SupabaseDeviceRepository } from '@/src/infrastructure/repositories/supabase-device.repository'
import { SupabaseUserRepository } from '@/src/infrastructure/repositories/supabase-user.repository'
import { SupabaseTimeSlotTemplateRepository } from '@/src/infrastructure/repositories/supabase-time-slot-template.repository'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
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

    // 인증 확인
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const validationResult = createReservationSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 레포지토리 초기화
    const reservationRepository = new SupabaseReservationRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepository(supabase)
    const userRepository = new SupabaseUserRepository(supabase)
    const timeSlotTemplateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const timeSlotDomainService = new TimeSlotDomainService(timeSlotTemplateRepository)

    // 유스케이스 실행
    const useCase = new CreateReservationUseCase(
      reservationRepository,
      deviceRepository,
      userRepository,
      timeSlotDomainService
    )

    const result = await useCase.execute({
      userId: user.id,
      deviceId: data.device_id,
      date: data.date,
      startHour: data.start_hour,
      endHour: data.end_hour,
      creditType: data.credit_type,
      playerCount: data.player_count
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
    const response = {
      id: result.reservation.id,
      reservation_number: result.reservationNumber,
      user_id: result.reservation.userId,
      device_id: result.reservation.deviceId,
      date: result.reservation.date.dateString,
      start_hour: data.start_hour,
      end_hour: data.end_hour,
      status: result.reservation.status.value,
      total_price: result.totalPrice,
      credit_type: data.credit_type,
      player_count: data.player_count,
      user_notes: data.user_notes,
      created_at: result.reservation.createdAt.toISOString(),
      updated_at: result.reservation.updatedAt.toISOString()
    }

    return NextResponse.json(response, { status: 201 })

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

    // 인증 확인
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
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
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { status, date, device_id, page, page_size } = validationResult.data

    // 기본 쿼리 생성
    let query = supabase
      .from('reservations')
      .select(`
        *,
        device:devices(
          id,
          device_number,
          name,
          device_type:device_types(
            id,
            name,
            model_name
          )
        ),
        user:users(
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
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

    if (queryError) {
      throw queryError
    }

    // 총 페이지 수 계산
    const total_count = count || 0
    const total_pages = Math.ceil(total_count / page_size)

    // 응답 형식화 (v2 snake_case)
    const formatted_reservations = (reservations || []).map(reservation => ({
      id: reservation.id,
      reservation_number: reservation.reservation_number,
      user_id: reservation.user_id,
      device_id: reservation.device_id,
      device_number: reservation.device?.device_number,
      device_name: reservation.device?.name,
      device_type: reservation.device?.device_type?.name,
      date: reservation.date,
      start_hour: reservation.start_hour,
      end_hour: reservation.end_hour,
      time_slot: `${reservation.start_hour}:00 - ${reservation.end_hour}:00`,
      status: reservation.status,
      credit_type: reservation.credit_type,
      player_count: reservation.player_count,
      total_price: reservation.total_price,
      user_notes: reservation.user_notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    }))

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
    logError(error, 'GET /api/v2/reservations')

    return NextResponse.json(
      { error: '예약 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}