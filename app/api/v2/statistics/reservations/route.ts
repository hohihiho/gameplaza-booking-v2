import { NextRequest, NextResponse } from 'next/server'
import { GetReservationStatisticsUseCase } from '@/src/application/use-cases/statistics/get-reservation-statistics.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { auth } from '@/auth'
import { z } from 'zod'

// 쿼리 파라미터 스키마 정의
const getReservationStatisticsSchema = z.object({
  periodType: z.enum(['day', 'week', 'month', 'custom']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  year: z.coerce.number().int().min(2024).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

/**
 * 예약 통계 조회 API
 * GET /api/v2/statistics/reservations
 */
export async function GET(request: NextRequest) {
  try {
    // 1. NextAuth 세션 확인
    const session = await auth()
    if (!session?.user?.id) {
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
      periodType: searchParams.get('periodType') || 'day',
      date: searchParams.get('date') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    }

    const validationResult = getReservationStatisticsSchema.safeParse(params)

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
    const useCase = new GetReservationStatisticsUseCase(
      reservationRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: session.user.id,
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
        endDate: result.statistics.period.endDate.toISOString(),
        days: result.statistics.period.getDaysCount()
      },
      statistics: {
        totalReservations: result.statistics.data.totalReservations,
        completedReservations: result.statistics.data.completedReservations,
        cancelledReservations: result.statistics.data.cancelledReservations,
        noShowReservations: result.statistics.data.noShowReservations,
        totalRevenue: result.statistics.data.totalRevenue,
        averageReservationDuration: result.statistics.data.averageReservationDuration,
        peakHours: result.statistics.data.peakHours,
        deviceUtilizationRate: result.statistics.data.deviceUtilizationRate,
        completionRate: result.statistics.getCompletionRate(),
        cancellationRate: result.statistics.getCancellationRate(),
        noShowRate: result.statistics.getNoShowRate(),
        averageRevenuePerReservation: result.statistics.getAverageRevenuePerReservation(),
        averageReservationsPerDay: result.statistics.getAverageReservationsPerDay(),
        averageRevenuePerDay: result.statistics.getAverageRevenuePerDay()
      }
    }

    // 이전 기간 비교 정보 추가
    if (result.comparison) {
      response.comparison = {
        previousPeriod: {
          startDate: result.comparison.previousPeriod.period.startDate.toISOString(),
          endDate: result.comparison.previousPeriod.period.endDate.toISOString(),
          totalReservations: result.comparison.previousPeriod.data.totalReservations,
          totalRevenue: result.comparison.previousPeriod.data.totalRevenue,
          completionRate: result.comparison.previousPeriod.getCompletionRate(),
          cancellationRate: result.comparison.previousPeriod.getCancellationRate()
        },
        changePercentage: {
          totalReservations: Math.round(result.comparison.changePercentage.totalReservations * 100) / 100,
          totalRevenue: Math.round(result.comparison.changePercentage.totalRevenue * 100) / 100,
          completionRate: Math.round(result.comparison.changePercentage.completionRate * 100) / 100,
          cancellationRate: Math.round(result.comparison.changePercentage.cancellationRate * 100) / 100
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Reservation statistics error:', error)

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

      if (error.message.includes('권한') || error.message.includes('관리자만')) {
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