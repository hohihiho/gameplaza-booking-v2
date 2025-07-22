import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { 
  isAuthenticated, 
  hasAdminAccess,
  getSessionUser,
  validatePhoneNumber,
  formatPhoneNumber 
} from '../utils-new'
import { createClient } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase')

describe('Auth Utils', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
      },
      from: jest.fn(),
    }
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('isAuthenticated', () => {
    it('인증된 세션이 있으면 true를 반환해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'valid-token',
          },
        },
        error: null,
      })

      // Act
      const result = await isAuthenticated()

      // Assert
      expect(result).toBe(true)
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('세션이 없으면 false를 반환해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Act
      const result = await isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })

    it('에러가 발생하면 false를 반환해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: null,
        error: new Error('Session error'),
      })

      // Act
      const result = await isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('hasAdminAccess', () => {
    it('관리자 권한이 있으면 true를 반환해야 함', async () => {
      // Arrange
      const userId = 'admin-123'
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'admin-123', is_super_admin: true },
              error: null,
            }),
          }),
        }),
      })

      // Act
      const result = await hasAdminAccess(userId)

      // Assert
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('admins')
    })

    it('관리자 권한이 없으면 false를 반환해야 함', async () => {
      // Arrange
      const userId = 'user-123'
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      // Act
      const result = await hasAdminAccess(userId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getSessionUser', () => {
    it('세션이 있으면 사용자 정보를 반환해야 함', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '010-1234-5678',
      }
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: { user: mockUser },
        },
        error: null,
      })

      // Act
      const result = await getSessionUser()

      // Assert
      expect(result).toEqual(mockUser)
    })

    it('세션이 없으면 null을 반환해야 함', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Act
      const result = await getSessionUser()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Phone Number Utils', () => {
    describe('validatePhoneNumber', () => {
      it('올바른 전화번호 형식이면 true를 반환해야 함', () => {
        expect(validatePhoneNumber('010-1234-5678')).toBe(true)
        expect(validatePhoneNumber('011-123-4567')).toBe(true)
        expect(validatePhoneNumber('016-1234-5678')).toBe(true)
        expect(validatePhoneNumber('01012345678')).toBe(true)
      })

      it('잘못된 전화번호 형식이면 false를 반환해야 함', () => {
        expect(validatePhoneNumber('123-1234-5678')).toBe(false)
        expect(validatePhoneNumber('010-12-5678')).toBe(false)
        expect(validatePhoneNumber('abcd-efgh-ijkl')).toBe(false)
        expect(validatePhoneNumber('')).toBe(false)
      })
    })

    describe('formatPhoneNumber', () => {
      it('하이픈이 없는 번호를 포맷팅해야 함', () => {
        expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678')
        expect(formatPhoneNumber('0111234567')).toBe('011-123-4567')
      })

      it('이미 포맷팅된 번호는 그대로 반환해야 함', () => {
        expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678')
      })

      it('잘못된 형식은 그대로 반환해야 함', () => {
        expect(formatPhoneNumber('12345')).toBe('12345')
        expect(formatPhoneNumber('')).toBe('')
      })
    })
  })
})