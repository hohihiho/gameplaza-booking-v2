import { ReservationStatistics, ReservationStatisticsData } from '@/src/domain/entities/reservation-statistics'
import { StatisticsPeriod } from '@/src/domain/value-objects/statistics-period'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface GetReservationStatisticsRequest {
  userId: string
  periodType: 'day' | 'week' | 'month' | 'custom'
  date?: string // YYYY-MM-DD for day/week
  year?: number // for month
  month?: number // for month
  startDate?: string // for custom period
  endDate?: string // for custom period
}

export interface GetReservationStatisticsResponse {
  statistics: ReservationStatistics
  comparison?: {
    previousPeriod: ReservationStatistics
    changePercentage: {
      totalReservations: number
      totalRevenue: number
      completionRate: number
      cancellationRate: number
    }
  }
}

/**
 * 예약 통계 조회 유스케이스
 * 사용자는 본인 통계, 관리자는 전체 통계 조회 가능
 */
export class GetReservationStatisticsUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetReservationStatisticsRequest): Promise<GetReservationStatisticsResponse> {
    // 1. 사용자 권한 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 관리자가 아닌 경우 자신의 통계만 조회 가능 (현재는 개인 통계이므로 허용)
    // 추후 전체 통계 조회 시에는 관리자 권한 필요

    // 2. 통계 기간 설정
    const period = this.createPeriod(request)

    // 3. 예약 데이터 조회 (사용자 본인의 예약만)
    const allReservations = await this.reservationRepository.findByDateRange(
      period.startDate,
      period.endDate
    )
    
    // 관리자가 아닌 경우 본인 예약만 필터링
    const reservations = user.role === 'admin' 
      ? allReservations 
      : allReservations.filter(reservation => reservation.userId === request.userId)

    // 4. 통계 데이터 계산
    const statisticsData = this.calculateStatistics(reservations)

    // 5. 통계 엔티티 생성
    const statistics = new ReservationStatistics(period, statisticsData)

    // 6. 이전 기간과 비교 (선택사항)
    let comparison
    if (request.periodType !== 'custom') {
      const previousPeriod = this.getPreviousPeriod(period, request.periodType)
      const previousReservations = await this.reservationRepository.findByDateRange(
        previousPeriod.startDate,
        previousPeriod.endDate
      )
      
      const previousData = this.calculateStatistics(previousReservations)
      const previousStatistics = new ReservationStatistics(previousPeriod, previousData)
      
      comparison = {
        previousPeriod: previousStatistics,
        changePercentage: this.calculateChangePercentage(statistics, previousStatistics)
      }
    }

    return {
      statistics,
      comparison
    }
  }

  /**
   * 요청에 따른 통계 기간 생성
   */
  private createPeriod(request: GetReservationStatisticsRequest): StatisticsPeriod {
    switch (request.periodType) {
      case 'day':
        if (!request.date) {
          throw new Error('일별 통계 조회 시 날짜가 필요합니다')
        }
        return StatisticsPeriod.forDay(KSTDateTime.fromString(request.date))

      case 'week':
        if (!request.date) {
          throw new Error('주별 통계 조회 시 날짜가 필요합니다')
        }
        return StatisticsPeriod.forWeek(KSTDateTime.fromString(request.date))

      case 'month':
        if (!request.year || !request.month) {
          throw new Error('월별 통계 조회 시 연도와 월이 필요합니다')
        }
        return StatisticsPeriod.forMonth(request.year, request.month)

      case 'custom':
        if (!request.startDate || !request.endDate) {
          throw new Error('사용자 정의 기간 조회 시 시작일과 종료일이 필요합니다')
        }
        return new StatisticsPeriod(
          KSTDateTime.fromString(request.startDate),
          KSTDateTime.fromString(request.endDate)
        )

      default:
        throw new Error('올바르지 않은 기간 타입입니다')
    }
  }

  /**
   * 이전 기간 계산
   */
  private getPreviousPeriod(
    currentPeriod: StatisticsPeriod, 
    periodType: 'day' | 'week' | 'month' | 'custom'
  ): StatisticsPeriod {
    const days = currentPeriod.getDaysCount()
    
    switch (periodType) {
      case 'day':
        const previousDay = currentPeriod.startDate.addDays(-1)
        return StatisticsPeriod.forDay(previousDay)

      case 'week':
        const previousWeekStart = currentPeriod.startDate.addDays(-7)
        return StatisticsPeriod.forWeek(previousWeekStart)

      case 'month':
        const previousMonth = currentPeriod.startDate.toDate()
        previousMonth.setMonth(previousMonth.getMonth() - 1)
        return StatisticsPeriod.forMonth(
          previousMonth.getFullYear(),
          previousMonth.getMonth() + 1
        )

      default:
        // custom의 경우 동일한 기간만큼 이전으로
        return new StatisticsPeriod(
          currentPeriod.startDate.addDays(-days),
          currentPeriod.endDate.addDays(-days)
        )
    }
  }

  /**
   * 통계 데이터 계산
   */
  private calculateStatistics(reservations: any[]): ReservationStatisticsData {
    const totalReservations = reservations.length
    const completedReservations = reservations.filter(r => r.status.value === 'completed').length
    const cancelledReservations = reservations.filter(r => r.status.value === 'cancelled').length
    const noShowReservations = reservations.filter(r => r.status.value === 'no_show').length

    // 수익 계산 (완료된 예약만)
    const totalRevenue = reservations
      .filter(r => r.status.value === 'completed')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0)

    // 평균 예약 시간 계산
    const totalDuration = reservations.reduce((sum, r) => {
      const duration = r.timeSlot.endHour - r.timeSlot.startHour
      return sum + duration
    }, 0)
    const averageReservationDuration = totalReservations > 0 ? totalDuration / totalReservations : 0

    // 피크 시간대 계산
    const hourCounts: { [hour: number]: number } = {}
    reservations.forEach(r => {
      for (let hour = r.timeSlot.startHour; hour < r.timeSlot.endHour; hour++) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }
    })

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // 기기 활용률 계산 (예약된 시간 / 전체 운영 시간)
    // 운영 시간을 하루 14시간(10:00 - 24:00)으로 가정
    const operatingHoursPerDay = 14
    const totalOperatingHours = operatingHoursPerDay * reservations.length // 간단히 계산
    const totalReservedHours = totalDuration
    const deviceUtilizationRate = totalOperatingHours > 0 
      ? (totalReservedHours / totalOperatingHours) * 100 
      : 0

    return {
      totalReservations,
      completedReservations,
      cancelledReservations,
      noShowReservations,
      totalRevenue,
      averageReservationDuration,
      peakHours,
      deviceUtilizationRate
    }
  }

  /**
   * 변화율 계산
   */
  private calculateChangePercentage(
    current: ReservationStatistics,
    previous: ReservationStatistics
  ): any {
    const calculatePercentage = (currentValue: number, previousValue: number): number => {
      if (previousValue === 0) return currentValue > 0 ? 100 : 0
      return ((currentValue - previousValue) / previousValue) * 100
    }

    return {
      totalReservations: calculatePercentage(
        current.data.totalReservations,
        previous.data.totalReservations
      ),
      totalRevenue: calculatePercentage(
        current.data.totalRevenue,
        previous.data.totalRevenue
      ),
      completionRate: calculatePercentage(
        current.getCompletionRate(),
        previous.getCompletionRate()
      ),
      cancellationRate: calculatePercentage(
        current.getCancellationRate(),
        previous.getCancellationRate()
      )
    }
  }
}