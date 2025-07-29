import { POST } from '../route'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Mock 모듈들
jest.mock('@/auth', () => ({
  auth: jest.fn()
}))
jest.mock('@/lib/supabase')

const { auth } = require('@/auth')

describe('POST /api/admin/reservations/[id]/adjust-amount', () => {
  let mockSession: any
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock session
    mockSession = {
      user: {
        email: 'admin@example.com'
      }
    }
    ;(auth as jest.Mock).mockResolvedValue(mockSession)

    // Mock Supabase
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis()
    }
    ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/admin/reservations/reservation-123/adjust-amount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('전액 환불', () => {
    it('관리자가 전액 환불(0원으로 조정)을 처리할 수 있어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      const mockReservation = {
        id: 'reservation-123',
        total_amount: 30000,
        status: 'approved'
      }
      const mockUpdatedReservation = {
        ...mockReservation,
        adjusted_amount: 0,
        adjustment_reason: '고객 요청으로 인한 전액 환불'
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser }) // users 조회
        .mockResolvedValueOnce({ data: mockAdmin }) // admins 조회
        .mockResolvedValueOnce({ data: mockReservation }) // reservations 조회
        .mockResolvedValueOnce({ data: mockUpdatedReservation }) // update 결과

      const request = createRequest({
        adjustedAmount: 0,
        reason: '고객 요청으로 인한 전액 환불'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.reservation.adjusted_amount).toBe(0)
      expect(data.data.message).toBe('금액이 성공적으로 조정되었습니다.')

      // 조정 이력이 저장되었는지 확인
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          reservation_id: 'reservation-123',
          original_amount: 30000,
          adjusted_amount: 0,
          difference: -30000,
          reason: '고객 요청으로 인한 전액 환불',
          adjusted_by: 'user-123'
        })
      )
    })
  })

  describe('부분 환불', () => {
    it('관리자가 부분 환불을 처리할 수 있어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      const mockReservation = {
        id: 'reservation-123',
        total_amount: 30000,
        status: 'approved'
      }
      const mockUpdatedReservation = {
        ...mockReservation,
        adjusted_amount: 20000,
        adjustment_reason: '30분 이용 불가로 인한 부분 환불'
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockAdmin })
        .mockResolvedValueOnce({ data: mockReservation })
        .mockResolvedValueOnce({ data: mockUpdatedReservation })

      const request = createRequest({
        adjustedAmount: 20000,
        reason: '30분 이용 불가로 인한 부분 환불'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.reservation.adjusted_amount).toBe(20000)
      
      // 조정 이력 확인 (10,000원 환불)
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          original_amount: 30000,
          adjusted_amount: 20000,
          difference: -10000
        })
      )
    })
  })

  describe('권한 검증', () => {
    it('인증되지 않은 사용자는 금액을 조정할 수 없어야 한다', async () => {
      // Given
      ;(auth as jest.Mock).mockResolvedValue(null)

      const request = createRequest({
        adjustedAmount: 0,
        reason: '환불'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(401)
      expect(data.error).toBe('인증되지 않았습니다')
    })

    it('관리자가 아닌 사용자는 금액을 조정할 수 없어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: null }) // admins 조회 실패

      const request = createRequest({
        adjustedAmount: 0,
        reason: '환불'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(403)
      expect(data.error).toBe('관리자 권한이 없습니다')
    })
  })

  describe('유효성 검증', () => {
    it('음수 금액으로는 조정할 수 없어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockAdmin })

      const request = createRequest({
        adjustedAmount: -1000,
        reason: '잘못된 조정'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(400)
      expect(data.error).toBe('금액은 0원 이상이어야 합니다')
    })

    it('조정 금액이 없으면 거부되어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockAdmin })

      const request = createRequest({
        reason: '환불'
        // adjustedAmount 누락
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(400)
      expect(data.error).toBe('조정 금액이 필요합니다')
    })

    it('존재하지 않는 예약은 조정할 수 없어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockAdmin })
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }) // 예약 없음

      const request = createRequest({
        adjustedAmount: 0,
        reason: '환불'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(404)
      expect(data.error).toBe('예약을 찾을 수 없습니다')
    })
  })

  describe('추가 금액 조정', () => {
    it('금액을 증액할 수도 있어야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      const mockReservation = {
        id: 'reservation-123',
        total_amount: 30000,
        status: 'approved'
      }
      const mockUpdatedReservation = {
        ...mockReservation,
        adjusted_amount: 35000,
        adjustment_reason: '추가 시간 이용'
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockAdmin })
        .mockResolvedValueOnce({ data: mockReservation })
        .mockResolvedValueOnce({ data: mockUpdatedReservation })

      const request = createRequest({
        adjustedAmount: 35000,
        reason: '추가 시간 이용'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.reservation.adjusted_amount).toBe(35000)
      
      // 증액 이력 확인 (5,000원 추가)
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          original_amount: 30000,
          adjusted_amount: 35000,
          difference: 5000
        })
      )
    })
  })

  describe('조정 이력', () => {
    it('조정 이력 저장이 실패해도 금액 조정은 성공해야 한다', async () => {
      // Given
      const mockUser = { id: 'user-123' }
      const mockAdmin = { is_super_admin: true }
      const mockReservation = {
        id: 'reservation-123',
        total_amount: 30000,
        status: 'approved'
      }
      const mockUpdatedReservation = {
        ...mockReservation,
        adjusted_amount: 0
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockAdmin })
        .mockResolvedValueOnce({ data: mockReservation })
        .mockResolvedValueOnce({ data: mockUpdatedReservation })

      // 이력 저장 실패
      mockSupabase.insert.mockResolvedValue({ error: { message: 'Table not found' } })

      const request = createRequest({
        adjustedAmount: 0,
        reason: '전액 환불'
      })

      // When
      const response = await POST(request, { params: Promise.resolve({ id: 'reservation-123' }) })
      const data = await response.json()

      // Then
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('금액이 성공적으로 조정되었습니다.')
    })
  })
})