import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// 테스트용 엔드포인트 - 스케줄 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // 해당 날짜의 스케줄 조회
    const { data: schedules, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('date', date)
      .order('start_time')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ 
      date,
      schedules: schedules || [],
      count: schedules?.length || 0
    })
    
  } catch (error: any) {
    console.error('스케줄 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '스케줄 조회 실패' },
      { status: 400 }
    )
  }
}