import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getD1Database, D1RepositoryFactory } from '@/lib/repositories/d1'
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

    // D1 데이터베이스 연결
    const db = getD1Database(request)
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const repos = new D1RepositoryFactory(db)
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

    // 1. 기기 존재 및 사용 가능 여부 확인
    const device = await repos.devices.findById(data.device_id)
    if (!device) {
      return NextResponse.json(
        { error: '존재하지 않는 기기입니다' },
        { status: 400 }
      )
    }

    if (device.status !== 'available') {
      return NextResponse.json(
        { error: '현재 사용할 수 없는 기기입니다' },
        { status: 400 }
      )
    }

    // 2. 시간 충돌 체크
    const hasConflict = await repos.reservations.checkTimeConflict(
      data.device_id,
      data.date,
      data.start_hour,
      data.end_hour
    )

    if (hasConflict) {
      return NextResponse.json(
        { error: '해당 시간대에 이미 예약이 있습니다' },
        { status: 400 }
      )
    }

    // 3. 사용자 일일 예약 수 제한 체크 (최대 3개)
    const dailyReservationCount = await repos.reservations.getUserReservationCount(
      userId,
      data.date,
      ['pending', 'approved', 'checked_in']
    )

    if (dailyReservationCount >= 3) {
      return NextResponse.json(
        { error: '하루 최대 3개까지만 예약할 수 있습니다' },
        { status: 400 }
      )
    }

    // 4. 예약 생성
    const reservation = await repos.reservations.createReservation({
      user_id: userId,
      device_id: data.device_id,
      date: data.date,
      start_hour: data.start_hour,
      end_hour: data.end_hour,
      credit_type: data.credit_type,
      player_count: data.player_count,
      user_notes: data.user_notes
    })

    // v2 응답 형식 (snake_case)
    const responseData = {
      id: reservation.id,
      reservation_number: reservation.reservation_number,
      user_id: reservation.user_id,
      device_id: reservation.device_id,
      date: reservation.date,
      start_hour: data.start_hour,
      end_hour: data.end_hour,
      status: reservation.status,
      total_price: 0,
      credit_type: data.credit_type,
      player_count: data.player_count,
      user_notes: data.user_notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    }

    return NextResponse.json({ reservation: responseData }, { status: 201 })

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

    // NextAuth 세션 확인
    const session = await auth()
    console.log('GET /api/v2/reservations - NextAuth 세션:', session)

    if (!session?.user?.id) {
      console.log('GET /api/v2/reservations - NextAuth 세션 없음')
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // D1 데이터베이스 연결
    const db = getD1Database(request)
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const repos = new D1RepositoryFactory(db)
    const userId = session.user.id

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
    
    // 페이지네이션 계산
    const offset = (page - 1) * page_size

    // 예약 목록 조회 (기기 정보와 함께)
    const reservations = await repos.reservations.findByUserId(userId, {
      status,
      date,
      device_id,
      limit: page_size,
      offset
    })

    console.log('GET /api/v2/reservations - 조회된 예약 수:', reservations.length)

    // 총 개수 조회 (페이지네이션용)
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM reservations r 
      WHERE r.user_id = ?
    `
    const countParams: any[] = [userId]

    if (status && status !== 'all') {
      countQuery += ' AND r.status = ?'
      countParams.push(status)
    }

    if (date) {
      countQuery += ' AND r.date = ?'
      countParams.push(date)
    }

    if (device_id) {
      countQuery += ' AND r.device_id = ?'
      countParams.push(device_id)
    }

    const countResult = await repos.reservations.rawFirst(countQuery, countParams) as any
    const total_count = countResult?.count || 0
    const total_pages = Math.ceil(total_count / page_size)

    // 응답 형식화 (v2 snake_case)
    const formatted_reservations = reservations.map(reservation => {
      // 시간을 시간(hour) 형태로 변환
      const startHour = reservation.start_time ? parseInt(reservation.start_time.split(':')[0]) : 0
      const endHour = reservation.end_time ? parseInt(reservation.end_time.split(':')[0]) : 0
      
      return {
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        user_id: reservation.user_id,
        device_id: reservation.device_id,
        device_number: (reservation as any).device_number,
        device_name: (reservation as any).device_type_name,
        device_type: (reservation as any).device_type_name,
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
        device: {
          id: reservation.device_id,
          device_number: (reservation as any).device_number,
          device_type: {
            name: (reservation as any).device_type_name || '기기 정보 없음',
            model_name: (reservation as any).device_type_description
          }
        }
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