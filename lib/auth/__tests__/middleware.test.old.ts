import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../middleware'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { mocked } from 'jest-mock'

// Mock modules
jest.mock('@supabase/ssr')
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn()
}))
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn((url) => ({ 
      redirect: url,
      headers: new Map(),
      status: 302 
    })),
    next: jest.fn((options) => ({ 
      next: true,
      headers: options?.request?.headers || new Map()
    })),
    json: jest.fn((data, options) => ({
      json: data,
      status: options?.status || 200
    }))
  },
}))

describe('Auth Middleware', () => {
  const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
  const mockCreateAdminClient = createAdminClient as any
  let mockSupabaseClient: any
  let mockAdminClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabaseClient)
    
    // Setup admin client mock
    mockAdminClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    mocked(createAdminClient).mockReturnValue(mockAdminClient)
  })

  describe('보호된 경로 접근', () => {
    it('인증되지 않은 사용자는 로그인 페이지로 리다이렉트되어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/mypage', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.redirect).toBeDefined()
      expect(response.redirect.toString()).toContain('/login')
    })

    it('인증된 사용자는 접근이 허용되어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
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
      const response = await authMiddleware(request)

      // Assert
      expect(response.next).toBe(true)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('관리자 경로 접근', () => {
    it('일반 사용자는 관리자 페이지에 접근할 수 없어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            user: { id: 'user-123', email: 'user@example.com' },
            access_token: 'valid-token',
          },
        },
        error: null,
      })

      // 관리자 권한 확인을 위한 mock - 일반 사용자
      mockAdminClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'user-123', email: 'user@example.com', role: 'user' },
              error: null,
            })
          }
        }
        return mockAdminClient
      })

      const request = new NextRequest('http://localhost:3000/admin', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.redirect).toBeDefined()
      expect(response.redirect.toString()).toContain('/')
    })

    it('관리자는 관리자 페이지에 접근할 수 있어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { 
            id: 'admin-123', 
            email: 'admin@example.com',
            phone: null,
            user_metadata: {}
          },
        },
        error: null,
      })

      // 관리자 권한 확인을 위한 mock - users 테이블
      mockAdminClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'admin-123', email: 'admin@example.com', role: 'admin' },
              error: null,
            })
          }
        }
        if (table === 'admins') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'admin-123', is_super_admin: false },
              error: null,
            })
          }
        }
        return mockAdminClient
      })

      const request = new NextRequest('http://localhost:3000/admin', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.next).toBe(true)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('공개 경로 접근', () => {
    it('인증되지 않은 사용자도 홈페이지에 접근할 수 있어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.next).toBe(true)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('세션 에러 처리', () => {
    it('세션 조회 실패 시 로그인 페이지로 리다이렉트되어야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: null,
        error: new Error('Session error'),
      })

      const request = new NextRequest('http://localhost:3000/mypage', {
        method: 'GET',
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.redirect).toBeDefined()
      expect(response.redirect.toString()).toContain('/login')
    })
  })
})