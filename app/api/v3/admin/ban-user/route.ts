import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/db'

// 스키마 정의
const BanUserSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  action: z.enum(['ban', 'restrict', 'unban']), // ban: 영구정지, restrict: 제한(임시정지)
  reason: z.string().optional(),
  restrictUntil: z.string().optional() // 제한 해제 날짜 (ISO 8601 format)
})

// 관리자 권한 체크
async function checkAdminAuth() {
  const session = await auth()
  if (!session?.user?.email) {
    return { authorized: false, error: '로그인이 필요합니다', status: 401 }
  }

  const supabaseAdmin = createAdminClient()
  const { data: adminData } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  if (!adminData || (adminData.role !== 'admin' && adminData.role !== 'super_admin')) {
    return { authorized: false, error: '관리자 권한이 필요합니다', status: 403 }
  }

  return { authorized: true, adminId: adminData.id, isSuperAdmin: adminData.role === 'super_admin' }
}

// 제한 상태 체크 및 자동 해제
async function checkAndUpdateRestriction(userId: string, email: string) {
  const supabaseAdmin = createAdminClient()
  
  // 사용자 정보 조회
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('is_blacklisted, is_restricted, restricted_until')
    .eq('id', userId)
    .single()

  if (!userData) return null

  // 제한 기간이 지났는지 체크
  if (userData.is_restricted && userData.restricted_until) {
    const restrictedUntil = new Date(userData.restricted_until)
    const now = new Date()
    
    if (now > restrictedUntil) {
      // 제한 기간이 지났으므로 자동 해제
      await supabaseAdmin
        .from('users')
        .update({ 
          is_restricted: false,
          restricted_until: null,
          restriction_reason: null
        })
        .eq('id', userId)

      // 블랙리스트 이메일에서도 비활성화
      await supabaseAdmin
        .from('blacklist_emails')
        .update({ is_active: false })
        .eq('email', email)
        .eq('ban_type', 'restrict')

      return { ...userData, is_restricted: false }
    }
  }

  return userData
}

