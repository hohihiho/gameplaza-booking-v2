import { NextRequest, NextResponse } from 'next/server'
import { GetUserStatisticsUseCase } from '@/src/application/use-cases/statistics/get-user-statistics.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// 쿼리 파라미터 스키마 정의
const getUserStatisticsSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  periodType: z.enum(['day', 'week', 'month', 'custom', 'all']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  year: z.coerce.number().int().min(2024).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

/**
 * 사용자별 통계 조회 API
 * GET /api/v2/statistics/users
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
      periodType: searchParams.get('periodType') || 'month',
      date: searchParams.get('date') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    }

    const validationResult = getUserStatisticsSchema.safeParse(params)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: firstError.message 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 3. 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: '서버 설정 오류' 
        },
        { status: 500 }
      )
    }

    // 4. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new GetUserStatisticsUseCase(
      reservationRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      targetUserId: data.targetUserId,
      periodType: data.periodType,
      date: data.date,
      year: data.year,
      month: data.month,
      startDate: data.startDate,
      endDate: data.endDate
    })

    // 6. 응답 형식화
    const response: any = {
      period: {
        type: data.periodType,
        startDate: result.statistics.period.startDate.toISOString(),
        endDate: result.statistics.period.endDate.toISOString()
      },
      user: {
        userId: result.statistics.userData.userId,
        statistics: {
          totalReservations: result.statistics.userData.totalReservations,
          completedReservations: result.statistics.userData.completedReservations,
          cancelledReservations: result.statistics.userData.cancelledReservations,
          noShowCount: result.statistics.userData.noShowCount,
          totalSpent: result.statistics.userData.totalSpent,
          favoriteDeviceId: result.statistics.userData.favoriteDeviceId,
          favoriteTimeSlots: result.statistics.userData.favoriteTimeSlots,
          averageReservationDuration: Math.round(result.statistics.userData.averageReservationDuration * 100) / 100,
          reliabilityScore: result.statistics.getReliabilityScore(),
          cancellationRate: Math.round(result.statistics.getCancellationRate() * 100) / 100,
          averageSpendingPerReservation: Math.round(result.statistics.getAverageSpendingPerReservation())
        }
      }
    }

    // 순위 정보 추가
    if (result.ranking) {
      response.ranking = {
        totalReservations: result.ranking.totalReservations,
        totalSpent: result.ranking.totalSpent,
        reliabilityScore: result.ranking.reliabilityScore
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('User statistics error:', error)

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

      if (error.message.includes('필요합니다') || error.message.includes('올바르지 않은')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
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