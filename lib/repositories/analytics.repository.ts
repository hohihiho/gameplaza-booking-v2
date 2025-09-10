// D1 Analytics Repository - 분석 데이터 조회를 위한 리포지토리

export interface RevenueData {
  date: string
  revenue: number
  count: number
}

export interface DeviceUsageData {
  deviceId: string
  deviceNumber: string
  deviceType: string
  category: string
  usageHours: number
  revenue: number
  reservationCount: number
}

export interface TimeSlotData {
  hour: number
  count: number
  revenue: number
}

export interface CustomerData {
  userId: string
  userName: string
  userEmail: string
  totalReservations: number
  totalRevenue: number
  lastVisit: string
}

export class AnalyticsRepository {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  // 날짜 범위별 수익 데이터 조회
  async getRevenueByDateRange(startDate: string, endDate: string): Promise<RevenueData[]> {
    const query = `
      SELECT 
        date,
        SUM(total_amount) as revenue,
        COUNT(*) as count
      FROM reservations
      WHERE date >= ? AND date <= ?
      AND status IN ('approved', 'checked_in', 'completed')
      GROUP BY date
      ORDER BY date ASC
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate)
        .all()

      return (result.results as any[]).map(row => ({
        date: row.date,
        revenue: row.revenue || 0,
        count: row.count || 0
      }))
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      return []
    }
  }

  // 기기 사용량 통계 조회
  async getDeviceUsageStats(startDate: string, endDate: string): Promise<DeviceUsageData[]> {
    const query = `
      SELECT 
        r.device_id,
        d.device_number,
        dt.name as device_type,
        dc.name as category,
        r.start_time,
        r.end_time,
        r.total_amount
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      WHERE r.date >= ? AND r.date <= ?
      AND r.status IN ('approved', 'checked_in', 'completed')
      ORDER BY r.device_id
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate)
        .all()

      // 기기별로 그룹화하여 통계 계산
      const deviceMap = new Map<string, DeviceUsageData>()

      ;(result.results as any[]).forEach(row => {
        const deviceId = row.device_id
        const existing = deviceMap.get(deviceId)

        // 사용 시간 계산 (시간:분 형식에서 시간 단위로 변환)
        const startHour = parseInt(row.start_time.split(':')[0])
        const startMin = parseInt(row.start_time.split(':')[1] || '0')
        const endHour = parseInt(row.end_time.split(':')[0])
        const endMin = parseInt(row.end_time.split(':')[1] || '0')
        const usageHours = (endHour + endMin / 60) - (startHour + startMin / 60)

        if (existing) {
          existing.usageHours += usageHours
          existing.revenue += row.total_amount || 0
          existing.reservationCount += 1
        } else {
          deviceMap.set(deviceId, {
            deviceId,
            deviceNumber: row.device_number || '',
            deviceType: row.device_type || '',
            category: row.category || '',
            usageHours,
            revenue: row.total_amount || 0,
            reservationCount: 1
          })
        }
      })

