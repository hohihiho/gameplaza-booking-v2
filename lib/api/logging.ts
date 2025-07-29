import { NextRequest } from 'next/server'

/**
 * API 요청을 로깅합니다
 */
export function logRequest(request: NextRequest, endpoint: string) {
  const timestamp = new Date().toISOString()
  const method = request.method
  const url = request.url
  
  console.log(`[${timestamp}] ${method} ${endpoint} - ${url}`)
}

/**
 * API 에러를 로깅합니다
 */
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  
  console.error(`[${timestamp}] ERROR${context ? ` in ${context}` : ''}: ${errorMessage}`)
  if (stack) {
    console.error('Stack trace:', stack)
  }
}

/**
 * 일반 정보를 로깅합니다
 */
export function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] INFO: ${message}`, data ? data : '')
}

/**
 * 경고를 로깅합니다
 */
export function logWarning(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] WARN: ${message}`, data ? data : '')
}