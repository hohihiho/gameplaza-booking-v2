// Cloudflare D1 adapter (skeleton)
// NOTE: This is a placeholder. In non-D1 environments it should not be used.

import { ListParams, ListResult, ReservationRecord } from './types'

function notConfigured(): never {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  D1 database not configured in development environment - returning mock data')
    // Development mode에서는 에러를 던지지 않고 undefined를 반환하도록 수정
    // 이는 함수들이 적절한 기본값을 반환하도록 처리될 것
    return undefined as never
  }
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
  // 개발 환경에서는 로컬 SQLite 파일 사용
  if (process.env.NODE_ENV === 'development') {
    try {
      const Database = require('better-sqlite3')
      const path = require('path')

      // wrangler가 생성한 로컬 D1 SQLite 파일 경로
      const dbPath = path.join(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/57fb29910e3cb6b7201eef11d3947ba68901010d74719e30568814eec7acf596.sqlite')
      const db = new Database(dbPath)

      // D1 스타일 인터페이스로 래핑
      return {
        prepare: (sql: string) => {
          const stmt = db.prepare(sql)
          return {
            bind: (...args: any[]) => ({
              ...stmt,
              all: () => Promise.resolve({ results: stmt.all(...args) }),
              first: () => Promise.resolve(stmt.get(...args)),
              run: () => Promise.resolve({ success: true, meta: stmt.run(...args) })
            }),
            all: () => Promise.resolve({ results: stmt.all() }),
            first: () => Promise.resolve(stmt.get()),
            run: () => Promise.resolve({ success: true, meta: stmt.run() })
          }
        }
      } as D1Database
    } catch (error) {
      console.warn('⚠️  Failed to connect to local SQLite:', error)
      return null
    }
  }

  // 프로덕션 환경에서는 Cloudflare D1 사용
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
  if (!isEnabled()) {
    console.warn('⚠️  D1 not configured - returning empty reservation list')
    return { reservations: [], total: 0, page: 1, pageSize: 10 }
  }
  const db = getD1()
  if (!db) {
    console.warn('⚠️  D1 connection failed - returning empty reservation list')
    return { reservations: [], total: 0, page: 1, pageSize: 10 }
  }

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

// ---- Devices CRUD helpers ----
export async function d1UpdateDevice(id: string, patch: { status?: string; updated_at?: string; device_number?: number }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  if (patch.status !== undefined) { fields.push('status = ?'); binds.push(patch.status) }
  if (patch.device_number !== undefined) { fields.push('device_number = ?'); binds.push(patch.device_number) }
  fields.push('updated_at = ?'); binds.push(patch.updated_at ?? new Date().toISOString())
  binds.push(id)
  await db.prepare(`UPDATE devices SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM devices WHERE id = ?').bind(id).first()
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
  if (!isEnabled()) {
    console.warn('⚠️  D1 not configured - returning null for user')
    return null
  }
  const db = getD1()
  if (!db) {
    console.warn('⚠️  D1 connection failed - returning null for user')
    return null
  }
  return await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
}

export async function d1GetUserByEmail(email: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  return await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
}

export async function d1UpsertUser(user: { id: string; email?: string; name?: string }) {
  if (!isEnabled()) {
    console.warn('⚠️  D1 not configured - cannot upsert user, returning mock user')
    return { id: user.id, email: user.email, name: user.name, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  }
  const db = getD1()
  if (!db) {
    console.warn('⚠️  D1 connection failed - cannot upsert user, returning mock user')
    return { id: user.id, email: user.email, name: user.name, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  }
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
  if (!isEnabled()) {
    console.warn('⚠️  D1 not configured - returning empty role list')
    return []
  }
  const db = getD1()
  if (!db) {
    console.warn('⚠️  D1 connection failed - returning empty role list')
    return []
  }
  const res = await db.prepare('SELECT role_type, granted_at, granted_by FROM user_roles WHERE user_id = ?').bind(userId).all()
  return res.results ?? []
}

export async function d1GetUserRole(userId: string): Promise<string | null> {
  if (!isEnabled()) {
    console.warn('⚠️  D1 not configured - returning null role')
    return null
  }
  const db = getD1()
  if (!db) {
    console.warn('⚠️  D1 connection failed - returning null role')
    return null
  }
  const res = await db.prepare('SELECT role_type FROM user_roles WHERE user_id = ? ORDER BY granted_at DESC LIMIT 1').bind(userId).first()
  return res?.role_type || null
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

// ---- Admin/Dashboard counts ----
export async function d1CountReservationsOnDate(date: string): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT COUNT(1) as cnt FROM reservations WHERE date = ?').bind(date).first()
  return Number(row?.cnt ?? 0)
}

export async function d1CountReservationsSinceDate(date: string): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT COUNT(1) as cnt FROM reservations WHERE date >= ?').bind(date).first()
  return Number(row?.cnt ?? 0)
}

export async function d1CountUsers(): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT COUNT(1) as cnt FROM users').first()
  return Number(row?.cnt ?? 0)
}

export async function d1CountActiveDevices(): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db
    .prepare("SELECT COUNT(1) as cnt FROM devices WHERE status IN ('available','in_use','maintenance','reserved')")
    .first()
  return Number(row?.cnt ?? 0)
}

export async function d1CountDevices(): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT COUNT(1) as cnt FROM devices').first()
  return Number(row?.cnt ?? 0)
}

export async function d1Ping(): Promise<{ ok: boolean }> {
  try {
    const db = getD1(); if (!db) return { ok: false }
    await db.prepare('SELECT 1').first()
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

// ---- Restrictions listing ----
export async function d1ListActiveRestrictionsByType(type: 'restricted' | 'suspended'): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const sql = `SELECT ur.*, u.email, u.name FROM user_restrictions ur LEFT JOIN users u ON ur.user_id = u.id WHERE ur.is_active = 1 AND ur.restriction_type = ? ORDER BY ur.created_at DESC`
  const res = await db.prepare(sql).bind(type).all()
  return res.results ?? []
}

export async function d1DeactivateExpiredRestrictionsForUser(userId: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db
    .prepare("UPDATE user_restrictions SET is_active = 0 WHERE user_id = ? AND is_active = 1 AND end_date IS NOT NULL AND end_date < ?")
    .bind(userId, now)
    .run()
  return true
}

export async function d1UnbanAndUnrestrictUser(userId: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare("UPDATE users SET status = 'active', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), userId).run()
  await db.prepare('UPDATE user_restrictions SET is_active = 0 WHERE user_id = ? AND is_active = 1').bind(userId).run()
  return true
}

// ---- Admin Users listing (search, filter, pagination) ----
export async function d1SearchUsersPaged(params: { page: number; pageSize: number; search?: string; filter?: 'all'|'active'|'blacklisted' }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const page = Math.max(1, params.page)
  const pageSize = Math.min(100, Math.max(1, params.pageSize))
  const offset = (page - 1) * pageSize

  const where: string[] = []
  const binds: any[] = []
  if (params.search) {
    where.push('(email LIKE ? OR name LIKE ?)')
    const pattern = `%${params.search}%`
    binds.push(pattern, pattern)
  }
  // Build base SQL with computed blacklist flag
  const baseSql = `SELECT u.*, (
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM user_restrictions ur WHERE ur.user_id = u.id AND ur.is_active = 1
    ) THEN 1 ELSE 0 END
  ) AS is_blacklisted
  FROM users u`
  let whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : ''

  // Filter by blacklist/active
  if (params.filter === 'blacklisted') {
    whereSql += (whereSql ? ' AND ' : ' WHERE ') + `(
      EXISTS (SELECT 1 FROM user_restrictions ur WHERE ur.user_id = u.id AND ur.is_active = 1)
    )`
  } else if (params.filter === 'active') {
    whereSql += (whereSql ? ' AND ' : ' WHERE ') + `(
      NOT EXISTS (SELECT 1 FROM user_restrictions ur WHERE ur.user_id = u.id AND ur.is_active = 1)
    )`
  }

  // Data page
  const listSql = `${baseSql}${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const listRes = await db.prepare(listSql).bind(...binds, pageSize, offset).all()

  // Count
  const countSql = `SELECT COUNT(1) as cnt FROM users u${whereSql}`
  const countRes = await db.prepare(countSql).bind(...binds).first()
  const total = Number((countRes as any)?.cnt ?? 0)

  return { users: listRes.results ?? [], total, page, pageSize }
}

export async function d1DeactivateUserRestrictions(userId: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('UPDATE user_restrictions SET is_active = 0 WHERE user_id = ? AND is_active = 1').bind(userId).run()
  return true
}

export async function d1SetUserRole(userId: string, roleType: string, grantedBy?: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  // Remove existing roles then add one role
  await db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userId).run()
  await db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_type, granted_at, granted_by) VALUES (?,?,?,?)')
    .bind(userId, roleType, new Date().toISOString(), grantedBy ?? null)
    .run()
  return d1ListUserRoles(userId)
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

// ---- Reservations listing by user with filters/pagination ----
export async function d1ListReservationsByUserPaged(userId: string, opts: { status?: string; date?: string; deviceId?: string; page: number; pageSize: number }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const page = Math.max(1, opts.page)
  const pageSize = Math.min(100, Math.max(1, opts.pageSize))
  const offset = (page - 1) * pageSize

  const where: string[] = ['r.user_id = ?']
  const binds: any[] = [userId]
  if (opts.status && opts.status !== 'all') { where.push('r.status = ?'); binds.push(opts.status) }
  if (opts.date) { where.push('r.date = ?'); binds.push(opts.date) }
  if (opts.deviceId) { where.push('r.device_id = ?'); binds.push(opts.deviceId) }
  const whereSql = `WHERE ${where.join(' AND ')}`

  const listSql = `
    SELECT r.*, d.device_number, dt.name as device_type_name, dt.model_name
    FROM reservations r
    LEFT JOIN devices d ON r.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `
  const listRes = await db.prepare(listSql).bind(...binds, pageSize, offset).all()

  const countSql = `SELECT COUNT(1) as cnt FROM reservations r ${whereSql}`
  const countRes = await db.prepare(countSql).bind(...binds).first()
  const total = Number((countRes as any)?.cnt ?? 0)

  return { reservations: listRes.results ?? [], total, page, pageSize }
}

// Flexible search for reservations with status set and date range
export async function d1SearchReservationsPaged(filters: { userId: string; statuses?: string[]; dateFrom?: string; dateTo?: string; page: number; pageSize: number }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const page = Math.max(1, filters.page)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize))
  const offset = (page - 1) * pageSize

  const where: string[] = ['r.user_id = ?']
  const binds: any[] = [filters.userId]
  if (filters.statuses && filters.statuses.length) {
    const placeholders = filters.statuses.map(() => '?').join(',')
    where.push(`r.status IN (${placeholders})`)
    binds.push(...filters.statuses)
  }
  if (filters.dateFrom) { where.push('r.date >= ?'); binds.push(filters.dateFrom) }
  if (filters.dateTo) { where.push('r.date <= ?'); binds.push(filters.dateTo) }
  const whereSql = `WHERE ${where.join(' AND ')}`

  const listSql = `
    SELECT r.*, d.device_number, dt.name as device_type_name, dt.model_name
    FROM reservations r
    LEFT JOIN devices d ON r.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    ${whereSql}
    ORDER BY r.date DESC, r.start_time DESC
    LIMIT ? OFFSET ?
  `
  const listRes = await db.prepare(listSql).bind(...binds, pageSize, offset).all()
  const countSql = `SELECT COUNT(1) as cnt FROM reservations r ${whereSql}`
  const countRes = await db.prepare(countSql).bind(...binds).first()
  const total = Number((countRes as any)?.cnt ?? 0)
  return { reservations: listRes.results ?? [], total, page, pageSize }
}

