import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

// 테스트용 엔드포인트 - 조기예약 승인 테스트
export async function POST(_request: NextRequest) {
  try {
    import { getDB, supabase } from '@/lib/db';
    
    // 1. 먼저 테스트용 조기예약 생성
    const testDate = '2025-08-21' // 목요일 - 새로운 날짜로 테스트
    const { data: reservation, error: createError } = await supabase
      .from('reservations')
      .insert({
        user_id: '4110ea35-228a-48a4-9db7-97c04627bb7c',
        device_id: '8d8bf85c-43a0-4b2b-a60a-8c5243178eb9',
        date: testDate,
        start_time: '07:00:00',
        end_time: '09:00:00',
        status: 'pending',
        player_count: 1,
        hourly_rate: 30000,
        total_amount: 60000,
        credit_type: 'freeplay',
        payment_method: 'cash',
        payment_status: 'pending',
        reservation_number: `TEST-EARLY-${Date.now()}`
      })
      .select()
      .single()
    
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }
    
    console.log('테스트 조기예약 생성됨:', reservation)
    
    // 2. 예약 승인 (이때 자동으로 조기영업 스케줄이 생성되어야 함)
    const { data: approved, error: approveError } = await supabase
      .from('reservations')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation.id)
      .select()
      .single()
    
    if (approveError) {
      return NextResponse.json({ error: approveError.message }, { status: 400 })
    }
    
    // 3. ScheduleService 직접 호출
    const { ScheduleService } = await import('@/lib/services/schedule.service')
    await ScheduleService.handleReservationApproved(reservation.id)
    
    // 4. 생성된 스케줄 확인
    const { data: schedules } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('date', testDate)
      .eq('type', 'early_open')
    
    return NextResponse.json({ 
      success: true,
      reservation: approved,
      schedules: schedules || [],
      message: `조기예약 승인 완료. 스케줄 ${schedules?.length || 0}개 발견`
    })
    
  } catch (error: any) {
    console.error('조기예약 승인 테스트 오류:', error)
    return NextResponse.json(
      { error: error.message || '조기예약 승인 테스트 실패' },
      { status: 400 }
    )
  }
}