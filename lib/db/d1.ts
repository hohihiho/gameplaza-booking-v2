// Cloudflare D1 adapter (skeleton)
// NOTE: This is a placeholder. In non-D1 environments it should not be used.

import { ListParams, ListResult, ReservationRecord } from './types'

function notConfigured(): never {
  throw new Error('[D1] Database is not configured in this environment')
}

// 중복 스켈레톤 함수들을 제거했습니다. 실제 구현은 아래에 있습니다.

// --- Below: concrete impl, active only when D1 is available ---

type D1Database = {
  prepare: (sql: string) => {
    bind: (...args: any[]) => any
    all: () => Promise<{ results?: any[] }>
    first: () => Promise<any>
    run: () => Promise<{ success: boolean; meta?: any }>
  }
}

function getD1(): D1Database | null {
  // Common patterns: globalThis.env.<BINDING>, globalThis.DB, globalThis.__D1__
  const g = globalThis as any
  const bindingName = process.env.D1_BINDING_NAME || 'DB'
  if (g?.env && g.env[bindingName]) return g.env[bindingName] as D1Database
  if (g?.env?.DB) return g.env.DB as D1Database
  if (g?.DB) return g.DB as D1Database
  if (g?.__D1__) return g.__D1__ as D1Database
  return null
}

function isEnabled(): boolean {
  const g = globalThis as any
  if (g?.env?.DB || g?.DB || g?.__D1__) return true
  return process.env.D1_ENABLED === 'true'
}

export async function d1ListReservations(params: ListParams): Promise<ListResult> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()

  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10))
  const offset = (page - 1) * pageSize

  const where: string[] = []
  const binds: any[] = []
  if (params.status) {
    where.push('status = ?')
    binds.push(params.status)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rowsRes = await db
    .prepare(`SELECT * FROM reservations ${whereSql} ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?`)
    .bind(...binds, pageSize, offset)
    .all()
  const countRes = await db
    .prepare(`SELECT COUNT(1) as cnt FROM reservations ${whereSql}`)
    .bind(...binds)
    .first()

  const reservations = (rowsRes?.results ?? []) as ReservationRecord[]
  const total = (countRes?.cnt as number) ?? 0
  return { reservations, total, page, pageSize }
}

export async function d1GetReservationById(id: string): Promise<ReservationRecord | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()
  const row = await db.prepare('SELECT * FROM reservations WHERE id = ?').bind(id).first()
  return row ?? null
}

export async function d1CreateReservation(item: ReservationRecord): Promise<ReservationRecord> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()

  const sql = `INSERT INTO reservations (
    id, user_id, device_id, date, start_time, end_time, player_count,
    credit_type, fixed_credits, total_amount, user_notes, slot_type, status,
    created_at, updated_at, check_in_at, payment_method, payment_amount
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`

  await db
    .prepare(sql)
    .bind(
      item.id,
      item.user_id,
      item.device_id,
      item.date,
      item.start_time,
      item.end_time,
      item.player_count,
      item.credit_type,
      item.fixed_credits ?? null,
      item.total_amount,
      item.user_notes ?? null,
      item.slot_type,
      item.status,
      item.created_at,
      item.updated_at,
      item.check_in_at ?? null,
      item.payment_method ?? null,
      item.payment_amount ?? null
    )
    .run()

  return item
}

export async function d1DeleteReservation(id: string): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()
  const res = await db.prepare('DELETE FROM reservations WHERE id = ?').bind(id).run()
  // D1 doesn't return changes, assume success true indicates ran; verify by select
  const check = await d1GetReservationById(id)
  return !check
}

export async function d1UpdateReservation(id: string, patch: Partial<ReservationRecord>): Promise<ReservationRecord | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()
  const fields = Object.keys(patch) as (keyof ReservationRecord)[]
  if (fields.length === 0) return d1GetReservationById(id)
  const sets: string[] = []
  const binds: any[] = []
  for (const key of fields) {
    sets.push(`${key} = ?`)
    // @ts-ignore
    binds.push(patch[key])
  }
  sets.push('updated_at = ?')
  binds.push(new Date().toISOString())
  binds.push(id)
  const sql = `UPDATE reservations SET ${sets.join(', ')} WHERE id = ?`
  await db.prepare(sql).bind(...binds).run()
  return d1GetReservationById(id)
}

// Optional: rental_time_slots fetch for pricing engine
export async function d1GetTimeSlotById(id: number): Promise<any | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()
  const row = await db.prepare('SELECT * FROM rental_time_slots WHERE id = ?').bind(id).first()
  return row ?? null
}

// Pricing source by device type and credit option
export async function d1GetDevicePricing(deviceTypeId: number, optionType: string): Promise<any | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()
  const row = await db
    .prepare('SELECT * FROM device_pricing WHERE device_type_id = ? AND option_type = ?')
    .bind(deviceTypeId, optionType)
    .first()
  return row ?? null
}

// ---- Device Types CRUD ----
export async function d1ListDeviceTypes(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT * FROM device_types ORDER BY name').all()
  return res.results ?? []
}

