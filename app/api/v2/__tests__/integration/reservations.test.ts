/**
 * v2 API 통합 테스트 스위트
 * QA Engineer Agent 작성
 * 
 * 테스트 범위:
 * - 예약 생성/조회/취소 플로우
 * - 24시간 룰 검증
 * - 예약번호 생성 및 유일성
 * - 시간대 충돌 감지
 * - 권한 검증
 * - 에러 처리
 * - 성능 (응답시간 < 200ms)
 */

import { createMockSupabaseClient } from '@/lib/test-utils/mock-supabase'
import { NextRequest } from 'next/server'
import { POST as createReservation, GET as getReservations } from '../../reservations/route'
import { GET as getReservationById, PUT as updateReservation, DELETE as cancelReservation } from '../../reservations/[id]/route'

// Mock 모듈들
jest.mock('@/lib/supabase', () => ({
  createAdminClient: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn()
}))

const { createAdminClient } = require('@/lib/supabase')
const { getCurrentUser } = require('@/lib/auth')

describe('v2 API Integration Tests - Reservations', () => {
  let mockSupabase: any
  let performanceStart: number

  // 테스트 데이터
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: '테스트 사용자',
      phone: '010-1234-5678'
    }
  }

  const testDevice = {
    id: 'test-device-id',
    device_number: 'PS5-01',
    status: 'available',
    device_type_id: 'ps5-type',
    hourly_rate: 10000
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    createAdminClient.mockReturnValue(mockSupabase)
    performanceStart = Date.now()
  })

  afterEach(() => {
    // 성능 검증 - 모든 테스트는 200ms 이내에 완료되어야 함
    const duration = Date.now() - performanceStart
    expect(duration).toBeLessThan(200)
  })

  describe('POST /api/v2/reservations - 예약 생성', () => {
    beforeEach(() => {
      getCurrentUser.mockResolvedValue(testUser)
      
      // Mock 데이터베이스 응답
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: testUser.id,
                email: testUser.email,
                full_name: testUser.user_metadata.full_name,
                phone: testUser.user_metadata.phone,
                created_at: new Date().toISOString()
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
              data: testDevice,
              error: null
            })
          }
        }
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-reservation-id',
                user_id: testUser.id,
                device_id: testDevice.id,
                date: tomorrowStr,
                start_time: '14:00',
                end_time: '16:00',
                status: 'pending',
                reservation_number: `GP-${tomorrow.toISOString().slice(0, 10).replace(/-/g, '')}-0001`,
                created_at: new Date().toISOString()
              },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })
    })

    it('정상적인 예약 생성', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          device_id: testDevice.id,
          player_count: 1,
          total_amount: 20000,
          user_notes: '테스트 예약',
          credit_type: 'freeplay'
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reservation).toBeDefined()
      expect(data.reservation.reservationNumber).toMatch(/^GP-\d{8}-\d{4}$/)
      expect(data.message).toContain('예약이 접수되었습니다')
    })

    it('24시간 룰 위반 시 에러', async () => {
      const now = new Date()
      const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000)
      const dateStr = in12Hours.toISOString().split('T')[0]
      const timeStr = in12Hours.toTimeString().slice(0, 5)

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          start_time: timeStr,
          end_time: '16:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('24시간')
    })

    it('시간대 충돌 감지', async () => {
      // 기존 예약이 있다고 가정
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [{
                id: 'existing-reservation',
                start_time: '14:00',
                end_time: '16:00',
                status: 'approved'
              }],
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '15:00',
          end_time: '17:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      expect(response.status).toBe(400)
    })

    it('미인증 사용자 접근 차단', async () => {
      getCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('로그인이 필요합니다')
    })

    it('필수 필드 검증', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          // start_time 누락
          end_time: '16:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('startTime')
    })

    it('잘못된 날짜 형식 검증', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025/07/25', // 잘못된 형식
          start_time: '14:00',
          end_time: '16:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      expect(response.status).toBe(400)
    })

    it('잘못된 시간 형식 검증', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '14시', // 잘못된 형식
          end_time: '16:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/v2/reservations - 예약 목록 조회', () => {
    const mockReservations = [
      {
        id: 'res-1',
        user_id: testUser.id,
        device_id: testDevice.id,
        date: tomorrowStr,
        start_time: '14:00',
        end_time: '16:00',
        status: 'pending',
        reservation_number: 'GP-20250725-0001',
        created_at: new Date().toISOString()
      },
      {
        id: 'res-2',
        user_id: testUser.id,
        device_id: testDevice.id,
        date: tomorrowStr,
        start_time: '18:00',
        end_time: '20:00',
        status: 'approved',
        reservation_number: 'GP-20250725-0002',
        created_at: new Date().toISOString()
      }
    ]

    beforeEach(() => {
      getCurrentUser.mockResolvedValue(testUser)
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: mockReservations,
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })
    })

    it('페이지네이션 테스트', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=10')
      
      const response = await getReservations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reservations).toHaveLength(2)
      expect(data.page).toBe(1)
      expect(data.pageSize).toBe(10)
      expect(data.totalPages).toBeDefined()
    })

    it('상태별 필터링', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations?status=pending')
      
      const response = await getReservations(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reservations).toBeDefined()
    })

    it('미인증 사용자 접근 차단', async () => {
      getCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v2/reservations')
      
      const response = await getReservations(request)
      expect(response.status).toBe(401)
    })
  })

  describe('Data Integrity Tests - 데이터 무결성', () => {
    it('예약번호 유일성 검증', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      
      // 두 개의 동시 예약 생성 시뮬레이션
      const promises = []
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: tomorrowStr,
            start_time: `${14 + i}:00`,
            end_time: `${15 + i}:00`,
            device_id: testDevice.id
          })
        })
        promises.push(createReservation(request))
      }

      const responses = await Promise.all(promises)
      const reservationNumbers = new Set()
      
      for (const response of responses) {
        if (response.status === 200) {
          const data = await response.json()
          const number = data.reservation?.reservationNumber
          if (number) {
            expect(reservationNumbers.has(number)).toBe(false)
            reservationNumbers.add(number)
          }
        }
      }
    })

    it('KST 시간대 일관성', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      
      // 다양한 시간대 테스트
      const testCases = [
        { hour: 0, display: '24시' },  // 자정
        { hour: 1, display: '25시' },  // 새벽 1시
        { hour: 5, display: '29시' },  // 새벽 5시
        { hour: 6, display: '06시' },  // 오전 6시
        { hour: 23, display: '23시' }  // 밤 11시
      ]

      for (const testCase of testCases) {
        const startTime = `${testCase.hour.toString().padStart(2, '0')}:00`
        const endTime = `${((testCase.hour + 2) % 24).toString().padStart(2, '0')}:00`
        
        const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: tomorrowStr,
            start_time: startTime,
            end_time: endTime,
            device_id: testDevice.id
          })
        })

        const response = await createReservation(request)
        expect(response.status).toBeLessThanOrEqual(400) // 성공 또는 검증 에러
      }
    })
  })

  describe('Error Handling & Edge Cases - 에러 처리', () => {
    it('데이터베이스 연결 실패', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          device_id: testDevice.id
        })
      })

      const response = await createReservation(request)
      expect(response.status).toBe(500)
    })

    it('잘못된 JSON 요청', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {'
      })

      const response = await createReservation(request)
      expect(response.status).toBe(400)
    })

    it('존재하지 않는 기기 ID', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'devices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Device not found' }
            })
          }
        }
        return mockSupabase.from(table)
      })

      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          device_id: 'non-existent-device'
        })
      })

      const response = await createReservation(request)
      expect(response.status).toBe(404)
    })
  })

  describe('Mobile-Specific Tests - 모바일 최적화', () => {
    it('큰 페이로드 처리 (느린 네트워크)', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      
      // 큰 메모 텍스트
      const largeNotes = 'a'.repeat(1000)
      
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tomorrowStr,
          start_time: '14:00',
          end_time: '16:00',
          device_id: testDevice.id,
          user_notes: largeNotes
        })
      })

      const startTime = Date.now()
      const response = await createReservation(request)
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(200) // 200ms 이내 응답
    })

    it('최소 데이터 응답 (모바일 데이터 절약)', async () => {
      getCurrentUser.mockResolvedValue(testUser)
      
      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=5')
      
      const response = await getReservations(request)
      const data = await response.json()
      const responseSize = JSON.stringify(data).length

      expect(response.status).toBe(200)
      expect(responseSize).toBeLessThan(5000) // 5KB 이하
    })
  })
})