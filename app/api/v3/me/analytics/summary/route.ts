import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { d1UserAnalytics, d1UserMonthlyRank } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined
  const data = await d1UserAnalytics(user.id, { start, end })
  // 추가: 월간 랭킹/건수 요약(기본: 이번 달)
  let monthly: { rank: number | null; count: number; start: string; end: string } | null = null
  try {
    const r = await d1UserMonthlyRank(user.id, 'month')
    monthly = { rank: r.rank, count: r.count, start: r.start, end: r.end }
  } catch {}
  return NextResponse.json({
    ...data,
    monthly,
  })
}
