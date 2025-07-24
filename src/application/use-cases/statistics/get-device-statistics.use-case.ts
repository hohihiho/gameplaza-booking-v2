import { DeviceStatistics, DeviceStatisticsData } from '@/src/domain/entities/reservation-statistics'
import { StatisticsPeriod } from '@/src/domain/value-objects/statistics-period'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface GetDeviceStatisticsRequest {
  userId: string
  deviceId?: string // 특정 기기만 조회하거나 전체 기기 조회
  periodType: 'day' | 'week' | 'month' | 'custom'
  date?: string
  year?: number
  month?: number
  startDate?: string
  endDate?: string
}

export interface GetDeviceStatisticsResponse {
  statistics: DeviceStatistics[]
  summary?: {
    totalDevices: number
    averageUtilizationRate: number
    mostPopularDevice: {
      deviceId: string
      deviceNumber: string
      reservationCount: number
    }
    highestRevenueDevice: {
      deviceId: string
      deviceNumber: string
      revenue: number
    }
  }
}

/**
 * 기기별 통계 조회 유스케이스
 * 관리자만 접근 가능
 */
export class GetDeviceStatisticsUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetDeviceStatisticsRequest): Promise<GetDeviceStatisticsResponse> {
    // 1. 사용자 권한 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 통계를 조회할 수 있습니다')
    }

    // 2. 통계 기간 설정
    const period = this.createPeriod(request)

    // 3. 기기 정보 조회
    let devices
    if (request.deviceId) {
      const device = await this.deviceRepository.findById(request.deviceId)
      if (!device) {
        throw new Error('기기를 찾을 수 없습니다')
      }
      devices = [device]
    } else {
      devices = await this.deviceRepository.findAll()
    }

    // 4. 각 기기별 통계 계산
    const statistics: DeviceStatistics[] = []
    
    for (const device of devices) {
      const reservations = await this.reservationRepository.findByDeviceAndTimeRange(
        device.id,
        period.startDate,
        period.endDate
      )

      if (reservations.length > 0 || request.deviceId) {
        const deviceData = this.calculateDeviceStatistics(device, reservations, period)
        statistics.push(new DeviceStatistics(period, deviceData))
      }
    }

    // 5. 요약 정보 계산 (전체 기기 조회 시)
    let summary
    if (!request.deviceId && statistics.length > 0) {
      summary = this.calculateSummary(statistics)
    }

    return {
      statistics,
      summary
    }
  }

  /**
   * 통계 기간 생성
   */
  private createPeriod(request: GetDeviceStatisticsRequest): StatisticsPeriod {
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
   * 기기별 통계 계산
   */
  private calculateDeviceStatistics(
    device: any,
    reservations: any[],
    period: StatisticsPeriod
  ): DeviceStatisticsData {
    // 완료된 예약만 통계에 포함
    const completedReservations = reservations.filter(r => 
      r.status.value === 'completed' || r.status.value === 'checked_in'
    )

    const totalReservations = completedReservations.length
    
    // 총 수익 계산
    const totalRevenue = completedReservations.reduce((sum, r) => 
      sum + (r.totalPrice || 0), 0
    )

    // 총 사용 시간 계산
    const totalHours = completedReservations.reduce((sum, r) => {
      const duration = r.timeSlot.endHour - r.timeSlot.startHour
      return sum + duration
    }, 0)

    // 시간대별 인기도 계산
    const timeSlotCounts: { [hour: number]: number } = {}
    completedReservations.forEach(r => {
      for (let hour = r.timeSlot.startHour; hour < r.timeSlot.endHour; hour++) {
        timeSlotCounts[hour] = (timeSlotCounts[hour] || 0) + 1
      }
    })

    const popularTimeSlots = Object.entries(timeSlotCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      }))
      .sort((a, b) => b.count - a.count)

    // 활용률 계산 (예약된 시간 / 전체 가능 시간)
    const operatingHoursPerDay = 14 // 10:00 - 24:00
    const totalPossibleHours = operatingHoursPerDay * period.getDaysCount()
    const utilizationRate = totalPossibleHours > 0 
      ? (totalHours / totalPossibleHours) * 100 
      : 0

    return {
      deviceId: device.id,
      deviceNumber: device.deviceNumber,
      deviceName: device.name,
      totalReservations,
      totalRevenue,
      totalHours,
      utilizationRate: Math.min(100, utilizationRate), // 100% 초과 방지
      popularTimeSlots
    }
  }

  /**
   * 요약 정보 계산
   */
  private calculateSummary(statistics: DeviceStatistics[]): any {
    const totalDevices = statistics.length
    
    // 평균 활용률
    const totalUtilization = statistics.reduce((sum, stat) => 
      sum + stat.deviceData.utilizationRate, 0
    )
    const averageUtilizationRate = totalDevices > 0 
      ? totalUtilization / totalDevices 
      : 0

    // 가장 인기 있는 기기
    const mostPopularDevice = statistics.reduce((prev, current) => 
      current.deviceData.totalReservations > prev.deviceData.totalReservations 
        ? current : prev
    )

    // 가장 수익이 높은 기기
    const highestRevenueDevice = statistics.reduce((prev, current) => 
      current.deviceData.totalRevenue > prev.deviceData.totalRevenue 
        ? current : prev
    )

    return {
      totalDevices,
      averageUtilizationRate,
      mostPopularDevice: {
        deviceId: mostPopularDevice.deviceData.deviceId,
        deviceNumber: mostPopularDevice.deviceData.deviceNumber,
        reservationCount: mostPopularDevice.deviceData.totalReservations
      },
      highestRevenueDevice: {
        deviceId: highestRevenueDevice.deviceData.deviceId,
        deviceNumber: highestRevenueDevice.deviceData.deviceNumber,
        revenue: highestRevenueDevice.deviceData.totalRevenue
      }
    }
  }
}