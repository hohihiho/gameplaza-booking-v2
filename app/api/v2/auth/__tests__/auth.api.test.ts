// Mock Next.js server first
jest.mock('next/server', () => ({
  NextRequest: jest.requireActual('next/server').NextRequest,
  NextResponse: class NextResponse {
    status: number
    headers: Map<string, string>
    
    constructor(body: any, init?: any) {
      this.status = init?.status || 200
      this.headers = new Map()
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string)
        })
      }
    }
    
    static json(body: any, init?: any) {
      const response = new NextResponse(body, init)
      response.json = async () => body
      return response
    }
  }
}))

// Mock 설정을 맨 위에
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    // 실제 JWT 형식의 토큰 반환
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = 'mock-signature'
    return `${header}.${body}.${signature}`
  }),
  verify: jest.fn((token, secret) => {
    // 토큰 형식 검증
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }
    
    // 토큰이 유효한 형식이면 payload 반환
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      return payload
    }
    
    throw new Error('Invalid token')
  })
}))

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true
      })
    })
  }))
}))

import { NextRequest } from 'next/server'
import { POST as googleAuth } from '../google/route'
import { POST as refreshToken } from '../refresh/route'
import { POST as logout } from '../logout/route'
import { GET as getProfile } from '../profile/route'
import { createClient } from '@supabase/supabase-js'
import * as jwt from 'jsonwebtoken'

// Mock 환경 변수
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-must-be-at-least-32-characters-long'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-must-be-at-least-32-characters-long'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock 데이터 정의
const mockUserData = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: null,
  role: 'user',
  status: 'active',
  birth_date: null,
  profile_image_url: 'https://example.com/photo.jpg',
  google_id: 'google-123',
  last_login_at: null,
  login_attempts: 0,
  suspended_until: null,
  banned_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockSessionData = {
  id: 'session-123',
  user_id: 'user-123',
  access_token: 'valid-access-token',
  refresh_token: 'valid-refresh-token',
  expires_at: new Date(Date.now() + 3600000).toISOString(), // 1시간 후
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_activity_at: new Date().toISOString(),
  is_active: true,
  device_info: {
    type: 'desktop',
    os: 'Windows',
    browser: 'Chrome'
  },
  ip_address: '127.0.0.1',
  user_agent: 'Test Browser'
}

// mocked 함수들을 가져옴
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockSupabaseClient = mockCreateClient({} as any, {} as any)
const mockJWT = jwt as jest.Mocked<typeof jwt>

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    // 각 테스트 전에 mock 리셋
    jest.clearAllMocks()
  })

  describe('POST /api/v2/auth/google', () => {
    beforeEach(() => {
      // Google 로그인을 위한 mock 설정
      const userChainable = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      }
      
      const sessionChainable = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSessionData, error: null })
      }
      
      // insert 메서드가 체이닝 가능하도록 수정
      sessionChainable.insert = jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: mockSessionData, error: null })
      }))
      
      // order().eq() 체인을 위한 설정
      sessionChainable.order = jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
      
      mockSupabaseClient.from = jest.fn((table) => {
        if (table === 'users') return userChainable
        if (table === 'sessions') return sessionChainable
        return userChainable
      }) as any
    })

    it('Google ID 토큰으로 로그인해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '127.0.0.1',
          'User-Agent': 'Test Browser'
        },
        body: JSON.stringify({
          googleIdToken: 'valid-google-token',
          deviceInfo: {
            type: 'desktop',
            os: 'Windows',
            browser: 'Chrome'
          }
        })
      })

      const response = await googleAuth(request)
      const data = await response.json()
      
      // JWT 토큰이 생성되었는지 확인
      const accessTokenParts = data.accessToken?.split('.')
      const refreshTokenParts = data.refreshToken?.split('.')

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        user: expect.objectContaining({
          email: 'test@example.com',
          fullName: 'Test User'
        }),
        tokenType: 'Bearer'
      })
      
      // JWT 토큰 형식 검증
      expect(accessTokenParts).toHaveLength(3)
      expect(refreshTokenParts).toHaveLength(3)
    }, 10000) // 타임아웃 증가

    it('Google ID 토큰이 없으면 400 에러를 반환해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await googleAuth(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Google ID token is required')
    })
  })

  describe('POST /api/v2/auth/refresh', () => {
    beforeEach(() => {
      // refresh를 위한 mock 설정
      const sessionChainable = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSessionData, error: null })
      }
      
      // update().eq() 체인을 위한 설정
      sessionChainable.update = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockSessionData, error: null })
        }))
      }))
      
      const userChainable = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      }
      
      mockSupabaseClient.from = jest.fn((table) => {
        if (table === 'sessions') return sessionChainable
        if (table === 'users') return userChainable
        return sessionChainable
      }) as any
    })

    it('리프레시 토큰으로 새 액세스 토큰을 발급해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: mockJWT.sign(
            { sub: 'user-123', email: 'test@example.com', sessionId: 'session-123', type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
          )
        })
      })

      const response = await refreshToken(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        accessToken: expect.any(String),
        expiresIn: expect.any(Number),
        tokenType: expect.any(String)
      })
    }, 10000) // 타임아웃 증가

    it('리프레시 토큰이 없으면 400 에러를 반환해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await refreshToken(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Refresh token is required')
    })
  })

  describe('POST /api/v2/auth/logout', () => {
    beforeEach(() => {
      // logout을 위한 mock 설정
      const sessionChainable = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...mockSessionData, is_active: false }, error: null })
      }
      
      // update().eq() 체인을 위한 설정
      sessionChainable.update = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { ...mockSessionData, is_active: false }, error: null })
        }))
      }))
      
      // select().eq().eq() 체인을 위한 설정 (findActiveByUserId 용)
      sessionChainable.select = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [mockSessionData], error: null }))
          }))
        }))
      }))
      
      mockSupabaseClient.from = jest.fn(() => sessionChainable) as any
    })

    it('현재 세션을 로그아웃해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': 'user-123',
          'X-User-Email': 'test@example.com',
          'X-User-Role': 'user',
          'X-Session-Id': 'session-123'
        },
        body: JSON.stringify({})
      })

      const response = await logout(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('로그아웃되었습니다')
    })

    it('모든 디바이스에서 로그아웃할 수 있어야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': 'user-123',
          'X-User-Email': 'test@example.com',
          'X-User-Role': 'user',
          'X-Session-Id': 'session-123'
        },
        body: JSON.stringify({
          allDevices: true
        })
      })

      const response = await logout(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('모든 디바이스에서 로그아웃되었습니다')
    })

    it('인증 없이 요청하면 401 에러를 반환해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await logout(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/v2/auth/profile', () => {
    beforeEach(() => {
      // profile을 위한 mock 설정
      const userChainable = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      }
      
      mockSupabaseClient.from = jest.fn(() => userChainable) as any
    })

    it('인증된 사용자의 프로필을 반환해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/profile', {
        method: 'GET',
        headers: { 
          'X-User-Id': 'user-123',
          'X-User-Email': 'test@example.com',
          'X-User-Role': 'user',
          'X-Session-Id': 'session-123'
        }
      })

      const response = await getProfile(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        fullName: expect.any(String),
        role: expect.any(String)
      })
    })

    it('인증 없이 요청하면 401 에러를 반환해야 한다', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/auth/profile', {
        method: 'GET'
      })

      const response = await getProfile(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('CORS Support', () => {
    it('OPTIONS 요청에 대해 CORS 헤더를 반환해야 한다', async () => {
      // NextResponse를 직접 import해서 사용
      const { OPTIONS } = await import('../google/route')
      const response = await OPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
    })
  })
})