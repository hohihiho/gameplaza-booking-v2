import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (!base) return NextResponse.json({ error: '외부 Worker가 설정되지 않았습니다' }, { status: 503 })
    const res = await fetch(`${base.replace(/\/$/, '')}/guide-categories/${encodeURIComponent(params.id)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        ...(process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}),
      },
      body: JSON.stringify(await request.json()),
    })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (err) {
    console.error('가이드 카테고리 수정 실패:', err)
    return NextResponse.json({ error: '가이드 카테고리 수정 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (!base) return NextResponse.json({ error: '외부 Worker가 설정되지 않았습니다' }, { status: 503 })
    const res = await fetch(`${base.replace(/\/$/, '')}/guide-categories/${encodeURIComponent(params.id)}`, {
      method: 'DELETE',
      headers: {
        ...(process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}),
      },
    })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
  } catch (err) {
    console.error('가이드 카테고리 삭제 실패:', err)
    return NextResponse.json({ error: '가이드 카테고리 삭제 실패' }, { status: 500 })
  }
}

