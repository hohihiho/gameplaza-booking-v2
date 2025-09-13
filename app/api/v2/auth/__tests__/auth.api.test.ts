// Mock Next.js server first
jest.mock('next/server', () => ({
  NextRequest: jest.requireActual('next/server').NextRequest,
  NextResponse: class NextResponse {
    status: number
    headers: Map<string, string>
    
    constructor(_body: any, init?: any) {
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
// Supabase mock을 더 단순하게 만듭니다
const mockSupabaseDB: Record<string, any[]> = {
  users: [],
  sessions: []
}

jest.mock('@supabase/supabase-js', () => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => {
        const filters: { [key: string]: any } = {}
        
        const queryBuilder: any = {
          eq: jest.fn((column: string, value: any) => {
            Object.assign(filters, { [column]: value })
            return queryBuilder
          }),
          order: jest.fn(() => queryBuilder),
          single: jest.fn(async () => {
            const record = mockSupabaseDB[table]?.find((r: any) => {
              return Object.entries(filters).every(([col, val]) => r[col] === val)
            })
            return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } }
          }),
          maybeSingle: jest.fn(async () => {
            const record = mockSupabaseDB[table]?.find((r: any) => {
              return Object.entries(filters).every(([col, val]) => r[col] === val)
            })
            return { data: record || null, error: null }
          }),
          then: jest.fn(async (callback) => {
            const records = mockSupabaseDB[table]?.filter((r: any) => {
              return Object.entries(filters).every(([col, val]) => r[col] === val)
            }) || []
            const result = { data: records, error: null }
            return callback ? callback(result) : result
          })
        }
        
        return queryBuilder
      }),
      insert: jest.fn((data: any) => ({
        select: jest.fn(() => ({
          single: jest.fn(async () => {
            const insertData = Array.isArray(data) ? data[0] : data
            mockSupabaseDB[table] = mockSupabaseDB[table] || []
            mockSupabaseDB[table].push(insertData)
            return { data: insertData, error: null }
          })
        })),
        single: jest.fn(async () => {
          const insertData = Array.isArray(data) ? data[0] : data
          mockSupabaseDB[table] = mockSupabaseDB[table] || []
          mockSupabaseDB[table].push(insertData)
          return { data: insertData, error: null }
        })
      })),
      update: jest.fn((updates: any) => ({
        eq: jest.fn((column: string, value: any) => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => {
              const index = mockSupabaseDB[table]?.findIndex((r: any) => r[column] === value)
              if (index >= 0) {
                mockSupabaseDB[table][index] = { ...mockSupabaseDB[table][index], ...updates }
                return { data: mockSupabaseDB[table][index], error: null }
              }
              return { data: null, error: { code: 'PGRST116' } }
            })
          })),
          single: jest.fn(async () => {
            const index = mockSupabaseDB[table]?.findIndex((r: any) => r[column] === value)
            if (index >= 0) {
              mockSupabaseDB[table][index] = { ...mockSupabaseDB[table][index], ...updates }
              return { data: mockSupabaseDB[table][index], error: null }
            }
            return { data: null, error: { code: 'PGRST116' } }
          })
        }))
      }))
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null })
    }
  }))
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, _secret, _options) => {
    // 실제 JWT 형식의 토큰 반환
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = 'mock-signature'
    return `${header}.${body}.${signature}`
  }),
  verify: jest.fn((token, _secret) => {
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

// Google Auth 관련 mock
const mockGooglePayload = {
  sub: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/photo.jpg',
  email_verified: true
}

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockImplementation(async () => ({
      getPayload: () => mockGooglePayload
    }))
  }))
}))

// GoogleAuthService mock
jest.mock('@/infrastructure/services/google-auth.service', () => ({
  GoogleAuthService: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      id: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true
    })
  }))
}))

// JWTTokenService mock
jest.mock('@/infrastructure/services/jwt-token.service', () => ({
  JWTTokenService: jest.fn().mockImplementation(() => ({
    generateToken: jest.fn((payload, options) => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = 'mock-signature'
      return Promise.resolve(`${header}.${body}.${signature}`)
    }),
    verifyToken: jest.fn((token) => {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) throw new Error('Invalid token format')
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
        return Promise.resolve(payload)
      } catch {
        throw new Error('Invalid token')
      }
    }),
    decodeToken: jest.fn((token) => {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) return null
        return JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      } catch {
        return null
      }
    })
  }))
}))