export async function d1CreateDeviceType(data: { name: string; is_rentable: boolean; max_rentable_count: number; color_code: string | null }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO device_types (name, is_rentable, max_rentable_count, color_code, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .bind(data.name, data.is_rentable ? 1 : 0, data.max_rentable_count, data.color_code, now, now).run()
  const row = await db.prepare('SELECT * FROM device_types WHERE name = ?').bind(data.name).first()
  return row
}

export async function d1GetDeviceTypeById(id: number) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  return await db.prepare('SELECT * FROM device_types WHERE id = ?').bind(id).first()
}

export async function d1UpdateDeviceType(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  for (const k of ['name','is_rentable','max_rentable_count','color_code']) {
    if (k in patch) { fields.push(`${k} = ?`); binds.push(k === 'is_rentable' ? (patch[k] ? 1 : 0) : patch[k]) }
  }
  if (!fields.length) return d1GetDeviceTypeById(id)
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(id)
  await db.prepare(`UPDATE device_types SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return d1GetDeviceTypeById(id)
}

export async function d1DeleteDeviceType(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM device_types WHERE id = ?').bind(id).run()
  const exists = await d1GetDeviceTypeById(id)
  return !exists
}

// ---- Device Pricing CRUD ----
export async function d1ListDevicePricing(deviceTypeId: number): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT * FROM device_pricing WHERE device_type_id = ? ORDER BY option_type').bind(deviceTypeId).all()
  return res.results ?? []
}

export async function d1UpsertDevicePricing(deviceTypeId: number, data: { option_type: string; price: number; price_2p_extra: number | null; enable_extra_people: number; extra_per_person: number | null }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const exists = await db.prepare('SELECT id FROM device_pricing WHERE device_type_id = ? AND option_type = ?').bind(deviceTypeId, data.option_type).first()
  const now = new Date().toISOString()
  if (exists?.id) {
    await db.prepare('UPDATE device_pricing SET price = ?, price_2p_extra = ?, enable_extra_people = ?, extra_per_person = ?, updated_at = ? WHERE id = ?')
      .bind(data.price, data.price_2p_extra, data.enable_extra_people, data.extra_per_person, now, exists.id).run()
  } else {
    await db.prepare('INSERT INTO device_pricing (device_type_id, option_type, price, price_2p_extra, enable_extra_people, extra_per_person, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(deviceTypeId, data.option_type, data.price, data.price_2p_extra, data.enable_extra_people, data.extra_per_person, now, now).run()
  }
  return d1ListDevicePricing(deviceTypeId)
}

export async function d1DeleteDevicePricing(deviceTypeId: number, optionType: string): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM device_pricing WHERE device_type_id = ? AND option_type = ?').bind(deviceTypeId, optionType).run()
  const left = await d1ListDevicePricing(deviceTypeId)
  return true
}

// ---- Rental Time Blocks CRUD ----
export async function d1ListTimeBlocks(deviceTypeId: number): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT * FROM rental_time_blocks WHERE device_type_id = ? ORDER BY slot_type').bind(deviceTypeId).all()
  return res.results ?? []
}

export async function d1CreateTimeBlock(deviceTypeId: number, data: { slot_type: string; start_time: string; end_time: string; enable_extra_people: number; extra_per_person: number | null }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO rental_time_blocks (device_type_id, slot_type, start_time, end_time, enable_extra_people, extra_per_person, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(deviceTypeId, data.slot_type, data.start_time, data.end_time, data.enable_extra_people, data.extra_per_person, now, now).run()
  const res = await db.prepare('SELECT * FROM rental_time_blocks WHERE device_type_id = ? AND slot_type = ? AND start_time = ? AND end_time = ? ORDER BY id DESC').bind(deviceTypeId, data.slot_type, data.start_time, data.end_time).first()
  return res
}

export async function d1UpdateTimeBlock(deviceTypeId: number, blockId: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  for (const k of ['slot_type','start_time','end_time','enable_extra_people','extra_per_person']) {
    if (k in patch) { fields.push(`${k} = ?`); binds.push(patch[k]) }
  }
  if (!fields.length) return await db.prepare('SELECT * FROM rental_time_blocks WHERE id = ? AND device_type_id = ?').bind(blockId, deviceTypeId).first()
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(blockId, deviceTypeId)
  await db.prepare(`UPDATE rental_time_blocks SET ${fields.join(', ')} WHERE id = ? AND device_type_id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM rental_time_blocks WHERE id = ? AND device_type_id = ?').bind(blockId, deviceTypeId).first()
}

export async function d1DeleteTimeBlock(deviceTypeId: number, blockId: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM rental_time_blocks WHERE id = ? AND device_type_id = ?').bind(blockId, deviceTypeId).run()
  const row = await db.prepare('SELECT id FROM rental_time_blocks WHERE id = ?').bind(blockId).first()
  return !row
}

// ---- Aggregates for public APIs ----
export async function d1ListAvailableDevices(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const devicesRes = await db.prepare('SELECT * FROM device_types WHERE is_rentable = 1 ORDER BY name').all()
  const devices = (devicesRes.results ?? []) as any[]
  for (const d of devices) {
    const pricing = await d1ListDevicePricing(d.id)
    const blocks = await d1ListTimeBlocks(d.id)
    d.pricing = pricing
    d.time_blocks = blocks
  }
  return devices
}

// ---- User management ----
export async function d1ListUsers(filters?: { email?: string; name?: string }): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const where: string[] = []
  const binds: any[] = []
  if (filters?.email) { where.push('email LIKE ?'); binds.push(`%${filters.email}%`) }
  if (filters?.name) { where.push('name LIKE ?'); binds.push(`%${filters.name}%`) }
  const sql = `SELECT * FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC`
  const res = await db.prepare(sql).bind(...binds).all()
  return res.results ?? []
}

