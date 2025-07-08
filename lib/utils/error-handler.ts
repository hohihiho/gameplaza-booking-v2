/**
 * 에러 처리 유틸리티
 * 일관된 에러 처리와 사용자 친화적인 메시지 제공
 */

import { ApiError, ApiResponse } from '@/types/api';
import { logger } from './logger';

// 커스텀 에러 클래스
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 에러 코드 정의
export const ErrorCodes = {
  // 인증 관련
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  
  // 검증 관련
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 예약 관련
  RESERVATION_CONFLICT: 'RESERVATION_CONFLICT',
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  TIME_SLOT_UNAVAILABLE: 'TIME_SLOT_UNAVAILABLE',
  
  // 기기 관련
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_UNAVAILABLE: 'DEVICE_UNAVAILABLE',
  
  // 시스템 관련
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// 에러 메시지 매핑
const errorMessages: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ErrorCodes.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCodes.TOKEN_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCodes.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  
  [ErrorCodes.VALIDATION_FAILED]: '입력한 정보가 올바르지 않습니다.',
  [ErrorCodes.INVALID_INPUT]: '잘못된 입력입니다.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: '필수 항목을 입력해주세요.',
  
  [ErrorCodes.RESERVATION_CONFLICT]: '선택한 시간대에 이미 예약이 있습니다.',
  [ErrorCodes.RESERVATION_NOT_FOUND]: '예약을 찾을 수 없습니다.',
  [ErrorCodes.RESERVATION_CANCELLED]: '취소된 예약입니다.',
  [ErrorCodes.TIME_SLOT_UNAVAILABLE]: '선택한 시간대는 예약할 수 없습니다.',
  
  [ErrorCodes.DEVICE_NOT_FOUND]: '기기를 찾을 수 없습니다.',
  [ErrorCodes.DEVICE_UNAVAILABLE]: '현재 이용할 수 없는 기기입니다.',
  
  [ErrorCodes.INTERNAL_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCodes.DATABASE_ERROR]: '데이터 처리 중 오류가 발생했습니다.',
  [ErrorCodes.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
};

// 에러 처리 함수
export function handleError(error: unknown): ApiError {
  // AppError 인스턴스인 경우
  if (error instanceof AppError) {
    logger.error('AppError:', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    
    return {
      code: error.code,
      message: errorMessages[error.code] || error.message,
      details: error.details,
      statusCode: error.statusCode,
    };
  }
  
  // 일반 Error 인스턴스인 경우
  if (error instanceof Error) {
    logger.error('Error:', error.message);
    
    // 특정 에러 메시지 패턴 감지
    if (error.message.includes('fetch failed')) {
      return {
        code: ErrorCodes.NETWORK_ERROR,
        message: errorMessages[ErrorCodes.NETWORK_ERROR],
        statusCode: 503,
      };
    }
    
    if (error.message.includes('unique constraint')) {
      return {
        code: ErrorCodes.VALIDATION_FAILED,
        message: '이미 존재하는 데이터입니다.',
        statusCode: 409,
      };
    }
    
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: errorMessages[ErrorCodes.INTERNAL_ERROR],
      statusCode: 500,
    };
  }
  
  // 알 수 없는 에러
  logger.error('Unknown error:', error);
  
  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: errorMessages[ErrorCodes.INTERNAL_ERROR],
    statusCode: 500,
  };
}

// API 응답 생성 헬퍼
export function createApiResponse<T>(
  data?: T,
  error?: ApiError | null,
  message?: string
): ApiResponse<T> {
  if (error) {
    return {
      success: false,
      error,
      message: error.message,
    };
  }
  
  return {
    success: true,
    data,
    message,
  };
}

// 클라이언트 사이드 에러 표시
export function showErrorToUser(error: ApiError | string): void {
  const message = typeof error === 'string' ? error : error.message;
  
  // 토스트나 알림 시스템이 있다면 사용
  // 현재는 임시로 alert 사용
  if (typeof window !== 'undefined') {
    // alert 대신 더 나은 UI 컴포넌트 사용 권장
    logger.error('User error:', message);
  }
}

// Supabase 에러 처리
export function handleSupabaseError(error: any): ApiError {
  if (error?.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return {
          code: ErrorCodes.INVALID_INPUT,
          message: '올바른 이메일 형식이 아닙니다.',
          statusCode: 400,
        };
      
      case 'auth/user-not-found':
        return {
          code: ErrorCodes.INVALID_CREDENTIALS,
          message: errorMessages[ErrorCodes.INVALID_CREDENTIALS],
          statusCode: 401,
        };
      
      case 'auth/wrong-password':
        return {
          code: ErrorCodes.INVALID_CREDENTIALS,
          message: errorMessages[ErrorCodes.INVALID_CREDENTIALS],
          statusCode: 401,
        };
      
      case '23505': // unique_violation
        return {
          code: ErrorCodes.VALIDATION_FAILED,
          message: '이미 존재하는 데이터입니다.',
          statusCode: 409,
        };
      
      default:
        return handleError(error);
    }
  }
  
  return handleError(error);
}