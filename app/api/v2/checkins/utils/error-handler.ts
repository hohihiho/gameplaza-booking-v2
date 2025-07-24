import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  message: string
  details?: any
}

/**
 * 표준화된 API 에러 응답 생성
 */
export function createApiError(
  status: number,
  message: string,
  details?: any
): NextResponse<ApiError> {
  const statusTextMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  }

  return NextResponse.json(
    {
      error: statusTextMap[status] || 'Error',
      message,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * 에러 인스턴스를 기반으로 적절한 HTTP 응답 생성
 */
export function handleError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // 도메인 에러를 HTTP 에러로 매핑
    const errorMappings: Array<{
      patterns: string[]
      status: number
      message?: string
    }> = [
      {
        patterns: ['찾을 수 없습니다', 'not found'],
        status: 404
      },
      {
        patterns: ['권한이 없습니다', 'unauthorized'],
        status: 403
      },
      {
        patterns: ['인증이 필요합니다', 'authentication required'],
        status: 401
      },
      {
        patterns: [
          '이미 존재',
          '이미 활성화된',
          '사용할 수 없는 상태',
          '체크인할 수 없는 상태',
          '완료할 수 없는 상태',
          '취소할 수 없는 상태',
          'already exists',
          'conflict'
        ],
        status: 409
      },
      {
        patterns: [
          '필수입니다',
          '유효하지 않은',
          '형식이 올바르지 않습니다',
          '0원 이상이어야',
          '체크인 가능 시간',
          'invalid',
          'required',
          'must be'
        ],
        status: 400
      }
    ]

    for (const mapping of errorMappings) {
      const matched = mapping.patterns.some(pattern => 
        error.message.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (matched) {
        return createApiError(
          mapping.status,
          mapping.message || error.message
        )
      }
    }
  }

  // 기본 서버 에러
  return createApiError(
    500,
    '서버 오류가 발생했습니다'
  )
}

/**
 * 환경 변수 검증
 */
export function validateEnvironment(): {
  supabaseUrl: string
  supabaseKey: string
} | NextResponse<ApiError> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables')
    return createApiError(500, '서버 설정 오류')
  }

  return { supabaseUrl, supabaseKey }
}

/**
 * CORS 헤더 생성
 */
export function createCorsHeaders(methods: string[] = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * OPTIONS 요청 처리
 */
export function handleOptions(methods?: string[]) {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(methods)
  })
}