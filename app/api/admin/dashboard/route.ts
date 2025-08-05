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
    console.log('Dashboard API: Created Supabase client')
    
    // 단계별로 서비스 테스트 - 먼저 간단한 데이터베이스 조회부터
    console.log('Dashboard API: Testing basic queries')
    
    // 1. 기본 예약 수 조회
    const { data: reservationCount, error: resError } = await supabase
      .from('reservations')
      .select('id', { count: 'exact' })
    
    console.log('Reservation count query:', { count: reservationCount?.length, error: resError })
    
    // 2. 기본 기기 수 조회
    const { data: deviceCount, error: devError } = await supabase
      .from('devices')
      .select('id', { count: 'exact' })
    
    console.log('Device count query:', { count: deviceCount?.length, error: devError })
    
    // 3. 오늘 예약 조회 (간단한 버전)
    const today = new Date().toISOString().split('T')[0]
    const { data: todayReservations, error: todayError } = await supabase
      .from('reservations')
      .select('id, status, date')
      .eq('date', today)
    
    console.log('Today reservations query:', { count: todayReservations?.length, error: todayError, today })
    
    // 전체 예약 수도 확인
    const { data: allReservations, error: allError } = await supabase
      .from('reservations')
      .select('id, date, status')
      .limit(10)
    
    console.log('All reservations sample:', { count: allReservations?.length, error: allError, data: allReservations })
    
    // 4. 오늘 매출 조회 (완료된 예약만)
    const { data: todayRevenue, error: revenueError } = await supabase
      .from('reservations')
      .select('total_amount')
      .eq('date', today)
      .eq('status', 'completed')
    
    console.log('Today revenue query:', { 
      count: todayRevenue?.length, 
      error: revenueError,
      data: todayRevenue?.map(r => ({ total_amount: r.total_amount }))
    })
    
    // 5. 최근 예약 5건 조회
    const { data: recentReservations, error: recentError } = await supabase
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
      .limit(5)
    
    console.log('Recent reservations query:', { count: recentReservations?.length, error: recentError })
    
    // 6. 전체 대기승인 예약 조회 (날짜 상관없이)
    const { data: allPendingReservations, error: pendingError } = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'pending')
    
    console.log('All pending reservations query:', { count: allPendingReservations?.length, error: pendingError })

    // 7. 체크인 대기중인 예약 조회 (승인됐지만 아직 체크인 안한 예약)
    // 오늘 날짜의 예약 중 현재 시간 기준으로 체크인 가능한 예약만 조회
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
    
    const { data: waitingCheckIn, error: waitingError } = await supabase
      .from('reservations')
      .select('id, date, start_time')
      .eq('status', 'approved')
      .eq('date', today) // 오늘 날짜만
      .lte('start_time', currentTime) // 현재 시간 이전에 시작하는 예약만
    
    console.log('Waiting check-in query:', { 
      count: waitingCheckIn?.length, 
      error: waitingError,
      today,
      currentTime
    })

    // 8. 결제 대기중인 예약 조회 (체크인했지만 결제 안된 예약)
    const { data: pendingPaymentReservations, error: paymentError } = await supabase
      .from('reservations')
      .select('id')
      .eq('status', 'checked_in')
      .eq('payment_status', 'pending')
    
    console.log('Pending payment reservations query:', { count: pendingPaymentReservations?.length, error: paymentError })

    // 기본 통계 계산
    const totalReservations = todayReservations?.length || 0
    const pendingReservations = allPendingReservations?.length || 0 // 전체 대기승인 개수
    const usingCount = todayReservations?.filter(r => r.status === 'checked_in').length || 0
    const todayRevenueAmount = todayRevenue?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const waitingCheckInCount = waitingCheckIn?.length || 0
    const pendingPaymentCount = pendingPaymentReservations?.length || 0
    
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
        createdAtText =
 `${diffHours}시간 전`
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
    
    return NextResponse.json({
      stats: {
        revenue: {
          value: todayRevenueAmount,
          trend: 0
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
          trend: 0
        },
        currentlyUsing: {
          using: usingCount,
          waiting: waitingCheckInCount // 체크인 대기중인 예약 수
        },
        devices: {
          available: deviceCount?.length || 0,
          total: deviceCount?.length || 0,
          maintenance: 0
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