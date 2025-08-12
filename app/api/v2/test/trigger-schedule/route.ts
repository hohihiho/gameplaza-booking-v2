import { NextRequest, NextResponse } from 'next/server'
import { ScheduleService } from '@/lib/services/schedule.service'

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()
    
    console.log('=== 수동으로 스케줄 생성 트리거 ===')
    console.log('예약 ID:', reservationId)
    
    // handleReservationApproved 호출
    await ScheduleService.handleReservationApproved(reservationId)
    
    return NextResponse.json({
      success: true,
      message: '스케줄 생성 프로세스가 실행되었습니다. 서버 로그를 확인하세요.'
    })
  } catch (error) {
    console.error('스케줄 생성 실패:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    )
  }
}