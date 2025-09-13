import { getDB, supabase } from '@/lib/db';
/**
 * 관리자 예약 승인 기능 테스트 - 수정된 버전
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

jest.mock('@/infrastructure/repositories/user.supabase.repository', () => ({
  UserSupabaseRepository: jest.fn()
}))

jest.mock('@/infrastructure/repositories/supabase-reservation.repository.v2', () => ({
  SupabaseReservationRepositoryV2: jest.fn()
}))

jest.mock('@/infrastructure/repositories/supabase-device.repository.v2', () => ({
  SupabaseDeviceRepositoryV2: jest.fn()
}))

jest.mock('@/infrastructure/repositories/notification.supabase.repository', () => ({
  NotificationSupabaseRepository: jest.fn()
}))

const { getAuthenticatedUser, isAdmin } = require('@/infrastructure/middleware/auth.middleware')
const { UserSupabaseRepository } = require('@/infrastructure/repositories/user.supabase.repository')
const { SupabaseReservationRepositoryV2 } = require('@/infrastructure/repositories/supabase-reservation.repository.v2')
const { SupabaseDeviceRepositoryV2 } = require('@/infrastructure/repositories/supabase-device.repository.v2')
const { NotificationSupabaseRepository } = require('@/infrastructure/repositories/notification.supabase.repository')

describe('예약 승인 API 테스트 - 수정판', () => {
  const adminUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin'
  }

  const mockReservation = {
    id: 'res-123',
    user_id: 'user-123',
    device_id: 'device-123',
    device_type_id: 'ps5-type',
    status: 'pending',
    reservation_number: 'GP-20250101-0001',
    date: '2025-07-01',
    start_time: '14:00',
    end_time: '16:00'
  }

  const mockDevice = {
    id: 'device-123',
    deviceNumber: 'PS5-01',
    status: { value: 'available' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('관리자가 예약을 승인할 수 있다', async () => {
    // 인증 설정
    getAuthenticatedUser.mockReturnValue(adminUser)
    isAdmin.mockReturnValue(true)

    // Mock 클라이언트
    const mockSupabase = {}

    // Repository mocks
    const mockUserRepo = {
      findById: jest.fn().mockResolvedValue({
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin'
      })
    }
    UserSupabaseRepository.mockImplementation(() => mockUserRepo)

    const mockReservationRepo = {
      findById: jest.fn().mockResolvedValue({
        id: mockReservation.id,
        userId: mockReservation.user_id,
        deviceId: mockReservation.device_id,
        status: { value: 'pending' },
        reservationNumber: mockReservation.reservation_number,
        date: { dateString: mockReservation.date },
        timeSlot: { startHour: 14, endHour: 16 },
        approveWithDevice: jest.fn().mockReturnValue({
          id: mockReservation.id,
          userId: mockReservation.user_id,
          deviceId: mockReservation.device_id,
          status: { value: 'approved' },
          reservationNumber: mockReservation.reservation_number,
          date: { dateString: mockReservation.date },
          timeSlot: { startHour: 14, endHour: 16 }
        })
      }),
      update: jest.fn(),
      findByDeviceAndTimeSlot: jest.fn().mockResolvedValue([])
    }
    SupabaseReservationRepositoryV2.mockImplementation(() => mockReservationRepo)

    const mockDeviceRepo = {
      findByTypeId: jest.fn().mockResolvedValue([mockDevice])
    }
    SupabaseDeviceRepositoryV2.mockImplementation(() => mockDeviceRepo)

    const mockNotificationRepo = {
      save: jest.fn()
    }
    NotificationSupabaseRepository.mockImplementation(() => mockNotificationRepo)

    // 요청 생성
    const request = new NextRequest('http://localhost:3000/api/v2/reservations/res-123/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    // API 호출
    const context = { params: Promise.resolve({ id: 'res-123' }) }
    const response = await approveReservation(request, context)
    const data = await response.json()

    // 검증
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.reservation).toBeDefined()
    expect(data.reservation.status).toBe('approved')
    expect(data.reservation.assignedDeviceNumber).toBe('PS5-01')
    expect(data.message).toContain('예약이 승인되었습니다')
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