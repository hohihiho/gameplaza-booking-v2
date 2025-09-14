export interface Env {
  DB: D1Database
  CACHE?: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Simple CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    try {
      if (request.method === 'GET' && path === '/public/schedule') {
        return handlePublicSchedule(url, env)
      }

      // Guide contents (CMS)
      if (request.method === 'GET' && path === '/guide-contents') {
        return handleGuideContentsList(url, env)
      }
      if (request.method === 'POST' && path === '/guide-contents') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGuideContentsCreate(request, env)
      }
      if (request.method === 'PUT' && path.startsWith('/guide-contents/')) {
        const id = path.split('/')[2]
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGuideContentsUpdate(id, request, env)
      }
      if (request.method === 'DELETE' && path.startsWith('/guide-contents/')) {
        const id = path.split('/')[2]
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGuideContentsDelete(id, env)
      }

      // Guide categories (CMS)
      if (request.method === 'GET' && path === '/guide-categories') {
        return handleGuideCategoriesList(env)
      }
      if (request.method === 'POST' && path === '/guide-categories') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGuideCategoriesCreate(request, env)
      }
      if (request.method === 'PUT' && path.startsWith('/guide-categories/')) {
        const id = path.split('/')[2]
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGuideCategoriesUpdate(id, request, env)
      }
      if (request.method === 'DELETE' && path.startsWith('/guide-categories/')) {
        const id = path.split('/')[2]
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGuideCategoriesDelete(id, env)
      }

      return json({ error: 'Not Found' }, 404)
    } catch (err: any) {
      console.error('[Worker] Error:', err)
      return json({ error: 'Internal error' }, 500)
    }
  },
}

