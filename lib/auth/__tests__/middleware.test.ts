
import { authMiddleware } from "../middleware"
import { NextRequest, NextResponse } from "next/server"

// Mock 모듈들
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

jest.mock("next/server", () => ({
  NextRequest: jest.fn((url: string) => ({
    nextUrl: { pathname: new URL(url).pathname },
    cookies: {
      get: jest.fn()
    },
    url
  })),
  NextResponse: {
    redirect: jest.fn((url: any) => ({ 
      type: "redirect",
      url: url.toString() 
    })),
    next: jest.fn(() => ({ 
      type: "next" 
    })),
    json: jest.fn((data: any, options: any) => ({
      type: "json",
      data,
      status: options?.status
    }))
  }
}))

// 수정된 테스트
describe("Auth Middleware", () => {
  const { createServerClient } = require("@supabase/ssr")
  const { createAdminClient } = require("@/lib/supabase/admin")
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("보호된 경로 접근", () => {
    it("인증되지 않은 사용자는 로그인 페이지로 리다이렉트되어야 함", async () => {
      // 인증 실패 설정
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null
          })
        }
      })

      const request = new NextRequest("http://localhost:3000/admin/dashboard")
      const response = await authMiddleware(request)

      expect(response.type).toBe("redirect")
      expect(response.url).toContain("/login")
    })

    it("공개 경로는 인증 없이도 접근이 허용되어야 함", async () => {
      // 인증 실패 설정
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null
          })
        }
      })

      const request = new NextRequest("http://localhost:3000/")
      const response = await authMiddleware(request)

      expect(response.type).toBe("next")
    })
  })

  describe("관리자 경로 접근", () => {
    it("일반 사용자는 관리자 페이지에 접근할 수 없어야 함", async () => {
      // 일반 사용자 설정
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { 
              user: { 
                id: "user-123", 
                email: "user@example.com",
                phone: null,
                user_metadata: {}
              } 
            },
            error: null
          })
        }
      })
      
      // Admin 권한 없음
      createAdminClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: "user-123", email: "user@example.com", role: "user" },
                error: null
              })
            }))
          }))
        }))
      })

      const request = new NextRequest("http://localhost:3000/admin")
      const response = await authMiddleware(request)

      expect(response.type).toBe("redirect")
      expect(response.url).toContain("/")
    })

    it("관리자는 관리자 페이지에 접근할 수 있어야 함", async () => {
      // 관리자 설정
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { 
              user: { 
                id: "admin-123", 
                email: "admin@example.com",
                phone: null,
                user_metadata: {}
              } 
            },
            error: null
          })
        }
      })
      
      // Admin 권한 있음
      const mockFrom = jest.fn()
      createAdminClient.mockReturnValue({
        from: mockFrom
      })
      
      // users 테이블 조회
      mockFrom.mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: "admin-123", email: "admin@example.com", role: "admin" },
                  error: null
                })
              }))
            }))
          }
        }
        if (table === "admins") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: "admin-123", is_super_admin: false },
                  error: null
                })
              }))
            }))
          }
        }
      })

      const request = new NextRequest("http://localhost:3000/admin")
      const response = await authMiddleware(request)

      expect(response.type).toBe("next")
    })
  })
})

