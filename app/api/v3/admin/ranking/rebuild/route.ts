import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ComputeMonthlyRanking, d1ApplyRolesFromRanking } from '@/lib/db/d1'

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const year = body.year ? String(body.year) : undefined
  const month = body.month ? String(body.month).padStart(2, '0') : undefined
  const ranking = await d1ComputeMonthlyRanking(year, month)
  const applied = await d1ApplyRolesFromRanking(ranking.map(r => ({ user_id: r.user_id, rank: r.rank })))
  return NextResponse.json({ year: year || new Date().toISOString().slice(0,4), month: month || new Date().toISOString().slice(5,7), total: ranking.length, applied })
}, { requireAdmin: true })

