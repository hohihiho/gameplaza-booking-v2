/**
 * API 보안 유틸리티
 * Rate limiting, 입력 검증, 보안 헤더 등을 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limiting을 위한 메모리 스토어 (프로덕션에서는 Redis 사용 권장)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting 설정
 */
interface RateLimitConfig {
  windowMs: number // 시간 윈도우 (밀리초)
  maxRequests: number // 최대 요청 수
  keyGenerator?: (request: NextRequest) => string // 키 생성 함수
}

/**
 * Rate limiting 미들웨어
 */
export function rateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(request: NextRequest): NextResponse | null {
    // 테스트 환경이거나 개발 환경에서는 Rate Limiting 비활성화
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return null
    }
    
    const key = config.keyGenerator ? config.keyGenerator(request) : getClientKey(request)
    const now = Date.now()
    
    // 기존 레코드 가져오기 또는 새로 생성
    const record = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs }
    
    // 시간 윈도우가 지났으면 리셋
    if (now > record.resetTime) {
      record.count = 0
      record.resetTime = now + config.windowMs
    }
    
    // 요청 수 증가
    record.count++
    rateLimitStore.set(key, record)
    
    // 제한 초과 시 429 응답
    if (record.count > config.maxRequests) {
      return new NextResponse(
        JSON.stringify({ 
          error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - record.count).toString(),
            'X-RateLimit-Reset': record.resetTime.toString(),
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
          },
        }
      )
    }
    
    return null // 통과
  }
}

/**
 * 클라이언트 식별 키 생성
 */
function getClientKey(request: NextRequest): string {
  // IP 주소 기반 키 생성 (프록시 환경 고려)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown'
  
  return `rate_limit:${ip}`
}

/**
 * 입력 검증 미들웨어
 */
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return async function validateMiddleware(
    request: NextRequest,
    getData: () => Promise<unknown> | unknown
  ): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
    try {
      const rawData = await getData()
      const validatedData = schema.parse(rawData)
      
      return { data: validatedData, error: null }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: new NextResponse(
            JSON.stringify({
              error: '입력 데이터가 올바르지 않습니다.',
              details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
              })),
              code: 'VALIDATION_ERROR'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          ),
        }
      }
      
      return {
        data: null,
        error: new NextResponse(
          JSON.stringify({ 
            error: '요청 처리 중 오류가 발생했습니다.',
            code: 'INVALID_INPUT'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      }
    }
  }
}

/**
 * 보안 응답 헤더 설정
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // 정보 노출 방지
  response.headers.delete('x-powered-by')
  response.headers.delete('server')
  
  // 보안 헤더 추가
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // API 응답은 캐시하지 않음
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  
  return response
}

/**
 * 안전한 JSON 응답 생성
 */
export function createSecureResponse(
  data: any,
  status = 200,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // 보안 헤더 설정
  setSecurityHeaders(response)
  
  // 추가 헤더 설정
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * 에러 응답 생성 (정보 노출 최소화)
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
): NextResponse {
  const errorData: any = {
    error: message,
    timestamp: new Date().toISOString(),
  }
  
  if (code) {
    errorData.code = code
  }
  
  // 개발 환경에서만 상세 정보 포함
  if (process.env.NODE_ENV === 'development' && details) {
    errorData.details = details
  }
  
  return createSecureResponse(errorData, status)
}

/**
 * 일반적인 Rate Limit 설정들
 */
export const rateLimitConfigs = {
  // 일반 API (분당 60회, 테스트 환경에서는 1000회)
  default: {
    windowMs: 60 * 1000,
    maxRequests: process.env.NODE_ENV === 'test' ? 1000 : 60,
  },
  // 인증 API (분당 5회, 테스트 환경에서는 100회)
  auth: {
    windowMs: 60 * 1000,
    maxRequests: process.env.NODE_ENV === 'test' ? 100 : 5,
  },
  // 예약 생성 (분당 10회, 테스트 환경에서는 200회)
  reservation: {
    windowMs: 60 * 1000,
    maxRequests: process.env.NODE_ENV === 'test' ? 200 : 10,
  },
  // 관리자 API (분당 100회, 테스트 환경에서는 500회)
  admin: {
    windowMs: 60 * 1000,
    maxRequests: process.env.NODE_ENV === 'test' ? 500 : 100,
  },
}

/**
 * 입력 sanitization
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .substring(0, 1000) // 길이 제한
}

/**
 * SQL Injection 방지를 위한 간단한 검사
 */
export function isSafeString(input: string): boolean {
  const dangerousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /script\s*>/i,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}