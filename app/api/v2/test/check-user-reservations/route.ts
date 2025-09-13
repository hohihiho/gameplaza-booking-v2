import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

// 사용자의 예약 현황 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username') || 'ndz5496'
    
    // 1. 사용자 ID 직접 사용 또는 email로 검색
    let userId = username;
    let userInfo;
    
    // UUID 형식이 아니면 email로 검색
    if (!username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role, phone')
        .eq('email', username)
        .single();
        
      if (userError || !user) {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
      }
      
      userId = user.id;
      userInfo = user;
    } else {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role, phone')
        .eq('id', userId)
        .single();
        
      if (userError || !user) {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
      }
      
      userInfo = user;
    }
    
    console.log('사용자 정보:', userInfo)
    
    // 2. 활성 예약 조회 (pending, approved, checked_in)
    const { data: activeReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved', 'checked_in'])
      .order('date', { ascending: true })
    
    if (reservationError) {
      return NextResponse.json({ error: reservationError.message }, { status: 400 })
    }
    
    // 3. 미래 예약만 필터링
    const today = new Date().toISOString().split('T')[0]!
    const futureReservations = activeReservations?.filter(r => r.date >= today) || []
    
    return NextResponse.json({ 
      user: {
        id: userInfo.id,
        email: userInfo.email,
        phone: userInfo.phone,
        role: userInfo.role
      },
      activeReservations: activeReservations || [],
      futureReservations,
      counts: {
        total_active: activeReservations?.length || 0,
        future_active: futureReservations.length,
        limit: 3
      },
      canMakeReservation: futureReservations.length < 3,
      message: futureReservations.length >= 3 
        ? '동시에 예약 가능한 최대 개수(3개)를 초과했습니다'
        : `추가 예약 가능 (현재 ${futureReservations.length}/3)`
    })
    
  } catch (error: any) {
    console.error('예약 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '예약 조회 실패' },
      { status: 400 }
    )
  }
}