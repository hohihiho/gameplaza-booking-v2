import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { d1GetReservationStatistics } from '@/lib/db/d1'

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
// 성능 최적화: 간단한 메모리 캐시 (5분)
const statsCache = new Map<string, {
  data: any;
  timestamp: number;
  userId: string;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function GET(request: NextRequest) {
  const startTime = Date.now();
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

    // 3. 기간 계산
    let startDate: string
    let endDate: string

    const today = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const kstToday = new Date(today.getTime() + kstOffset)
    const todayStr = kstToday.toISOString().split('T')[0]

    if (data.periodType === 'day') {
      startDate = data.date || todayStr
      endDate = startDate
    } else if (data.periodType === 'week') {
      const date = data.date ? new Date(data.date) : kstToday
      const dayOfWeek = date.getDay()
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - dayOfWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      startDate = weekStart.toISOString().split('T')[0]
      endDate = weekEnd.toISOString().split('T')[0]
    } else if (data.periodType === 'month') {
      const year = data.year || kstToday.getFullYear()
      const month = data.month || (kstToday.getMonth() + 1)

      startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    } else {
      // custom
      startDate = data.startDate || todayStr
      endDate = data.endDate || todayStr
    }

    // 4. 캐시 확인
    const cacheKey = `${session.user.id}-${JSON.stringify(data)}`;
    const cached = statsCache.get(cacheKey);

    if (cached &&
        cached.userId === session.user.id &&
        Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ 캐시에서 통계 반환 (${Date.now() - startTime}ms):`, cacheKey);
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    // 5. D1에서 통계 조회
    const result = await d1GetReservationStatistics({
      userId: session.user.id,
      startDate,
      endDate
    })

    if (!result || 'error' in result) {
      return NextResponse.json(
        {
          error: 'Service Unavailable',
          message: 'D1 데이터베이스를 사용할 수 없습니다'
        },
        { status: 503 }
      )
    }

    // 6. 응답 형식화
    const response: any = {
      period: {
        type: data.periodType,
        startDate,
        endDate,
        days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      },
      statistics: {
        totalUsages: result.statistics.totalUsages,
        completedUsages: result.statistics.completedUsages,
        cancelledUsages: result.statistics.cancelledUsages,
        noShowUsages: result.statistics.noShowUsages,
        totalRevenue: result.statistics.totalRevenue,
        averageUsageDuration: result.statistics.averageUsageDuration,
        peakHours: result.chartData.preferredHours.slice(0, 3).map((h: any) => h.timeRange),
        deviceUtilizationRate: 0, // TODO: 계산 필요
        completionRate: result.statistics.completionRate,
        cancellationRate: result.statistics.cancellationRate,
        noShowRate: result.statistics.noShowRate,
        averageRevenuePerUsage: result.statistics.averageRevenuePerUsage,
        averageUsagesPerDay: result.statistics.averageUsagesPerDay,
        averageRevenuePerDay: result.statistics.averageRevenuePerDay,
        // 차트 데이터
        monthlyData: result.chartData.monthlyData,
        deviceUsage: result.chartData.deviceUsage,
        preferredHours: result.chartData.preferredHours,
        weekdayPattern: result.chartData.weekdayPattern
      }
    }

    // 7. 이전 기간 비교 (TODO: 필요시 구현)
    // 현재는 단순화를 위해 생략

    // 8. 캐시에 저장
    statsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      userId: session.user.id
    });

    // 9. 오래된 캐시 정리 (메모리 관리)
    if (statsCache.size > 50) {
      const cutoff = Date.now() - CACHE_DURATION;
      for (const [key, value] of statsCache.entries()) {
        if (value.timestamp < cutoff) {
          statsCache.delete(key);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`🚀 D1에서 통계 조회 완료 (${responseTime}ms):`, cacheKey);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`
      }
    })

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