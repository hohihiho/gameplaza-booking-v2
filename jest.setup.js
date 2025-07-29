// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import 'whatwg-fetch'
import React from 'react'

// React를 전역으로 설정
global.React = React

// isows 모듈 Mock (ESM 변환 문제 해결)
jest.mock('isows', () => ({
  WebSocket: global.WebSocket || class MockWebSocket {},
  getNativeWebSocket: () => global.WebSocket || class MockWebSocket {}
}))

// next-auth 모듈 Mock
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
    handlers: { GET: jest.fn(), POST: jest.fn() },
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google',
  })),
}))

// auth.ts 파일 Mock
jest.mock('./auth', () => ({
  auth: jest.fn(),
  handlers: { GET: jest.fn(), POST: jest.fn() },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// jose 모듈 Mock (ESM 변환 문제 해결)
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token')
  })),
  importPKCS8: jest.fn(),
  importSPKI: jest.fn()
}))

// @supabase/supabase-js Mock
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => {
    const createQueryBuilder = () => {
      const builder = {
        select: jest.fn(() => builder),
        insert: jest.fn(() => builder),
        update: jest.fn(() => builder),
        delete: jest.fn(() => builder),
        upsert: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        neq: jest.fn(() => builder),
        gt: jest.fn(() => builder),
        gte: jest.fn(() => builder),
        lt: jest.fn(() => builder),
        lte: jest.fn(() => builder),
        like: jest.fn(() => builder),
        ilike: jest.fn(() => builder),
        in: jest.fn(() => builder),
        contains: jest.fn(() => builder),
        order: jest.fn(() => builder),
        limit: jest.fn(() => builder),
        offset: jest.fn(() => builder),
        range: jest.fn(() => builder),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        then: jest.fn((resolve) => resolve({ data: [], error: null }))
      }
      return builder
    }
    
    return {
      from: jest.fn(() => createQueryBuilder()),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      }
    }
  })
}))

// Mock 환경 변수
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// MSW를 동적으로 import하여 Node.js 환경 문제 해결
if (typeof window === 'undefined') {
  beforeAll(async () => {
    const { server } = await import('./src/mocks/server')
    server.listen({ onUnhandledRequest: 'bypass' })
  })
  
  afterEach(async () => {
    const { server } = await import('./src/mocks/server')
    server.resetHandlers()
  })
  
  afterAll(async () => {
    const { server } = await import('./src/mocks/server')
    server.close()
  })
}

// Supabase SSR 클라이언트 mock
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

// Supabase 클라이언트 mock - 완전한 체인 메서드 지원
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
    from: jest.fn(() => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn(function() {
          // eq 체이닝을 지원하기 위해 자기 자신을 반환하고 eq 메서드도 추가
          this.eq = jest.fn().mockReturnThis();
          return this;
        }),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockResolvedValue({ data: [], error: null }),
      }
      return queryBuilder
    }),
  })),
  createAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        getUserById: jest.fn(),
        createUser: jest.fn(),
        updateUserById: jest.fn(),
        deleteUser: jest.fn(),
        listUsers: jest.fn(),
      },
    },
    from: jest.fn(() => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn(function() {
          // eq 체이닝을 지원하기 위해 자기 자신을 반환하고 eq 메서드도 추가
          this.eq = jest.fn().mockReturnThis();
          return this;
        }),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockResolvedValue({ data: [], error: null }),
      }
      return queryBuilder
    }),
  })),
}))

// Next.js router mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
}))

// 전역 mock 함수
global.fetch = jest.fn()

// Node.js 환경에서 누락된 전역 객체들 추가
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Touch 이벤트 mock (모바일 테스트용)
if (typeof global.Touch === 'undefined') {
  global.Touch = class Touch {
    constructor({ identifier, target, clientX, clientY, screenX, screenY, pageX, pageY }) {
      this.identifier = identifier;
      this.target = target;
      this.clientX = clientX || 0;
      this.clientY = clientY || 0;
      this.screenX = screenX || 0;
      this.screenY = screenY || 0;
      this.pageX = pageX || 0;
      this.pageY = pageY || 0;
    }
  };
  
  global.TouchEvent = class TouchEvent extends Event {
    constructor(type, init) {
      super(type, init);
      this.touches = init?.touches || [];
      this.targetTouches = init?.targetTouches || [];
      this.changedTouches = init?.changedTouches || [];
    }
  };
}

// ReadableStream 폴리필
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: async () => ({ done: true, value: undefined }),
        cancel: async () => {},
        closed: Promise.resolve()
      };
    }
  };
}

// window.scrollTo mock
global.scrollTo = jest.fn();

// Next.js 15 cookies mock
const mockCookies = {
  get: jest.fn((name) => ({ name, value: 'mock-value' })),
  getAll: jest.fn(() => []),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookies)),
  headers: jest.fn(() => new Map([['user-agent', 'jest']])),
}));


// Request/Response 전역 객체 mock
global.Request = jest.fn().mockImplementation((input, init) => {
  return {
    url: input,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => {
      if (!init?.body) return {};
      try {
        return JSON.parse(init.body);
      } catch (error) {
        throw new SyntaxError(`Unexpected token 'i', "${init.body}" is not valid JSON`);
      }
    },
  }
})

global.Response = jest.fn().mockImplementation((body, init) => {
  return {
    ok: init?.status >= 200 && init?.status < 300,
    status: init?.status || 200,
    json: async () => typeof body === 'string' ? JSON.parse(body) : body,
  }
})

// Custom Jest matchers 추가
expect.extend({
  toBeBetween(received, min, max) {
    const pass = received >= min && received <= max
    if (pass) {
      return {
        message: () => `expected ${received} not to be between ${min} and ${max}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be between ${min} and ${max}`,
        pass: false,
      }
    }
  },
})

// NextResponse mock
jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    constructor(body, init) {
      super(body, init)
      // headers 속성이 올바르게 설정되도록 보장
      if (init?.headers) {
        this.headers = new Headers(init.headers)
      }
    }
    
    static json(data, init) {
      const response = new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      })
      response.json = async () => data
      return response
    }
    
    static redirect(url, status = 302) {
      const response = new MockNextResponse(null, {
        status,
        headers: { Location: url }
      })
      response.redirect = url
      return response
    }
    
    static next() {
      const response = new MockNextResponse(null, { status: 200 })
      response.next = true
      return response
    }
  }
  
  // NextResponse를 constructor로도 사용할 수 있도록 설정
  MockNextResponse.json = MockNextResponse.json
  MockNextResponse.redirect = MockNextResponse.redirect
  MockNextResponse.next = MockNextResponse.next
  
  return {
    NextRequest: jest.fn().mockImplementation((url, init) => {
      const mockRequest = new global.Request(url, init)
      // nextUrl 속성 추가
      mockRequest.nextUrl = new URL(url)
      // cookies 속성 추가
      mockRequest.cookies = {
        get: jest.fn((name) => ({ value: 'mock-token-value' })),
        set: jest.fn(),
        delete: jest.fn(),
        getAll: jest.fn(() => []),
      }
      // headers 객체 추가
      mockRequest.headers = new Headers(init?.headers || {})
      return mockRequest
    }),
    NextResponse: MockNextResponse,
  }
})