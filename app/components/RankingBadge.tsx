import React from 'react'

type Props = {
  role?: 'gp_vip' | 'gp_regular' | 'gp_user' | 'restricted' | 'super_admin' | null
  className?: string
}

export function RankingBadge({ role, className }: Props) {
  if (!role) return null
  if (role === 'restricted') {
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 ${className || ''}`}>
        제한
      </span>
    )
  }
  if (role === 'super_admin') {
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-800 ${className || ''}`}>
        운영자
      </span>
    )
  }
  if (role === 'gp_vip') {
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 ${className || ''}`}>
        VIP
      </span>
    )
  }
  if (role === 'gp_regular') {
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-zinc-200 text-zinc-800 ${className || ''}`}>
        단골
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 ${className || ''}`}>
      일반
    </span>
  )
}

