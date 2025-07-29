import { NextRequest, NextResponse } from 'next/server'
import { GetDeviceStatisticsUseCase } from '@/src/application/use-cases/statistics/get-device-statistics.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { auth } from '@/auth'
import { z } from 'zod'

// 쿼리 파라미터 스키마 정의
const getDeviceStatisticsSchema = z.object({
  deviceId: z.string().uuid().optional(),
  periodType: z.enum(['day', 'week', 'month', 'custom']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  year: z.coerce.number().int().min(2024).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

/**
 * 기기별 통계 조회 API
 * GET /api/v2/statistics/devices
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
      deviceId: searchParams.get('deviceId') || undefined,
      periodType: searchParams.get('periodType') || 'day',
      date: searchParams.get('date') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    }

    const validationResult = getDeviceStatisticsSchema.safeParse(params)

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
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new GetDeviceStatisticsUseCase(
      reservationRepository,
      deviceRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: session.user.id,
      deviceId: data.deviceId,
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
        startDate: result.statistics[0]?.period.startDate.toISOString(),
        endDate: result.statistics[0]?.period.endDate.toISOString()
      },
      devices: result.statistics.map(stat => ({
        deviceId: stat.deviceData.deviceId,
        deviceNumber: stat.deviceData.deviceNumber,
        deviceName: stat.deviceData.deviceName,
        statistics: {
          totalReservations: stat.deviceData.totalReservations,
          totalRevenue: stat.deviceData.totalRevenue,
          totalHours: stat.deviceData.totalHours,
          utilizationRate: Math.round(stat.deviceData.utilizationRate * 100) / 100,
          averageHoursPerReservation: Math.round(stat.getAverageHoursPerReservation() * 100) / 100,
          averageRevenuePerHour: Math.round(stat.getAverageRevenuePerHour()),
          mostPopularTimeSlot: stat.getMostPopularTimeSlot(),
          popularTimeSlots: stat.deviceData.popularTimeSlots.slice(0, 5) // 상위 5개
        }
      }))
    }

    // 요약 정보 추가
    if (result.summary) {
      response.summary = {
        totalDevices: result.summary.totalDevices,
        averageUtilizationRate: Math.round(result.summary.averageUtilizationRate * 100) / 100,
        mostPopularDevice: {
          deviceId: result.summary.mostPopularDevice.deviceId,
          deviceNumber: result.summary.mostPopularDevice.deviceNumber,
          reservationCount: result.summary.mostPopularDevice.reservationCount
        },
        highestRevenueDevice: {
          deviceId: result.summary.highestRevenueDevice.deviceId,
          deviceNumber: result.summary.highestRevenueDevice.deviceNumber,
          revenue: result.summary.highestRevenueDevice.revenue
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Device statistics error:', error)

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