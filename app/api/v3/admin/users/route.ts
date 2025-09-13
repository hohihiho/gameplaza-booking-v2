import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/db'

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
    
    // 관리자 권한 체크
    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()
    
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다'
      }, { status: 404 })
    }
    
    // 관리자 여부 확인
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single()
    
    if (!adminData?.is_super_admin) {
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
    
    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
    
    // 검색어 필터
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,nickname.ilike.%${search}%`)
    }
    
    // 상태 필터
    if (filter === 'blacklisted') {
      query = query.eq('is_blacklisted', true)
    } else if (filter === 'active') {
      query = query.eq('is_blacklisted', false)
    }
    
    // 페이지네이션
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    query = query.range(start, end)
    
    const { data: users, error, count } = await query
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      users: users || [],
      total: count || 0,
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
    
    // 관리자 권한 체크
    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()
    
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다'
      }, { status: 404 })
    }
    
    // 관리자 여부 확인
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single()
    
    if (!adminData?.is_super_admin) {
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
    
    let updateData: any = {}
    
    // 액션에 따른 업데이트
    switch (action) {
      case 'blacklist':
        updateData = { 
          is_blacklisted: true,
          blacklist_reason: reason || '관리자에 의한 정지',
          blacklisted_at: new Date().toISOString()
        }
        break
      case 'unblacklist':
        updateData = { 
          is_blacklisted: false,
          blacklist_reason: null,
          blacklisted_at: null
        }
        break
      case 'change_role':
        updateData = { role: body.role }
        break
      default:
        return NextResponse.json({
          success: false,
          error: '유효하지 않은 액션입니다'
        }, { status: 400 })
    }
    
    // 사용자 정보 업데이트
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
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