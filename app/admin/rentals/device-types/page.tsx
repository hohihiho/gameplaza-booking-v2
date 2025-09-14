'use client'

import { useEffect, useState } from 'react'

type DeviceType = {
  id: number | string
  name: string
  is_rentable: number
  display_order: number
  model_name?: string | null
  version_name?: string | null
  description?: string | null
  rental_settings?: string | null
}

export default function DeviceTypesAdminPage() {
  const [items, setItems] = useState<DeviceType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v3/admin/device-types')
      const json = await res.json()
      setItems(json.data || [])
    } catch (e: any) {
      setError(e?.message || '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">대여 기기 타입 관리</h1>
      {loading && <p>불러오는 중…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">정렬</th>
            <th className="py-2">이름</th>
            <th className="py-2">모델</th>
            <th className="py-2">버전</th>
            <th className="py-2">대여</th>
            <th className="py-2">설정</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={String(it.id)} className="border-b">
              <td className="py-2">{it.display_order}</td>
              <td className="py-2 font-medium">{it.name}</td>
              <td className="py-2">{it.model_name || '-'}</td>
              <td className="py-2">{it.version_name || '-'}</td>
              <td className="py-2">{it.is_rentable ? '가능' : '불가'}</td>
              <td className="py-2">
                <a className="text-blue-600 underline" href={`/admin/rentals/device-types/${it.id}`}>관리</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

