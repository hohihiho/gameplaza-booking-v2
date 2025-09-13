import fs from 'fs'
import path from 'path'

// 로컬 JSON 파일 기반 매우 단순한 저장소 (개발용)
// 추후 Cloudflare D1로 교체

const DB_DIR = path.join(process.cwd(), 'data', 'local-db')
const RES_FILE = path.join(DB_DIR, 'reservations.json')

export type LocalReservation = {
  id: string
  user_id: string
  device_id: string
  date: string
  start_time: string
  end_time: string
  player_count: number
  credit_type: string
  fixed_credits?: number
  total_amount: number
  user_notes?: string
  slot_type: string
  status: string
  created_at: string
  updated_at: string
  // 확장 필드
  check_in_at?: string
  payment_method?: 'cash' | 'transfer'
  payment_amount?: number
}

function ensureFiles() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
  if (!fs.existsSync(RES_FILE)) fs.writeFileSync(RES_FILE, '[]', 'utf-8')
}

function loadAll(): LocalReservation[] {
  ensureFiles()
  const raw = fs.readFileSync(RES_FILE, 'utf-8')
  try {
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveAll(items: LocalReservation[]) {
  ensureFiles()
  fs.writeFileSync(RES_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export function listReservations({ page = 1, pageSize = 10, status }: { page?: number; pageSize?: number; status?: string }) {
  const all = loadAll()
  const filtered = status ? all.filter(r => r.status === status) : all
  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const reservations = filtered.slice(start, end)
  return { reservations, total, page, pageSize }
}

export function listReservationsByUser(userId: string, { page = 1, pageSize = 10, status }: { page?: number; pageSize?: number; status?: string } = {}) {
  const all = loadAll()
  const filtered = all.filter(r => r.user_id === userId).filter(r => (status ? r.status === status : true))
  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const reservations = filtered.slice(start, end)
  return { reservations, total, page, pageSize }
}

export function getReservationById(id: string): LocalReservation | null {
  const all = loadAll()
  return all.find(r => r.id === id) || null
}

export function createReservation(item: LocalReservation): LocalReservation {
  const all = loadAll()
  all.push(item)
  saveAll(all)
  return item
}

export function deleteReservation(id: string): boolean {
  const all = loadAll()
  const next = all.filter(r => r.id !== id)
  if (next.length === all.length) return false
  saveAll(next)
  return true
}

export function updateReservation(id: string, patch: Partial<LocalReservation>): LocalReservation | null {
  const all = loadAll()
  const idx = all.findIndex(r => r.id === id)
  if (idx === -1) return null
  const updated = { ...all[idx], ...patch, updated_at: new Date().toISOString() }
  all[idx] = updated
  saveAll(all)
  return updated
}
