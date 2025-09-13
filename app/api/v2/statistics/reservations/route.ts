import { NextRequest, NextResponse } from 'next/server'
import { GetReservationStatisticsUseCase } from '@/src/application/use-cases/statistics/get-reservation-statistics.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createAdminClient } from '@/lib/db'
import { auth } from '@/lib/auth'
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

    // 3. 캐시 확인
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

    // 4. 서비스 초기화
    const supabase = createAdminClient()
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
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

    // 차트용 추가 데이터 생성 (UseCase와 동일한 데이터 사용)
    const allReservations = await reservationRepository.findByDateRange(
      result.statistics.period.startDate,
      result.statistics.period.endDate
    )
    
    // 사용자별 필터링 + 완료된 예약만
    const userReservations = allReservations.filter(reservation => 
      reservation.userId === session.user.id && reservation.status.value === 'completed'
    )
    
    console.log('UseCase 방식 - 전체 예약 수:', allReservations.length)
    console.log('UseCase 방식 - 사용자 예약 수:', userReservations.length)
    console.log('UseCase 결과 - totalReservations:', result.statistics.data.totalReservations)
    console.log('UseCase 결과 - completedReservations:', result.statistics.data.completedReservations)
    
    // 상태별 분포 확인
    const statusDistribution: { [key: string]: number } = {}
    userReservations.forEach(reservation => {
      const status = reservation.status?.value || 'unknown'
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
    })
    console.log('UseCase - 상태별 예약 분포:', statusDistribution)
    
    console.log('통계 조회 범위:', result.statistics.period.startDate.dateString, '~', result.statistics.period.endDate.dateString)
    console.log('사용자 예약 수:', userReservations.length)
    
    const chartData = await generateChartDataFromDomain(
      userReservations, 
      result.statistics.period.startDate, 
      result.statistics.period.endDate
    )

    // 6. 응답 형식화
    const response: any = {
      period: {
        type: data.periodType,
        startDate: result.statistics.period.startDate.toISOString(),
        endDate: result.statistics.period.endDate.toISOString(),
        days: result.statistics.period.getDaysCount()
      },
      statistics: {
        totalUsages: result.statistics.data.totalReservations,
        completedUsages: result.statistics.data.completedReservations,
        cancelledUsages: result.statistics.data.cancelledReservations,
        noShowUsages: result.statistics.data.noShowReservations,
        totalRevenue: result.statistics.data.totalRevenue,
        averageUsageDuration: result.statistics.data.averageReservationDuration,
        peakHours: result.statistics.data.peakHours,
        deviceUtilizationRate: result.statistics.data.deviceUtilizationRate,
        completionRate: result.statistics.getCompletionRate(),
        cancellationRate: result.statistics.getCancellationRate(),
        noShowRate: result.statistics.getNoShowRate(),
        averageRevenuePerUsage: result.statistics.getAverageRevenuePerReservation(),
        averageUsagesPerDay: result.statistics.getAverageReservationsPerDay(),
        averageRevenuePerDay: result.statistics.getAverageRevenuePerDay(),
        // 차트 데이터
        monthlyData: chartData.monthlyData,
        deviceUsage: chartData.deviceUsage,
        preferredHours: chartData.preferredHours,
        weekdayPattern: chartData.weekdayPattern
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

    // 7. 캐시에 저장
    statsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      userId: session.user.id
    });

    // 8. 오래된 캐시 정리 (메모리 관리)
    if (statsCache.size > 50) {
      const cutoff = Date.now() - CACHE_DURATION;
      for (const [key, value] of statsCache.entries()) {
        if (value.timestamp < cutoff) {
          statsCache.delete(key);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`🚀 DB에서 통계 조회 완료 (${responseTime}ms):`, cacheKey);

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

/**
 * 도메인 객체로부터 차트 데이터 생성
 */
async function generateChartDataFromDomain(
  reservations: any[],
  startDate: any,
  endDate: any
) {
  console.log('도메인 방식 - 사용자 예약 수:', reservations.length)
  
  // 기기별 예약 분포 확인 (도메인 객체 기준)
  const deviceDistribution: { [key: string]: number } = {}
  reservations.forEach(reservation => {
    const deviceId = reservation.deviceId || 'unknown'
    deviceDistribution[deviceId] = (deviceDistribution[deviceId] || 0) + 1
  })
  
  console.log('도메인 방식 - 기기별 예약 분포 (device ID):', deviceDistribution)
  console.log('도메인 방식 - 예약 샘플:', reservations.slice(0, 5).map(r => ({ 
    userId: r.userId, 
    id: r.id, 
    date: r.date?.dateString,
    deviceId: r.deviceId,
    status: r.status?.value || 'unknown'
  })))

  // 1. 월별 데이터 (일별 예약 추이)
  const monthlyData = generateMonthlyDataFromDomain(reservations, startDate.toDate(), endDate.toDate())

  // 2. 기기별 사용 현황 - 도메인 객체에서는 device ID만 있으므로 별도 처리 필요
  const deviceUsage = await generateDeviceUsageFromDomain(reservations)

  // 3. 선호 시간대 - 도메인 객체의 timeSlot 사용
  const preferredHours = generatePreferredHoursFromDomain(reservations)

  // 4. 요일별 패턴 - 도메인 객체의 date 사용
  const weekdayPattern = generateWeekdayPatternFromDomain(reservations)

  return {
    monthlyData,
    deviceUsage,
    preferredHours,
    weekdayPattern
  }
}

/**
 * 도메인에서 월별 데이터 생성
 */
function generateMonthlyDataFromDomain(reservations: any[], startDate: Date, endDate: Date) {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 12개월 이상의 기간이면 월별 차트 생성
  if (daysDiff >= 300) { // 약 10개월 이상
    return generateMonthlyChartFromDomain(reservations, startDate, endDate)
  } else {
    // 짧은 기간은 일별 차트 생성
    return generateDailyChartFromDomain(reservations, startDate, endDate)
  }
}

/**
 * 도메인에서 일별 차트 데이터 생성
 */
function generateDailyChartFromDomain(reservations: any[], startDate: Date, endDate: Date) {
  const data = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0]
    const dayReservations = reservations.filter(r => r.date.dateString === dateStr)
    
    data.push({
      date: dateStr,
      reservations: dayReservations.length,
      completed: dayReservations.filter(r => r.status.value === 'completed').length
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return data
}

/**
 * 도메인에서 월별 차트 데이터 생성
 */
function generateMonthlyChartFromDomain(reservations: any[], startDate: Date, endDate: Date) {
  const monthlyData: { [key: string]: { reservations: number, completed: number } } = {}
  
  // 예약 데이터를 월별로 그룹핑
  reservations.forEach(reservation => {
    if (reservation.date && reservation.date.dateString) {
      const date = new Date(reservation.date.dateString)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { reservations: 0, completed: 0 }
      }
      
      monthlyData[monthKey].reservations += 1
      if (reservation.status.value === 'completed') {
        monthlyData[monthKey].completed += 1
      }
    }
  })
  
  // 시작월부터 종료월까지 모든 월 생성
  const result = []
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  
  while (current <= end) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    const monthName = `${current.getMonth() + 1}월`
    
    result.push({
      month: monthName,
      date: monthKey,
      reservations: monthlyData[monthKey]?.reservations || 0,
      completed: monthlyData[monthKey]?.completed || 0
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  console.log('도메인 - 월별 차트 데이터:', result)
  return result
}

/**
 * 도메인에서 기기별 사용 데이터 생성
 */
async function generateDeviceUsageFromDomain(reservations: any[]) {
  // 기기 정보를 가져오기 위해 Supabase에서 별도 조회
  const supabase = createAdminClient()
  
  // 모든 기기 ID 수집
  const deviceIds = [...new Set(reservations.map(r => r.deviceId).filter(Boolean))]
  
  console.log('수집된 기기 IDs:', deviceIds)
  
  // 기기 정보 조회
  const { data: devices, error } = await supabase
    .from('devices')
    .select(`
      id,
      device_number,
      device_types (
        id,
        name,
        model_name
      )
    `)
    .in('id', deviceIds)
  
  if (error) {
    console.error('기기 정보 조회 오류:', error)
  }
  
  console.log('조회된 기기 정보:', devices)
  
  // 기기 ID별 이름 매핑
  const deviceNames: { [key: string]: string } = {}
  devices?.forEach(device => {
    if (device.device_types) {
      const deviceType = Array.isArray(device.device_types) ? device.device_types[0] : device.device_types
      const deviceName = deviceType?.model_name 
        ? `${deviceType.name} ${deviceType.model_name}` 
        : deviceType?.name || 'Unknown Device'
      deviceNames[device.id] = deviceName
    }
  })
  
  console.log('기기 이름 매핑:', deviceNames)
  
  // 기기별 사용 횟수 집계
  const deviceTypeCount: { [key: string]: number } = {}
  const deviceTypeNames: { [key: string]: string } = {}
  
  reservations.forEach(reservation => {
    const deviceId = reservation.deviceId
    if (deviceId && deviceNames[deviceId]) {
      const deviceTypeName = deviceNames[deviceId]
      // 기기 타입별로 합산 (같은 이름의 기기들을 하나로 묶음)
      deviceTypeCount[deviceTypeName] = (deviceTypeCount[deviceTypeName] || 0) + 1
      deviceTypeNames[deviceTypeName] = deviceTypeName
    }
  })
  
  const totalReservations = reservations.length
  
  return Object.entries(deviceTypeCount)
    .map(([deviceTypeName, count]) => ({ 
      deviceId: deviceTypeName, // 기기 타입 이름을 ID로 사용
      name: deviceTypeName,
      count,
      device: deviceTypeName,
      avgTime: 2.5,
      percentage: totalReservations > 0 ? Math.round((count as number / totalReservations) * 100) : 0
     }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

/**
 * 도메인에서 선호 시간대 데이터 생성
 */
function generatePreferredHoursFromDomain(reservations: any[]) {
  const hourRangeCount: { [key: string]: { hour: number, count: number } } = {}
  
  reservations.forEach(reservation => {
    if (reservation.timeSlot) {
      const startHour = reservation.timeSlot.startHour
      const endHour = reservation.timeSlot.endHour
      
      const timeRangeKey = `${startHour}-${endHour}`
      
      if (!hourRangeCount[timeRangeKey]) {
        hourRangeCount[timeRangeKey] = {
          hour: startHour,
          count: 0
        }
      }
      hourRangeCount[timeRangeKey].count += 1
    }
  })
  
  const totalReservations = reservations.length
  
  return Object.entries(hourRangeCount)
    .map(([timeRangeKey, data]) => {
      const [startHour, endHour] = timeRangeKey.split('-').map(Number)
      return {
        timeRangeKey,
        hour: data.hour,
        count: data.count,
        label: `${startHour}~${endHour}시`,
        timeRange: `${startHour}~${endHour}시`,
        percentage: totalReservations > 0 ? Math.round((data.count / totalReservations) * 100) : 0
      }
    })
    .sort((a, b) => a.hour - b.hour)
}

/**
 * 도메인에서 요일별 패턴 데이터 생성
 */
function generateWeekdayPatternFromDomain(reservations: any[]) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekdayCount: { [key: number]: number } = {}
  
  reservations.forEach(reservation => {
    if (reservation.date && reservation.date.dateString) {
      const date = new Date(reservation.date.dateString)
      const dayOfWeek = date.getDay()
      weekdayCount[dayOfWeek] = (weekdayCount[dayOfWeek] || 0) + 1
    }
  })
  
  const totalReservations = reservations.length
  
  return weekdays.map((name, index) => ({
    dayIndex: index,
    name,
    count: weekdayCount[index] || 0,
    percentage: totalReservations > 0 ? Math.round(((weekdayCount[index] || 0) / totalReservations) * 100) : 0
  }))
}

// 미사용 함수들 제거됨 - generateDeviceUsage, generatePreferredHours, generateWeekdayPattern은 도메인 버전으로 대체

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