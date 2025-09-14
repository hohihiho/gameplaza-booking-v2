import { NextRequest, NextResponse } from 'next/server'

const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
const authHeader = process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}

export async function GET(_request: NextRequest) {
  try {
    if (!base) return NextResponse.json({ summary: { missing: 0 }, missing: [] })
    const res = await fetch(`${base.replace(/\/$/, '')}/admin/schedule/check-missing`, { headers: { accept: 'application/json', ...authHeader } })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: '프록시 오류' }, { status: 500 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    if (!base) return NextResponse.json({ error: '외부 Worker 미설정' }, { status: 503 })
    const res = await fetch(`${base.replace(/\/$/, '')}/admin/schedule/check-missing`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeader }, body: JSON.stringify({ autoFix: true }) })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: '프록시 오류' }, { status: 500 })
  }
}
