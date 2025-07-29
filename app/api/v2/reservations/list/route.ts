import { NextRequest, NextResponse } from 'next/server'
import { ListUserReservationsUseCase } from '@/src/application/use-cases/reservation/list-user-reservations.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { z } from 'zod'

// 쿼리 파라미터 스키마 정의
const listReservationsSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  status: z.string().optional(), // comma-separated values
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

/**
 * 예약 목록 조회 API (v2)
 * GET /api/v2/reservations/list
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다' 
        },
        { status: 401 }
      )
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const params = {
      targetUserId: searchParams.get('targetUserId') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20
    }

    const validationResult = listReservationsSchema.safeParse(params)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: firstError?.message ?? '유효하지 않은 요청입니다' 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 3. 서비스 초기화
    const supabase = createServiceRoleClient()
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new ListUserReservationsUseCase(
      reservationRepository,
      userRepository
    )

    // status 파라미터를 배열로 변환 (comma-separated)
    const statusArray = data.status ? data.status.split(',').map(s => s.trim()) : undefined

    const result = await useCase.execute({
      userId: user.id,
      targetUserId: data.targetUserId,
      status: statusArray,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      page: data.page,
      pageSize: data.pageSize
    })

    // 5. 응답 형식화
    const formattedReservations = result.reservations.map(reservation => ({
      id: reservation.id,
      userId: reservation.userId,
      deviceId: reservation.deviceId,
      date: reservation.date.dateString,
      timeSlot: {
        startHour: reservation.timeSlot.startHour,
        endHour: reservation.timeSlot.endHour,
        displayText: `${reservation.timeSlot.startHour}:00 - ${reservation.timeSlot.endHour}:00`
      },
      status: reservation.status.value,
      reservationNumber: reservation.reservationNumber,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString()
    }))

    return NextResponse.json({
      reservations: formattedReservations,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Reservation list error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }

      if (error.message.includes('권한이 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: error.message 
          },
          { status: 403 }
        )
      }
    }

    // 기본 에러 응답
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: '서버 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}