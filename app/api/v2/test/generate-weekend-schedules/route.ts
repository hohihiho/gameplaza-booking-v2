import { NextRequest, NextResponse } from 'next/server'
import { ScheduleService } from '@/lib/services/schedule.service'

// 테스트용 엔드포인트 - 주말 밤샘영업 생성
export async function POST(request: NextRequest) {
  try {
    const result = await ScheduleService.generateWeekendOvernightSchedules()
    
    return NextResponse.json({ 
      success: true,
      message: '주말 밤샘영업 3주치 생성 완료',
      result
    })
    
  } catch (error: any) {
    console.error('주말 밤샘영업 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '주말 밤샘영업 생성 실패' },
      { status: 400 }
    )
  }
}