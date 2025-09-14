import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (base) {
      const res = await fetch(`${base.replace(/\/$/, '')}/guide-categories`, { headers: { accept: 'application/json' } })
      const text = await res.text()
      return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
    }
    return NextResponse.json({ categories: [] })
  } catch (err) {
    console.error('가이드 카테고리 조회 실패:', err)
    return NextResponse.json({ error: '가이드 카테고리 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (!base) return NextResponse.json({ error: '외부 Worker가 설정되지 않았습니다' }, { status: 503 })
    const res = await fetch(`${base.replace(/\/$/, '')}/guide-categories`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}),
      },
      body: JSON.stringify(await request.json()),
    })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (err) {
    console.error('가이드 카테고리 생성 실패:', err)
    return NextResponse.json({ error: '가이드 카테고리 생성 실패' }, { status: 500 })
  }
}

