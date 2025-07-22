// 간단한 에러 추적 시스템 (Sentry 없이)

export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export enum ErrorCategory {
  Network = 'network',
  Database = 'database',
  Authentication = 'authentication',
  Validation = 'validation',
  Permission = 'permission',
  Business = 'business',
  Unknown = 'unknown'
}

export class TrackedError extends Error {
  severity: ErrorSeverity
  category: ErrorCategory
  metadata?: Record<string, any>

  constructor(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.Medium,
    category: ErrorCategory = ErrorCategory.Unknown,
    metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'TrackedError'
    this.severity = severity
    this.category = category
    this.metadata = metadata
  }
}

export function initErrorTracking() {
  // 초기화 (현재는 아무것도 하지 않음)
}

export function setErrorUser(user: { id: string; username?: string }) {
  // 사용자 설정 (현재는 아무것도 하지 않음)
}

export function reportError(
  error: Error | TrackedError | unknown,
  context?: Record<string, any>
) {
  console.error('[Error]', error, context)
}

export async function handleApiError(
  error: unknown,
  req?: Request,
  context?: Record<string, any>
): Promise<Response> {
  let status = 500
  let message = '서버 오류가 발생했습니다'
  let code = 'INTERNAL_ERROR'

  if (error instanceof TrackedError) {
    if (error.severity === ErrorSeverity.Low) {
      status = 400
    } else if (error.severity === ErrorSeverity.Critical) {
      status = 503
    }
    message = error.message
    code = error.category.toUpperCase()
  } else if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      status = 401
      message = '인증이 필요합니다'
      code = 'UNAUTHORIZED'
    } else if (error.message.includes('Forbidden')) {
      status = 403
      message = '권한이 없습니다'
      code = 'FORBIDDEN'
    } else if (error.message.includes('Not Found')) {
      status = 404
      message = '리소스를 찾을 수 없습니다'
      code = 'NOT_FOUND'
    }
  }

  reportError(error, context)

  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

export function handleReactError(error: Error, errorInfo: { componentStack: string }) {
  reportError(error, { componentStack: errorInfo.componentStack })
}

export function setupGlobalErrorHandlers() {
  // 전역 에러 핸들러 설정
}

export function trackNetworkError(url: string, status: number, method: string = 'GET') {
  console.error(`[Network Error] ${method} ${url} - ${status}`)
}