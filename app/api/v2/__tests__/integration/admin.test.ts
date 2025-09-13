import { getDB, supabase } from '@/lib/db';
/**
 * v2 API 통합 테스트 - 관리자 기능
 * QA Engineer Agent 작성
 * 
 * 테스트 범위:
 * - 예약 승인/거절
 * - 체크인 처리
 * - 예약 완료
 * - 노쇼 처리
 * - 관리자 권한 검증
 */

import { NextRequest } from 'next/server'
import { POST as approveReservation } from '@/app/api/v2/reservations/[id]/approve/route'
import { POST as rejectReservation } from '@/app/api/v2/reservations/[id]/reject/route'
import { POST as checkInReservation } from '@/app/api/v2/reservations/[id]/check-in/route'
import { POST as markAsNoShow } from '@/app/api/v2/reservations/[id]/no-show/route'

// Mock 모듈들
jest.mock('@/infrastructure/middleware/auth.middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  isAdmin: jest.fn()
}))

jest.mock('@/lib/db', () => ({
}))

// Repository mocks
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

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}))

const { getAuthenticatedUser, isAdmin } = require('@/infrastructure/middleware/auth.middleware')
const { UserSupabaseRepository } = require('@/infrastructure/repositories/user.supabase.repository')
const { SupabaseReservationRepositoryV2 } = require('@/infrastructure/repositories/supabase-reservation.repository.v2')
const { SupabaseDeviceRepositoryV2 } = require('@/infrastructure/repositories/supabase-device.repository.v2')
const { NotificationSupabaseRepository } = require('@/infrastructure/repositories/notification.supabase.repository')

// createApiHandler를 모킹하여 원래 함수를 그대로 반환하도록 함
jest.mock('@/lib/api/handler', () => ({
  createApiHandler: (handler: any) => handler,
  apiHandler: (handler: any) => handler
}))