async function handlePublicSchedule(url: URL, env: Env): Promise<Response> {
  const year = url.searchParams.get('year')
  const month = url.searchParams.get('month')
  if (!year || !month) return json({ error: '년월 정보가 필요합니다' }, 400)

  // Compute range strings YYYY-MM-DD
  const endDate = new Date(parseInt(year), parseInt(month), 0)
  const startStr = `${year}-${month.padStart(2, '0')}-01`
  const endStr = `${year}-${month.padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  // Optional KV cache
  const cacheKey = `public:schedule:${year}-${month}`
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey)
    if (cached) return json(JSON.parse(cached))
  }

  // 1) schedule_events
  const seRes = await env.DB.prepare(
    `SELECT id, title, description, date, end_date, type, start_time, end_time, affects_reservation, block_type
     FROM schedule_events
     WHERE date >= ? AND date <= ?
     ORDER BY date`
  ).bind(startStr, endStr).all()
  const scheduleEvents = seRes.results ?? []

  // 2) reservations (subset of fields)
  // Note: status values may vary; filter to common finalized statuses
  const rRes = await env.DB.prepare(
    `SELECT id, device_id, player_count, status, date, start_time, end_time
     FROM reservations
     WHERE date >= ? AND date <= ?
       AND status IN ('approved','checked_in','completed')`
  ).bind(startStr, endStr).all()
  const reservations = rRes.results ?? []

  // 3) devices: join device_types for name/model/version, only for referenced device_ids
  let devices: any[] = []
  const deviceIds = Array.from(new Set((reservations as any[]).map(r => r.device_id).filter(Boolean)))
  if (deviceIds.length > 0) {
    const placeholders = deviceIds.map(() => '?').join(',')
    const sql = `
      SELECT d.id, d.device_number, dt.name, dt.model_name, dt.version_name
      FROM devices d
      JOIN device_types dt ON dt.id = d.device_type_id
      WHERE d.id IN (${placeholders})
      ORDER BY dt.name, d.device_number
    `
    const dRes = await env.DB.prepare(sql).bind(...deviceIds).all()
    const rows = dRes.results ?? []
    devices = rows.map((row: any) => ({
      id: row.id,
      device_number: row.device_number,
      device_types: {
        name: row.name,
        model_name: row.model_name,
        version_name: row.version_name,
      },
    }))
  }

  const payload = { scheduleEvents, reservations, devices }

  // Store cache
  if (env.CACHE) {
    try { await env.CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 600 }) } catch {}
  }

  return json(payload)
}

// ---- Guide Contents (CMS) ----
async function handleGuideContentsList(url: URL, env: Env): Promise<Response> {
  const slug = url.searchParams.get('category') || ''
  const cacheKey = `guide:contents:${slug || 'all'}`

  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey)
    if (cached) return json(JSON.parse(cached))
  }

  const hasSlug = !!slug
  const sql = hasSlug
    ? `SELECT * FROM guide_contents WHERE is_published = 1 AND category_id = (SELECT id FROM guide_categories WHERE slug = ? LIMIT 1) ORDER BY display_order ASC, updated_at DESC`
    : `SELECT * FROM guide_contents WHERE is_published = 1 ORDER BY display_order ASC, updated_at DESC`

  const res = hasSlug
    ? await env.DB.prepare(sql).bind(slug).all()
    : await env.DB.prepare(sql).all()
  const rows = (res.results || []).map((r: any) => ({
    ...r,
    content: safeJson(r.content),
  }))

  const payload = { contents: rows }
  if (env.CACHE) {
    try { await env.CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 600 }) } catch {}
  }
  return json(payload)
}

async function handleGuideContentsCreate(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any
  const { category, categoryId, title, content, display_order = 0, is_published } = body
  if (!title || content === undefined) return json({ error: 'title, content 필수' }, 400)

  let catId = categoryId
  if (!catId && category) {
    const row = await env.DB.prepare('SELECT id FROM guide_categories WHERE slug = ? LIMIT 1').bind(category).first()
    if (!row) return json({ error: '유효하지 않은 category(slug)' }, 400)
    catId = row.id
  }
  if (!catId) return json({ error: 'categoryId 또는 category(slug) 필요' }, 400)

  await env.DB
    .prepare('INSERT INTO guide_contents (category_id, title, content, is_published, display_order, created_at, updated_at) VALUES (?,?,?,?,?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .bind(catId, title, JSON.stringify(content), is_published ? 1 : 1, display_order)
    .run()

  // Invalidate caches
  if (env.CACHE) {
    try {
      await env.CACHE.delete('guide:contents:all')
      if (category) await env.CACHE.delete(`guide:contents:${category}`)
    } catch {}
  }
  return json({ success: true })
}

async function handleGuideContentsUpdate(id: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any
  const { title, content, order_index, is_active, is_published, display_order } = body

  const sets: string[] = []
  const binds: any[] = []
  if (title !== undefined) { sets.push('title = ?'); binds.push(title) }
  if (content !== undefined) { sets.push('content = ?'); binds.push(JSON.stringify(content)) }
  const newDisplayOrder = display_order ?? order_index
  if (newDisplayOrder !== undefined) { sets.push('display_order = ?'); binds.push(newDisplayOrder) }
  const newIsPublished = typeof is_published === 'boolean' ? is_published : (typeof is_active === 'boolean' ? is_active : undefined)
  if (newIsPublished !== undefined) { sets.push('is_published = ?'); binds.push(newIsPublished ? 1 : 0) }
  sets.push('updated_at = CURRENT_TIMESTAMP')
  binds.push(id)

  const sql = `UPDATE guide_contents SET ${sets.join(', ')} WHERE id = ?`
  const res = await env.DB.prepare(sql).bind(...binds).run()
  if (!res?.success) return json({ error: '업데이트 실패' }, 500)

  if (env.CACHE) {
    try {
      await env.CACHE.delete('guide:contents:all')
      // We don’t know exact slug; safest is to clear all relevant keys if you track slugs separately
    } catch {}
  }
  return json({ success: true })
}

async function handleGuideContentsDelete(id: string, env: Env): Promise<Response> {
  const res = await env.DB
    .prepare('UPDATE guide_contents SET is_published = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(id)
    .run()
  if (!res?.success) return json({ error: '삭제 실패' }, 500)
  if (env.CACHE) {
    try { await env.CACHE.delete('guide:contents:all') } catch {}
  }
  return json({ success: true })
}

// ---- Guide Categories (CMS) ----
async function handleGuideCategoriesList(env: Env): Promise<Response> {
  const cacheKey = 'guide:categories'
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey)
    if (cached) return json(JSON.parse(cached))
  }
  const res = await env.DB
    .prepare('SELECT id, slug, name, description, display_order, icon, created_at, updated_at FROM guide_categories ORDER BY display_order ASC, name ASC')
    .all()
  const payload = { categories: res.results || [] }
  if (env.CACHE) {
    try { await env.CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 600 }) } catch {}
  }
  return json(payload)
}

async function handleGuideCategoriesCreate(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any
  const { slug, name, description, display_order = 0, icon } = body
  if (!slug || !name) return json({ error: 'slug, name 필수' }, 400)
  await env.DB
    .prepare('INSERT INTO guide_categories (slug, name, description, display_order, icon, created_at, updated_at) VALUES (?,?,?,?,?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .bind(slug, name, description ?? null, display_order, icon ?? null)
    .run()
  if (env.CACHE) { try { await env.CACHE.delete('guide:categories') } catch {} }
  return json({ success: true })
}

async function handleGuideCategoriesUpdate(id: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any
  const { slug, name, description, display_order, icon } = body
  const sets: string[] = []
  const binds: any[] = []
  if (slug !== undefined) { sets.push('slug = ?'); binds.push(slug) }
  if (name !== undefined) { sets.push('name = ?'); binds.push(name) }
  if (description !== undefined) { sets.push('description = ?'); binds.push(description) }
  if (display_order !== undefined) { sets.push('display_order = ?'); binds.push(display_order) }
  if (icon !== undefined) { sets.push('icon = ?'); binds.push(icon) }
  sets.push('updated_at = CURRENT_TIMESTAMP')
  binds.push(id)
  const sql = `UPDATE guide_categories SET ${sets.join(', ')} WHERE id = ?`
  const res = await env.DB.prepare(sql).bind(...binds).run()
  if (!res?.success) return json({ error: '업데이트 실패' }, 500)
  if (env.CACHE) { try { await env.CACHE.delete('guide:categories') } catch {} }
  return json({ success: true })
}

async function handleGuideCategoriesDelete(id: string, env: Env): Promise<Response> {
  const res = await env.DB.prepare('DELETE FROM guide_categories WHERE id = ?').bind(id).run()
  if (!res?.success) return json({ error: '삭제 실패' }, 500)
  if (env.CACHE) { try { await env.CACHE.delete('guide:categories') } catch {} }
  return json({ success: true })
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...corsHeaders() },
  })
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
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

// ---- Admin Schedule ----
async function handleAdminScheduleList(url: URL, env: Env): Promise<Response> {
  const year = url.searchParams.get('year')
  const month = url.searchParams.get('month')
  let sql = 'SELECT * FROM schedule_events'
  const binds: any[] = []
  if (year && month) {
    const endDate = new Date(parseInt(year), parseInt(month), 0)
    const startStr = `${year}-${month.padStart(2, '0')}-01`
    const endStr = `${year}-${month.padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    sql += ' WHERE date >= ? AND date <= ?'
    binds.push(startStr, endStr)
  }
  sql += ' ORDER BY date ASC'
      // Admin schedule CRUD
      if (path === '/admin/schedule' && request.method === 'GET') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleAdminScheduleList(url, env)
      }
      if (path === '/admin/schedule' && request.method === 'POST') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleAdminScheduleCreate(await request.json(), env)
      }
      if (path === '/admin/schedule' && request.method === 'PATCH') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleAdminScheduleUpdate(await request.json(), env)
      }
      if (path === '/admin/schedule' && request.method === 'DELETE') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        const id = new URL(request.url).searchParams.get('id')
        if (!id) return json({ error: 'id 필요' }, 400)
        return handleAdminScheduleDelete(id, env)
      }

      // Admin schedule: check-missing
      if (path === '/admin/schedule/check-missing' && request.method === 'GET') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleAdminScheduleCheckMissing(env)
      }
      if (path === '/admin/schedule/check-missing' && request.method === 'POST') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleAdminScheduleCheckMissingCreate(env)
      }

      // Admin schedule: sync by reservations
      if (path === '/admin/schedule/sync-reservations' && request.method === 'POST') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleAdminScheduleSyncReservations(env)
      }

      // V2: generate weekend overnights
      if (path === '/v2/admin/schedule/generate-weekend' && request.method === 'POST') {
        const admin = await requireAdmin(request, env)
        if (!admin.ok) return admin.res
        return handleGenerateWeekend(env)
      }
  const res = await env.DB.prepare(sql).bind(...binds).all()
  return json({ events: res.results || [] })
}

