import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ScheduleService } from '@/lib/services/schedule.service'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 주말 밤샘영업 3주치 생성
    const result = await ScheduleService.generateWeekendOvernightSchedules()

    return NextResponse.json({
      success: true,
      message: `주말 밤샘영업 스케줄 생성 완료`,
      result: {
        created: result.created,
        skipped: result.skipped,
        total: result.created + result.skipped
      }
    })

  } catch (error: any) {
    console.error('주말 밤샘영업 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '주말 밤샘영업 생성 실패' },
      { status: 400 }
    )
  }
}

// 현재 상태 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 향후 3주간의 주말 밤샘영업 스케줄 조회
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 21) // 3주 후

    const { data: schedules, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('type', 'overnight')
      .eq('source_type', 'weekend_auto')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 금요일, 토요일별로 그룹화
    const groupedSchedules = {
      friday: schedules?.filter(s => new Date(s.date).getDay() === 5) || [],
      saturday: schedules?.filter(s => new Date(s.date).getDay() === 6) || [],
    }

    return NextResponse.json({
      schedules: groupedSchedules,
      total: schedules?.length || 0,
      dateRange: {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    })

  } catch (error: any) {
    console.error('스케줄 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '스케줄 조회 실패' },
      { status: 400 }
    )
  }
}