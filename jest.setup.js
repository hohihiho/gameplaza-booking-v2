// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock 환경 변수
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Supabase 클라이언트 mock
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
  createAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
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

// Request/Response 전역 객체 mock
global.Request = jest.fn().mockImplementation((input, init) => {
  return {
    url: input,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => init?.body ? JSON.parse(init.body) : {},
  }
})

global.Response = jest.fn().mockImplementation((body, init) => {
  return {
    ok: init?.status >= 200 && init?.status < 300,
    status: init?.status || 200,
    json: async () => typeof body === 'string' ? JSON.parse(body) : body,
  }
})

// NextResponse mock
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => {
    return new global.Request(url, init)
  }),
  NextResponse: {
    json: (data, init) => {
      const response = new global.Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      })
      response.json = async () => data
      return response
    },
  },
}))