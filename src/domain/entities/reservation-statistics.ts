import { StatisticsPeriod } from '../value-objects/statistics-period'

/**
 * 예약 통계 데이터
 */
export interface ReservationStatisticsData {
  totalReservations: number
  completedReservations: number
  cancelledReservations: number
  noShowReservations: number
  totalRevenue: number
  averageReservationDuration: number // 시간 단위
  peakHours: number[] // 가장 많이 예약된 시간대
  deviceUtilizationRate: number // 기기 활용률 (0-100%)
}

/**
 * 예약 통계 엔티티
 */
export class ReservationStatistics {
  constructor(
    public readonly period: StatisticsPeriod,
    public readonly data: ReservationStatisticsData
  ) {}

  /**
   * 완료율 계산
   */
  getCompletionRate(): number {
    if (this.data.totalReservations === 0) return 0
    return (this.data.completedReservations / this.data.totalReservations) * 100
  }

  /**
   * 취소율 계산
   */
  getCancellationRate(): number {
    if (this.data.totalReservations === 0) return 0
    return (this.data.cancelledReservations / this.data.totalReservations) * 100
  }

  /**
   * 노쇼율 계산
   */
  getNoShowRate(): number {
    if (this.data.totalReservations === 0) return 0
    return (this.data.noShowReservations / this.data.totalReservations) * 100
  }

  /**
   * 평균 예약당 수익
   */
  getAverageRevenuePerReservation(): number {
    if (this.data.completedReservations === 0) return 0
    return this.data.totalRevenue / this.data.completedReservations
  }

  /**
   * 일평균 예약 수
   */
  getAverageReservationsPerDay(): number {
    const days = this.period.getDaysCount()
    return this.data.totalReservations / days
  }

  /**
   * 일평균 수익
   */
  getAverageRevenuePerDay(): number {
    const days = this.period.getDaysCount()
    return this.data.totalRevenue / days
  }
}

/**
 * 기기별 통계 데이터
 */
export interface DeviceStatisticsData {
  deviceId: string
  deviceNumber: string
  deviceName: string
  totalReservations: number
  totalRevenue: number
  totalHours: number
  utilizationRate: number // 활용률 (0-100%)
  popularTimeSlots: Array<{
    hour: number
    count: number
  }>
}

/**
 * 기기별 통계 엔티티
 */
export class DeviceStatistics {
  constructor(
    public readonly period: StatisticsPeriod,
    public readonly deviceData: DeviceStatisticsData
  ) {}

  /**
   * 평균 예약당 시간
   */
  getAverageHoursPerReservation(): number {
    if (this.deviceData.totalReservations === 0) return 0
    return this.deviceData.totalHours / this.deviceData.totalReservations
  }

  /**
   * 시간당 평균 수익
   */
  getAverageRevenuePerHour(): number {
    if (this.deviceData.totalHours === 0) return 0
    return this.deviceData.totalRevenue / this.deviceData.totalHours
  }

  /**
   * 가장 인기 있는 시간대 반환
   */
  getMostPopularTimeSlot(): number | null {
    if (this.deviceData.popularTimeSlots.length === 0) return null
    
    const mostPopular = this.deviceData.popularTimeSlots.reduce((prev, current) => 
      current.count > prev.count ? current : prev
    )
    
    return mostPopular.hour
  }
}

/**
 * 사용자별 통계 데이터
 */
export interface UserStatisticsData {
  userId: string
  totalReservations: number
  completedReservations: number
  cancelledReservations: number
  noShowCount: number
  totalSpent: number
  favoriteDeviceId: string | null
  favoriteTimeSlots: number[]
  averageReservationDuration: number
}

/**
 * 사용자별 통계 엔티티
 */
export class UserStatistics {
  constructor(
    public readonly period: StatisticsPeriod,
    public readonly userData: UserStatisticsData
  ) {}

  /**
   * 신뢰도 점수 계산 (0-100)
   * 완료된 예약 비율과 노쇼 비율을 기반으로 계산
   */
  getReliabilityScore(): number {
    if (this.userData.totalReservations === 0) return 100
    
    const completionRate = this.userData.completedReservations / this.userData.totalReservations
    const noShowRate = this.userData.noShowCount / this.userData.totalReservations
    
    // 완료율 70%, 노쇼 페널티 30%
    const score = (completionRate * 70) + ((1 - noShowRate) * 30)
    
    return Math.round(score)
  }

  /**
   * 평균 예약당 지출
   */
  getAverageSpendingPerReservation(): number {
    if (this.userData.completedReservations === 0) return 0
    return this.userData.totalSpent / this.userData.completedReservations
  }

  /**
   * 취소율 계산
   */
  getCancellationRate(): number {
    if (this.userData.totalReservations === 0) return 0
    return (this.userData.cancelledReservations / this.userData.totalReservations) * 100
  }
}