// ========== 통계 관련 ========== //

/**
 * 기기별 통계 조회
 */
export async function d1GetDeviceStatistics(
  params: {
    userId?: string
    deviceId?: string
    startDate: string
    endDate: string
  }
) {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()

  try {
    // 1. 기본 통계 쿼리
    let baseQuery = `
      SELECT
        d.id as device_id,
        d.device_number,
        dt.name as device_name,
        dt.model_name,
        COUNT(DISTINCT r.id) as total_reservations,
        COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_reservations,
        COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.id END) as cancelled_reservations,
        SUM(CASE WHEN r.status = 'completed' THEN COALESCE(r.final_price, 0) ELSE 0 END) as total_revenue,
        SUM(CASE WHEN r.status = 'completed' THEN
          (CAST(r.end_hour AS INTEGER) - CAST(r.start_hour AS INTEGER))
        ELSE 0 END) as total_hours
      FROM devices d
      LEFT JOIN device_types dt ON d.device_type_id = dt.id
      LEFT JOIN reservations r ON d.id = r.device_id
        AND r.date >= ? AND r.date <= ?
    `

    const queryParams: any[] = [params.startDate, params.endDate]

    if (params.userId) {
      baseQuery += ` AND r.user_id = ?`
      queryParams.push(params.userId)
    }

    if (params.deviceId) {
      baseQuery += ` WHERE d.id = ?`
      queryParams.push(params.deviceId)
    }

    baseQuery += ` GROUP BY d.id, d.device_number, dt.name, dt.model_name`

    const result = await db.prepare(baseQuery).bind(...queryParams).all()

    // 2. 인기 시간대 분석
    let timeSlotQuery = `
      SELECT
        r.device_id,
        r.start_hour,
        r.end_hour,
        COUNT(*) as count
      FROM reservations r
      WHERE r.date >= ? AND r.date <= ?
        AND r.status = 'completed'
    `

    const timeSlotParams: any[] = [params.startDate, params.endDate]

    if (params.userId) {
      timeSlotQuery += ` AND r.user_id = ?`
      timeSlotParams.push(params.userId)
    }

    if (params.deviceId) {
      timeSlotQuery += ` AND r.device_id = ?`
      timeSlotParams.push(params.deviceId)
    }

    timeSlotQuery += ` GROUP BY r.device_id, r.start_hour, r.end_hour
                        ORDER BY count DESC`

    const timeSlots = await db.prepare(timeSlotQuery).bind(...timeSlotParams).all()

    // 3. 데이터 가공
    const devices = result.results?.map((device: any) => {
      const deviceTimeSlots = timeSlots.results?.filter((ts: any) => ts.device_id === device.device_id) || []
      const utilizationRate = device.total_hours ? (device.total_hours / (24 * 7)) * 100 : 0 // 주간 기준

      return {
        deviceId: device.device_id,
        deviceNumber: device.device_number,
        deviceName: device.model_name ? `${device.device_name} ${device.model_name}` : device.device_name,
        statistics: {
          totalReservations: device.total_reservations || 0,
          completedReservations: device.completed_reservations || 0,
          cancelledReservations: device.cancelled_reservations || 0,
          totalRevenue: device.total_revenue || 0,
          totalHours: device.total_hours || 0,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          averageHoursPerReservation: device.completed_reservations > 0
            ? Math.round((device.total_hours / device.completed_reservations) * 100) / 100
            : 0,
          averageRevenuePerHour: device.total_hours > 0
            ? Math.round(device.total_revenue / device.total_hours)
            : 0,
          popularTimeSlots: deviceTimeSlots.slice(0, 5).map((ts: any) => ({
            timeRange: `${ts.start_hour}~${ts.end_hour}시`,
            count: ts.count
          }))
        }
      }
    }) || []

    // 4. 요약 정보
    const totalDevices = devices.length
    const avgUtilization = totalDevices > 0
      ? devices.reduce((sum: number, d: any) => sum + d.statistics.utilizationRate, 0) / totalDevices
      : 0

    const mostPopular = devices.reduce((max: any, d: any) =>
      !max || d.statistics.totalReservations > max.statistics.totalReservations ? d : max
    , null)

    const highestRevenue = devices.reduce((max: any, d: any) =>
      !max || d.statistics.totalRevenue > max.statistics.totalRevenue ? d : max
    , null)

    return {
      devices,
      summary: {
        totalDevices,
        averageUtilizationRate: Math.round(avgUtilization * 100) / 100,
        mostPopularDevice: mostPopular ? {
          deviceId: mostPopular.deviceId,
          deviceNumber: mostPopular.deviceNumber,
          reservationCount: mostPopular.statistics.totalReservations
        } : null,
        highestRevenueDevice: highestRevenue ? {
          deviceId: highestRevenue.deviceId,
          deviceNumber: highestRevenue.deviceNumber,
          revenue: highestRevenue.statistics.totalRevenue
        } : null
      }
    }
  } catch (error) {
    console.error('[D1] Device statistics error:', error)
    throw error
  }
}

