import { UserStatistics, UserStatisticsData } from '@/src/domain/entities/reservation-statistics'
import { StatisticsPeriod } from '@/src/domain/value-objects/statistics-period'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface GetUserStatisticsRequest {
  userId: string
  targetUserId?: string // 특정 사용자 통계 조회 (관리자용)
  periodType: 'day' | 'week' | 'month' | 'custom' | 'all'
  date?: string
  year?: number
  month?: number
  startDate?: string
  endDate?: string
}

export interface GetUserStatisticsResponse {
  statistics: UserStatistics
  ranking?: {
    totalReservations: number // 전체 사용자 중 순위
    totalSpent: number // 지출액 순위
    reliabilityScore: number // 신뢰도 순위
  }
}

/**
 * 사용자별 통계 조회 유스케이스
 * 사용자는 자신의 통계만, 관리자는 모든 사용자 통계 조회 가능
 */
export class GetUserStatisticsUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetUserStatisticsRequest): Promise<GetUserStatisticsResponse> {
    // 1. 요청 사용자 확인
    const requestingUser = await this.userRepository.findById(request.userId)
    if (!requestingUser) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 조회 대상 사용자 결정
    let targetUserId = request.userId
    if (request.targetUserId && request.targetUserId !== request.userId) {
      if (requestingUser.role !== 'admin') {
        throw new Error('다른 사용자의 통계를 조회할 권한이 없습니다')
      }
      targetUserId = request.targetUserId
    }

    // 3. 대상 사용자 확인
    const targetUser = await this.userRepository.findById(targetUserId)
    if (!targetUser) {
      throw new Error('대상 사용자를 찾을 수 없습니다')
    }

    // 4. 통계 기간 설정
    const period = this.createPeriod(request)

    // 5. 사용자 예약 데이터 조회
    let reservations
    if (request.periodType === 'all') {
      // 전체 기간 조회
      const allReservations = await this.reservationRepository.findByUserId(targetUserId)
      reservations = allReservations.reservations
    } else {
      // 특정 기간 조회
      reservations = await this.reservationRepository.findByUserAndTimeRange(
        targetUserId,
        period.startDate,
        period.endDate
      )
    }

    // 6. 통계 데이터 계산
    const statisticsData = await this.calculateUserStatistics(targetUserId, reservations)

    // 7. 통계 엔티티 생성
    const statistics = new UserStatistics(period, statisticsData)

    // 8. 순위 정보 계산 (관리자가 조회하거나 자신의 통계 조회 시)
    let ranking
    if (requestingUser.role === 'admin' || targetUserId === request.userId) {
      ranking = await this.calculateUserRanking(targetUserId, period)
    }

    return {
      statistics,
      ranking
    }
  }

  /**
   * 통계 기간 생성
   */
  private createPeriod(request: GetUserStatisticsRequest): StatisticsPeriod {
    if (request.periodType === 'all') {
      // 전체 기간은 서비스 시작일부터 현재까지로 설정
      const serviceStartDate = KSTDateTime.fromString('2024-01-01')
      const now = KSTDateTime.now()
      return new StatisticsPeriod(serviceStartDate, now)
    }

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
   * 사용자 통계 계산
   */
  private async calculateUserStatistics(
    userId: string,
    reservations: any[]
  ): Promise<UserStatisticsData> {
    const totalReservations = reservations.length
    const completedReservations = reservations.filter(r => 
      r.status.value === 'completed'
    ).length
    const cancelledReservations = reservations.filter(r => 
      r.status.value === 'cancelled'
    ).length
    const noShowCount = reservations.filter(r => 
      r.status.value === 'no_show'
    ).length

    // 총 지출액 계산 (완료된 예약만)
    const totalSpent = reservations
      .filter(r => r.status.value === 'completed')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0)

    // 선호 기기 분석
    const deviceCounts: { [deviceId: string]: number } = {}
    reservations.forEach(r => {
      deviceCounts[r.deviceId] = (deviceCounts[r.deviceId] || 0) + 1
    })
    
    const favoriteDeviceId = Object.keys(deviceCounts).length > 0
      ? Object.entries(deviceCounts).sort(([, a], [, b]) => b - a)[0][0]
      : null

    // 선호 시간대 분석
    const timeSlotCounts: { [hour: number]: number } = {}
    reservations.forEach(r => {
      for (let hour = r.timeSlot.startHour; hour < r.timeSlot.endHour; hour++) {
        timeSlotCounts[hour] = (timeSlotCounts[hour] || 0) + 1
      }
    })

    const favoriteTimeSlots = Object.entries(timeSlotCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // 평균 예약 시간 계산
    const totalDuration = reservations.reduce((sum, r) => {
      const duration = r.timeSlot.endHour - r.timeSlot.startHour
      return sum + duration
    }, 0)
    const averageReservationDuration = totalReservations > 0 
      ? totalDuration / totalReservations 
      : 0

    return {
      userId,
      totalReservations,
      completedReservations,
      cancelledReservations,
      noShowCount,
      totalSpent,
      favoriteDeviceId,
      favoriteTimeSlots,
      averageReservationDuration
    }
  }

  /**
   * 사용자 순위 계산
   */
  private async calculateUserRanking(
    userId: string,
    period: StatisticsPeriod
  ): Promise<any> {
    // 모든 사용자의 통계를 계산하여 순위 산정
    // 실제 구현에서는 효율적인 쿼리로 처리해야 함
    
    // 임시로 고정된 순위 반환
    return {
      totalReservations: 1,
      totalSpent: 1,
      reliabilityScore: 1
    }
  }
}