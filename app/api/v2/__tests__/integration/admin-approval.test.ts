import { getDB, supabase } from '@/lib/db';
/**
 * 관리자 예약 승인 기능 테스트
 * 단순화된 버전
 */

import { NextRequest } from 'next/server'
import { POST as approveReservation } from '@/app/api/v2/reservations/[id]/approve/route'

// Mock 설정
jest.mock('@/lib/api/handler', () => ({
  createApiHandler: (handler: any) => handler
}))

jest.mock('@/infrastructure/middleware/auth.middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  isAdmin: jest.fn()
}))

jest.mock('@/lib/db', () => ({
}))

const { getAuthenticatedUser, isAdmin } = require('@/infrastructure/middleware/auth.middleware')

describe('예약 승인 API 테스트', () => {
  const adminUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin'
  }

  const mockReservation = {
    id: 'res-123',
    user_id: 'user-123',
    device_id: 'device-123',
    status: 'pending'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('관리자가 예약을 승인할 수 있다', async () => {
    // 인증 설정
    getAuthenticatedUser.mockReturnValue(adminUser)
    isAdmin.mockReturnValue(true)

    // Supabase mock
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                id: adminUser.id, 
                email: adminUser.email,
                role: 'admin'
              },
              error: null
            })
          }
        }
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockReservation,
              error: null
            }),
            update: jest.fn().mockReturnThis()
          }
        }
        if (table === 'devices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })
    }


    // DeviceRepository mock 추가
    jest.mock('@/infrastructure/repositories/supabase-device.repository.v2', () => ({
      SupabaseDeviceRepositoryV2: jest.fn().mockImplementation(() => ({
        findByTypeId: jest.fn().mockResolvedValue([
          { 
            id: 'device-123', 
            deviceNumber: 'PS5-01',
            status: { value: 'available' }
          }
        ])
      }))
    }))

    // 요청 생성
    const request = new NextRequest('http://localhost:3000/api/v2/reservations/res-123/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    // API 호출
    const context = { params: Promise.resolve({ id: 'res-123' }) }
    const response = await approveReservation(request, context)
    const data = await response.json()

    // 에러 확인
    if (response.status !== 200) {
      console.log('Error:', data)
    }

    // 검증
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.reservation).toBeDefined()
    expect(data.reservation.status).toBe('approved')
  })

  it('비관리자는 예약을 승인할 수 없다', async () => {
    // 일반 사용자로 설정
    getAuthenticatedUser.mockReturnValue({ ...adminUser, role: 'user' })
    isAdmin.mockReturnValue(false)

    const request = new NextRequest('http://localhost:3000/api/v2/reservations/res-123/approve', {
      method: 'POST'
    })

    const context = { params: Promise.resolve({ id: 'res-123' }) }
    const response = await approveReservation(request, context)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('관리자 권한')
  })
})