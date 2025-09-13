import { NextRequest, NextResponse } from 'next/server'
import { d1MonthlyRanking, d1AddUserRole, d1RemoveUserRole, d1ListUserRoles, d1ListUserRestrictions } from '@/lib/db/d1'

// Vercel Cron 훅: 매일 06:00 KST에 랭킹 기반 직급 재부여 (D1 사용)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const ranking = await d1MonthlyRanking({ period: 'month', page: 1, pageSize: 2000 })
    const assignments = ranking.items.map((it) => ({
      user_id: String(it.user_id),
      rank: Number(it.rank),
      role: Number(it.rank) <= 5 ? 'gp_vip' : Number(it.rank) <= 20 ? 'gp_regular' : 'gp_user'
    }))
    let updated = 0
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
      await d1RemoveUserRole(a.user_id, 'gp_vip').catch(() => {})
      await d1RemoveUserRole(a.user_id, 'gp_regular').catch(() => {})
      await d1RemoveUserRole(a.user_id, 'gp_user').catch(() => {})
      await d1AddUserRole(a.user_id, a.role).catch(() => {})
      updated++
    }
    return NextResponse.json({ start: ranking.start, end: ranking.end, updated })
  } catch (error) {
    console.error('Cron rebuild roles error:', error)
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
