import { ListParams, ListResult, ReservationRecord } from './types'
import { listReservations as localList, listReservationsByUser as localListByUser, getReservationById as localGet, createReservation as localCreate, deleteReservation as localDelete, updateReservation as localUpdate } from './local'
import { d1ListReservations, d1GetReservationById, d1CreateReservation, d1DeleteReservation, d1UpdateReservation } from './d1'

function useD1(): boolean {
  return process.env.D1_ENABLED === 'true'
}

export async function listReservations(params: ListParams): Promise<ListResult> {
  if (useD1()) return d1ListReservations(params)
  return localList(params)
}

export async function getReservationById(id: string): Promise<ReservationRecord | null> {
  if (useD1()) return d1GetReservationById(id)
  return localGet(id)
}

export async function createReservation(item: ReservationRecord): Promise<ReservationRecord> {
  if (useD1()) return d1CreateReservation(item)
  return localCreate(item)
}

export async function deleteReservation(id: string): Promise<boolean> {
  if (useD1()) return d1DeleteReservation(id)
  return localDelete(id)
}

export async function updateReservation(id: string, patch: Partial<ReservationRecord>): Promise<ReservationRecord | null> {
  if (useD1()) return d1UpdateReservation(id, patch)
  return localUpdate(id, patch)
}

export async function listReservationsByUser(userId: string, params: ListParams): Promise<ListResult> {
  if (useD1()) {
    // simple wrapper: use d1ListReservations then filter by userId if needed (or implement dedicated query)
    const all = await d1ListReservations({ ...params })
    const filtered = all.reservations.filter(r => r.user_id === userId)
    return { reservations: filtered, total: filtered.length, page: params.page ?? 1, pageSize: params.pageSize ?? 10 }
  }
  return localListByUser(userId, params)
}

// 기기 관련 함수들 - 임시 구현
export async function listDevices(params?: { category?: string | null; includeInactive?: boolean }) {
  // 임시 기기 데이터
  const devices = [
    { id: 'ps5-1', name: 'PS5 #1', type: 'console', category: 'PS5', status: 'available', is_active: true },
    { id: 'ps5-2', name: 'PS5 #2', type: 'console', category: 'PS5', status: 'in_use', is_active: true },
    { id: 'switch-1', name: '스위치 #1', type: 'console', category: 'Switch', status: 'available', is_active: true },
    { id: 'switch-2', name: '스위치 #2', type: 'console', category: 'Switch', status: 'available', is_active: true },
    { id: 'racing-1', name: '레이싱 시뮬레이터', type: 'simulator', category: 'Racing', status: 'available', is_active: true },
    { id: 'beatmania-1', name: '비트매니아 IIDX', type: 'arcade', category: 'Rhythm', status: 'available', is_active: true },
    { id: 'sdvx-1', name: 'SDVX', type: 'arcade', category: 'Rhythm', status: 'maintenance', is_active: true },
    { id: 'popn-1', name: '팝픈뮤직', type: 'arcade', category: 'Rhythm', status: 'available', is_active: false },
  ]
  
  let filtered = devices
  
  if (params?.category) {
    filtered = filtered.filter(d => d.category === params.category)
  }
  
  if (!params?.includeInactive) {
    filtered = filtered.filter(d => d.is_active)
  }
  
  return filtered
}
