import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// no_show 상태의 예약 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // no_show 상태의 예약 조회
    const { data: noShowReservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        users:user_id (
          id,
          name,
          phone,
          email
        ),
        devices:device_id (
          id,
          device_number,
          device_types (
            name
          )
        )
      `)
      .eq('status', 'no_show')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // 전체 예약 중 no_show 카운트
    const { count: noShowCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'no_show')
    
    // 모든 상태별 카운트
    const { data: statusCounts } = await supabase
      .from('reservations')
      .select('status')
    
    const statusSummary = statusCounts?.reduce((acc: any, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    }, {})
    
    return NextResponse.json({ 
      noShowReservations: noShowReservations || [],
      noShowCount: noShowCount || 0,
      statusSummary: statusSummary || {},
      message: `총 ${noShowCount || 0}개의 노쇼 예약이 있습니다.`
    })
    
  } catch (error: any) {
    console.error('노쇼 예약 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '노쇼 예약 조회 실패' },
      { status: 400 }
    )
  }
}