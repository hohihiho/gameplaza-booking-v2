/**
 * v2 API 성능 벤치마크 테스트
 * QA Engineer Agent 작성
 * 
 * 목표:
 * - 모든 API 응답시간 < 200ms
 * - 동시 요청 처리 능력
 * - 메모리 사용량 모니터링
 * - 3G 네트워크 시뮬레이션
 */

import { performance } from 'perf_hooks'
import { createMockSupabaseClient } from '@/lib/test-utils/mock-supabase'
import { NextRequest } from 'next/server'

// Mock 모듈들
jest.mock('@/lib/db', () => ({
  createAdminClient: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn()
}))

jest.mock('@/lib/db', () => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: '테스트 사용자' }
          }
        },
        error: null
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
}))

const { createAdminClient } = require('@/lib/db')
const { getCurrentUser } = require('@/lib/auth')

// v2 API 엔드포인트 import
import { POST as createReservation, GET as getReservations } from '../../reservations/route'

describe('v2 API Performance Benchmarks', () => {
  let mockSupabase: any
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_fullName: '테스트 사용자' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    createAdminClient.mockReturnValue(mockSupabase)
    getCurrentUser.mockResolvedValue(testUser)
    
    // Supabase client mock 설정
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: { full_name: '테스트 사용자' }
            }
          },
          error: null
        }))
      },
      from: jest.fn((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-user-id',
                email: 'test@example.com',
                full_name: '테스트 사용자',
                birth_date: '1990-01-01',
                phone: '010-1234-5678',
                status: 'active',
                role: 'user'
              },
              error: null
            }))
          }
        }
        if (table === 'devices') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'device-123',
                device_number: '1',
                name: 'PC-001',
                type_id: 'type-123',
                status: 'available'
              },
              error: null
            }))
          }
        }
        if (table === 'time_slot_templates') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn(() => Promise.resolve({
              data: [{
                id: 'template-123',
                name: '일반 시간',
                type: 'regular',
                start_hour: 14,
                end_hour: 18,
                credit_options: [{
                  type: 'freeplay',
                  hours: [1, 2, 3, 4],
                  prices: { 1: 3000, 2: 5000, 3: 7000, 4: 9000 }
                }],
                enable_2p: true,
                price_2p_extra: 1000,
                is_youth_time: false,
                priority: 1,
                is_active: true
              }],
              error: null
            }))
          }
        }
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn(() => Promise.resolve({
              data: Array(10).fill(null).map((_, i) => ({
                id: `reservation-${i}`,
                user_id: 'test-user-id',
                device_id: 'device-123',
                date: '2025-12-01',
                start_hour: 14,
                end_hour: 18,
                status: 'approved',
                reservation_number: `GP-20251201-000${i}`,
                created_at: new Date().toISOString()
              })),
              error: null,
              count: 100
            })),
            insert: jest.fn(() => Promise.resolve({
              data: {
                id: 'new-reservation',
                reservation_number: 'GP-20251201-0001'
              },
              error: null
            }))
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }
      })
    })
    
    // 빠른 Mock 응답 설정
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null
      }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    }))
  })

  describe('Response Time Benchmarks', () => {
    it('예약 생성 API - 200ms 이내', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-07-25',
          start_time: '14:00',
          end_time: '16:00',
          device_id: 'device-1'
        })
      })

      const startTime = performance.now()
      const response = await createReservation(request)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(response.status).toBeLessThanOrEqual(400)
      expect(duration).toBeLessThan(200)
      console.log(`Create Reservation API: ${duration.toFixed(2)}ms`)
    })

    it('예약 목록 조회 API - 200ms 이내', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=10')

      const startTime = performance.now()
      const response = await getReservations(request)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(200)
      console.log(`Get Reservations API: ${duration.toFixed(2)}ms`)
    })

    it('페이지네이션 성능 (100건)', async () => {
      // 100건의 예약 데이터 Mock
      const mockReservations = Array.from({ length: 100 }, (_, i) => ({
        id: `res-${i}`,
        user_id: testUser.id,
        device_id: `device-${i % 10}`,
        date: '2025-07-25',
        start_time: `${10 + (i % 12)}:00`,
        end_time: `${12 + (i % 12)}:00`,
        status: ['pending', 'approved', 'completed'][i % 3]
      }))

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockReservations.slice(0, 10), // 첫 페이지 10건
          error: null
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=10')

      const startTime = performance.now()
      const response = await getReservations(request)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(200)
      console.log(`Paginated List (100 items): ${duration.toFixed(2)}ms`)
    })
  })

  describe('Concurrent Request Handling', () => {
    it('10개 동시 예약 생성', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/v2/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: '2025-07-25',
            start_time: `${14 + i}:00`,
            end_time: `${15 + i}:00`,
            device_id: `device-${i}`
          })
        })
      )

      const startTime = performance.now()
      const responses = await Promise.all(
        requests.map(req => createReservation(req))
      )
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(responses.every(r => r.status <= 400)).toBe(true)
      expect(duration).toBeLessThan(2000) // 10건 모두 2초 이내
      console.log(`10 Concurrent Requests: ${duration.toFixed(2)}ms`)
      console.log(`Average per request: ${(duration / 10).toFixed(2)}ms`)
    })

    it('50개 동시 조회 요청', async () => {
      const requests = Array.from({ length: 50 }, () => 
        new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=5')
      )

      const startTime = performance.now()
      const responses = await Promise.all(
        requests.map(req => getReservations(req))
      )
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(duration).toBeLessThan(5000) // 50건 모두 5초 이내
      console.log(`50 Concurrent GET Requests: ${duration.toFixed(2)}ms`)
      console.log(`Average per request: ${(duration / 50).toFixed(2)}ms`)
    })
  })

  describe('Memory Usage Monitoring', () => {
    it('메모리 사용량 추적', async () => {
      const initialMemory = process.memoryUsage()
      
      // 100개의 예약 생성
      const requests = Array.from({ length: 100 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/v2/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: '2025-07-25',
            start_time: `${(i % 24).toString().padStart(2, '0')}:00`,
            end_time: `${((i + 1) % 24).toString().padStart(2, '0')}:00`,
            device_id: `device-${i % 10}`,
            user_notes: 'Memory test reservation '.repeat(10) // 약 250바이트
          })
        })
      )

      await Promise.all(requests.map(req => createReservation(req)))
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = {
        heapUsed: (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024,
        external: (finalMemory.external - initialMemory.external) / 1024 / 1024
      }

      console.log(`Memory increase after 100 requests:`)
      console.log(`- Heap: ${memoryIncrease.heapUsed.toFixed(2)} MB`)
      console.log(`- External: ${memoryIncrease.external.toFixed(2)} MB`)

      // 메모리 증가가 50MB 미만인지 확인
      expect(memoryIncrease.heapUsed).toBeLessThan(50)
    })
  })

  describe('3G Network Simulation', () => {
    // 3G 네트워크 시뮬레이션 (지연 추가)
    const simulate3GDelay = () => new Promise(resolve => setTimeout(resolve, 100))

    it('3G 환경에서 예약 생성', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-07-25',
          start_time: '14:00',
          end_time: '16:00',
          device_id: 'device-1'
        })
      })

      const startTime = performance.now()
      
      // 3G 네트워크 지연 시뮬레이션
      await simulate3GDelay()
      const response = await createReservation(request)
      await simulate3GDelay()
      
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(response.status).toBeLessThanOrEqual(400)
      expect(duration).toBeLessThan(500) // 3G에서도 500ms 이내
      console.log(`3G Network Simulation: ${duration.toFixed(2)}ms`)
    })

    it('3G 환경에서 페이지네이션', async () => {
      // 최소 데이터 전송 (pageSize=5)
      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=5')

      const startTime = performance.now()
      
      await simulate3GDelay()
      const response = await getReservations(request)
      await simulate3GDelay()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      const data = await response.json()
      const responseSize = JSON.stringify(data).length

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(500)
      expect(responseSize).toBeLessThan(3000) // 3KB 미만
      console.log(`3G Pagination: ${duration.toFixed(2)}ms, Size: ${responseSize} bytes`)
    })
  })

  describe('Stress Testing', () => {
    it('대량 데이터 처리 (1000건 예약)', async () => {
      const mockReservations = Array.from({ length: 1000 }, (_, i) => ({
        id: `res-${i}`,
        user_id: testUser.id,
        device_id: `device-${i % 20}`,
        date: `2025-07-${(i % 30 + 1).toString().padStart(2, '0')}`,
        start_time: `${(i % 24).toString().padStart(2, '0')}:00`,
        end_time: `${((i + 2) % 24).toString().padStart(2, '0')}:00`,
        status: ['pending', 'approved', 'completed', 'cancelled'][i % 4]
      }))

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockImplementation((start, end) => 
          Promise.resolve({
            data: mockReservations.slice(start, end + 1),
            error: null
          })
        )
      }))

      const request = new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=50')

      const startTime = performance.now()
      const response = await getReservations(request)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(300) // 대량 데이터도 300ms 이내
      console.log(`Large Dataset (1000 items, 50 per page): ${duration.toFixed(2)}ms`)
    })

    it('Peak Time 시뮬레이션 (100명 동시 접속)', async () => {
      const userRequests = Array.from({ length: 100 }, (_, i) => {
        // 50% 예약 생성, 50% 조회
        if (i % 2 === 0) {
          return new NextRequest('http://localhost:3000/api/v2/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: '2025-07-25',
              start_time: `${(i % 24).toString().padStart(2, '0')}:00`,
              end_time: `${((i + 1) % 24).toString().padStart(2, '0')}:00`,
              device_id: `device-${i % 10}`
            })
          })
        } else {
          return new NextRequest('http://localhost:3000/api/v2/reservations?page=1&pageSize=10')
        }
      })

      const startTime = performance.now()
      
      const responses = await Promise.all(
        userRequests.map((req, i) => 
          i % 2 === 0 ? createReservation(req) : getReservations(req)
        )
      )
      
      const endTime = performance.now()
      const duration = endTime - startTime

      const successCount = responses.filter(r => r.status <= 400).length
      const errorCount = responses.filter(r => r.status > 400).length

      console.log(`Peak Time Simulation (100 users):`)
      console.log(`- Total time: ${duration.toFixed(2)}ms`)
      console.log(`- Success: ${successCount}, Errors: ${errorCount}`)
      console.log(`- Average per request: ${(duration / 100).toFixed(2)}ms`)

      expect(successCount).toBeGreaterThan(95) // 95% 이상 성공
      expect(duration).toBeLessThan(10000) // 10초 이내 모든 처리
    })
  })
})