/**
 * 예약 통계 조회
 */
export async function d1GetReservationStatistics(
  params: {
    userId: string
    startDate: string
    endDate: string
  }
) {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()

  try {
    // 1. 기본 통계
    const statsQuery = `
      SELECT
        COUNT(*) as total_reservations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reservations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_reservations,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_reservations,
        SUM(CASE WHEN status = 'completed' THEN COALESCE(final_price, 0) ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN
          CAST(end_hour AS INTEGER) - CAST(start_hour AS INTEGER)
        END) as avg_duration
      FROM reservations
      WHERE user_id = ? AND date >= ? AND date <= ?
    `

    const stats = await db.prepare(statsQuery)
      .bind(params.userId, params.startDate, params.endDate)
      .first()

    // 2. 시간대별 분포
    const hourQuery = `
      SELECT
        start_hour,
        end_hour,
        COUNT(*) as count
      FROM reservations
      WHERE user_id = ? AND date >= ? AND date <= ?
        AND status = 'completed'
      GROUP BY start_hour, end_hour
      ORDER BY count DESC
    `

    const hours = await db.prepare(hourQuery)
      .bind(params.userId, params.startDate, params.endDate)
      .all()

    // 3. 기기별 사용 현황
    const deviceQuery = `
      SELECT
        d.id as device_id,
        d.device_number,
        dt.name as device_name,
        dt.model_name,
        COUNT(r.id) as count
      FROM reservations r
      JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.device_type_id = dt.id
      WHERE r.user_id = ? AND r.date >= ? AND r.date <= ?
        AND r.status = 'completed'
      GROUP BY d.id, d.device_number, dt.name, dt.model_name
      ORDER BY count DESC
      LIMIT 5
    `

    const devices = await db.prepare(deviceQuery)
      .bind(params.userId, params.startDate, params.endDate)
      .all()

    // 4. 요일별 패턴
    const weekdayQuery = `
      SELECT
        CAST(strftime('%w', date) AS INTEGER) as weekday,
        COUNT(*) as count
      FROM reservations
      WHERE user_id = ? AND date >= ? AND date <= ?
        AND status = 'completed'
      GROUP BY weekday
      ORDER BY weekday
    `

    const weekdays = await db.prepare(weekdayQuery)
      .bind(params.userId, params.startDate, params.endDate)
      .all()

    // 5. 일별/월별 데이터
    const dailyQuery = `
      SELECT
        date,
        COUNT(*) as reservations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM reservations
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY date
      ORDER BY date
    `

    const daily = await db.prepare(dailyQuery)
      .bind(params.userId, params.startDate, params.endDate)
      .all()

    // 계산
    const totalReservations = (stats as any)?.total_reservations || 0
    const completedReservations = (stats as any)?.completed_reservations || 0
    const cancelledReservations = (stats as any)?.cancelled_reservations || 0
    const noShowReservations = (stats as any)?.no_show_reservations || 0
    const totalRevenue = (stats as any)?.total_revenue || 0
    const avgDuration = (stats as any)?.avg_duration || 0

    const completionRate = totalReservations > 0
      ? (completedReservations / totalReservations) * 100
      : 0

    const cancellationRate = totalReservations > 0
      ? (cancelledReservations / totalReservations) * 100
      : 0

    const noShowRate = totalReservations > 0
      ? (noShowReservations / totalReservations) * 100
      : 0

    // 일수 계산
    const startDateObj = new Date(params.startDate)
    const endDateObj = new Date(params.endDate)
    const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      statistics: {
        totalUsages: totalReservations,
        completedUsages: completedReservations,
        cancelledUsages: cancelledReservations,
        noShowUsages: noShowReservations,
        totalRevenue,
        averageUsageDuration: Math.round(avgDuration * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        noShowRate: Math.round(noShowRate * 100) / 100,
        averageRevenuePerUsage: completedReservations > 0
          ? Math.round(totalRevenue / completedReservations)
          : 0,
        averageUsagesPerDay: Math.round((totalReservations / days) * 100) / 100,
        averageRevenuePerDay: Math.round(totalRevenue / days)
      },
      chartData: {
        monthlyData: daily.results || [],
        deviceUsage: (devices.results || []).map((d: any) => ({
          deviceId: d.device_id,
          name: d.model_name ? `${d.device_name} ${d.model_name}` : d.device_name,
          count: d.count,
          percentage: totalReservations > 0
            ? Math.round((d.count / totalReservations) * 100)
            : 0
        })),
        preferredHours: (hours.results || []).map((h: any) => ({
          timeRange: `${h.start_hour}~${h.end_hour}시`,
          count: h.count,
          percentage: totalReservations > 0
            ? Math.round((h.count / totalReservations) * 100)
            : 0
        })),
        weekdayPattern: ['일', '월', '화', '수', '목', '금', '토'].map((name, index) => {
          const data = weekdays.results?.find((w: any) => w.weekday === index)
          return {
            dayIndex: index,
            name,
            count: data?.count || 0,
            percentage: totalReservations > 0
              ? Math.round(((data?.count || 0) / totalReservations) * 100)
              : 0
          }
        })
      }
    }
  } catch (error) {
    console.error('[D1] Reservation statistics error:', error)
    throw error
  }
}

