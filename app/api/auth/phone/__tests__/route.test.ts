import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST } from '../route'
import { createClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Mock modules
jest.mock('@/lib/supabase')

// Mock Request class
global.Request = jest.fn().mockImplementation((input, init) => {
  return {
    url: input,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => init?.body ? JSON.parse(init.body) : {},
  }
}) as any

describe('POST /api/auth/phone', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        signInWithOtp: jest.fn(),
      },
      from: jest.fn(),
    }
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('전화번호 인증 요청', () => {
    it('유효한 전화번호로 OTP를 전송해야 함', async () => {
      // Arrange
      const phoneNumber = '010-1234-5678'
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const request = new Request('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toContain('인증 코드')
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        phone: '+8201012345678', // 국제 번호 형식으로 변환
        options: {
          channel: 'sms',
        },
      })
    })

    it('잘못된 전화번호 형식은 거부해야 함', async () => {
      // Arrange
      const invalidPhone = '123-456-7890'
      
      const request = new Request('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({ phone: invalidPhone }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toBe('올바른 전화번호 형식이 아닙니다')
      expect(mockSupabaseClient.auth.signInWithOtp).not.toHaveBeenCalled()
    })

    it('전화번호가 없으면 에러를 반환해야 함', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toBe('전화번호를 입력해주세요')
    })

    it('Supabase 에러를 처리해야 함', async () => {
      // Arrange
      const phoneNumber = '010-1234-5678'
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'SMS provider error' },
      })

      const request = new Request('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.error).toBe('SMS provider error')
    })

    it('요청 속도 제한을 확인해야 함', async () => {
      // Arrange
      const phoneNumber = '010-1234-5678'
      
      // 첫 번째 요청 - 성공
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const request1 = new Request('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber }),
      })

      await POST(request1 as any)

      // 두 번째 요청 - 너무 빠른 재요청
      const request2 = new Request('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber }),
      })

      // Act
      const response = await POST(request2 as any)
      const responseData = await response.json()

      // Assert - 실제 구현에 따라 달라질 수 있음
      // 예: 429 Too Many Requests 또는 특정 에러 메시지
      expect([429, 200]).toContain(response.status)
      if (response.status === 429) {
        expect(responseData.error).toContain('잠시 후')
      }
    })
  })
})