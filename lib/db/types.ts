export type PaymentMethod = 'cash' | 'transfer'

export interface ReservationRecord {
  id: string
  user_id: string
  device_id: string
  date: string // YYYY-MM-DD (KST)
  start_time: string // HH:MM
  end_time: string // HH:MM
  player_count: number
  credit_type: string
  fixed_credits?: number
  total_amount: number
  user_notes?: string
  slot_type: string
  status: string
  created_at: string
  updated_at: string
  check_in_at?: string
  payment_method?: PaymentMethod
  payment_amount?: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  status?: string
}

export interface ListResult {
  reservations: ReservationRecord[]
  total: number
  page: number
  pageSize: number
}