export async function d1GetUserById(userId: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  return await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
}

export async function d1GetUserByEmail(email: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  return await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
}

export async function d1UpsertUser(user: { id: string; email?: string; name?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const exists = await d1GetUserById(user.id)
  const now = new Date().toISOString()
  if (exists) {
    await db.prepare('UPDATE users SET email = COALESCE(?, email), name = COALESCE(?, name), updated_at = ? WHERE id = ?')
      .bind(user.email ?? null, user.name ?? null, now, user.id).run()
  } else {
    await db.prepare('INSERT INTO users (id, email, name, status, created_at, updated_at) VALUES (?,?,?,?,?,?)')
      .bind(user.id, user.email ?? null, user.name ?? null, 'active', now, now).run()
  }
  return d1GetUserById(user.id)
}

export async function d1ListUserRoles(userId: string): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT role_type, granted_at, granted_by FROM user_roles WHERE user_id = ?').bind(userId).all()
  return res.results ?? []
}

export async function d1AddUserRole(userId: string, roleType: string, grantedBy?: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_type, granted_at, granted_by) VALUES (?,?,?,?)')
    .bind(userId, roleType, new Date().toISOString(), grantedBy ?? null).run()
  return d1ListUserRoles(userId)
}

export async function d1RemoveUserRole(userId: string, roleType: string): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_type = ?').bind(userId, roleType).run()
  return true
}

export async function d1ListUserRestrictions(userId: string): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT * FROM user_restrictions WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
  return res.results ?? []
}