/**
 * 사용자 통계 조회
 */
export async function d1GetUserStatistics(
  params: {
    startDate: string
    endDate: string
  }
) {
  if (!isEnabled()) return notConfigured()
  const db = getD1()
  if (!db) return notConfigured()

  try {
    // 1. 활성 사용자 통계
    const activeUsersQuery = `
      SELECT
        COUNT(DISTINCT user_id) as total_active_users,
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN user_id END) as completed_users,
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'completed' THEN COALESCE(final_price, 0) ELSE 0 END) as total_revenue
      FROM reservations
      WHERE date >= ? AND date <= ?
    `

    const activeStats = await db.prepare(activeUsersQuery)
      .bind(params.startDate, params.endDate)
      .first()

    // 2. 상위 사용자
    const topUsersQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(r.id) as reservation_count,
        SUM(CASE WHEN r.status = 'completed' THEN COALESCE(r.final_price, 0) ELSE 0 END) as total_spent
      FROM users u
      LEFT JOIN reservations r ON u.id = r.user_id
        AND r.date >= ? AND r.date <= ?
      GROUP BY u.id, u.name, u.email
      HAVING reservation_count > 0
      ORDER BY reservation_count DESC
      LIMIT 10
    `

    const topUsers = await db.prepare(topUsersQuery)
      .bind(params.startDate, params.endDate)
      .all()

    // 3. 신규 사용자
    const newUsersQuery = `
      SELECT COUNT(*) as new_users
      FROM users
      WHERE created_at >= ? AND created_at <= ?
    `

    const newUsers = await db.prepare(newUsersQuery)
      .bind(params.startDate, params.endDate + ' 23:59:59')
      .first()

    // 4. 사용자 성장 추이
    const growthQuery = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `

    const growth = await db.prepare(growthQuery)
      .bind(params.startDate, params.endDate + ' 23:59:59')
      .all()

    return {
      summary: {
        totalActiveUsers: (activeStats as any)?.total_active_users || 0,
        completedUsers: (activeStats as any)?.completed_users || 0,
        totalReservations: (activeStats as any)?.total_reservations || 0,
        totalRevenue: (activeStats as any)?.total_revenue || 0,
        newUsers: (newUsers as any)?.new_users || 0,
        averageReservationsPerUser: (activeStats as any)?.total_active_users > 0
          ? Math.round(((activeStats as any).total_reservations / (activeStats as any).total_active_users) * 100) / 100
          : 0,
        averageRevenuePerUser: (activeStats as any)?.completed_users > 0
          ? Math.round((activeStats as any).total_revenue / (activeStats as any).completed_users)
          : 0
      },
      topUsers: (topUsers.results || []).map((u: any) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        reservationCount: u.reservation_count,
        totalSpent: u.total_spent
      })),
      userGrowth: (growth.results || []).map((g: any) => ({
        date: g.date,
        newUsers: g.new_users
      }))
    }
  } catch (error) {
    console.error('[D1] User statistics error:', error)
    throw error
  }
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

