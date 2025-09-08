/**
 * Supabase 관련 타입 정의
 */

import type { Database } from '@/types/database'

// Database 타입 재내보내기
export type { Database }

// 테이블 타입 별칭
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Enum 타입 별칭
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// 자주 사용하는 테이블 타입
export type User = Tables<'users'>
export type Reservation = Tables<'reservations'>
export type Machine = Tables<'machines'>
export type DeviceType = Tables<'device_types'>
export type TimeSlot = Tables<'time_slots'>
export type Payment = Tables<'payments'>
export type Admin = Tables<'admins'>

// 자주 사용하는 Enum 타입
export type ReservationStatus = Enums<'reservation_status'>
export type PaymentStatus = Enums<'payment_status'>
export type PaymentMethod = Enums<'payment_method'>
export type MachineStatus = Enums<'machine_status'>
export type PlayMode = Enums<'play_mode'>
export type DeviceCategory = Enums<'device_category'>

// 조인된 데이터 타입
export interface ReservationWithRelations extends Reservation {
  user?: User
  machine?: Machine & {
    device_type?: DeviceType
  }
  payment?: Payment
}

export interface MachineWithRelations extends Machine {
  device_type?: DeviceType
  current_reservations?: Reservation[]
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

// 페이지네이션 타입
export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
}