export async function d1AddUserRestriction(userId: string, data: { restriction_type: string; reason?: string; start_date?: string; end_date?: string; created_by?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('INSERT INTO user_restrictions (user_id, restriction_type, reason, start_date, end_date, created_at, created_by, is_active) VALUES (?,?,?,?,?,?,?,1)')
    .bind(userId, data.restriction_type, data.reason ?? null, data.start_date ?? null, data.end_date ?? null, new Date().toISOString(), data.created_by ?? null)
    .run()
  return d1ListUserRestrictions(userId)
}

export async function d1UpdateUserRestriction(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  for (const k of ['restriction_type','reason','start_date','end_date','is_active']) {
    if (k in patch) { fields.push(`${k} = ?`); binds.push(k === 'is_active' ? (patch[k] ? 1 : 0) : patch[k]) }
  }
  if (!fields.length) return null
  binds.push(id)
  await db.prepare(`UPDATE user_restrictions SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM user_restrictions WHERE id = ?').bind(id).first()
}

export async function d1SuspendUserForever(userId: string, reason?: string, created_by?: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').bind('suspended', new Date().toISOString(), userId).run()
  await d1AddUserRestriction(userId, { restriction_type: 'suspended', reason, created_by })
  return d1GetUserById(userId)
}

// ---- Analytics ----
export async function d1UsageStats(range?: { start?: string; end?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const where: string[] = []
  const binds: any[] = []
  if (range?.start) { where.push('date >= ?'); binds.push(range.start) }
  if (range?.end) { where.push('date <= ?'); binds.push(range.end) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const byDate = await db.prepare(`SELECT date, COUNT(1) as count FROM reservations ${whereSql} GROUP BY date ORDER BY date DESC`).bind(...binds).all()
  const byDevice = await db.prepare(`SELECT device_id, COUNT(1) as count FROM reservations ${whereSql} GROUP BY device_id ORDER BY count DESC`).bind(...binds).all()
  return { byDate: byDate.results ?? [], byDevice: byDevice.results ?? [] }
}

export async function d1SalesStats(range?: { start?: string; end?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const where: string[] = []
  const binds: any[] = []
  if (range?.start) { where.push('date >= ?'); binds.push(range.start) }
  if (range?.end) { where.push('date <= ?'); binds.push(range.end) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const byDate = await db.prepare(`SELECT date, SUM(total_amount) as total FROM reservations ${whereSql} GROUP BY date ORDER BY date DESC`).bind(...binds).all()
  const total = await db.prepare(`SELECT SUM(total_amount) as total FROM reservations ${whereSql}`).bind(...binds).first()
  return { byDate: byDate.results ?? [], total: total?.total ?? 0 }
}

// ---- User analytics ----
export async function d1UserAnalytics(userId: string, range?: { start?: string; end?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const where: string[] = ['user_id = ?']
  const binds: any[] = [userId]
  if (range?.start) { where.push('date >= ?'); binds.push(range.start) }
  if (range?.end) { where.push('date <= ?'); binds.push(range.end) }
  const whereSql = `WHERE ${where.join(' AND ')}`
  const byDeviceRows = await db.prepare(`SELECT device_id, COUNT(1) as count FROM reservations ${whereSql} GROUP BY device_id ORDER BY count DESC`).bind(...binds).all()
  const byDevice = await mapDeviceNames(db, byDeviceRows.results ?? [])
  const most = byDevice[0] ?? null
  const byWeekdayRows = await db.prepare(`SELECT strftime('%w', date) as weekday, COUNT(1) as count FROM reservations ${whereSql} GROUP BY weekday ORDER BY weekday`).bind(...binds).all()
  const byWeekday = mapWeekdaysKo(byWeekdayRows.results ?? [])
  const bySlot = await db.prepare(`SELECT slot_type, COUNT(1) as count FROM reservations ${whereSql} GROUP BY slot_type`).bind(...binds).all()
  return {
    byDevice: byDevice.results ?? [],
    mostRented: most,
    byWeekday,
    bySlot: bySlot.results ?? [],
  }
}

// ---- Admin analytics ----
export async function d1AdminAnalytics(range?: { start?: string; end?: string }, mode?: 'month' | 'year') {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const where: string[] = []
  const binds: any[] = []
  if (range?.start) { where.push('date >= ?'); binds.push(range.start) }
  if (range?.end) { where.push('date <= ?'); binds.push(range.end) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const byDeviceRows = await db.prepare(`SELECT device_id, COUNT(1) as count FROM reservations ${whereSql} GROUP BY device_id ORDER BY count DESC`).bind(...binds).all()
  const byDevice = await mapDeviceNames(db, byDeviceRows.results ?? [])
  const most = byDevice[0] ?? null
  const byWeekdayRows = await db.prepare(`SELECT strftime('%w', date) as weekday, COUNT(1) as count FROM reservations ${whereSql} GROUP BY weekday ORDER BY weekday`).bind(...binds).all()
  const byWeekday = mapWeekdaysKo(byWeekdayRows.results ?? [])
  const bySlot = await db.prepare(`SELECT slot_type, COUNT(1) as count FROM reservations ${whereSql} GROUP BY slot_type`).bind(...binds).all()
  const byPayment = await db.prepare(`SELECT payment_method, COUNT(1) as count FROM reservations ${whereSql} GROUP BY payment_method`).bind(...binds).all()
  const noShow = await db.prepare(`SELECT COUNT(1) as cnt FROM reservations ${whereSql} AND status = 'no_show'`).bind(...binds).first().catch(async () => {
    // Fallback when no where: create proper SQL
    const noWhere = whereSql ? whereSql + " AND status = 'no_show'" : "WHERE status = 'no_show'"
    return await db.prepare(`SELECT COUNT(1) as cnt FROM reservations ${noWhere}`).bind(...binds).first()
  })

  let byPeriod: any[] | null = null
  if (mode === 'month') {
    byPeriod = (await db.prepare(`SELECT strftime('%Y-%m', date) as ym, COUNT(1) as count FROM reservations ${whereSql} GROUP BY ym ORDER BY ym DESC`).bind(...binds).all()).results ?? []
  } else if (mode === 'year') {
    byPeriod = (await db.prepare(`SELECT strftime('%Y', date) as y, COUNT(1) as count FROM reservations ${whereSql} GROUP BY y ORDER BY y DESC`).bind(...binds).all()).results ?? []
  }

  return {
    byDevice,
    mostRented: most,
    byWeekday,
    bySlot: bySlot.results ?? [],
    byPayment: byPayment.results ?? [],
    noShowCount: noShow?.cnt ?? 0,
    byPeriod,
  }
}

export async function d1DailySales(date: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const rows = await db.prepare(`SELECT payment_method, SUM(COALESCE(payment_amount, total_amount)) as total FROM reservations WHERE date = ? GROUP BY payment_method`).bind(date).all()
  const list = rows.results ?? []
  let cash = 0, transfer = 0
  for (const r of list) {
    if (r.payment_method === 'cash') cash = Number(r.total || 0)
    if (r.payment_method === 'transfer') transfer = Number(r.total || 0)
  }
  return { date, cash, transfer, total: cash + transfer }
}

export async function d1ConfirmReservationPayment(resvId: string, method: string, amount: number) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('UPDATE reservations SET payment_method = ?, payment_amount = ?, payment_status = ?, payment_confirmed_at = ?, updated_at = ? WHERE id = ?')
    .bind(method, amount, 'paid', now, now, resvId).run()
  return await db.prepare('SELECT * FROM reservations WHERE id = ?').bind(resvId).first()
}

// helpers
function mapWeekdaysKo(rows: any[]): any[] {
  const names = ['일','월','화','수','목','금','토']
  return rows.map(r => ({ weekday: names[Number(r.weekday) || 0], count: r.count }))
}

async function mapDeviceNames(db: any, rows: any[]): Promise<any[]> {
  const out: any[] = []
  for (const r of rows) {
    let name = null
    const idNum = Number(r.device_id)
    if (!Number.isNaN(idNum)) {
      const row = await db.prepare('SELECT name FROM device_types WHERE id = ?').bind(idNum).first()
      name = row?.name ?? null
    }
    if (!name) {
      const row2 = await db.prepare('SELECT name FROM device_types WHERE name = ?').bind(String(r.device_id)).first()
      name = row2?.name ?? String(r.device_id)
    }
    out.push({ device_id: r.device_id, device_name: name, count: r.count })
  }
  return out
}

// ---- Ranking & Roles ----
export async function d1ComputeMonthlyRanking(year?: string, month?: string): Promise<Array<{ user_id: string; count: number; rank: number }>> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  // KST 기준으로 간주: date 컬럼은 YYYY-MM-DD 텍스트
  const y = year || new Date().toISOString().slice(0, 4)
  const m = month || (new Date().toISOString().slice(5, 7))
  const ym = `${y}-${m.padStart(2, '0')}`
  const rows = await db.prepare(`SELECT user_id, COUNT(1) AS cnt FROM reservations WHERE strftime('%Y-%m', date) = ? GROUP BY user_id ORDER BY cnt DESC`).bind(ym).all()
  const list = (rows.results ?? []) as Array<{ user_id: string; cnt: number }>
  // assign rank
  let rank = 0; let prevCnt = -1; let idx = 0
  const out: Array<{ user_id: string; count: number; rank: number }> = []
  for (const r of list) {
    idx += 1
    const c = Number(r.cnt || 0)
    if (c !== prevCnt) { rank = idx; prevCnt = c }
    out.push({ user_id: r.user_id, count: c, rank })
  }
  return out
}

export async function d1ApplyRolesFromRanking(ranking: Array<{ user_id: string; rank: number }>) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  // build sets
  const vip = new Set(ranking.filter(r => r.rank >= 1 && r.rank <= 5).map(r => r.user_id))
  const regular = new Set(ranking.filter(r => r.rank >= 6 && r.rank <= 20).map(r => r.user_id))
  // Remove gp_* roles, keep super_admin/restricted
  await db.prepare(`DELETE FROM user_roles WHERE role_type IN ('gp_vip','gp_regular','gp_user')`).run()
  // Apply new roles (vip/regular); others become gp_user lazily on demand if 필요
  const now = new Date().toISOString()
  for (const userId of vip) {
    await db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_type, granted_at, granted_by) VALUES (?,?,?,?)')
      .bind(userId, 'gp_vip', now, 'system_ranking').run()
  }
  for (const userId of regular) {
    if (!vip.has(userId)) {
      await db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_type, granted_at, granted_by) VALUES (?,?,?,?)')
        .bind(userId, 'gp_regular', now, 'system_ranking').run()
    }
  }
  return { vip: vip.size, regular: regular.size }
}

// ---- Ranking (monthly) ----
function ymStartEnd(period?: 'month' | 'year', base?: Date): { start: string; end: string } {
  const d = base ? new Date(base) : new Date()
  if (period === 'year') {
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const end = new Date(Date.UTC(d.getUTCFullYear() + 1, 0, 1))
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export async function d1MonthlyRanking(params?: { period?: 'month' | 'year'; page?: number; pageSize?: number; baseDate?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20))
  const offset = (page - 1) * pageSize
  const { start, end } = ymStartEnd(params?.period ?? 'month', params?.baseDate ? new Date(params.baseDate) : undefined)

  const rowsRes = await db
    .prepare(`SELECT user_id, COUNT(1) as cnt FROM reservations WHERE date >= ? AND date < ? GROUP BY user_id ORDER BY cnt DESC, user_id ASC LIMIT ? OFFSET ?`)
    .bind(start, end, pageSize, offset)
    .all()
  const allCountRes = await db
    .prepare(`SELECT COUNT(1) as users FROM (SELECT user_id FROM reservations WHERE date >= ? AND date < ? GROUP BY user_id)`)
    .bind(start, end)
    .first()
  const items = (rowsRes?.results ?? []) as Array<{ user_id: string; cnt: number }>
  // compute ranks for this page segment (global ranks require offset)
  const ranked = items.map((r, i) => ({ ...r, rank: offset + i + 1 }))
  return { start, end, items: ranked, totalUsers: (allCountRes?.users as number) ?? 0, page, pageSize }
}

export async function d1UserMonthlyRank(userId: string, period?: 'month' | 'year', baseDate?: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const { start, end } = ymStartEnd(period ?? 'month', baseDate ? new Date(baseDate) : undefined)

  // user's count in period
  const myCntRes = await db
    .prepare(`SELECT COUNT(1) as cnt FROM reservations WHERE user_id = ? AND date >= ? AND date < ?`)
    .bind(userId, start, end)
    .first()
  const myCount = (myCntRes?.cnt as number) ?? 0

  if (myCount === 0) {
    return { start, end, count: 0, rank: null as number | null }
  }

  // number of users with higher count
  const higherRes = await db
    .prepare(`SELECT COUNT(1) as higher FROM (SELECT user_id, COUNT(1) as cnt FROM reservations WHERE date >= ? AND date < ? GROUP BY user_id HAVING cnt > ?)`)
    .bind(start, end, myCount)
    .first()
  const higher = (higherRes?.higher as number) ?? 0
  return { start, end, count: myCount, rank: higher + 1 }
}

// ---- CMS: Terms ----
export async function d1ListTerms(type?: string): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const sql = type ? 'SELECT * FROM terms_pages WHERE type = ? ORDER BY version DESC' : 'SELECT * FROM terms_pages ORDER BY type, version DESC'
  const res = await db.prepare(sql).bind(...(type ? [type] : [])).all()
  return res.results ?? []
}

export async function d1GetActiveTerms(type: string): Promise<any | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT * FROM terms_pages WHERE type = ? AND is_active = 1 ORDER BY version DESC LIMIT 1').bind(type).first()
  return row ?? null
}

export async function d1CreateTerms(data: { type: string; version: number; title: string; content: string; is_active?: boolean }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO terms_pages (type, version, title, content, is_active, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(data.type, data.version, data.title, data.content, data.is_active ? 1 : 0, data.is_active ? now : null, now, now).run()
  const row = await db.prepare('SELECT * FROM terms_pages WHERE type = ? AND version = ?').bind(data.type, data.version).first()
  return row
}

export async function d1UpdateTerms(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  for (const k of ['title','content','version']) { if (k in patch) { fields.push(`${k} = ?`); binds.push(patch[k]) } }
  if (!fields.length) return await db.prepare('SELECT * FROM terms_pages WHERE id = ?').bind(id).first()
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(id)
  await db.prepare(`UPDATE terms_pages SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM terms_pages WHERE id = ?').bind(id).first()
}

export async function d1ActivateTerms(id: number) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT type FROM terms_pages WHERE id = ?').bind(id).first()
  if (!row?.type) return null
  const now = new Date().toISOString()
  await db.prepare('UPDATE terms_pages SET is_active = 0 WHERE type = ?').bind(row.type).run()
  await db.prepare('UPDATE terms_pages SET is_active = 1, published_at = ?, updated_at = ? WHERE id = ?').bind(now, now, id).run()
  return await db.prepare('SELECT * FROM terms_pages WHERE id = ?').bind(id).first()
}

export async function d1DeleteTerms(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM terms_pages WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM terms_pages WHERE id = ?').bind(id).first()
  return !row
}

// ---- CMS: Guides ----
export async function d1ListGuideCategories(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT * FROM guide_categories ORDER BY display_order, name').all()
  return res.results ?? []
}

// ---- Age Verification ----
export async function d1GetAgeVerification(userId: string): Promise<any | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT * FROM age_verifications WHERE user_id = ?').bind(userId).first()
  return row ?? { user_id: userId, is_verified: 0, verified_at: null }
}

