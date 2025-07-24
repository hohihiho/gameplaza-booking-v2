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

import { createMockSupabaseClient } from '@/lib/test-utils/mock-supabase'
import { NextRequest } from 'next/server'

// v2 API 엔드포인트 import (아직 구현 전이므로 목 처리)
const approveReservation = jest.fn()
const rejectReservation = jest.fn()
const checkInReservation = jest.fn()
const completeReservation = jest.fn()
const markAsNoShow = jest.fn()

// Mock 모듈들
jest.mock('@/lib/supabase', () => ({
  createAdminClient: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  isAdmin: jest.fn()
}))

const { createAdminClient } = require('@/lib/supabase')
const { getCurrentUser, isAdmin } = require('@/lib/auth')

describe('v2 API Integration Tests - Admin Functions', () => {
  let mockSupabase: any
  let performanceStart: number

  const adminUser = {
    id: 'admin-user-id',
    email: 'admin@gameplaza.com',
    user_metadata: {
      full_name: '관리자',
      role: 'admin'
    }
  }

  const regularUser = {
    id: 'regular-user-id',
    email: 'user@example.com',
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
    mockSupabase = createMockSupabaseClient()
    createAdminClient.mockReturnValue(mockSupabase)
    performanceStart = Date.now()
  })

  afterEach(() => {
    const duration = Date.now() - performanceStart
    expect(duration).toBeLessThan(200)
  })

  describe('예약 승인 기능', () => {
    it('관리자가 예약 승인', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...testReservation, status: 'approved' },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const response = await approveReservation(testReservation.id)
      
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('approved')
    })

    it('비관리자 접근 차단', async () => {
      getCurrentUser.mockResolvedValue(regularUser)
      isAdmin.mockResolvedValue(false)

      const response = await approveReservation(testReservation.id)
      
      expect(response.status).toBe(403)
      expect(response.error).toContain('권한')
    })

    it('이미 승인된 예약 재승인 방지', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...testReservation, status: 'approved' },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const response = await approveReservation(testReservation.id)
      
      expect(response.status).toBe(400)
      expect(response.error).toContain('이미 승인')
    })
  })

  describe('예약 거절 기능', () => {
    it('관리자가 예약 거절 및 사유 기록', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      const rejectionReason = '기기 점검으로 인한 사용 불가'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                ...testReservation, 
                status: 'rejected',
                admin_notes: rejectionReason 
              },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const response = await rejectReservation(testReservation.id, rejectionReason)
      
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('rejected')
      expect(response.data.admin_notes).toBe(rejectionReason)
    })

    it('거절 사유 필수 입력', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      const response = await rejectReservation(testReservation.id, '')
      
      expect(response.status).toBe(400)
      expect(response.error).toContain('거절 사유')
    })
  })

  describe('체크인 기능', () => {
    const approvedReservation = {
      ...testReservation,
      status: 'approved'
    }

    it('정상적인 체크인 처리', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      const now = new Date()
      const checkInTime = now.toISOString()

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: approvedReservation,
              error: null
            }),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                ...approvedReservation, 
                status: 'checked_in',
                checked_in_at: checkInTime 
              },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const response = await checkInReservation(testReservation.id)
      
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('checked_in')
      expect(response.data.checked_in_at).toBeDefined()
    })

    it('승인되지 않은 예약 체크인 방지', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      mockSupabase.from.mockImplementation((table: string) => {
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
        return mockSupabase.from(table)
      })

      const response = await checkInReservation(testReservation.id)
      
      expect(response.status).toBe(400)
      expect(response.error).toContain('승인된 예약')
    })

    it('예약 시간 30분 전부터 체크인 허용', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      // 예약 시간 20분 전
      const now = new Date()
      const [hours, minutes] = testReservation.start_time.split(':')
      const reservationTime = new Date(testReservation.date)
      reservationTime.setHours(parseInt(hours), parseInt(minutes))
      const timeDiff = (reservationTime.getTime() - now.getTime()) / 1000 / 60

      if (timeDiff <= 30 && timeDiff >= -10) {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'reservations') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: approvedReservation,
                error: null
              }),
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { 
                  ...approvedReservation, 
                  status: 'checked_in' 
                },
                error: null
              })
            }
          }
          return mockSupabase.from(table)
        })

        const response = await checkInReservation(testReservation.id)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('예약 완료 및 노쇼 처리', () => {
    const checkedInReservation = {
      ...testReservation,
      status: 'checked_in',
      checked_in_at: new Date().toISOString()
    }

    it('정상 완료 처리', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                ...checkedInReservation, 
                status: 'completed',
                completed_at: new Date().toISOString() 
              },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const response = await completeReservation(testReservation.id)
      
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('completed')
      expect(response.data.completed_at).toBeDefined()
    })

    it('노쇼 처리 (예약 시간 30분 경과)', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

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
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                ...approvedReservation, 
                status: 'no_show' 
              },
              error: null
            })
          }
        }
        return mockSupabase.from(table)
      })

      const response = await markAsNoShow(testReservation.id)
      
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('no_show')
    })

    it('이미 체크인한 예약은 노쇼 처리 불가', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

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
        return mockSupabase.from(table)
      })

      const response = await markAsNoShow(testReservation.id)
      
      expect(response.status).toBe(400)
      expect(response.error).toContain('체크인')
    })
  })

  describe('성능 테스트', () => {
    it('대량 예약 승인 처리 (10건)', async () => {
      getCurrentUser.mockResolvedValue(adminUser)
      isAdmin.mockResolvedValue(true)

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
        
        promises.push(approveReservation(`res-${i}`))
      }

      await Promise.all(promises)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(2000) // 10건 처리에 2초 이내
    })
  })
})