import { NextRequest } from 'next/server'
import { POST as googleAuth } from '../google/route'
import { POST as refreshToken } from '../refresh/route'
import { POST as logout } from '../logout/route'
import { GET as getProfile } from '../profile/route'
// // import { getDB, supabase } from '@/lib/db'
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

// JWT 형식의 토큰 생성
const createMockToken = () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub: 'user-123',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'session-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url')
  const signature = 'mock-signature'
  return `${header}.${payload}.${signature}`
}

const mockSessionData = {
  id: 'session-123',
  user_id: 'user-123',
  access_token: createMockToken(),
  refresh_token: createMockToken(),
  access_token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1시간 후
  refresh_token_expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(), // 7일 후
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

// Helper function for creating chainable query
const createChainableQuery = (defaultData: any = null) => {
  const builder: any = {
    data: defaultData,
    error: null,
    
    // 메소드들
    select: jest.fn(function(this: any) {
      return this
    }),
    insert: jest.fn(function(this: any) {
      return this
    }),
    update: jest.fn(function(this: any) {
      return this
    }),
    delete: jest.fn(function(this: any) {
      return this
    }),
    upsert: jest.fn(function(this: any) {
      return this
    }),
    eq: jest.fn(function(this: any) {
      return this
    }),
    neq: jest.fn(function(this: any) {
      return this
    }),
    gt: jest.fn(function(this: any) {
      return this
    }),
    gte: jest.fn(function(this: any) {
      return this
    }),
    lt: jest.fn(function(this: any) {
      return this
    }),
    lte: jest.fn(function(this: any) {
      return this
    }),
    like: jest.fn(function(this: any) {
      return this
    }),
    ilike: jest.fn(function(this: any) {
      return this
    }),
    in: jest.fn(function(this: any) {
      return this
    }),
    contains: jest.fn(function(this: any) {
      return this
    }),
    order: jest.fn(function(this: any) {
      return this
    }),
    limit: jest.fn(function(this: any) {
      return this
    }),
    offset: jest.fn(function(this: any) {
      return this
    }),
    range: jest.fn(function(this: any) {
      return this
    }),
    
    // 터미널 메소드들
    single: jest.fn(async function(this: any) {
      return { data: this.data, error: this.error }
    }),
    maybeSingle: jest.fn(async function(this: any) {
      return { data: this.data, error: this.error }
    }),
    then: jest.fn(async function(this: any, resolve: any) {
      const result = { data: this.data || [], error: this.error }
      return resolve ? resolve(result) : result
    })
  }
  
  // 메소드 체이닝을 위해 this 바인딩
  Object.keys(builder).forEach(key => {
    if (typeof builder[key] === 'function') {
      builder[key] = builder[key].bind(builder)
    }
  })
  
  return builder
}

// mocked 함수들을 가져옴
const mockSupabaseClient = mockCreateClient({} as any, {} as any)
const mockJWT = jwt as jest.Mocked<typeof jwt>

describe('Auth API Endpoints', () => {
  // 테스트 타임아웃 설정
  jest.setTimeout(30000)
  
  beforeEach(() => {
    // 각 테스트 전에 mock 리셋
    jest.clearAllMocks()
    // 가상 DB 초기화
    mockSupabaseDB.users = []
    mockSupabaseDB.sessions = []
  })

  describe('POST /api/v2/auth/google', () => {
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
    it('리프레시 토큰으로 새 액세스 토큰을 발급해야 한다', async () => {
      // 먼저 세션 데이터를 DB에 추가
      mockSupabaseDB.sessions.push(mockSessionData)
      mockSupabaseDB.users.push(mockUserData)
      
      // 리프레시 토큰 생성
      const validRefreshToken = mockJWT.sign(
        { 
          sub: 'user-123', 
          email: 'test@example.com', 
          role: 'user',
          sessionId: 'session-123',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7일 후
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      )
      
      const request = new NextRequest('http://localhost:3000/api/v2/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: validRefreshToken
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
    it('현재 세션을 로그아웃해야 한다', async () => {
      // 먼저 세션 데이터를 DB에 추가
      mockSupabaseDB.sessions.push({ ...mockSessionData, is_active: true })
      const request = new NextRequest('http://localhost:3000/api/v2/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': 'user-123',
          'X-User-Email': 'test@example.com',
          'X-User-Role': 'user',
          'X-Session-Id': 'session-123'
        },
        body: JSON.stringify({ sessionId: 'session-123' })
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
    it('인증된 사용자의 프로필을 반환해야 한다', async () => {
      // 먼저 사용자 데이터를 DB에 추가
      mockSupabaseDB.users.push(mockUserData)
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