export async function d1SetAgeVerified(userId: string, verifiedBy?: string, method?: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO age_verifications (user_id, is_verified, verified_at, verified_by, method) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET is_verified=1, verified_at=?, verified_by=?, method=?')
    .bind(userId, 1, now, verifiedBy ?? null, method ?? null, now, verifiedBy ?? null, method ?? null).run()
  return d1GetAgeVerification(userId)
}

export async function d1UnsetAgeVerified(userId: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('UPDATE age_verifications SET is_verified = 0, verified_at = NULL, verified_by = NULL WHERE user_id = ?').bind(userId).run()
  return d1GetAgeVerification(userId)
}

// ---- User profile image ----
export async function d1UpdateUserImage(userId: string, imageUrl: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('UPDATE users SET image_url = ?, updated_at = ? WHERE id = ?').bind(imageUrl, new Date().toISOString(), userId).run()
  return d1GetUserById(userId)
}

// ---- Push subscriptions ----
export async function d1UpsertPushSubscription(userId: string, subscription: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('INSERT INTO push_subscriptions (user_id, subscription, created_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET subscription = ?')
    .bind(userId, JSON.stringify(subscription), new Date().toISOString(), JSON.stringify(subscription)).run()
  return true
}

export async function d1RemovePushSubscription(userId: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').bind(userId).run()
  return true
}

