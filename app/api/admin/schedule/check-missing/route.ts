import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ScheduleService } from '@/lib/services/schedule.service'
import { getCurrentUser } from '@/lib/auth'

/**
 * 누락된 조기영업 일정 검사 및 자동 생성
 * GET /api/admin/schedule/check-missing - 누락된 일정 조회
 * POST /api/admin/schedule/check-missing - 누락된 일정 자동 생성
 */

export async function GET(_request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // 날짜 범위 설정 (오늘부터 7일)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)
    
    // 조기대여 예약 중 승인된 것 조회
    const { data: earlyReservations, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        date,
        start_time,
        end_time,
        status,
        devices (
          device_number,
          device_types (
            name
          )
        )
      `)
      .eq('status', 'approved')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .gte('start_time', '07:00')
      .lte('start_time', '14:00')
      .order('date', { ascending: true })
    
    if (reservationError) {
      throw new Error(`예약 조회 실패: ${reservationError.message}`)
    }
    
    // 해당 날짜들의 schedule_events 조회
    const dates = [...new Set(earlyReservations?.map(r => r.date) || [])]
    
    const { data: existingSchedules, error: scheduleError } = await supabase
      .from('schedule_events')
      .select('date, type, source_reference')
      .in('date', dates)
      .eq('type', 'early_open')
    
    if (scheduleError) {
      throw new Error(`일정 조회 실패: ${scheduleError.message}`)
    }
    
    // 누락된 일정 찾기
    const missingSchedules = []
    const scheduleDateMap = new Map()
    
    existingSchedules?.forEach(schedule => {
      scheduleDateMap.set(schedule.date, schedule)
    })
    
    const dateReservationMap = new Map()
    earlyReservations?.forEach(reservation => {
      if (!dateReservationMap.has(reservation.date)) {
        dateReservationMap.set(reservation.date, [])
      }
      dateReservationMap.get(reservation.date).push(reservation)
    })
    
    for (const [date, reservations] of dateReservationMap) {
      if (!scheduleDateMap.has(date)) {
        missingSchedules.push({
          date,
          reservations: reservations.map((r: any) => ({
            id: r.id,
            number: r.reservation_number,
            time: `${r.start_time.slice(0, 5)} - ${r.end_time.slice(0, 5)}`,
            device: r.devices?.device_types?.name + ' ' + r.devices?.device_number + '번'
          })),
          reason: '조기영업 일정 없음'
        })
      }
    }
    
    return NextResponse.json({
      summary: {
        totalEarlyReservations: earlyReservations?.length || 0,
        existingSchedules: existingSchedules?.length || 0,
        missingSchedules: missingSchedules.length
      },
      missing: missingSchedules,
      message: missingSchedules.length > 0 
        ? `${missingSchedules.length}개의 누락된 조기영업 일정이 발견되었습니다.`
        : '누락된 조기영업 일정이 없습니다.'
    })
    
  } catch (error) {
    console.error('누락 일정 검사 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 검사 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await _request.json()
    const { autoFix = true } = body // 자동 수정 여부
    
    if (!autoFix) {
      return NextResponse.json({
        message: '수동 모드입니다. GET 요청으로 누락된 일정을 확인하세요.'
      })
    }
    
    // GET과 동일한 로직으로 누락 일정 찾기
    const getResponse = await GET(_request)
    const getResult = await getResponse.json()
    
    if (getResult.missing?.length === 0) {
      return NextResponse.json({
        message: '누락된 일정이 없습니다.',
        summary: getResult.summary
      })
    }
    
    // 누락된 일정 자동 생성
    const createdSchedules = []
    const failedSchedules = []
    
    for (const missing of getResult.missing) {
      try {
        // 각 날짜의 첫 번째 예약을 기준으로 일정 생성
        const firstReservation = missing.reservations[0]
        console.log(`${missing.date} 조기영업 일정 자동 생성 시도 - 예약 ID: ${firstReservation.id}`)
        
        await ScheduleService.handleReservationApproved(firstReservation.id)
        
        createdSchedules.push({
          date: missing.date,
          reservationId: firstReservation.id,
          reservationNumber: firstReservation.number
        })
      } catch (error) {
        console.error(`${missing.date} 일정 생성 실패:`, error)
        failedSchedules.push({
          date: missing.date,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }
    
    return NextResponse.json({
      success: createdSchedules.length > 0,
      summary: {
        attempted: getResult.missing.length,
        created: createdSchedules.length,
        failed: failedSchedules.length
      },
      created: createdSchedules,
      failed: failedSchedules,
      message: `${createdSchedules.length}개의 조기영업 일정이 생성되었습니다.`
    })
    
  } catch (error) {
    console.error('일정 자동 생성 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}