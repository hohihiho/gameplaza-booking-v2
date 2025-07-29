import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

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
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  async getRevenueByDateRange(startDate: string, endDate: string): Promise<RevenueData[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('date, total_amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['approved', 'checked_in', 'completed'])
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching revenue data:', error)
      throw error
    }

    // 날짜별로 그룹화
    const revenueMap = new Map<string, { revenue: number; count: number }>()
    
    data?.forEach(reservation => {
      const existing = revenueMap.get(reservation.date) || { revenue: 0, count: 0 }
      revenueMap.set(reservation.date, {
        revenue: existing.revenue + (reservation.total_amount || 0),
        count: existing.count + 1
      })
    })

    return Array.from(revenueMap.entries()).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      count: stats.count
    }))
  }

  async getDeviceUsageStats(startDate: string, endDate: string): Promise<DeviceUsageData[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        device_id,
        start_time,
        end_time,
        total_amount,
        devices!inner(
          device_number,
          device_types(
            name,
            device_categories(
              name
            )
          )
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['approved', 'checked_in', 'completed'])

    if (error) {
      console.error('Error fetching device usage data:', error)
      throw error
    }

    // 기기별로 그룹화
    const deviceMap = new Map<string, DeviceUsageData>()

    data?.forEach(reservation => {
      const deviceId = reservation.device_id
      const existing = deviceMap.get(deviceId)

      // 사용 시간 계산
      const startHour = parseInt(reservation.start_time.split(':')[0])
      const startMin = parseInt(reservation.start_time.split(':')[1])
      const endHour = parseInt(reservation.end_time.split(':')[0])
      const endMin = parseInt(reservation.end_time.split(':')[1])
      const usageHours = (endHour + endMin / 60) - (startHour + startMin / 60)

      if (existing) {
        existing.usageHours += usageHours
        existing.revenue += reservation.total_amount || 0
        existing.reservationCount += 1
      } else {
        deviceMap.set(deviceId, {
          deviceId,
          deviceNumber: reservation.devices?.device_number || '',
          deviceType: reservation.devices?.device_types?.name || '',
          category: reservation.devices?.device_types?.device_categories?.name || '',
          usageHours,
          revenue: reservation.total_amount || 0,
          reservationCount: 1
        })
      }
    })

    return Array.from(deviceMap.values()).sort((a, b) => b.revenue - a.revenue)
  }

  async getTimeSlotAnalysis(startDate: string, endDate: string): Promise<TimeSlotData[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('start_time, total_amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['approved', 'checked_in', 'completed'])

    if (error) {
      console.error('Error fetching time slot data:', error)
      throw error
    }

    // 시간대별로 그룹화
    const timeSlotMap = new Map<number, { count: number; revenue: number }>()

    data?.forEach(reservation => {
      const hour = parseInt(reservation.start_time.split(':')[0])
      const existing = timeSlotMap.get(hour) || { count: 0, revenue: 0 }
      
      timeSlotMap.set(hour, {
        count: existing.count + 1,
        revenue: existing.revenue + (reservation.total_amount || 0)
      })
    })

    return Array.from(timeSlotMap.entries())
      .map(([hour, stats]) => ({
        hour,
        count: stats.count,
        revenue: stats.revenue
      }))
      .sort((a, b) => a.hour - b.hour)
  }

  async getTopCustomers(startDate: string, endDate: string, limit: number = 10): Promise<CustomerData[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        user_id,
        total_amount,
        date,
        users!reservations_user_id_fkey(
          name,
          email
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['approved', 'checked_in', 'completed'])

    if (error) {
      console.error('Error fetching customer data:', error)
      throw error
    }

    // 고객별로 그룹화
    const customerMap = new Map<string, CustomerData>()

    data?.forEach(reservation => {
      const userId = reservation.user_id
      const existing = customerMap.get(userId)

      if (existing) {
        existing.totalReservations += 1
        existing.totalRevenue += reservation.total_amount || 0
        if (reservation.date > existing.lastVisit) {
          existing.lastVisit = reservation.date
        }
      } else {
        customerMap.set(userId, {
          userId,
          userName: reservation.users?.name || '',
          userEmail: reservation.users?.email || '',
          totalReservations: 1,
          totalRevenue: reservation.total_amount || 0,
          lastVisit: reservation.date
        })
      }
    })

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
  }

  async getReservationStats(startDate: string, endDate: string): Promise<{
    total: number
    approved: number
    cancelled: number
    completed: number
    avgRevenue: number
  }> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('status, total_amount')
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) {
      console.error('Error fetching reservation stats:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      approved: 0,
      cancelled: 0,
      completed: 0,
      totalRevenue: 0
    }

    data?.forEach(reservation => {
      switch (reservation.status) {
        case 'approved':
        case 'checked_in':
          stats.approved++
          stats.totalRevenue += reservation.total_amount || 0
          break
        case 'cancelled':
        case 'rejected':
          stats.cancelled++
          break
        case 'completed':
          stats.completed++
          stats.totalRevenue += reservation.total_amount || 0
          break
      }
    })

    return {
      total: stats.total,
      approved: stats.approved,
      cancelled: stats.cancelled,
      completed: stats.completed,
      avgRevenue: stats.total > 0 ? stats.totalRevenue / (stats.approved + stats.completed) : 0
    }
  }
}