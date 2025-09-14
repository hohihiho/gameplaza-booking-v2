import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db/client'

// GET: 이용안내 콘텐츠 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') // slug (e.g., 'arcade')

    // Proxy to Worker if configured
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (base) {
      const url = `${base.replace(/\/$/, '')}/guide-contents${category ? `?category=${encodeURIComponent(category)}` : ''}`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      const body = await res.text()
      return new NextResponse(body, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } })
    }

    const db = getDB()

    // D1 schema: guide_contents(category_id, title, content, is_published, display_order, ...)
    // If category slug is provided, translate to category_id via subquery
    let query = 'SELECT * FROM guide_contents WHERE is_published = 1'
    const params: any[] = []

    if (category) {
      query += ' AND category_id = (SELECT id FROM guide_categories WHERE slug = ? LIMIT 1)'
      params.push(category)
    }

    query += ' ORDER BY display_order ASC, updated_at DESC'

    const result = await db.prepare(query).bind(...params).all()
    
    // content JSON 문자열을 파싱
    const contents = (result.results || []).map((item: any) => ({
      ...item,
      content: safeJson(item.content)
    }))
    
    return NextResponse.json({ contents });
  } catch (error) {
    console.error('이용안내 콘텐츠 조회 실패:', error);
    return NextResponse.json(
      { error: '콘텐츠를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

// POST: 새 콘텐츠 추가 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // Proxy first
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE
    if (base) {
      const res = await fetch(`${base.replace(/\/$/, '')}/guide-contents`, {
        method: 'POST',
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
    const { category, categoryId, title, content, order_index = 0, is_published } = body

    if (!title || content === undefined) {
      return NextResponse.json({ error: 'title과 content는 필수입니다' }, { status: 400 })
    }

    const db = getDB()

    // Resolve category_id: prefer explicit categoryId; fallback to slug in `category`
    let catId = categoryId
    if (!catId && category) {
      const row = await db
        .prepare('SELECT id FROM guide_categories WHERE slug = ? LIMIT 1')
        .bind(category)
        .first()
      if (!row) return NextResponse.json({ error: '유효하지 않은 category(slug)' }, { status: 400 })
      catId = row.id
    }
    if (!catId) return NextResponse.json({ error: 'categoryId 또는 category(slug)가 필요합니다' }, { status: 400 })

    const result = await db
      .prepare(
        `INSERT INTO guide_contents (category_id, title, content, is_published, display_order)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(catId, title, JSON.stringify(content), is_published ? 1 : 1, order_index)
      .run()

    return NextResponse.json({ success: true, id: result?.meta?.last_row_id })
  } catch (error) {
    console.error('콘텐츠 추가 실패:', error);
    return NextResponse.json(
      { error: '콘텐츠 추가에 실패했습니다' },
      { status: 500 }
    );
  }
}

function safeJson(v: any) {
  try {
    if (typeof v === 'string') return JSON.parse(v || '[]')
    return v ?? []
  } catch {
    return []
  }
}