export async function d1InsertDevicesForType(deviceTypeId: number, count: number, baseName?: string) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID?.() ?? `${deviceTypeId}-${Date.now()}-${i}`
    await db
      .prepare('INSERT INTO devices (id, device_type_id, device_number, status, created_at, updated_at) VALUES (?,?,?,?,?,?)')
      .bind(id, deviceTypeId, i + 1, 'available', now, now)
      .run()
  }
  return d1ListDevicesByType(deviceTypeId)
}

// ---- Device categories CRUD ----
export async function d1CreateDeviceCategory(data: { name: string; display_order?: number }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db
    .prepare('INSERT INTO device_categories (name, display_order) VALUES (?,?)')
    .bind(data.name, data.display_order ?? 0)
    .run()
  const row = await db
    .prepare('SELECT * FROM device_categories WHERE name = ? ORDER BY id DESC')
    .bind(data.name)
    .first()
  return row
}

export async function d1UpdateDeviceCategory(id: number, patch: { name?: string; display_order?: number }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []
  const binds: any[] = []
  if (patch.name !== undefined) { fields.push('name = ?'); binds.push(patch.name) }
  if (patch.display_order !== undefined) { fields.push('display_order = ?'); binds.push(patch.display_order) }
  if (!fields.length) return await db.prepare('SELECT * FROM device_categories WHERE id = ?').bind(id).first()
  binds.push(id)
  await db.prepare(`UPDATE device_categories SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM device_categories WHERE id = ?').bind(id).first()
}

export async function d1DeleteDeviceCategory(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM device_categories WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM device_categories WHERE id = ?').bind(id).first()
  return !row
}

// ---- Machine rules CRUD ----
export async function d1ListMachineRules(): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const res = await db
    .prepare('SELECT * FROM machine_rules ORDER BY display_order ASC, id ASC')
    .all()
  return res.results ?? []
}

export async function d1CreateMachineRule(data: { content: string; display_order?: number; is_active?: boolean }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const now = new Date().toISOString()
  await db
    .prepare('INSERT INTO machine_rules (content, display_order, is_active) VALUES (?,?,?)')
    .bind(data.content, data.display_order ?? 0, data.is_active ? 1 : 1)
    .run()
  const row = await db.prepare('SELECT * FROM machine_rules WHERE content = ? ORDER BY id DESC').bind(data.content).first()
  return row
}

export async function d1UpdateMachineRule(id: number, patch: { content?: string; display_order?: number; is_active?: boolean }) {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const fields: string[] = []; const binds: any[] = []
  if (patch.content !== undefined) { fields.push('content = ?'); binds.push(patch.content) }
  if (patch.display_order !== undefined) { fields.push('display_order = ?'); binds.push(patch.display_order) }
  if (patch.is_active !== undefined) { fields.push('is_active = ?'); binds.push(patch.is_active ? 1 : 0) }
  if (!fields.length) return await db.prepare('SELECT * FROM machine_rules WHERE id = ?').bind(id).first()
  binds.push(id)
  await db.prepare(`UPDATE machine_rules SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run()
  return await db.prepare('SELECT * FROM machine_rules WHERE id = ?').bind(id).first()
}

export async function d1DeleteMachineRule(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM machine_rules WHERE id = ?').bind(id).run()
  const row = await db.prepare('SELECT id FROM machine_rules WHERE id = ?').bind(id).first()
  return !row
}

// ---- Users: reservations with device info + counts ----
export async function d1ListRecentReservationsByUser(userId: string, limit: number): Promise<any[]> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const sql = `
    SELECT r.*, d.device_number, dt.id AS device_type_id, dt.name AS device_type_name, dt.model_name AS device_type_model
    FROM reservations r
    LEFT JOIN devices d ON r.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    WHERE r.user_id = ?
    ORDER BY r.date DESC, r.start_time DESC
    LIMIT ?
  `
  const res = await db.prepare(sql).bind(userId, limit).all()
  return res.results ?? []
}

export async function d1CountReservationsByUser(userId: string): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT COUNT(1) as cnt FROM reservations WHERE user_id = ?').bind(userId).first()
  return Number(row?.cnt ?? 0)
}

export async function d1CountReservationsByUserWithStatus(userId: string, status: string): Promise<number> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  const row = await db.prepare('SELECT COUNT(1) as cnt FROM reservations WHERE user_id = ? AND status = ?').bind(userId, status).first()
  return Number(row?.cnt ?? 0)
}

export async function d1DeleteScheduleEvent(id: number): Promise<boolean> {
  if (!isEnabled()) return notConfigured()
  const db = getD1(); if (!db) return notConfigured()
  await db.prepare('DELETE FROM schedule_events WHERE id = ?').bind(id).run()
  const row = await d1GetScheduleEventById(id)
  return !row
}