// POST /api/v3/admin/ban-user - 유저 정지/제한/해제
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 체크
    const authResult = await checkAdminAuth()
    if (!authResult.authorized) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const body = await req.json()
    const validated = BanUserSchema.parse(body)
    
    const supabaseAdmin = createAdminClient()
    
    // 유저 정보 조회 (userId 또는 email로)
    let userData
    if (validated.userId) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_blacklisted, is_restricted')
        .eq('id', validated.userId)
        .single()
      userData = data
    } else if (validated.email) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_blacklisted, is_restricted')
        .eq('email', validated.email)
        .single()
      userData = data
    } else {
      return NextResponse.json({
        success: false,
        error: 'userId 또는 email이 필요합니다'
      }, { status: 400 })
    }

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // 관리자는 정지/제한할 수 없음
    if (userData.role === 'admin' || userData.role === 'super_admin') {
      return NextResponse.json({
        success: false,
        error: '관리자 계정은 정지하거나 제한할 수 없습니다'
      }, { status: 403 })
    }

    if (validated.action === 'ban') {
      // 영구 정지 처리
      // 1. users 테이블 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_blacklisted: true,
          is_restricted: false, // 제한 해제 (정지가 우선)
          blacklisted_at: new Date().toISOString(),
          blacklist_reason: validated.reason || '관리자에 의한 영구 정지',
          restricted_until: null,
          restriction_reason: null
        })
        .eq('id', userData.id)

      if (updateError) throw updateError

      // 2. 블랙리스트 이메일 기록 (재가입 방지)
      await supabaseAdmin
        .from('blacklist_emails')
        .upsert({
          email: userData.email,
          ban_type: 'permanent',
          reason: validated.reason || '관리자에 의한 영구 정지',
          banned_at: new Date().toISOString(),
          banned_by: authResult.adminId,
          is_active: true,
          expires_at: null // 영구 정지는 만료 없음
        })

      // 3. 활성 세션 종료
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('userId', userData.id)

      return NextResponse.json({
        success: true,
        message: '사용자가 영구 정지되었습니다',
        user: {
          id: userData.id,
          email: userData.email,
          blacklisted: true,
          restricted: false
        }
      })
      
    } else if (validated.action === 'restrict') {
      // 제한 (임시 정지) 처리
      if (!validated.restrictUntil) {
        return NextResponse.json({
          success: false,
          error: '제한 해제 날짜를 지정해주세요'
        }, { status: 400 })
      }

      const restrictUntil = new Date(validated.restrictUntil)
      if (restrictUntil <= new Date()) {
        return NextResponse.json({
          success: false,
          error: '제한 해제 날짜는 현재보다 미래여야 합니다'
        }, { status: 400 })
      }

      // 1. users 테이블 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_restricted: true,
          is_blacklisted: false, // 영구 정지 해제 (제한으로 변경)
          restricted_until: restrictUntil.toISOString(),
          restriction_reason: validated.reason || '관리자에 의한 임시 제한',
          blacklisted_at: null,
          blacklist_reason: null
        })
        .eq('id', userData.id)

      if (updateError) throw updateError

      // 2. 블랙리스트 이메일 기록 (제한 기간 동안 재가입 방지)
      await supabaseAdmin
        .from('blacklist_emails')
        .upsert({
          email: userData.email,
          ban_type: 'restrict',
          reason: validated.reason || '관리자에 의한 임시 제한',
          banned_at: new Date().toISOString(),
          banned_by: authResult.adminId,
          is_active: true,
          expires_at: restrictUntil.toISOString()
        })

      // 3. 활성 세션 종료
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('userId', userData.id)

      // 제한 기간 계산
      const days = Math.ceil((restrictUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      return NextResponse.json({
        success: true,
        message: `사용자가 ${days}일 동안 제한되었습니다`,
        user: {
          id: userData.id,
          email: userData.email,
          restricted: true,
          restrictedUntil: restrictUntil.toISOString(),
          blacklisted: false
        }
      })
      
    } else {
      // 정지/제한 해제
      // 1. users 테이블 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_blacklisted: false,
          is_restricted: false,
          blacklisted_at: null,
          blacklist_reason: null,
          restricted_until: null,
          restriction_reason: null
        })
        .eq('id', userData.id)

      if (updateError) throw updateError

      // 2. 블랙리스트 이메일 비활성화
      await supabaseAdmin
        .from('blacklist_emails')
        .update({ is_active: false })
        .eq('email', userData.email)

      return NextResponse.json({
        success: true,
        message: '사용자 정지/제한이 해제되었습니다',
        user: {
          id: userData.id,
          email: userData.email,
          blacklisted: false,
          restricted: false
        }
      })
    }
  } catch (error) {
    console.error('POST /api/v3/admin/ban-user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// GET /api/v3/admin/ban-user - 정지/제한된 사용자 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 체크
    const authResult = await checkAdminAuth()
    if (!authResult.authorized) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const supabaseAdmin = createAdminClient()
    
    // 정지된 사용자 목록 조회
    const { data: bannedUsers, error: bannedError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_blacklisted, blacklisted_at, blacklist_reason, created_at')
      .eq('is_blacklisted', true)
      .order('blacklisted_at', { ascending: false })

    if (bannedError) throw bannedError

    // 제한된 사용자 목록 조회
    const { data: restrictedUsers, error: restrictedError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_restricted, restricted_until, restriction_reason, created_at')
      .eq('is_restricted', true)
      .order('restricted_until', { ascending: true }) // 해제 날짜가 가까운 순

    if (restrictedError) throw restrictedError

    // 제한 기간이 지난 사용자 자동 해제
    const now = new Date()
    const autoUnbanned = []
    
    for (const user of restrictedUsers || []) {
      if (user.restricted_until && new Date(user.restricted_until) <= now) {
        // 자동 해제
        await checkAndUpdateRestriction(user.id, user.email)
        autoUnbanned.push(user.email)
      }
    }

    // 블랙리스트 이메일 목록 조회 (재가입 방지용)
    const { data: blacklistEmails } = await supabaseAdmin
      .from('blacklist_emails')
      .select('email, ban_type, reason, banned_at, expires_at')
      .eq('is_active', true)
      .order('banned_at', { ascending: false })

    // 업데이트된 제한 사용자 목록 재조회
    const { data: updatedRestrictedUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_restricted, restricted_until, restriction_reason, created_at')
      .eq('is_restricted', true)
      .order('restricted_until', { ascending: true })

    return NextResponse.json({
      success: true,
      bannedUsers: bannedUsers || [],
      restrictedUsers: updatedRestrictedUsers || [],
      blacklistEmails: blacklistEmails || [],
      totalBanned: bannedUsers?.length || 0,
      totalRestricted: updatedRestrictedUsers?.length || 0,
      autoUnbanned: autoUnbanned.length > 0 ? autoUnbanned : undefined
    })
  } catch (error) {
    console.error('GET /api/v3/admin/ban-user error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// 내보내기 (다른 API에서 사용)
export { checkAndUpdateRestriction }