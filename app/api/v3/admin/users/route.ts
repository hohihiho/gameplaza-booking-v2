import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { d1GetUserByEmail, d1ListUserRoles, d1SearchUsersPaged, d1AddUserRestriction, d1DeactivateUserRestrictions, d1SetUserRole } from '@/lib/db/d1'

// GET /api/v3/admin/users - 사용자 목록 조회 (관리자 전용)
export async function GET(req: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다'
      }, { status: 401 })
    }
    
    // 관리자 권한 체크 (D1 user_roles: super_admin)
    const me = await d1GetUserByEmail(session.user.email)
    if (!me) {
      return NextResponse.json({ success: false, error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 })
    }
    const myRoles = await d1ListUserRoles(me.id)
    const isSuperAdmin = Array.isArray(myRoles) && myRoles.some((r: any) => r.role_type === 'super_admin')
    if (!isSuperAdmin) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다'
      }, { status: 403 })
    }
    
    // 사용자 목록 조회
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all' // all, active, blacklisted
    
    const { users, total } = await d1SearchUsersPaged({ page, pageSize, search, filter: filter as any })
    
    return NextResponse.json({
      success: true,
      users: users || [],
      total: total || 0,
      page,
      pageSize
    })
  } catch (error) {
    console.error('GET /api/v3/admin/users error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '사용자 목록 조회 실패'
    }, { status: 500 })
  }
}

// PATCH /api/v3/admin/users/:id - 사용자 정보 수정 (관리자 전용)
export async function PATCH(req: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다'
      }, { status: 401 })
    }
    
    const me = await d1GetUserByEmail(session.user.email)
    if (!me) {
      return NextResponse.json({ success: false, error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 })
    }
    const myRoles = await d1ListUserRoles(me.id)
    const isSuperAdmin = Array.isArray(myRoles) && myRoles.some((r: any) => r.role_type === 'super_admin')
    if (!isSuperAdmin) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다'
      }, { status: 403 })
    }
    
    // 요청 데이터 파싱
    const body = await req.json()
    const { userId, action, reason } = body
    
    if (!userId || !action) {
      return NextResponse.json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      }, { status: 400 })
    }
    
    // 액션 처리 (D1)
    if (action === 'blacklist') {
      await d1AddUserRestriction(userId, { restriction_type: 'restricted', reason })
    } else if (action === 'unblacklist') {
      await d1DeactivateUserRestrictions(userId)
    } else if (action === 'change_role') {
      if (!body.role) {
        return NextResponse.json({ success: false, error: 'role 값이 필요합니다' }, { status: 400 })
      }
      await d1SetUserRole(userId, String(body.role), me.id)
    } else {
      return NextResponse.json({ success: false, error: '유효하지 않은 액션입니다' }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: action === 'blacklist' ? '사용자가 정지되었습니다' : 
               action === 'unblacklist' ? '정지가 해제되었습니다' :
               '사용자 정보가 업데이트되었습니다'
    })
  } catch (error) {
    console.error('PATCH /api/v3/admin/users error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '사용자 정보 수정 실패'
    }, { status: 500 })
  }
}
