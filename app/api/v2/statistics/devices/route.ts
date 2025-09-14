import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { d1GetDeviceStatistics } from '@/lib/db/d1'

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

    // 4. D1에서 통계 조회
    const result = await d1GetDeviceStatistics({
      userId: session.user.id,
      deviceId: data.deviceId,
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

    // 5. 응답 형식화
    const response: any = {
      period: {
        type: data.periodType,
        startDate,
        endDate
      },
      devices: result.devices.map((device: any) => ({
        deviceId: device.deviceId,
        deviceNumber: device.deviceNumber,
        deviceName: device.deviceName,
        statistics: {
          totalReservations: device.statistics.totalReservations,
          totalRevenue: device.statistics.totalRevenue,
          totalHours: device.statistics.totalHours,
          utilizationRate: device.statistics.utilizationRate,
          averageHoursPerReservation: device.statistics.averageHoursPerReservation,
          averageRevenuePerHour: device.statistics.averageRevenuePerHour,
          mostPopularTimeSlot: device.statistics.popularTimeSlots[0]?.timeRange || null,
          popularTimeSlots: device.statistics.popularTimeSlots
        }
      }))
    }

    // 요약 정보 추가
    if (result.summary) {
      response.summary = result.summary
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