import { NextRequest, NextResponse } from 'next/server'
import { JWTTokenService } from '../services/jwt-token.service'
import { UserSupabaseRepository } from '../repositories/user.supabase.repository'
import { SessionSupabaseRepository } from '../repositories/session.supabase.repository'
import { createClient } from '@supabase/supabase-js'

/**
 * 인증된 사용자 정보
 */
export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  sessionId: string
}

/**
 * 인증 미들웨어 옵션
 */
export interface AuthMiddlewareOptions {
  requireAuth?: boolean
  requireRoles?: string[]
  allowExpired?: boolean
}

/**
 * JWT 인증 미들웨어
 */
export class AuthMiddleware {
  private tokenService: JWTTokenService
  private userRepository: UserSupabaseRepository
  private sessionRepository: SessionSupabaseRepository

  constructor() {
    // 환경 변수에서 설정 로드
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET!
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // 서비스 초기화
    this.tokenService = new JWTTokenService(accessTokenSecret, refreshTokenSecret)
    const supabase = createClient(supabaseUrl, supabaseKey)
    this.userRepository = new UserSupabaseRepository(supabase)
    this.sessionRepository = new SessionSupabaseRepository(supabase)
  }

  /**
   * 인증 미들웨어 생성
   */
  middleware(options: AuthMiddlewareOptions = {}) {
    return async (request: NextRequest) => {
      try {
        // Authorization 헤더에서 토큰 추출
        const token = this.extractToken(request)
        
        if (!token && options.requireAuth) {
          return this.unauthorizedResponse('인증이 필요합니다')
        }

        if (!token) {
          // 인증이 필수가 아닌 경우 계속 진행
          return NextResponse.next()
        }

        // 토큰 검증
        let payload
        try {
          payload = await this.tokenService.verifyAccessToken(token)
        } catch (error) {
          if (!options.allowExpired) {
            return this.unauthorizedResponse('유효하지 않은 토큰입니다')
          }
        }

        // payload null 체크
        if (!payload) {
          return this.unauthorizedResponse('유효하지 않은 토큰입니다')
        }

        // 세션 확인
        const session = await this.sessionRepository.findById(payload.sessionId)
        if (!session || !session.isActive) {
          return this.unauthorizedResponse('세션이 만료되었습니다')
        }

        // 사용자 확인
        const user = await this.userRepository.findById(payload.sub)
        if (!user || !user.isActive()) {
          return this.unauthorizedResponse('접근이 제한된 계정입니다')
        }

        // 역할 확인
        if (options.requireRoles && options.requireRoles.length > 0) {
          if (!options.requireRoles.includes(user.role)) {
            return this.forbiddenResponse('권한이 부족합니다')
          }
        }

        // 세션 활동 업데이트
        const updatedSession = session.updateActivity()
        await this.sessionRepository.update(updatedSession)

        // 요청에 사용자 정보 추가
        const authenticatedUser: AuthenticatedUser = {
          id: user.id,
          email: user.email,
          role: user.role,
          sessionId: session.id
        }

        // 헤더에 사용자 정보 추가
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('X-User-Id', authenticatedUser.id)
        requestHeaders.set('X-User-Email', authenticatedUser.email)
        requestHeaders.set('X-User-Role', authenticatedUser.role)
        requestHeaders.set('X-Session-Id', authenticatedUser.sessionId)

        return NextResponse.next({
          request: {
            headers: requestHeaders
          }
        })
      } catch (error) {
        console.error('Auth middleware error:', error)
        return this.serverErrorResponse()
      }
    }
  }

  /**
   * Bearer 토큰 추출
   */
  private extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }

  /**
   * 401 Unauthorized 응답
   */
  private unauthorizedResponse(message: string): NextResponse {
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        message
      },
      { status: 401 }
    )
  }

  /**
   * 403 Forbidden 응답
   */
  private forbiddenResponse(message: string): NextResponse {
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message
      },
      { status: 403 }
    )
  }

  /**
   * 500 Internal Server Error 응답
   */
  private serverErrorResponse(): NextResponse {
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}

/**
 * 요청에서 인증된 사용자 정보 추출
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  const userId = request.headers.get('X-User-Id')
  const email = request.headers.get('X-User-Email')
  const role = request.headers.get('X-User-Role')
  const sessionId = request.headers.get('X-Session-Id')

  if (!userId || !email || !role || !sessionId) {
    return null
  }

  return {
    id: userId,
    email,
    role,
    sessionId
  }
}

// 기본 인스턴스 export
export const authMiddleware = new AuthMiddleware()

/**
 * 관리자 권한 확인 유틸리티 함수
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin'
}