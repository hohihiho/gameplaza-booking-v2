import { NextResponse } from 'next/server'

const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
const headers = {
  'content-type': 'application/json',
  ...(process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}),
}

// GET: 일정 목록 조회 (proxy)
export async function GET(request: Request) {
  try {
    if (!base) return NextResponse.json({ events: [] })
    const u = new URL(request.url)
    const year = u.searchParams.get('year')
    const month = u.searchParams.get('month')
    const url = `${base.replace(/\/$/, '')}/admin/schedule${year && month ? `?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}` : ''}`
    const res = await fetch(url, { headers: { accept: 'application/json', ...headers } })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: '프록시 오류' }, { status: 500 })
  }
}

// POST: 새 일정 추가 (proxy)
export async function POST(request: Request) {
  try {
    if (!base) return NextResponse.json({ error: '외부 Worker 미설정' }, { status: 503 })
    const res = await fetch(`${base.replace(/\/$/, '')}/admin/schedule`, { method: 'POST', headers, body: JSON.stringify(await request.json()) })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: '프록시 오류' }, { status: 500 })
  }
}

// PATCH: 일정 수정 (proxy)
export async function PATCH(request: Request) {
  try {
    if (!base) return NextResponse.json({ error: '외부 Worker 미설정' }, { status: 503 })
    const res = await fetch(`${base.replace(/\/$/, '')}/admin/schedule`, { method: 'PATCH', headers, body: JSON.stringify(await request.json()) })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: '프록시 오류' }, { status: 500 })
  }
}

// DELETE: 일정 삭제 (proxy)
export async function DELETE(request: Request) {
  try {
    if (!base) return NextResponse.json({ error: '외부 Worker 미설정' }, { status: 503 })
    const u = new URL(request.url)
    const id = u.searchParams.get('id')
    const url = `${base.replace(/\/$/, '')}/admin/schedule${id ? `?id=${encodeURIComponent(id)}` : ''}`
    const res = await fetch(url, { method: 'DELETE', headers })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: '프록시 오류' }, { status: 500 })
  }
}
