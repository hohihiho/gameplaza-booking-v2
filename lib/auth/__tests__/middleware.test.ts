import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../middleware'
import { createClient } from '@/lib/supabase'

// Mock modules
jest.mock('@/lib/supabase')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn((url) => ({ redirect: url })),
    next: jest.fn(() => ({ next: true })),
  },
}))

describe('Auth Middleware', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
      },
    }
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('보호된 경로 접근', () => {
    it('인증되지 않은 사용자는 로그인 페이지로 리다이렉트되어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/mypage', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request, '/mypage')

      // Assert
      expect(response.redirect).toBeDefined()
      expect(response.redirect.toString()).toContain('/auth/signin')
    })

    it('인증된 사용자는 접근이 허용되어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'valid-token',
          },
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/mypage', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request, '/mypage')

      // Assert
      expect(response.next).toBe(true)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('관리자 경로 접근', () => {
    it('일반 사용자는 관리자 페이지에 접근할 수 없어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'user@example.com' },
            access_token: 'valid-token',
          },
        },
        error: null,
      })

      // 관리자 권한 확인을 위한 mock
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // 관리자 데이터 없음
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/admin', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request, '/admin')

      // Assert
      expect(response.redirect).toBeDefined()
      expect(response.redirect.toString()).toContain('/unauthorized')
    })

    it('관리자는 관리자 페이지에 접근할 수 있어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-123', email: 'admin@example.com' },
            access_token: 'valid-token',
          },
        },
        error: null,
      })

      // 관리자 권한 확인을 위한 mock
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'admin-123', is_super_admin: true },
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/admin', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request, '/admin')

      // Assert
      expect(response.next).toBe(true)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('공개 경로 접근', () => {
    it('인증되지 않은 사용자도 홈페이지에 접근할 수 있어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request, '/')

      // Assert
      expect(response.next).toBe(true)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('세션 에러 처리', () => {
    it('세션 조회 실패 시 로그인 페이지로 리다이렉트되어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: null,
        error: new Error('Session error'),
      })

      const request = new NextRequest('http://localhost:3000/mypage', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request, '/mypage')

      // Assert
      expect(response.redirect).toBeDefined()
      expect(response.redirect.toString()).toContain('/auth/signin')
    })
  })
})