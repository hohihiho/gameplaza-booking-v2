import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { d1GetUserByEmail, d1ListUserRoles, d1ListUserRestrictions, d1CountReservationsOnDate, d1CountReservationsSinceDate, d1CountUsers, d1CountActiveDevices } from '@/lib/db/d1'

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

  // D1 사용자 정보 및 권한
  const userData = await d1GetUserByEmail(session.user.email)

  if (!userData) {
    return { 
      authorized: false, 
      error: '사용자 정보를 찾을 수 없습니다',
      status: 404 
    }
  }

  // 정지된 사용자 체크 (활성 제한 존재 여부)
  const restrictions = await d1ListUserRestrictions(userData.id)
  const isBlacklisted = Array.isArray(restrictions) && restrictions.some((r: any) => r.is_active === 1)
  if (isBlacklisted) {
    return { 
      authorized: false, 
      error: '정지된 계정입니다',
      status: 403 
    }
  }

  // 관리자 권한 체크 (super_admin 보유)
  const roles = await d1ListUserRoles(userData.id)
  const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
  
  if (!isAdmin) {
    return { 
      authorized: false, 
      error: '관리자 권한이 필요합니다',
      status: 403 
    }
  }

  return { authorized: true, user: userData, isSuperAdmin: isAdmin }
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

    // 관리자 대시보드 데이터 조회 (D1)
    const today = new Date().toISOString().split('T')[0]
    const todayCount = await d1CountReservationsOnDate(today)

    // 이번 주 예약 통계
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekCount = await d1CountReservationsSinceDate(weekStart.toISOString().split('T')[0])

    // 전체 사용자 수
    const userCount = await d1CountUsers()

    // 활성 기기 수
    const deviceCount = await d1CountActiveDevices()

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
