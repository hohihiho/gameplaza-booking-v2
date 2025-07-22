import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST } from '../route'
import { createClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Mock modules
jest.mock('@/lib/supabase')

describe('POST /api/auth/phone/verify', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        verifyOtp: jest.fn(),
      },
      from: jest.fn(),
    }
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('전화번호 인증 검증', () => {
    it('유효한 전화번호와 코드로 인증을 완료해야 함', async () => {
      // Arrange
      const phoneNumber = '010-1234-5678'
      const code = '123456'
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null,
      })

      const request = new Request('http://localhost:3000/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber, code }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toContain('인증')
      expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
        phone: '+821012345678',
        token: '123456',
        type: 'sms',
      })
    })

    it('전화번호가 없으면 에러를 반환해야 함', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toContain('전화번호')
      expect(mockSupabaseClient.auth.verifyOtp).not.toHaveBeenCalled()
    })

    it('인증 코드가 없으면 에러를 반환해야 함', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: '010-1234-5678' }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toContain('인증 코드')
      expect(mockSupabaseClient.auth.verifyOtp).not.toHaveBeenCalled()
    })

    it('잘못된 인증 코드로 실패 시 에러를 반환해야 함', async () => {
      // Arrange
      const phoneNumber = '010-1234-5678'
      const wrongCode = '999999'
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid OTP' },
      })

      const request = new Request('http://localhost:3000/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber, code: wrongCode }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid OTP')
      expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
        phone: '+821012345678',
        token: wrongCode,
        type: 'sms',
      })
    })

    it('서버 에러 발생 시 에러를 반환해야 함', async () => {
      // Arrange
      const phoneNumber = '010-1234-5678'
      const code = '123456'
      mockSupabaseClient.auth.verifyOtp.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNumber, code }),
      })

      // Act
      const response = await POST(request as any)
      const responseData = await response.json()

      // Assert
      // phone-auth 모듈의 catch 블록에서 에러를 처리하여 400을 반환
      expect(response.status).toBe(400)
      expect(responseData.error).toContain('인증 코드 검증 중 오류가 발생했습니다')
    })
  })
})