import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, reportError, TrackedError, ErrorSeverity, ErrorCategory } from '@/lib/monitoring/error-tracking'
import { createServerClient } from '@supabase/ssr'

// API 라우트 에러 처리 미들웨어
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // 요청 시작 시간
      const startTime = Date.now()
      
      // 핸들러 실행
      const response = await handler(req, context)
      
      // 응답 시간 측정
      const duration = Date.now() - startTime
      
      // 느린 API 추적 (3초 이상)
      if (duration > 3000) {
        reportError(
          new TrackedError(
            `Slow API response: ${req.method} ${req.url} (${duration}ms)`,
            ErrorSeverity.Low,
            ErrorCategory.Network,
            { 
              url: req.url,
              method: req.method,
              duration,
              userAgent: req.headers.get('user-agent'),
            }
          )
        )
      }
      
      // 5xx 에러 추적
      if (response.status >= 500) {
        reportError(
          new TrackedError(
            `Server error: ${req.method} ${req.url} (${response.status})`,
            ErrorSeverity.High,
            ErrorCategory.Network,
            {
              url: req.url,
              method: req.method,
              status: response.status,
              userAgent: req.headers.get('user-agent'),
            }
          )
        )
      }
      
      return response
    } catch (error) {
      // 에러 응답 생성
      return handleApiError(error, req, {
        path: req.nextUrl.pathname,
        query: Object.fromEntries(req.nextUrl.searchParams),
      })
    }
  }
}

// 인증 확인 미들웨어
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options?: {
    requireAdmin?: boolean
    requireSuperAdmin?: boolean
  }
) {
  return withErrorHandling(async (req: NextRequest, context?: any) => {
    // 인증 토큰 확인
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      throw new TrackedError(
        '인증 토큰이 필요합니다',
        ErrorSeverity.Low,
        ErrorCategory.Authentication
      )
    }
    
    // Supabase 토큰 검증
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new TrackedError(
        '유효하지 않은 토큰입니다',
        ErrorSeverity.Low,
        ErrorCategory.Authentication
      )
    }
    
    if (options?.requireAdmin) {
      const { data: adminData } = await supabase
        .from('admins')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .single();
        
      if (!adminData) {
        throw new TrackedError(
          '관리자 권한이 필요합니다',
          ErrorSeverity.Low,
          ErrorCategory.Permission
        )
      }
    }
    
    return handler(req, context)
  })
}

// 요청 검증 미들웨어
export function withValidation<T = any>(
  schema: {
    body?: any
    query?: any
    params?: any
  },
  handler: (req: NextRequest & { validated: T }, context?: any) => Promise<Response>
) {
  return withErrorHandling(async (req: NextRequest, context?: any) => {
    const validated: any = {}
    
    try {
      // Body 검증
      if (schema.body && req.method !== 'GET') {
        const body = await req.json()
        // 간단한 검증 (실제로는 zod나 yup 사용 권장)
        if (schema.body && typeof schema.body === 'function') {
          validated.body = schema.body(body)
        } else {
          validated.body = body
        }
      }
      
      // Query 검증
      if (schema.query) {
        const query = Object.fromEntries(req.nextUrl.searchParams)
        validated.query = query
      }
      
      // Params 검증
      if (schema.params && context?.params) {
        validated.params = context.params
      }
      
    } catch (error) {
      throw new TrackedError(
        '요청 데이터가 올바르지 않습니다',
        ErrorSeverity.Low,
        ErrorCategory.Validation,
        { error: error instanceof Error ? error.message : String(error) }
      )
    }
    
    // 검증된 데이터와 함께 핸들러 실행
    return handler(Object.assign(req, { validated }) as any, context)
  })
}

// Rate Limiting 미들웨어
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  options: {
    requests: number
    windowMs: number
    keyGenerator?: (req: NextRequest) => string
  },
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return withErrorHandling(async (req: NextRequest, context?: any) => {
    // Rate limit 키 생성
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.headers.get('x-forwarded-for') || 'anonymous'
    
    const now = Date.now()
    const limit = rateLimitMap.get(key)
    
    // 제한 확인
    if (limit) {
      if (now < limit.resetTime) {
        if (limit.count >= options.requests) {
          throw new TrackedError(
            '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            ErrorSeverity.Low,
            ErrorCategory.Network,
            {
              key,
              limit: options.requests,
              resetTime: new Date(limit.resetTime).toISOString(),
            }
          )
        }
        limit.count++
      } else {
        // 시간 초과, 리셋
        limit.count = 1
        limit.resetTime = now + options.windowMs
      }
    } else {
      // 새로운 키
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      })
    }
    
    // 메모리 관리 (1000개 이상이면 오래된 것 삭제)
    if (rateLimitMap.size > 1000) {
      const sortedEntries = Array.from(rateLimitMap.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime)
      
      // 오래된 절반 삭제
      for (let i = 0; i < 500; i++) {
        rateLimitMap.delete(sortedEntries[i][0])
      }
    }
    
    return handler(req, context)
  })
}

// CORS 미들웨어
export function withCORS(
  options: {
    origin?: string | string[] | ((origin: string) => boolean)
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  },
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: getCORSHeaders(req, options),
      })
    }
    
    // 실제 요청 처리
    const response = await withErrorHandling(handler)(req, context)
    
    // CORS 헤더 추가
    const headers = new Headers(response.headers)
    const corsHeaders = getCORSHeaders(req, options)
    
    corsHeaders.forEach((value, key) => {
      headers.set(key, value)
    })
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

// CORS 헤더 생성 헬퍼
function getCORSHeaders(
  req: NextRequest,
  options: {
    origin?: string | string[] | ((origin: string) => boolean)
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }
): Headers {
  const headers = new Headers()
  const origin = req.headers.get('origin') || ''
  
  // Origin 처리
  if (options.origin) {
    if (typeof options.origin === 'string') {
      headers.set('Access-Control-Allow-Origin', options.origin)
    } else if (Array.isArray(options.origin)) {
      if (options.origin.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin)
      }
    } else if (typeof options.origin === 'function') {
      if (options.origin(origin)) {
        headers.set('Access-Control-Allow-Origin', origin)
      }
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*')
  }
  
  // Methods
  headers.set(
    'Access-Control-Allow-Methods',
    options.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS'
  )
  
  // Headers
  headers.set(
    'Access-Control-Allow-Headers',
    options.headers?.join(', ') || 'Content-Type, Authorization'
  )
  
  // Credentials
  if (options.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return headers
}