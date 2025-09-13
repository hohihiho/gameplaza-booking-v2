import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/db'
import { d1MonthlyRanking, d1AddUserRole, d1RemoveUserRole, d1ListUserRoles, d1ListUserRestrictions } from '@/lib/db/d1'

// 수동 랭킹 기반 직급 재부여(미리보기 + 적용 옵션)
// GET /api/v3/admin/users/roles/rebuild?period=month&apply=false
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })
    }

    // 관리자 권한 확인 (슈퍼관리자만)
    const supabase = createAdminClient()
    const { data: me } = await supabase.from('users').select('id').eq('email', session.user.email).single()
    if (!me) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
    const { data: admin } = await supabase.from('admins').select('is_super_admin').eq('user_id', me.id).single()
    if (!admin?.is_super_admin) return NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') as 'month' | 'year') || 'month'
    const apply = (searchParams.get('apply') || 'false') === 'true'

    const ranking = await d1MonthlyRanking({ period, page: 1, pageSize: 1000 })
    // 역할 분기: 1~5 vip, 6~20 regular, 21+ user
    const targets = ranking.items.map(it => ({ user_id: String(it.user_id), rank: Number(it.rank), count: Number(it.cnt) }))
    const assignments = targets.map(t => ({
      user_id: t.user_id,
      rank: t.rank,
      count: t.count,
      role: t.rank <= 5 ? 'gp_vip' : t.rank <= 20 ? 'gp_regular' : 'gp_user'
    }))

    if (apply) {
      for (const a of assignments) {
        // super_admin 보유자/활성 제한자는 스킵
        try {
          const roles = await d1ListUserRoles(a.user_id)
          const isSuper = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
          if (isSuper) continue
          const restrictions = await d1ListUserRestrictions(a.user_id)
          const hasActiveRestriction = Array.isArray(restrictions) && restrictions.some((r: any) => r.is_active === 1 && (r.restriction_type === 'restricted' || r.restriction_type === 'suspended'))
          if (hasActiveRestriction) continue
        } catch {}
        // 기존 랭킹 계열 역할 제거 후 새 역할 부여
        await d1RemoveUserRole(a.user_id, 'gp_vip').catch(() => {})
        await d1RemoveUserRole(a.user_id, 'gp_regular').catch(() => {})
        await d1RemoveUserRole(a.user_id, 'gp_user').catch(() => {})
        await d1AddUserRole(a.user_id, a.role, me.id).catch(() => {})
      }
    }

    return NextResponse.json({
      period,
      start: ranking.start,
      end: ranking.end,
      totalUsers: ranking.totalUsers,
      applied: apply,
      assignments,
    })
  } catch (error) {
    console.error('GET /api/v3/admin/users/roles/rebuild error:', error)
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
