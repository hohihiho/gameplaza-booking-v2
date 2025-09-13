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

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...corsHeaders() },
  })
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  }
}
