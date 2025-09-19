/**
 * 분석 관련 비즈니스 로직을 처리하는 서비스 레이어
 */

import { AnalyticsRepository } from '@/lib/repositories/analytics.repository'
import { DeviceRepository } from '@/lib/repositories/device.repository'
import { UserRepository } from '@/lib/repositories/user.repository'
import { logger } from '@/lib/utils/logger'
import { getDB } from '@/lib/db/server'

export interface DateRangeDto {
  startDate: string
  endDate: string
}

export interface DashboardStats {
  revenue: {
    total: number
    today: number
    thisMonth: number
    growth: number
  }
  reservations: {
    total: number
    active: number
    completed: number
    cancelled: number
  }
  devices: {
    total: number
    available: number
    inUse: number
    maintenance: number
  }
  users: {
    total: number
    active: number
    new: number
  }
}

export class AnalyticsService {
  private analyticsRepo: AnalyticsRepository
  private deviceRepo: DeviceRepository
  private userRepo: UserRepository

  constructor() {
    const db = getDB()
    this.analyticsRepo = new AnalyticsRepository(db)
    this.deviceRepo = new DeviceRepository(db)
    this.userRepo = new UserRepository(db)
  }

  // 싱글톤 인스턴스
  private static instance: AnalyticsService | null = null

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * 대시보드 통계 조회
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      // 이번 달 시작일
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0]
      
      // 지난 달 같은 기간
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0]
      const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0]

      // 매출 데이터
      const todayRevenue = await this.analyticsRepo.getRevenueByDateRange(todayStr, todayStr)
      const monthRevenue = await this.analyticsRepo.getRevenueByDateRange(startOfMonthStr, todayStr)
      const lastMonthRevenue = await this.analyticsRepo.getRevenueByDateRange(lastMonthStartStr, lastMonthEndStr)

      const todayTotal = todayRevenue.reduce((sum, r) => sum + r.revenue, 0)
      const monthTotal = monthRevenue.reduce((sum, r) => sum + r.revenue, 0)
      const lastMonthTotal = lastMonthRevenue.reduce((sum, r) => sum + r.revenue, 0)
      
      const growth = lastMonthTotal > 0 
        ? Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100)
        : 0

      // 예약 통계
      const reservationStats = await this.analyticsRepo.getReservationStats(startOfMonthStr, todayStr)

      // 기기 통계
      const deviceStats = await this.deviceRepo.getDeviceStats()

      // 사용자 통계
      const userStats = await this.userRepo.getUserStats()

      return {
        revenue: {
          total: monthTotal,
          today: todayTotal,
          thisMonth: monthTotal,
          growth
        },
        reservations: reservationStats,
        devices: deviceStats,
        users: userStats
      }
    } catch (error) {
      logger.error('Failed to fetch dashboard stats', error)
      throw error
    }
  }

  /**
   * 매출 분석 데이터 조회
   */
  async getRevenueAnalytics(dateRange: DateRangeDto) {
    try {
      const { startDate, endDate } = dateRange

      // 일별 매출 데이터
      const dailyRevenue = await this.analyticsRepo.getRevenueByDateRange(startDate, endDate)

      // 기기별 매출 데이터
      const deviceUsage = await this.analyticsRepo.getDeviceUsageStats(startDate, endDate)

      // 시간대별 분석
      const timeSlotAnalysis = await this.analyticsRepo.getTimeSlotAnalysis(startDate, endDate)

      // 총 매출 계산
      const totalRevenue = dailyRevenue.reduce((sum, r) => sum + r.revenue, 0)
      const totalReservations = dailyRevenue.reduce((sum, r) => sum + r.count, 0)
      const avgRevenuePerReservation = totalReservations > 0 
        ? Math.round(totalRevenue / totalReservations)
        : 0

      // 최고/최저 매출일
      const sortedByRevenue = [...dailyRevenue].sort((a, b) => b.revenue - a.revenue)
      const peakDay = sortedByRevenue[0] || null
      const lowestDay = sortedByRevenue[sortedByRevenue.length - 1] || null

      return {
        summary: {
          totalRevenue,
          totalReservations,
          avgRevenuePerReservation,
          peakDay,
          lowestDay
        },
        dailyRevenue,
        devicePerformance: deviceUsage.slice(0, 10), // Top 10 devices
        timeSlotAnalysis
      }
    } catch (error) {
      logger.error('Failed to fetch revenue analytics', error)
      throw error
    }
  }

  /**
   * 기기 사용 분석 데이터 조회
   */
  async getDeviceAnalytics(dateRange: DateRangeDto) {
    try {
      const { startDate, endDate } = dateRange

      // 기기별 사용 통계
      const deviceUsage = await this.analyticsRepo.getDeviceUsageStats(startDate, endDate)

      // 카테고리별 그룹화
      const categoryStats = new Map<string, {
        category: string
        devices: number
        totalHours: number
        totalRevenue: number
        reservations: number
      }>()

      deviceUsage.forEach(device => {
        const category = device.category || 'Unknown'
        const existing = categoryStats.get(category) || {
          category,
          devices: 0,
          totalHours: 0,
          totalRevenue: 0,
          reservations: 0
        }

        categoryStats.set(category, {
          category,
          devices: existing.devices + 1,
          totalHours: existing.totalHours + device.usageHours,
          totalRevenue: existing.totalRevenue + device.revenue,
          reservations: existing.reservations + device.reservationCount
        })
      })

      // 사용률 계산
      const totalDevices = await this.deviceRepo.getDeviceStats()
      const utilizationRate = deviceUsage.length > 0
        ? Math.round((deviceUsage.length / totalDevices.total) * 100)
        : 0

      return {
        summary: {
          totalDevices: totalDevices.total,
          activeDevices: deviceUsage.length,
          utilizationRate,
          totalRevenue: deviceUsage.reduce((sum, d) => sum + d.revenue, 0),
          totalHours: Math.round(deviceUsage.reduce((sum, d) => sum + d.usageHours, 0))
        },
        deviceUsage,
        categoryBreakdown: Array.from(categoryStats.values())
      }
    } catch (error) {
      logger.error('Failed to fetch device analytics', error)
      throw error
    }
  }

  /**
   * 고객 분석 데이터 조회
   */
  async getCustomerAnalytics(dateRange: DateRangeDto) {
    try {
      const { startDate, endDate } = dateRange

      // 상위 고객 데이터
      const topCustomers = await this.analyticsRepo.getTopCustomers(startDate, endDate, 20)

      // 고객 통계
      const customerStats = {
        totalCustomers: topCustomers.length,
        totalRevenue: topCustomers.reduce((sum, c) => sum + c.totalRevenue, 0),
        avgRevenuePerCustomer: 0,
        avgReservationsPerCustomer: 0
      }

      if (customerStats.totalCustomers > 0) {
        customerStats.avgRevenuePerCustomer = Math.round(
          customerStats.totalRevenue / customerStats.totalCustomers
        )
        customerStats.avgReservationsPerCustomer = Math.round(
          topCustomers.reduce((sum, c) => sum + c.totalReservations, 0) / customerStats.totalCustomers
        )
      }

      // 신규 vs 기존 고객 분석
      const newCustomers = topCustomers.filter(c => {
        const firstVisit = new Date(c.lastVisit)
        const rangeStart = new Date(startDate)
        return firstVisit >= rangeStart
      })

      return {
        summary: customerStats,
        topCustomers,
        customerSegments: {
          new: newCustomers.length,
          returning: topCustomers.length - newCustomers.length
        }
      }
    } catch (error) {
      logger.error('Failed to fetch customer analytics', error)
      throw error
    }
  }

  /**
   * 시간대별 분석
   */
  async getTimeSlotAnalytics(dateRange: DateRangeDto) {
    try {
      const { startDate, endDate } = dateRange

      const timeSlotData = await this.analyticsRepo.getTimeSlotAnalysis(startDate, endDate)

      // 피크 시간대 찾기
      const sortedByCount = [...timeSlotData].sort((a, b) => b.count - a.count)
      const peakHours = sortedByCount.slice(0, 3).map(slot => ({
        hour: slot.hour,
        display: `${slot.hour}:00 ~ ${slot.hour + 1}:00`,
        count: slot.count,
        revenue: slot.revenue
      }))

      // 시간대별 평균 계산
      const totalSlots = timeSlotData.length
      const avgReservationsPerHour = totalSlots > 0
        ? Math.round(timeSlotData.reduce((sum, slot) => sum + slot.count, 0) / totalSlots)
        : 0

      return {
        hourlyData: timeSlotData,
        peakHours,
        avgReservationsPerHour
      }
    } catch (error) {
      logger.error('Failed to fetch time slot analytics', error)
      throw error
    }
  }

  /**
   * 예측 분석 (간단한 추세 기반)
   */
  async getPredictiveAnalytics() {
    try {
      // 최근 30일 데이터
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const recentRevenue = await this.analyticsRepo.getRevenueByDateRange(
        thirtyDaysAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )

      // 주별 평균 계산
      const weeklyAverages = []
      for (let i = 0; i < 4; i++) {
        const weekStart = i * 7
        const weekEnd = (i + 1) * 7
        const weekData = recentRevenue.slice(weekStart, weekEnd)
        const weekAvg = weekData.reduce((sum, d) => sum + d.revenue, 0) / 7
        weeklyAverages.push(weekAvg)
      }

      // 간단한 선형 추세 계산
      const trend = weeklyAverages.length > 1
        ? (weeklyAverages[weeklyAverages.length - 1] - weeklyAverages[0]) / weeklyAverages.length
        : 0

      // 다음 주 예측
      const nextWeekPrediction = weeklyAverages[weeklyAverages.length - 1] + trend

      return {
        historicalData: recentRevenue,
        weeklyAverages,
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        nextWeekPrediction: Math.round(nextWeekPrediction * 7)
      }
    } catch (error) {
      logger.error('Failed to fetch predictive analytics', error)
      throw error
    }
  }
}