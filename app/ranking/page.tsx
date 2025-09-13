import React from 'react'
import { RankingBadge } from '@/app/components/RankingBadge'

async function fetchRanking() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v3/ranking?period=month`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    try {
      const res = await fetch(`/api/v3/ranking?period=month`, { cache: 'no-store' })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }
}

async function fetchMeMonthly() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v3/me/analytics/summary`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    try {
      const res = await fetch(`/api/v3/me/analytics/summary`, { cache: 'no-store' })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }
}

function roleFromRank(rank?: number | null) {
  if (!rank) return 'gp_user' as const
  if (rank <= 5) return 'gp_vip' as const
  if (rank <= 20) return 'gp_regular' as const
  return 'gp_user' as const
}

export default async function RankingPage() {
  const [ranking, me] = await Promise.all([fetchRanking(), fetchMeMonthly()])
  const items: Array<{ user_id: string; cnt: number; rank: number }> = ranking?.items || []
  const my = me?.monthly || null
  const myRole = my ? roleFromRank(my.rank) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">월간 대여 랭킹</h1>

      <div className="mb-6">
        {my ? (
          <div className="rounded border p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">내 순위</div>
                <div className="text-xl font-semibold">{my.rank ?? '-'} 위</div>
              </div>
              <div>
                <RankingBadge role={myRole} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">이번 달 이용: {my.count}건</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">로그인 시 내 순위와 배지를 확인할 수 있어요.</div>
        )}
      </div>

      <ol className="divide-y rounded border bg-white shadow-sm">
        {items.map((it) => (
          <li key={`${it.user_id}-${it.rank}`} className="flex items-center gap-4 p-4">
            <div className="w-10 text-lg font-semibold tabular-nums">{it.rank}</div>
            <div className="flex-1">
              <div className="font-medium">사용자 {it.user_id.slice(0, 6)}•••</div>
              <div className="text-sm text-gray-500">이용 {it.cnt}건</div>
            </div>
            <RankingBadge role={roleFromRank(it.rank)} />
          </li>
        ))}
        {items.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-500">랭킹 데이터가 없습니다.</li>
        )}
      </ol>
    </div>
  )
}

