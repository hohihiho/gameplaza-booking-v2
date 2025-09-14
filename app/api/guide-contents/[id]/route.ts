import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'

// PUT: 콘텐츠 수정 (관리자 전용)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (base) {
      const res = await fetch(`${base.replace(/\/$/, '')}/guide-contents/${encodeURIComponent(params.id)}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          ...(process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}),
        },
        body: JSON.stringify(await request.json()),
      })
      const text = await res.text()
      return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
    }
    const body = await request.json()
    const { title, content, order_index, is_active, is_published, display_order } = body
    const id = params.id

    const db = getDB()

    // Map legacy fields to new schema
    const newDisplayOrder = display_order ?? order_index
    const newIsPublished = typeof is_published === 'boolean' ? is_published : (typeof is_active === 'boolean' ? is_active : undefined)

    const sets: string[] = []
    const binds: any[] = []
    if (title !== undefined) { sets.push('title = ?'); binds.push(title) }
    if (content !== undefined) { sets.push('content = ?'); binds.push(JSON.stringify(content)) }
    if (newDisplayOrder !== undefined) { sets.push('display_order = ?'); binds.push(newDisplayOrder) }
    if (newIsPublished !== undefined) { sets.push('is_published = ?'); binds.push(newIsPublished ? 1 : 0) }
    sets.push('updated_at = CURRENT_TIMESTAMP')

    const sql = `UPDATE guide_contents SET ${sets.join(', ')} WHERE id = ?`
    binds.push(id)
    const result = await db.prepare(sql).bind(...binds).run()

    if (!result?.meta || result.meta.changes === 0) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('콘텐츠 수정 실패:', error);
    return NextResponse.json(
      { error: '콘텐츠 수정에 실패했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 콘텐츠 삭제 (관리자 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (base) {
      const res = await fetch(`${base.replace(/\/$/, '')}/guide-contents/${encodeURIComponent(params.id)}`, {
        method: 'DELETE',
        headers: {
          ...(process.env.CMS_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.CMS_ADMIN_TOKEN}` } : {}),
        },
      })
      const text = await res.text()
      return new NextResponse(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
    }
    const id = params.id
    const db = getDB()

    const result = await db.prepare(
      `UPDATE guide_contents SET is_published = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run()

    if (!result?.meta || result.meta.changes === 0) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('콘텐츠 삭제 실패:', error);
    return NextResponse.json(
      { error: '콘텐츠 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}
