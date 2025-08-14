import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AnalyticsService } from '@/lib/services/analytics.service'
import { ReservationRepository } from '@/lib/repositories/reservation.repository'
import { DeviceRepository } from '@/lib/repositories/device.repository'

export const GET = withAuth(
  async (_req, { user: _user }) => {
    try {
    console.log('Dashboard API: Starting request')
    const supabase = createAdminClient()
    
    // 오늘 영업일 날짜 (KST 기준, 06시 이전은 전날 영업일)
    const kstOffset = 9 * 60 * 60 * 1000 // 9시간을 밀리초로
    const now = new Date()
    const kstNow = new Date(now.getTime() + kstOffset)
    
    // 현재 시간이 06시 이전이면 전날을 영업일로 간주
    const currentHour = kstNow.getHours()
    const businessDay = new Date(kstNow)
    if (currentHour < 6) {
      businessDay.setDate(businessDay.getDate() - 1)
    }
    const todayStr = businessDay.toISOString().split('T')[0]

    // 어제 영업일
    const yesterday = new Date(businessDay)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    console.log('Business day calculation:', { 
      kstNow: kstNow.toISOString(), 
      currentHour, 
      todayStr, 
      yesterdayStr 
    })

    // 1. 오늘 영업일 예약 조회 (조기/밤샘 시스템 적용)
    // 당일 07시 이후 + 다음날 00~05시 밤샘 예약 포함
    const todayBusinessDate = new Date(businessDay)
    const tomorrowStr = new Date(todayBusinessDate.getTime() + 24*60*60*1000).toISOString().split('T')[0]
    
    const { data: todayDayReservations } = await supabase
      .from('reservations')
      .select('id, status, date, total_amount, start_time')
      .eq('date', todayStr)
      .gte('start_time', '07:00:00')
    
    const { data: todayNightReservations } = await supabase
      .from('reservations')
      .select('id, status, date, total_amount, start_time')
      .eq('date', tomorrowStr)
      .lte('start_time', '05:59:59')
    
    // 오늘 영업일 전체 예약 = 당일 07시이후 + 다음날 00~05시
    const todayReservations = [...(todayDayReservations || []), ...(todayNightReservations || [])]
    
    // 2. 어제 영업일 예약 조회 (트렌드 계산용, 테스트 데이터 제외)
    // 어제 07시 이후 + 오늘 00~05시 밤샘 예약 포함
    const { data: yesterdayDayReservations } = await supabase
      .from('reservations')
      .select('id, status, total_amount, reservation_number, start_time')
      .eq('date', yesterdayStr)
      .gte('start_time', '07:00:00')
    
    const { data: yesterdayNightReservations } = await supabase
      .from('reservations')
      .select('id, status, total_amount, reservation_number, start_time')
      .eq('date', todayStr)
      .lte('start_time', '05:59:59')
    
    // 어제 영업일 전체 예약 = 어제 07시이후 + 오늘 00~05시
    const yesterdayReservations = [...(yesterdayDayReservations || []), ...(yesterdayNightReservations || [])]
    
    // 3. 전체 대기승인 예약 조회 (테스트 데이터 제외)
    const { data: allPendingReservations, error: pendingError } = await supabase
      .from('reservations')
      .select('id, reservation_number')
      .eq('status', 'pending')
    
    // 4. 체크인 대기중인 예약 조회 (승인됐지만 아직 체크인 안한 예약)
    const currentTime = `${String(kstNow.getHours()).padStart(2, '0')}:${String(kstNow.getMinutes()).padStart(2, '0')}:00`
    
    const { data: waitingCheckIn, error: waitingError } = await supabase
      .from('reservations')
      .select('id, date, start_time, reservation_number')
      .eq('status', 'approved')
      .eq('date', todayStr)
      .lte('start_time', currentTime)
    
    // 5. 결제 대기중인 예약 조회 (테스트 데이터 제외)
    const { data: pendingPaymentReservations, error: paymentError } = await supabase
      .from('reservations')
      .select('id, reservation_number')
      .eq('status', 'checked_in')
      .eq('payment_status', 'pending')
    
    // 6. 기기 현황 조회
    const { data: totalDevices, count: totalDeviceCount } = await supabase
      .from('devices')
      .select('id, status', { count: 'exact' })
    
    const availableDevices = totalDevices?.filter(d => d.status === 'available')?.length || 0
    const maintenanceDevices = totalDevices?.filter(d => d.status === 'maintenance')?.length || 0
    
    // 7. 최근 예약 5건 조회 (테스트 데이터 제외)
    const { data: recentReservations, error: recentError } = await supabase
      .from('reservations')
      .select(`
        id,
        status,
        date,
        start_time,
        end_time,
        created_at,
        reservation_number,
        users!inner(name, nickname),
        devices!inner(
          device_number,
          device_types!inner(
            name,
            model_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 통계 계산
    const totalReservations = todayReservations?.length || 0
    const pendingReservations = allPendingReservations?.length || 0
    const usingCount = todayReservations?.filter(r => r.status === 'checked_in').length || 0
    const todayRevenueAmount = todayReservations
      ?.filter(r => r.status === 'completed')
      ?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const waitingCheckInCount = waitingCheckIn?.length || 0
    const pendingPaymentCount = pendingPaymentReservations?.length || 0
    
    // 트렌드 계산
    const yesterdayCount = yesterdayReservations?.length || 0
    const reservationTrend = yesterdayCount > 0
      ? Math.round((totalReservations - yesterdayCount) / yesterdayCount * 100)
      : totalReservations > 0 ? 100 : 0
      
    const yesterdayRevenue = yesterdayReservations
      ?.filter(r => r.status === 'completed')
      ?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const revenueTrend = yesterdayRevenue > 0
      ? Math.round((todayRevenueAmount - yesterdayRevenue) / yesterdayRevenue * 100)
      : todayRevenueAmount > 0 ? 100 : 0
    
    // 최근 예약 데이터 형식화
    const formattedRecentReservations = recentReservations?.map(r => {
      const device = r.devices
      const deviceType = (device as any)?.device_types
      const user = (r as any).users
      
      // created_at 시간 차이 계산
      const createdAt = new Date(r.created_at)
      const now = new Date()
      const diffMs = now.getTime() - createdAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      
      let createdAtText = ''
      if (diffMins < 60) {
        createdAtText = `${diffMins}분 전`
      } else if (diffHours < 24) {
        createdAtText = `${diffHours}시간 전`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        createdAtText = `${diffDays}일 전`
      }

      // 기기명 조합
      const deviceName = deviceType?.model_name 
        ? `${deviceType.name} ${deviceType.model_name}` 
        : deviceType?.name || '알 수 없음'

      return {
        id: r.id,
        user_name: (user as any)?.nickname || (user as any)?.name || '알 수 없음',
        device_name: deviceName,
        date: r.date,
        time: `${r.start_time.slice(0, 5)}-${r.end_time.slice(0, 5)}`,
        status: r.status,
        created_at: createdAtText
      }
    }) || []
    
    console.log('Dashboard statistics:', {
      todayStr,
      totalReservations,
      pendingReservations,
      usingCount,
      todayRevenueAmount,
      waitingCheckInCount,
      pendingPaymentCount,
      reservationTrend,
      revenueTrend,
      totalDeviceCount,
      availableDevices,
      maintenanceDevices
    })
    
    return NextResponse.json({
      stats: {
        revenue: {
          value: todayRevenueAmount,
          trend: revenueTrend
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
          trend: reservationTrend
        },
        currentlyUsing: {
          using: usingCount,
          waiting: waitingCheckInCount
        },
        devices: {
          available: availableDevices,
          total: totalDeviceCount || 0,
          maintenance: maintenanceDevices
        }
      },
      recentReservations: formattedRecentReservations,
      pendingPayments: pendingPaymentCount
    })
    
    /*
    const analyticsService = new AnalyticsService(supabase)
    console.log('Dashboard API: Created analytics service')
    
    const reservationRepo = new ReservationRepository(supabase)
    console.log('Dashboard API: Created reservation repository')
    
    const deviceRepo = new DeviceRepository(supabase)
    console.log('Dashboard API: Created device repository')

    // 오늘 영업일 날짜 (KST 기준, 06시 이전은 전날 영업일)
    const kstOffset = 9 * 60 * 60 * 1000 // 9시간을 밀리초로
    const now = new Date()
    const kstNow = new Date(now.getTime() + kstOffset)
    
    // 현재 시간이 06시 이전이면 전날을 영업일로 간주
    const currentHour = kstNow.getHours()
    const businessDay = new Date(kstNow)
    if (currentHour < 6) {
      businessDay.setDate(businessDay.getDate() - 1)
    }
    const todayStr = businessDay.toISOString().split('T')[0]

    // 어제 영업일
    const yesterday = new Date(businessDay)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // 1. 매출 데이터
    const todayRevenue = await analyticsService.getRevenueAnalytics({
      startDate: todayStr!,
      endDate: todayStr!
    })

    const yesterdayRevenue = await analyticsService.getRevenueAnalytics({
      startDate: yesterdayStr!,
      endDate: yesterdayStr!
    })

    const revenue = todayRevenue.summary.totalRevenue
    const yesterdayTotal = yesterdayRevenue.summary.totalRevenue
    const revenueTrend = yesterdayTotal > 0 
      ? Math.round((revenue - yesterdayTotal) / yesterdayTotal * 100)
      : 0

    // 2. 예약 현황
    const todayReservations = await reservationRepo.findByDateAndDevice(
      todayStr!,
      '', // 모든 기기
      ['pending', 'approved', 'checked_in', 'completed', 'cancelled', 'rejected']
    )

    const allPendingReservations = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'pending')

    const totalReservations = todayReservations.length
    const pendingReservations = allPendingReservations.data?.length || 0

    const yesterdayReservations = await reservationRepo.findByDateAndDevice(
      yesterdayStr!,
      '', // 모든 기기
      ['pending', 'approved', 'checked_in', 'completed', 'cancelled', 'rejected']
    )

    const yesterdayCount = yesterdayReservations.length
    const reservationTrend = yesterdayCount > 0
      ? Math.round((totalReservations - yesterdayCount) / yesterdayCount * 100)
      : 0

    // 3. 현재 이용 현황
    const currentlyUsing = todayReservations.filter(r => r.status === 'checked_in')
    const usingCount = currentlyUsing.length

    // 체크인 대기중 계산
    // const currentMinute = kstNow.getMinutes() // 현재 사용하지 않음
    const thirtyMinutesBefore = new Date(kstNow)
    thirtyMinutesBefore.setMinutes(thirtyMinutesBefore.getMinutes() - 30)
    const beforeHour = thirtyMinutesBefore.getHours()
    const beforeMinute = thirtyMinutesBefore.getMinutes()
    
    const thirtyMinutesBeforeTime = `${String(beforeHour).padStart(2, '0')}:${String(beforeMinute).padStart(2, '0')}`

    const waitingCheckin = todayReservations.filter(r => 
      r.status === 'approved' && r.start_time >= thirtyMinutesBeforeTime + ':00'
    )
    const waitingCount = waitingCheckin.length

    // 4. 기기 현황
    const deviceStats = await deviceRepo.getDeviceStats()

    // 5. 최근 예약 목록
    const { data: recentReservations } = await supabase
      .from('reservations')
      .select(`
        id,
        status,
        date,
        start_time,
        end_time,
        created_at,
        users!inner(name, nickname),
        devices!inner(
          device_number,
          device_types!inner(
            name,
            model_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // 6. 결제 대기 현황
    const { data: pendingPayments } = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'checked_in')
      .eq('payment_status', 'pending')

    const pendingPaymentCount = pendingPayments?.length || 0

    // 데이터 형식 변환
    const formattedRecentReservations = recentReservations?.map(r => {
      const device = r.devices
      const deviceType = (device as any)?.device_types
      const user = (r as any).users
      
      // created_at 시간 차이 계산
      const createdAt = new Date(r.created_at)
      const now = new Date()
      const diffMs = now.getTime() - createdAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      
      let createdAtText = ''
      if (diffMins < 60) {
        createdAtText = `${diffMins}분 전`
      } else if (diffHours < 24) {
        createdAtText = `${diffHours}시간 전`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        createdAtText = `${diffDays}일 전`
      }

      // 기기명 조합
      const deviceName = deviceType?.model_name 
        ? `${deviceType.name} ${deviceType.model_name}` 
        : deviceType?.name || '알 수 없음'

      return {
        id: r.id,
        user_name: (user as any)?.nickname || (user as any)?.name || '알 수 없음',
        device_name: deviceName,
        date: r.date,
        time: `${r.start_time.slice(0, 5)}-${r.end_time.slice(0, 5)}`,
        status: r.status,
        created_at: createdAtText
      }
    }) || []
    */

    /* 원래 코드 주석 처리됨
    return NextResponse.json({
      stats: {
        revenue: {
          value: revenue,
          trend: revenueTrend
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
          trend: reservationTrend
        },
        currentlyUsing: {
          using: usingCount,
          waiting: waitingCount
        },
        devices: {
          available: deviceStats.available,
          total: deviceStats.total,
          maintenance: deviceStats.maintenance
        }
      },
      recentReservations: formattedRecentReservations,
      pendingPayments: pendingPaymentCount
    })
    */

  } catch (error) {
    console.error('Dashboard API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : error)
      return NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  },
  { requireAdmin: true }
)