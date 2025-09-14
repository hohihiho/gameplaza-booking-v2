import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { d1GetUserByEmail, d1GetUserById, d1ListUserRoles, d1AddUserRestriction, d1DeactivateUserRestrictions, d1SuspendUserForever, d1ListActiveRestrictionsByType, d1DeactivateExpiredRestrictionsForUser, d1UnbanAndUnrestrictUser } from '@/lib/db/d1'

// 스키마 정의
const BanUserSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  action: z.enum(['ban', 'restrict', 'unban']), // ban: 영구정지, restrict: 제한(임시정지)
  reason: z.string().optional(),
  restrictUntil: z.string().optional() // 제한 해제 날짜 (ISO 8601 format)
})

// 관리자 권한 체크 (super_admin)
async function checkAdminAuth() {
  const session = await auth()
  if (!session?.user?.email) {
    return { authorized: false, error: '로그인이 필요합니다', status: 401 }
  }
  const me = await d1GetUserByEmail(session.user.email)
  if (!me) return { authorized: false, error: '사용자 정보를 찾을 수 없습니다', status: 404 }
  const roles = await d1ListUserRoles(me.id)
  const isSuperAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
  if (!isSuperAdmin) return { authorized: false, error: '관리자 권한이 필요합니다', status: 403 }
  return { authorized: true, adminId: me.id, isSuperAdmin }
}

// 제한 상태 체크 및 자동 해제 (만료된 제한 비활성화)
async function checkAndUpdateRestriction(userId: string) {
  await d1DeactivateExpiredRestrictionsForUser(userId)
  return true
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

    // 유저 정보 조회 (userId 또는 email로)
    let userData: any
    if (validated.userId) {
      userData = await d1GetUserById(validated.userId)
    } else if (validated.email) {
      userData = await d1GetUserByEmail(validated.email)
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

    // super_admin(관리자)은 정지/제한 불가
    const roles = await d1ListUserRoles(userData.id)
    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
    if (isAdmin) {
      return NextResponse.json({
        success: false,
        error: '관리자 계정은 정지하거나 제한할 수 없습니다'
      }, { status: 403 })
    }

    if (validated.action === 'ban') {
      // 영구 정지 처리 (D1)
      await d1SuspendUserForever(userData.id, validated.reason, authResult.adminId)

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

      await d1AddUserRestriction(userData.id, {
        restriction_type: 'restricted',
        reason: validated.reason,
        start_date: new Date().toISOString(),
        end_date: restrictUntil.toISOString(),
        created_by: authResult.adminId
      })

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
      // 정지/제한 해제 (D1)
      await d1UnbanAndUnrestrictUser(userData.id)

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

    // 정지/제한 사용자 목록 (D1)
    const bannedUsers = await d1ListActiveRestrictionsByType('suspended')
    const restrictedUsers = await d1ListActiveRestrictionsByType('restricted')

    // 제한 기간이 지난 사용자 자동 해제
    const now = new Date()
    const autoUnbanned = []
    
    for (const ur of restrictedUsers || []) {
      if (ur.end_date && new Date(ur.end_date) <= now) {
        await checkAndUpdateRestriction(ur.user_id)
        autoUnbanned.push(ur.email)
      }
    }

    return NextResponse.json({
      success: true,
      bannedUsers: bannedUsers || [],
      restrictedUsers: restrictedUsers || [],
      totalBanned: bannedUsers?.length || 0,
      totalRestricted: restrictedUsers?.length || 0,
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