export async function d1GetPushSubscription(userId: string): Promise<any | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT subscription FROM push_subscriptions WHERE user_id = ?').bind(userId).first()
  return row?.subscription ? JSON.parse(row.subscription) : null
}

export async function d1LogPushNotification(data: { user_id?: string; type?: string; title?: string; body?: string; payload?: any; status: string; error?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('INSERT INTO push_notification_logs (user_id, type, title, body, data, status, error, sent_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(data.user_id ?? null, data.type ?? null, data.title ?? null, data.body ?? null, JSON.stringify(data.payload ?? null), data.status, data.error ?? null, new Date().toISOString()).run()
  return true
}

// ---- Push templates ----
export async function d1ListPushTemplates(): Promise<any[]> {
  if (!isEnabled()) return notConfigured(); const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT * FROM push_templates ORDER BY template_key').all()
  return res.results ?? []
}

export async function d1CreatePushTemplate(data: { template_key: string; title: string; body: string; data?: any }) {
  if (!isEnabled()) return notConfigured(); const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO push_templates (template_key, title, body, data, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .bind(data.template_key, data.title, data.body, JSON.stringify(data.data ?? null), now, now).run()
  return await db.prepare('SELECT * FROM push_templates WHERE template_key = ?').bind(data.template_key).first()
}

export async function d1UpdatePushTemplate(id: number, patch: any) {
  if (!isEnabled()) return notConfigured(); const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []; const binds: any[] = []
  if ('template_key' in patch) { fields.push('template_key = ?'); binds.push(patch.template_key) }
  if ('title' in patch) { fields.push('title = ?'); binds.push(patch.title) }
  if ('body' in patch) { fields.push('body = ?'); binds.push(patch.body) }
  if ('data' in patch) { fields.push('data = ?'); binds.push(JSON.stringify(patch.data)) }
  if (!fields.length) return await db.prepare('SELECT * FROM push_templates WHERE id = ?').bind(id).first()
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(id)
  await db.prepare(`UPDATE push_templates SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM push_templates WHERE id = ?').bind(id).first()
}

export async function d1DeletePushTemplate(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured(); const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM push_templates WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM push_templates WHERE id = ?').bind(id).first()
  return !row
}

export async function d1GetPushTemplateByKey(template_key: string): Promise<any | null> {
  if (!isEnabled()) return notConfigured(); const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT * FROM push_templates WHERE template_key = ?').bind(template_key).first()
  return row ?? null
}

// ---- Admin payment QR helpers ----
export async function d1GetPaymentQr(adminUserId: string): Promise<any | null> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT * FROM payment_qr_codes WHERE admin_user_id = ?').bind(adminUserId).first()
  return row ?? null
}

export async function d1SetPaymentQr(adminUserId: string, imageUrl: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO payment_qr_codes (admin_user_id, image_url, updated_at) VALUES (?,?,?) ON CONFLICT(admin_user_id) DO UPDATE SET image_url = ?, updated_at = ?')
    .bind(adminUserId, imageUrl, now, imageUrl, now).run()
  return d1GetPaymentQr(adminUserId)
}

// ---- Banned words ----
export async function d1ListBannedWords(activeOnly?: boolean): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const sql = activeOnly ? 'SELECT * FROM banned_words WHERE is_active = 1 ORDER BY word' : 'SELECT * FROM banned_words ORDER BY word'
  const res = await db.prepare(sql).all()
  return res.results ?? []
}

export async function d1CreateBannedWord(data: { word: string; category?: string; severity?: string; created_by?: string; is_active?: boolean }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('INSERT INTO banned_words (word, category, severity, is_active, created_at, created_by) VALUES (?,?,?,?,?,?)')
    .bind(data.word, data.category ?? 'custom', data.severity ?? 'medium', data.is_active ? 1 : 1, new Date().toISOString(), data.created_by ?? null).run()
  return await db.prepare('SELECT * FROM banned_words WHERE word = ?').bind(data.word).first()
}

export async function d1UpdateBannedWord(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []; const binds: any[] = []
  for (const k of ['word','category','severity','is_active']) { if (k in patch) { fields.push(`${k} = ?`); binds.push(k === 'is_active' ? (patch[k] ? 1 : 0) : patch[k]) } }
  if (!fields.length) return await db.prepare('SELECT * FROM banned_words WHERE id = ?').bind(id).first()
  binds.push(id)
  await db.prepare(`UPDATE banned_words SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM banned_words WHERE id = ?').bind(id).first()
}

export async function d1DeleteBannedWord(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM banned_words WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM banned_words WHERE id = ?').bind(id).first()
  return !row
}

export async function d1CheckBannedInText(text: string): Promise<{ matches: Array<{ word: string; category: string; severity: string }> }> {
  if (!isEnabled()) return notConfigured()
  const list = await d1ListBannedWords(true)
  const lower = text.toLowerCase()
  const matches = [] as Array<{ word: string; category: string; severity: string }>
  for (const w of list) {
    const word = String(w.word || '').toLowerCase()
    if (!word) continue
    if (lower.includes(word)) {
      matches.push({ word: w.word, category: w.category, severity: w.severity })
    }
  }
  return { matches }
}

export async function d1CreateGuideCategory(data: { slug: string; name: string; description?: string; display_order?: number; icon?: string }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO guide_categories (slug, name, description, display_order, icon, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
    .bind(data.slug, data.name, data.description ?? null, data.display_order ?? 0, data.icon ?? null, now, now).run()
  const row = await db.prepare('SELECT * FROM guide_categories WHERE slug = ?').bind(data.slug).first()
  return row
}

export async function d1UpdateGuideCategory(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []; const binds: any[] = []
  for (const k of ['slug','name','description','display_order','icon']) { if (k in patch) { fields.push(`${k} = ?`); binds.push(patch[k]) } }
  if (!fields.length) return await db.prepare('SELECT * FROM guide_categories WHERE id = ?').bind(id).first()
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(id)
  await db.prepare(`UPDATE guide_categories SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM guide_categories WHERE id = ?').bind(id).first()
}

export async function d1DeleteGuideCategory(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM guide_categories WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM guide_categories WHERE id = ?').bind(id).first()
  return !row
}

export async function d1ListGuideContents(categoryId?: number): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const sql = categoryId ? 'SELECT * FROM guide_contents WHERE category_id = ? ORDER BY display_order, updated_at DESC' : 'SELECT * FROM guide_contents ORDER BY updated_at DESC'
  const res = await db.prepare(sql).bind(...(categoryId ? [categoryId] : [])).all()
  return res.results ?? []
}

export async function d1CreateGuideContent(data: { category_id: number; title: string; content: string; is_published?: boolean; display_order?: number }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare('INSERT INTO guide_contents (category_id, title, content, is_published, display_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
    .bind(data.category_id, data.title, data.content, data.is_published ? 1 : 0, data.display_order ?? 0, now, now).run()
  const row = await db.prepare('SELECT * FROM guide_contents WHERE category_id = ? ORDER BY id DESC').bind(data.category_id).first()
  return row
}

export async function d1UpdateGuideContent(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []; const binds: any[] = []
  for (const k of ['title','content','is_published','display_order']) { if (k in patch) { fields.push(`${k} = ?`); binds.push(k === 'is_published' ? (patch[k] ? 1 : 0) : patch[k]) } }
  if (!fields.length) return await db.prepare('SELECT * FROM guide_contents WHERE id = ?').bind(id).first()
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(id)
  await db.prepare(`UPDATE guide_contents SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM guide_contents WHERE id = ?').bind(id).first()
}

export async function d1DeleteGuideContent(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM guide_contents WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM guide_contents WHERE id = ?').bind(id).first()
  return !row
}

// ---- Schedule events CRUD ----
export async function d1ListScheduleEvents(filters?: { date?: string }): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  if (filters?.date) {
    const res = await db
      .prepare('SELECT * FROM schedule_events WHERE date = ? OR (end_date IS NOT NULL AND end_date = ?) ORDER BY date, start_time')
      .bind(filters.date, filters.date)
      .all()
    return res.results ?? []
  }
  const res = await db.prepare('SELECT * FROM schedule_events ORDER BY date DESC, start_time DESC').all()
  return res.results ?? []
}

export async function d1CreateScheduleEvent(data: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db.prepare(`INSERT INTO schedule_events (title, description, date, end_date, type, start_time, end_time, affects_reservation, block_type, is_auto_generated, source_type, source_reference, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(
      String(data.title),
      data.description ?? null,
      String(data.date),
      data.end_date ?? null,
      String(data.type),
      data.start_time ?? null,
      data.end_time ?? null,
      data.affects_reservation ? 1 : 0,
      data.block_type ?? null,
      data.is_auto_generated ? 1 : 0,
      data.source_type ?? 'manual',
      data.source_reference ?? null,
      now,
      now
    )
    .run()
  const row = await db.prepare('SELECT * FROM schedule_events WHERE title = ? AND date = ? ORDER BY id DESC').bind(String(data.title), String(data.date)).first()
  return row
}

export async function d1GetScheduleEventById(id: number) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  return await db.prepare('SELECT * FROM schedule_events WHERE id = ?').bind(id).first()
}

export async function d1UpdateScheduleEvent(id: number, patch: any) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  for (const k of ['title','description','date','end_date','type','start_time','end_time','affects_reservation','block_type','is_auto_generated','source_type','source_reference']) {
    if (k in patch) { fields.push(`${k} = ?`); binds.push((k === 'affects_reservation' || k === 'is_auto_generated') ? (patch[k] ? 1 : 0) : patch[k]) }
  }
  if (!fields.length) return d1GetScheduleEventById(id)
  fields.push('updated_at = ?'); binds.push(new Date().toISOString()); binds.push(id)
  await db.prepare(`UPDATE schedule_events SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return d1GetScheduleEventById(id)
}

// ---- Public Machines helpers (categories, device types, devices, play modes) ----
export async function d1ListDeviceCategories(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db.prepare('SELECT id, name, display_order FROM device_categories ORDER BY display_order ASC, name ASC').all()
  return res.results ?? []
}

export async function d1ListDevicesByType(deviceTypeId: number): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db
    .prepare('SELECT id, device_number, status, device_type_id FROM devices WHERE device_type_id = ? ORDER BY device_number ASC')
    .bind(deviceTypeId)
    .all()
  return res.results ?? []
}

export async function d1ListPlayModesByType(deviceTypeId: number): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db
    .prepare('SELECT id, name, price, display_order FROM play_modes WHERE device_type_id = ? ORDER BY display_order ASC, name ASC')
    .bind(deviceTypeId)
    .all()
  return res.results ?? []
}

export async function d1ListActiveReservationsForToday(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const today = new Date().toISOString().split('T')[0]
  const res = await db
    .prepare("SELECT device_id, start_time, end_time, status FROM reservations WHERE date = ? AND status IN ('approved','checked_in')")
    .bind(today)
    .all()
  return res.results ?? []
}

export async function d1ListActiveMachineRules(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db
    .prepare('SELECT id, title, content, display_order, is_active FROM machine_rules WHERE is_active = 1 ORDER BY display_order ASC, id ASC')
    .all()
  return res.results ?? []
}

export async function d1DeleteScheduleEvent(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM schedule_events WHERE id = ?').bind(id).run()
  const row = await d1GetScheduleEventById(id)
  return !row
}