async function handleAdminScheduleCreate(body: any, env: Env): Promise<Response> {
  const insertData = {
    date: body.date,
    end_date: body.endDate || null,
    title: body.title,
    type: body.type,
    description: body.description || null,
    start_time: body.startTime && body.startTime !== '' ? body.startTime : null,
    end_time: body.endTime && body.endTime !== '' ? body.endTime : null,
    is_recurring: body.isRecurring || 0,
    recurring_type: body.recurringType || null,
    affects_reservation: body.type === 'reservation_block' ? 1 : (body.affectsReservation ? 1 : 0),
    block_type: body.blockType || null,
  }
  const keys = Object.keys(insertData)
  const cols = keys.join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map((k) => (insertData as any)[k])
  await env.DB
    .prepare(`INSERT INTO schedule_events (${cols}) VALUES (${placeholders})`)
    .bind(...values)
    .run()
  const row = await env.DB.prepare('SELECT * FROM schedule_events ORDER BY id DESC LIMIT 1').first()
  return json({ event: row })
}

async function handleAdminScheduleUpdate(body: any, env: Env): Promise<Response> {
  if (!body.id) return json({ error: 'id 필요' }, 400)
  const map: any = {}
  if (body.date !== undefined) map.date = body.date
  if (body.endDate !== undefined) map.end_date = body.endDate
  if (body.title !== undefined) map.title = body.title
  if (body.type !== undefined) map.type = body.type
  if (body.description !== undefined) map.description = body.description
  if (body.startTime !== undefined) map.start_time = body.startTime === '' ? null : body.startTime
  if (body.endTime !== undefined) map.end_time = body.endTime === '' ? null : body.endTime
  if (body.isRecurring !== undefined) map.is_recurring = body.isRecurring ? 1 : 0
  if (body.recurringType !== undefined) map.recurring_type = body.recurringType
  if (body.affectsReservation !== undefined) map.affects_reservation = body.affectsReservation ? 1 : 0
  if (body.blockType !== undefined) map.block_type = body.blockType

  const sets: string[] = []
  const binds: any[] = []
  for (const k of Object.keys(map)) { sets.push(`${k} = ?`); binds.push(map[k]) }
  binds.push(body.id)
  await env.DB.prepare(`UPDATE schedule_events SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()
  const row = await env.DB.prepare('SELECT * FROM schedule_events WHERE id = ?').bind(body.id).first()
  return json({ event: row })
}

async function handleAdminScheduleDelete(id: string, env: Env): Promise<Response> {
  await env.DB.prepare('DELETE FROM schedule_events WHERE id = ?').bind(id).run()
  return json({ success: true })
}

// Helpers
function ymd(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

async function handleAdminScheduleCheckMissing(env: Env): Promise<Response> {
  const today = new Date(); today.setHours(0,0,0,0)
  const end = new Date(today); end.setDate(end.getDate() + 7)
  const startStr = ymd(today); const endStr = ymd(end)

  const resv = await env.DB.prepare(
    `SELECT date, slot_type, COUNT(1) as cnt FROM reservations
     WHERE status IN ('approved','checked_in','completed') AND date >= ? AND date <= ?
     GROUP BY date, slot_type`
  ).bind(startStr, endStr).all()
  const rows = resv.results || []

  const sched = await env.DB.prepare(
    `SELECT date, type FROM schedule_events WHERE date >= ? AND date <= ?`
  ).bind(startStr, endStr).all()
  const existing = new Map<string, Set<string>>()
  for (const r of (sched.results || [])) {
    const set = existing.get(r.date) || new Set<string>()
    set.add(r.type)
    existing.set(r.date, set)
  }

  const missing: any[] = []
  const byDate: Record<string, Set<string>> = {}
  for (const r of rows as any[]) {
    const need = r.slot_type === 'early' ? 'early_open' : (r.slot_type === 'overnight' ? 'overnight' : null)
    if (!need) continue
    const has = existing.get(r.date)
    if (!has || !has.has(need)) {
      if (!byDate[r.date]) byDate[r.date] = new Set<string>()
      byDate[r.date].add(need)
    }
  }
  for (const [date, types] of Object.entries(byDate)) {
    missing.push({ date, types: Array.from(types) })
  }

  return json({ summary: { range: `${startStr}~${endStr}`, missing: missing.length }, missing })
}

async function handleAdminScheduleCheckMissingCreate(env: Env): Promise<Response> {
  const scan = await handleAdminScheduleCheckMissing(env)
  const payload = await scan.json() as any
  let created = 0, errors = 0
  for (const m of payload.missing as any[]) {
    for (const t of m.types as string[]) {
      const title = t === 'early_open' ? '조기 영업' : '밤샘 영업'
      try {
        await env.DB.prepare(
          'INSERT INTO schedule_events (date, title, type, is_auto_generated, created_at, updated_at) VALUES (?,?,?,?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
        ).bind(m.date, title, t, 1).run()
        created++
      } catch { errors++ }
    }
  }
  return json({ result: { created, errors } })
}

async function handleAdminScheduleSyncReservations(env: Env): Promise<Response> {
  const today = new Date(); today.setHours(0,0,0,0)
  const end = new Date(today); end.setDate(end.getDate() + 21)
  const startStr = ymd(today); const endStr = ymd(end)

  const resv = await env.DB.prepare(
    `SELECT date, slot_type FROM reservations WHERE status IN ('approved','checked_in','completed') AND date >= ? AND date <= ?`
  ).bind(startStr, endStr).all()
  const rows = resv.results || []

  // Existing auto-generated schedules in range
  const existing = await env.DB.prepare(
    `SELECT id, date, type, is_auto_generated FROM schedule_events WHERE date >= ? AND date <= ?`
  ).bind(startStr, endStr).all()
  const byDateType = new Map<string, any>()
  for (const s of (existing.results || [])) byDateType.set(`${s.date}:${s.type}`, s)

  const needSet = new Set<string>()
  for (const r of (rows as any[])) {
    const t = r.slot_type === 'early' ? 'early_open' : (r.slot_type === 'overnight' ? 'overnight' : null)
    if (!t) continue
    needSet.add(`${r.date}:${t}`)
  }

  let created = 0, cleaned = 0
  // Create missing
  for (const key of needSet) {
    if (!byDateType.has(key)) {
      const [date, t] = key.split(':')
      const title = t === 'early_open' ? '조기 영업' : '밤샘 영업'
      await env.DB.prepare('INSERT INTO schedule_events (date, title, type, is_auto_generated, created_at, updated_at) VALUES (?,?,?,?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .bind(date, title, t, 1).run()
      created++
    }
  }
  // Clean auto-generated without need
  for (const s of (existing.results || [])) {
    const key = `${(s as any).date}:${(s as any).type}`
    if ((s as any).is_auto_generated && !needSet.has(key)) {
      await env.DB.prepare('DELETE FROM schedule_events WHERE id = ?').bind((s as any).id).run()
      cleaned++
    }
  }

  return json({ result: { processed: rows.length, created, cleaned, errors: 0, dateRange: `${startStr}~${endStr}` } })
}

async function handleGenerateWeekend(env: Env): Promise<Response> {
  const today = new Date(); today.setHours(0,0,0,0)
  const end = new Date(today); end.setDate(end.getDate() + 21)
  let cur = new Date(today)
  let created = 0, skipped = 0
  while (cur <= end) {
    const dow = cur.getDay() // 0 Sun .. 6 Sat
    if (dow === 5 || dow === 6) { // Fri or Sat
      const date = ymd(cur)
      const exists = await env.DB.prepare('SELECT id FROM schedule_events WHERE date = ? AND type = ? LIMIT 1').bind(date, 'overnight').first()
      if (!exists) {
        await env.DB.prepare('INSERT INTO schedule_events (date, title, type, is_auto_generated, created_at, updated_at) VALUES (?,?,?,?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
          .bind(date, '밤샘 영업', 'overnight', 1).run()
        created++
      } else {
        skipped++
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  return json({ result: { created, skipped } })
}

async function requireAdmin(request: Request, env: Env): Promise<{ ok: true } | { ok: false; res: Response }> {
  // Expect Bearer token; compare with secret set in env.ADMIN_API_TOKEN
  const hdr = request.headers.get('authorization') || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : ''
  const expected = (env as any).ADMIN_API_TOKEN as string | undefined
  if (!expected) {
    // If not configured, deny by default
    return { ok: false, res: json({ error: 'Admin API not configured' }, 503) }
  }
  if (!token || token !== expected) {
    return { ok: false, res: json({ error: 'Unauthorized' }, 401) }
  }
  return { ok: true }
}
