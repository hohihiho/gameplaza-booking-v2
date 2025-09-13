import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/db'

// 관리자 권한 체크 헬퍼 함수
async function checkAdminAuth(request: NextRequest) {
  // Better Auth 세션 체크
  const session = await auth()
  if (!session?.user?.email) {
    return { 
      authorized: false, 
      error: '로그인이 필요합니다',
      status: 401 
    }
  }

  // Supabase에서 사용자 정보 및 권한 조회
  const supabaseAdmin = createAdminClient()
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, email, role, is_blacklisted')
    .eq('email', session.user.email)
    .single()

  if (!userData) {
    return { 
      authorized: false, 
      error: '사용자 정보를 찾을 수 없습니다',
      status: 404 
    }
  }

  // 정지된 사용자 체크
  if (userData.is_blacklisted) {
    return { 
      authorized: false, 
      error: '정지된 계정입니다',
      status: 403 
    }
  }

  // 관리자 권한 체크 (role이 admin 또는 super_admin)
  const isAdmin = userData.role === 'admin' || userData.role === 'super_admin'
  
  if (!isAdmin) {
    return { 
      authorized: false, 
      error: '관리자 권한이 필요합니다',
      status: 403 
    }
  }

  return { 
    authorized: true, 
    user: userData,
    isSuperAdmin: userData.role === 'super_admin'
  }
}

// GET /api/v3/admin - 관리자 정보 조회
export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth(req)
    
    if (!authResult.authorized) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    // 관리자 대시보드 데이터 조회
    const supabaseAdmin = createAdminClient()
    
    // 오늘 예약 통계
    const today = new Date().toISOString().split('T')[0]
    const { data: todayReservations, count: todayCount } = await supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: false })
      .eq('date', today)

    // 이번 주 예약 통계
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const { data: weekReservations, count: weekCount } = await supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: false })
      .gte('date', weekStart.toISOString().split('T')[0])

    // 전체 사용자 수
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 활성 기기 수
    const { count: deviceCount } = await supabaseAdmin
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      admin: {
        id: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role,
        isSuperAdmin: authResult.isSuperAdmin
      },
      stats: {
        todayReservations: todayCount || 0,
        weekReservations: weekCount || 0,
        totalUsers: userCount || 0,
        activeDevices: deviceCount || 0
      }
    })
  } catch (error) {
    console.error('GET /api/v3/admin error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// 관리자 권한 체크 미들웨어 export (다른 관리자 API에서 사용)
export { checkAdminAuth }