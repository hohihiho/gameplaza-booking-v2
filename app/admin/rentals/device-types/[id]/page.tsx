'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditDeviceTypePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const id = params.id
  const [item, setItem] = useState<any>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [pricing, setPricing] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [dt, tb, pr] = await Promise.all([
        fetch(`/api/v3/admin/device-types/${id}`).then(r=>r.json()),
        fetch(`/api/v3/admin/device-types/${id}/time-blocks`).then(r=>r.json()),
        fetch(`/api/v3/admin/device-types/${id}/pricing`).then(r=>r.json()),
      ])
      setItem(dt.data)
      setBlocks(tb.data || [])
      setPricing(pr.data || [])
    } catch (e: any) {
      setError(e?.message || '불러오기 실패')
    }
  }

  useEffect(() => { load() }, [id])

  const rentalSettings = useMemo(() => {
    try { return item?.rental_settings ? JSON.parse(item.rental_settings) : {} } catch { return {} }
  }, [item])

  const updateField = (k: string, v: any) => setItem((prev: any) => ({ ...prev, [k]: v }))

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const body: any = {
        name: item.name,
        is_rentable: !!item.is_rentable,
        display_order: Number(item.display_order || 999),
        model_name: item.model_name || null,
        version_name: item.version_name || null,
        description: item.description || null,
      }
      if (item.rental_settings_json) body.rental_settings = item.rental_settings_json
      const res = await fetch(`/api/v3/admin/device-types/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('저장 실패')
      await load()
    } catch (e: any) {
      setError(e?.message || '저장 실패')
    } finally { setSaving(false) }
  }

  const addBlock = async () => {
    const payload = { slot_type: 'early', start_time: '07:00:00', end_time: '12:00:00', is_youth_time: 0 }
    await fetch(`/api/v3/admin/device-types/${id}/time-blocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await load()
  }

  const addPricing = async () => {
    const payload = { option_type: 'freeplay', price: 0 }
    await fetch(`/api/v3/admin/device-types/${id}/pricing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await load()
  }

  if (!item) return <main className="p-6 max-w-4xl mx-auto">불러오는 중…</main>

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <button className="text-sm text-gray-600 mb-4" onClick={() => router.back()}>&larr; 목록</button>
      <h1 className="text-2xl font-bold mb-4">기기 타입 편집</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <div className="text-sm text-gray-600">이름</div>
          <input className="border rounded px-2 py-1 w-full" value={item.name || ''} onChange={e=>updateField('name', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">정렬</div>
          <input type="number" className="border rounded px-2 py-1 w-full" value={item.display_order || 0} onChange={e=>updateField('display_order', Number(e.target.value))} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">모델 (Valkyrie/Lightning/Arena 등)</div>
          <input className="border rounded px-2 py-1 w-full" value={item.model_name || ''} onChange={e=>updateField('model_name', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">버전</div>
          <input className="border rounded px-2 py-1 w-full" value={item.version_name || ''} onChange={e=>updateField('version_name', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">대여 가능</div>
          <select className="border rounded px-2 py-1 w-full" value={item.is_rentable ? 1 : 0} onChange={e=>updateField('is_rentable', Number(e.target.value))}>
            <option value={1}>가능</option>
            <option value={0}>불가</option>
          </select>
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">설명</div>
          <input className="border rounded px-2 py-1 w-full" value={item.description || ''} onChange={e=>updateField('description', e.target.value)} />
        </label>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-1">rental_settings (JSON)</div>
        <textarea className="border rounded px-2 py-1 w-full h-28" defaultValue={JSON.stringify(rentalSettings, null, 2)} onChange={e=>updateField('rental_settings_json', JSON.parse(e.target.value || '{}'))} />
      </div>

      <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded" onClick={save}>{saving ? '저장 중…' : '저장'}</button>

      <h2 className="text-xl font-semibold mt-8 mb-2">시간 블록</h2>
      <button className="px-3 py-1 bg-gray-800 text-white rounded mb-3" onClick={addBlock}>+ 블록 추가</button>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b"><th className="py-2">타입</th><th className="py-2">시작</th><th className="py-2">종료</th><th className="py-2">청소년</th><th className="py-2">2인</th><th className="py-2">추가요금</th></tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="py-2">{b.slot_type}</td>
              <td className="py-2">{b.start_time}</td>
              <td className="py-2">{b.end_time}</td>
              <td className="py-2">{b.is_youth_time ? '예' : '아니오'}</td>
              <td className="py-2">{b.enable_extra_people ? '예' : '아니오'}</td>
              <td className="py-2">{b.extra_per_person ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-8 mb-2">요금/크레딧</h2>
      <button className="px-3 py-1 bg-gray-800 text-white rounded mb-3" onClick={addPricing}>+ 요금 추가</button>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b"><th className="py-2">옵션</th><th className="py-2">가격</th><th className="py-2">2인추가</th><th className="py-2">2인가능</th></tr>
        </thead>
        <tbody>
          {pricing.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.option_type}</td>
              <td className="py-2">{p.price}</td>
              <td className="py-2">{p.price_2p_extra ?? '-'}</td>
              <td className="py-2">{p.enable_extra_people ? '예' : '아니오'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

