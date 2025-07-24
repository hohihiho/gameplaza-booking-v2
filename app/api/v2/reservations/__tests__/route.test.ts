import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import { createServerClient } from '@/lib/server/auth/supabase'

// Mock dependencies
jest.mock('@/lib/server/auth/supabase')
jest.mock('@/lib/api/logging')

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn(),
  eq: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  channel: jest.fn(() => ({
    send: jest.fn()
  }))
}

;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

describe('/api/v2/reservations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - 예약 생성', () => {
    it('인증되지 않은 사용자는 401을 반환해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        body: JSON.stringify({
          device_id: '123e4567-e89b-12d3-a456-426614174000',
          date: '2025-12-01',
          start_hour: 14,
          end_hour: 18,
          credit_type: 'freeplay',
          player_count: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('로그인이 필요합니다')
    })

    it('잘못된 요청 형식은 400을 반환해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        body: JSON.stringify({
          device_id: 'invalid-uuid',
          date: '2025-12-01',
          start_hour: 14,
          end_hour: 18,
          credit_type: 'freeplay',
          player_count: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('올바른 기기 ID 형식이 아닙니다')
    })

    it('시작 시간이 종료 시간보다 크면 400을 반환해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        body: JSON.stringify({
          device_id: '123e4567-e89b-12d3-a456-426614174000',
          date: '2025-12-01',
          start_hour: 18,
          end_hour: 14,
          credit_type: 'freeplay',
          player_count: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('종료 시간은 시작 시간보다 커야 합니다')
    })
  })

  describe('GET - 예약 목록 조회', () => {
    it('인증되지 않은 사용자는 401을 반환해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('로그인이 필요합니다')
    })

    it('성공적으로 예약 목록을 반환해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      })

      const mockReservations = [
        {
          id: 'res-1',
          reservation_number: 'GP-20251201-0001',
          user_id: 'user-1',
          device_id: 'device-1',
          date: '2025-12-01',
          start_hour: 14,
          end_hour: 18,
          status: 'pending',
          credit_type: 'freeplay',
          player_count: 1,
          total_price: 5000,
          created_at: '2025-11-30T10:00:00Z',
          updated_at: '2025-11-30T10:00:00Z',
          device: {
            id: 'device-1',
            device_number: 1,
            name: 'PC-001',
            device_type: {
              id: 'type-1',
              name: 'GTX 3060',
              model_name: 'NVIDIA GTX 3060'
            }
          }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockReservations,
                error: null,
                count: 1
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reservations).toHaveLength(1)
      expect(data.reservations[0]).toMatchObject({
        id: 'res-1',
        reservation_number: 'GP-20251201-0001',
        status: 'pending',
        time_slot: '14:00 - 18:00'
      })
      expect(data.pagination).toMatchObject({
        page: 1,
        page_size: 20,
        total_count: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false
      })
    })

    it('페이지네이션 파라미터가 올바르게 처리되어야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 50
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=2&page_size=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination).toMatchObject({
        page: 2,
        page_size: 10,
        total_count: 50,
        total_pages: 5,
        has_next: true,
        has_prev: true
      })
    })

    it('상태 필터가 올바르게 적용되어야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      })

      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations?status=approved')
      await GET(request)

      // status 필터가 적용되었는지 확인
      expect(mockEq).toHaveBeenCalledWith('status', 'approved')
    })
  })
})