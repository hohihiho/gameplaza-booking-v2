import { NextResponse } from 'next/server'

/**
 * API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

/**
 * API 에러 타입
 */
export interface ApiError {
  code: string
  message: string
  details?: any
  path?: string
  timestamp?: string
}

/**
 * 에러 코드 상수
 */
export const ErrorCode = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 유효성 검사
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // 비즈니스 로직
  RESERVATION_NOT_AVAILABLE: 'RESERVATION_NOT_AVAILABLE',
  INVALID_TIME_SLOT: 'INVALID_TIME_SLOT',
  DEVICE_NOT_AVAILABLE: 'DEVICE_NOT_AVAILABLE',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  
  // 시스템 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]

/**
 * 에러 응답 클래스
 */
export class ErrorResponse implements ApiError {
  code: string
  message: string
  details?: any
  path?: string
  timestamp: string

  constructor(message: string, code: ErrorCodeType = ErrorCode.INTERNAL_ERROR, details?: any) {
    this.message = message
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status })
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(error: ApiError | ErrorResponse, status: number = 500): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      ...error,
      timestamp: error.timestamp || new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status })
}

/**
 * 공통 API 응답 생성 (v2 호환)
 */
export function createResponse<T>(data: T | ErrorResponse, status?: number): NextResponse {
  if (data instanceof ErrorResponse) {
    return createErrorResponse(data, status || 500)
  }
  
  return createSuccessResponse(data, status || 200)
}

/**
 * 에러 상태 코드 매핑
 */
export function getErrorStatusCode(errorCode: ErrorCodeType): number {
  switch (errorCode) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.INVALID_CREDENTIALS:
      return 401
      
    case ErrorCode.FORBIDDEN:
      return 403
      
    case ErrorCode.NOT_FOUND:
      return 404
      
    case ErrorCode.CONFLICT:
    case ErrorCode.ALREADY_EXISTS:
      return 409
      
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_REQUEST:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_TIME_SLOT:
    case ErrorCode.INVALID_STATUS_TRANSITION:
      return 400
      
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429
      
    default:
      return 500
  }
}

/**
 * 공통 에러 응답 헬퍼
 */
export const CommonErrors = {
  unauthorized: (message = '인증이 필요합니다') => 
    new ErrorResponse(message, ErrorCode.UNAUTHORIZED),
    
  forbidden: (message = '권한이 없습니다') => 
    new ErrorResponse(message, ErrorCode.FORBIDDEN),
    
  notFound: (resource = '리소스', id?: string) => 
    new ErrorResponse(
      `${resource}를 찾을 수 없습니다${id ? ` (ID: ${id})` : ''}`, 
      ErrorCode.NOT_FOUND
    ),
    
  validationError: (field: string, message: string) => 
    new ErrorResponse(
      message, 
      ErrorCode.VALIDATION_ERROR, 
      { field }
    ),
    
  internalError: (message = '서버 오류가 발생했습니다') => 
    new ErrorResponse(message, ErrorCode.INTERNAL_ERROR),
    
  databaseError: (operation: string, details?: any) => 
    new ErrorResponse(
      `데이터베이스 ${operation} 중 오류가 발생했습니다`, 
      ErrorCode.DATABASE_ERROR,
      details
    )
}