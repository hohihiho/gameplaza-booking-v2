import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { 
  formatPhoneForSupabase, 
  sendPhoneOTP, 
  verifyPhoneOTP 
} from '../phone-auth'
import { createClient } from '@/lib/supabase'

// Mock modules
jest.mock('@/lib/supabase')

describe('Phone Authentication', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        signInWithOtp: jest.fn(),
        verifyOtp: jest.fn(),
      },
    }
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('formatPhoneForSupabase', () => {
    it('한국 전화번호를 국제 형식으로 변환해야 함', () => {
      expect(formatPhoneForSupabase('010-1234-5678')).toBe('+821012345678')
      expect(formatPhoneForSupabase('01012345678')).toBe('+821012345678')
      expect(formatPhoneForSupabase('011-123-4567')).toBe('+82111234567')
    })
  })

  describe('sendPhoneOTP', () => {
    it('유효한 전화번호로 OTP를 전송해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      // Act
      const result = await sendPhoneOTP('010-1234-5678')

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('인증 코드가 전송되었습니다')
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        phone: '+821012345678',
        options: { channel: 'sms' },
      })
    })

    it('전화번호가 없으면 에러를 반환해야 함', async () => {
      // Act
      const result = await sendPhoneOTP('')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('전화번호를 입력해주세요')
      expect(mockSupabaseClient.auth.signInWithOtp).not.toHaveBeenCalled()
    })

    it('잘못된 전화번호 형식은 거부해야 함', async () => {
      // Act
      const result = await sendPhoneOTP('123-456-7890')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('올바른 전화번호 형식이 아닙니다')
      expect(mockSupabaseClient.auth.signInWithOtp).not.toHaveBeenCalled()
    })

    it('Supabase 에러를 처리해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'SMS provider error' },
      })

      // Act
      const result = await sendPhoneOTP('010-1234-5678')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('SMS provider error')
    })
  })

  describe('verifyPhoneOTP', () => {
    it('유효한 코드로 인증을 완료해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null,
      })

      // Act
      const result = await verifyPhoneOTP('010-1234-5678', '123456')

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('인증이 완료되었습니다')
      expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
        phone: '+821012345678',
        token: '123456',
        type: 'sms',
      })
    })

    it('전화번호나 코드가 없으면 에러를 반환해야 함', async () => {
      // Act
      const result1 = await verifyPhoneOTP('', '123456')
      const result2 = await verifyPhoneOTP('010-1234-5678', '')

      // Assert
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('전화번호와 인증 코드를 입력해주세요')
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('전화번호와 인증 코드를 입력해주세요')
    })

    it('잘못된 코드로 인증 실패 시 에러를 반환해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid OTP' },
      })

      // Act
      const result = await verifyPhoneOTP('010-1234-5678', '999999')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid OTP')
    })
  })
})