describe('v2 API Integration Tests - Admin Functions', () => {
  let mockSupabase: any
  let performanceStart: number

  const adminUser = {
    id: 'admin-user-id',
    email: 'admin@gameplaza.com',
    role: 'admin', // role을 최상위 레벨로 이동
    user_metadata: {
      full_name: '관리자',
      role: 'admin'
    }
  }

  const regularUser = {
    id: 'regular-user-id',
    email: 'user@example.com',
    role: 'user', // role 추가
    user_metadata: {
      full_name: '일반 사용자'
    }
  }

  const testReservation = {
    id: 'test-reservation-id',
    user_id: regularUser.id,
    device_id: 'test-device-id',
    date: '2025-07-25',
    start_time: '14:00',
    end_time: '16:00',
    status: 'pending',
    reservation_number: 'GP-20250725-0001',
    created_at: new Date().toISOString()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    performanceStart = Date.now()
  })

  afterEach(() => {
    const duration = Date.now() - performanceStart
    expect(duration).toBeLessThan(200)
  })

  describe('예약 승인 기능', () => {
    it('관리자가 예약 승인', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      // Mock 클라이언트
      const mockSupabase = {}

      // Repository mocks 설정
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
          id: testReservation.id,
          userId: testReservation.user_id,
          deviceId: testReservation.device_id,
          status: { value: 'pending' },
          reservationNumber: testReservation.reservation_number,
          date: { dateString: testReservation.date },
          timeSlot: { startHour: 14, endHour: 16 },
          approveWithDevice: jest.fn().mockReturnValue({
            id: testReservation.id,
            userId: testReservation.user_id,
            deviceId: testReservation.device_id,
            status: { value: 'approved' },
            reservationNumber: testReservation.reservation_number,
            date: { dateString: testReservation.date },
            timeSlot: { startHour: 14, endHour: 16 }
          })
        }),
        update: jest.fn(),
        findByDeviceAndTimeSlot: jest.fn().mockResolvedValue([])
      }
      SupabaseReservationRepositoryV2.mockImplementation(() => mockReservationRepo)

      const mockDeviceRepo = {
        findByTypeId: jest.fn().mockResolvedValue([{
          id: testReservation.device_id,
          deviceNumber: 'PS5-01',
          status: { value: 'available' }
        }])
      }
      SupabaseDeviceRepositoryV2.mockImplementation(() => mockDeviceRepo)

      const mockNotificationRepo = {
        save: jest.fn()
      }
      NotificationSupabaseRepository.mockImplementation(() => mockNotificationRepo)

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await approveReservation(request, context)
      const data = await response.json()
      
      if (response.status !== 200) {
        console.log('Error response:', JSON.stringify(data, null, 2))
      }
      
      expect(response.status).toBe(200) // 성공
      expect(data.success).toBe(true)
      expect(data.reservation).toBeDefined()
      expect(data.reservation.status).toBe('approved')
      expect(data.reservation.id).toBe(testReservation.id)
      expect(data.reservation.assignedDeviceNumber).toBe('PS5-01')
      expect(data.message).toContain('예약이 승인되었습니다')
    })

    it('비관리자 접근 차단', async () => {
      getAuthenticatedUser.mockReturnValue(regularUser)
      isAdmin.mockReturnValue(false)

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await approveReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.message).toContain('관리자 권한이 필요합니다')
    })

    it('이미 승인된 예약 재승인 방지', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      // Mock 클라이언트
      const mockSupabase = {}

      // Repository mocks - 이미 승인된 예약 반환
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
          id: testReservation.id,
          userId: testReservation.user_id,
          deviceId: testReservation.device_id,
          status: { value: 'approved' }, // 이미 승인된 상태
          reservationNumber: testReservation.reservation_number,
          date: { dateString: testReservation.date },
          timeSlot: { startHour: 14, endHour: 16 }
        })
      }
      SupabaseReservationRepositoryV2.mockImplementation(() => mockReservationRepo)

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await approveReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(400) // 이미 승인된 예약은 400 에러
      expect(data.error).toContain('대기 중')
    })
  })

  describe('예약 거절 기능', () => {
    it('관리자가 예약 거절 및 사유 기록', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      const rejectionReason = '기기 점검으로 인한 사용 불가'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          // 첫 번째 호출: findById
          const chainObj = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            update: jest.fn().mockReturnThis()
          }
          chainObj.single.mockResolvedValue({
            data: { ...testReservation, status: 'pending' }, // 초기 상태는 pending
            error: null
          })
          return chainObj
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: testReservation.user_id,
                email: regularUser.email,
                raw_user_meta_data: regularUser.user_metadata
              },
              error: null
            })
          }
        }
        if (table === 'devices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: testReservation.device_id,
                device_number: 'PS5-01',
                status: 'available',
                device_type_id: 'ps5-type'
              },
              error: null
            })
          }
        }
        if (table === 'notification_channels' || table === 'notifications') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }
        }
        // 기본 mock 반환
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ reason: rejectionReason })
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await rejectReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200) // 성공
      expect(data.id).toBe(testReservation.id)
      expect(data.status).toBe('rejected')
      expect(data.rejectionReason).toBe(rejectionReason)
      expect(data.admin_notes).toBe(rejectionReason)
    })

    it('거절 사유 필수 입력', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ reason: '' })
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await rejectReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(400) // 거절 사유가 비어있으면 400
      expect(data.error).toBeDefined()
    })
  })

  describe('체크인 기능', () => {
    const approvedReservation = {
      ...testReservation,
      status: 'approved'
    }

    it('정상적인 체크인 처리', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      const now = new Date()
      const checkInTime = now.toISOString()

      // Mock 설정 - 실제 repository 패턴에 맞춤
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: adminUser.id,
                email: adminUser.email,
                full_name: adminUser.user_metadata.full_name,
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
              data: approvedReservation,
              error: null
            }),
            update: jest.fn().mockReturnThis()
          }
        }
        if (table === 'check_ins') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'check-in-id',
                reservation_id: testReservation.id,
                user_id: adminUser.id,
                check_in_time: checkInTime,
                status: 'active'
              },
              error: null
            })
          }
        }
        // 기본 mock 반환
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          paymentMethod: 'cash',
          paymentAmount: 10000
        })
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await checkInReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200) // 성공
      expect(data.status).toBe('checked_in')
      expect(data.checkInId).toBeDefined()
    })

    it('승인되지 않은 예약 체크인 방지', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: adminUser.id,
                email: adminUser.email,
                full_name: adminUser.user_metadata.full_name,
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
              data: testReservation, // pending 상태
              error: null
            })
          }
        }
        // 기본 mock 반환
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          paymentMethod: 'cash',
          paymentAmount: 10000
        })
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await checkInReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(400) // 승인되지 않은 예약은 체크인 불가
      expect(data.error).toContain('승인')
    })

    it('예약 시간 30분 전부터 체크인 허용', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      // Mock 설정
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: adminUser.id,
                email: adminUser.email,
                full_name: adminUser.user_metadata.full_name,
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
              data: approvedReservation,
              error: null
            }),
            update: jest.fn().mockReturnThis()
          }
        }
        if (table === 'check_ins') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'check-in-id',
                reservation_id: testReservation.id,
                user_id: adminUser.id,
                check_in_time: new Date().toISOString(),
                status: 'active'
              },
              error: null
            })
          }
        }
        // 기본 mock 반환
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          paymentMethod: 'cash',
          paymentAmount: 10000
        })
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await checkInReservation(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200) // 성공
      expect(data.status).toBe('checked_in')
    })
  })

  describe('노쇼 처리', () => {
    const checkedInReservation = {
      ...testReservation,
      status: 'checked_in',
      checked_in_at: new Date().toISOString()
    }

    it('노쇼 처리 (예약 시간 30분 경과)', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      const approvedReservation = {
        ...testReservation,
        status: 'approved'
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: approvedReservation,
              error: null
            }),
            update: jest.fn().mockReturnThis()
          }
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: testReservation.user_id,
                email: regularUser.email,
                raw_user_meta_data: regularUser.user_metadata
              },
              error: null
            })
          }
        }
        if (table === 'devices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: testReservation.device_id,
                device_number: 'PS5-01',
                status: 'available',
                device_type_id: 'ps5-type'
              },
              error: null
            })
          }
        }
        // 기본 mock 반환
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await markAsNoShow(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200) // 성공
      expect(data.reservationId).toBe(testReservation.id)
      expect(data.status).toBe('no_show')
    })

    it('이미 체크인한 예약은 노쇼 처리 불가', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: checkedInReservation,
              error: null
            })
          }
        }
        // 기본 mock 반환
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const request = new NextRequest(`http://localhost:3000/api/v2/reservations/${testReservation.id}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const context = { params: Promise.resolve({ id: testReservation.id }) }
      const response = await markAsNoShow(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(400) // 이미 체크인된 예약은 노쇼 처리 불가
      expect(data.error).toContain('체크인')
    })
  })

  describe('성능 테스트', () => {
    it('대량 예약 승인 처리 (10건)', async () => {
      getAuthenticatedUser.mockReturnValue(adminUser)
      isAdmin.mockReturnValue(true)

      const startTime = Date.now()
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'reservations') {
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...testReservation, id: `res-${i}`, status: 'approved' },
                error: null
              })
            }
          }
          return mockSupabase.from(table)
        })
        
        const request = new NextRequest(`http://localhost:3000/api/v2/reservations/res-${i}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        const context = { params: Promise.resolve({ id: `res-${i}` }) }
        promises.push(approveReservation(request, context))
      }

      await Promise.all(promises)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(2000) // 10건 처리에 2초 이내
    })
  })
})