      return Array.from(deviceMap.values()).sort((a, b) => b.revenue - a.revenue)
    } catch (error) {
      console.error('Error fetching device usage data:', error)
      return []
    }
  }

  // 시간대별 예약 분석
  async getTimeSlotAnalysis(startDate: string, endDate: string): Promise<TimeSlotData[]> {
    const query = `
      SELECT 
        CAST(substr(start_time, 1, 2) AS INTEGER) as hour,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM reservations
      WHERE date >= ? AND date <= ?
      AND status IN ('approved', 'checked_in', 'completed')
      GROUP BY hour
      ORDER BY hour ASC
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate)
        .all()

      return (result.results as any[]).map(row => ({
        hour: row.hour,
        count: row.count || 0,
        revenue: row.revenue || 0
      }))
    } catch (error) {
      console.error('Error fetching time slot data:', error)
      return []
    }
  }

  // 상위 고객 조회
  async getTopCustomers(startDate: string, endDate: string, limit: number = 10): Promise<CustomerData[]> {
    const query = `
      SELECT 
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(*) as total_reservations,
        SUM(r.total_amount) as total_revenue,
        MAX(r.date) as last_visit
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.date >= ? AND r.date <= ?
      AND r.status IN ('approved', 'checked_in', 'completed')
      GROUP BY r.user_id, u.name, u.email
      ORDER BY total_revenue DESC
      LIMIT ?
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate, limit)
        .all()

      return (result.results as any[]).map(row => ({
        userId: row.user_id,
        userName: row.user_name || '',
        userEmail: row.user_email || '',
        totalReservations: row.total_reservations || 0,
        totalRevenue: row.total_revenue || 0,
        lastVisit: row.last_visit || ''
      }))
    } catch (error) {
      console.error('Error fetching customer data:', error)
      return []
    }
  }

  // 예약 통계 조회
  async getReservationStats(startDate: string, endDate: string): Promise<{
    total: number
    approved: number
    cancelled: number
    completed: number
    avgRevenue: number
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('approved', 'checked_in') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status IN ('cancelled', 'rejected') THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('approved', 'checked_in', 'completed') THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status IN ('approved', 'checked_in', 'completed') THEN 1 ELSE 0 END) as revenue_count
      FROM reservations
      WHERE date >= ? AND date <= ?
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate)
        .first()

      const stats = result as any
      
      return {
        total: stats?.total || 0,
        approved: stats?.approved || 0,
        cancelled: stats?.cancelled || 0,
        completed: stats?.completed || 0,
        avgRevenue: stats?.revenue_count > 0 ? (stats?.total_revenue || 0) / stats.revenue_count : 0
      }
    } catch (error) {
      console.error('Error fetching reservation stats:', error)
      return {
        total: 0,
        approved: 0,
        cancelled: 0,
        completed: 0,
        avgRevenue: 0
      }
    }
  }

  // 월별 성장률 분석
  async getMonthlyGrowthStats(months: number = 12): Promise<Array<{
    month: string
    reservations: number
    revenue: number
    growthRate: number
  }>> {
    const query = `
      SELECT 
        substr(date, 1, 7) as month,
        COUNT(*) as reservations,
        SUM(total_amount) as revenue
      FROM reservations
      WHERE status IN ('approved', 'checked_in', 'completed')
      AND date >= date('now', '-${months} months')
      GROUP BY month
      ORDER BY month ASC
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .all()

      const monthlyData = result.results as any[]
      
      return monthlyData.map((row, index) => {
        let growthRate = 0
        if (index > 0) {
          const prevRevenue = monthlyData[index - 1].revenue || 0
          const currentRevenue = row.revenue || 0
          growthRate = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0
        }

        return {
          month: row.month,
          reservations: row.reservations || 0,
          revenue: row.revenue || 0,
          growthRate: Math.round(growthRate * 100) / 100
        }
      })
    } catch (error) {
      console.error('Error fetching monthly growth stats:', error)
      return []
    }
  }

  // 기기 카테고리별 성과 분석
  async getCategoryPerformance(startDate: string, endDate: string): Promise<Array<{
    category: string
    reservations: number
    revenue: number
    avgUsageHours: number
  }>> {
    const query = `
      SELECT 
        COALESCE(dc.name, 'Unknown') as category,
        COUNT(*) as reservations,
        SUM(r.total_amount) as revenue,
        AVG(
          (CAST(substr(r.end_time, 1, 2) AS REAL) + CAST(substr(r.end_time, 4, 2) AS REAL) / 60) -
          (CAST(substr(r.start_time, 1, 2) AS REAL) + CAST(substr(r.start_time, 4, 2) AS REAL) / 60)
        ) as avg_usage_hours
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      WHERE r.date >= ? AND r.date <= ?
      AND r.status IN ('approved', 'checked_in', 'completed')
      GROUP BY dc.name
      ORDER BY revenue DESC
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate)
        .all()

      return (result.results as any[]).map(row => ({
        category: row.category || 'Unknown',
        reservations: row.reservations || 0,
        revenue: row.revenue || 0,
        avgUsageHours: Math.round((row.avg_usage_hours || 0) * 100) / 100
      }))
    } catch (error) {
      console.error('Error fetching category performance:', error)
      return []
    }
  }

  // 피크 시간대 분석
  async getPeakHoursAnalysis(startDate: string, endDate: string): Promise<Array<{
    hour: number
    weekday: number
    reservations: number
    revenue: number
  }>> {
    const query = `
      SELECT 
        CAST(substr(start_time, 1, 2) AS INTEGER) as hour,
        CAST(strftime('%w', date) AS INTEGER) as weekday,
        COUNT(*) as reservations,
        SUM(total_amount) as revenue
      FROM reservations
      WHERE date >= ? AND date <= ?
      AND status IN ('approved', 'checked_in', 'completed')
      GROUP BY hour, weekday
      ORDER BY reservations DESC
    `
    
    try {
      const result = await this.db
        .prepare(query)
        .bind(startDate, endDate)
        .all()

      return (result.results as any[]).map(row => ({
        hour: row.hour,
        weekday: row.weekday, // 0=일요일, 1=월요일, ...
        reservations: row.reservations || 0,
        revenue: row.revenue || 0
      }))
    } catch (error) {
      console.error('Error fetching peak hours analysis:', error)
      return []
    }
  }
}