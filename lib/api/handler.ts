/**
 * API 핸들러 유틸리티
 * 모든 API route에서 일관된 응답 형식과 에러 처리를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

import { 
  ApiResponse, 
  ApiError 
} from '@/types/api';
import { 
  createApiResponse, 
  handleError,
  AppError,
  ErrorCodes 
} from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { serverLogCollector } from '@/lib/server/log-collector';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * API 핸들러 래퍼 함수
 * 일관된 응답 형식과 에러 처리를 제공합니다.
 * 
 * @param handler - 실제 비즈니스 로직을 처리하는 함수
 * @param options - 인증, 권한 등의 옵션
 * @returns NextResponse 객체
 * 
 * @example
 * export const GET = apiHandler(async (req) => {
 *   const data = await fetchData();
 *   return data;
 * }, { requireAuth: true });
 */
export function apiHandler<T>(
  handler: (req: NextRequest, context?: any) => Promise<T>,
  options?: ApiHandlerOptions
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // 요청 로깅
      logger.info(`API Request: ${req.method} ${req.url}`);

      // 인증 확인
      if (options?.requireAuth || options?.requireAdmin) {
        const user = await getCurrentUser();
        
        if (!session?.user) {
          throw new AppError(
            ErrorCodes.UNAUTHORIZED,
            '로그인이 필요합니다.',
            401
          );
        }

        // 관리자 권한 확인
        if (options.requireAdmin && !session.user.isAdmin) {
          throw new AppError(
            ErrorCodes.FORBIDDEN,
            '관리자 권한이 필요합니다.',
            403
          );
        }

        // context에 session 정보 추가
        if (context) {
          context.session = session;
        }
      }

      // 핸들러 실행
      const data = await handler(req, context);

      // 성공 응답
      const response = createApiResponse(data);
      const duration = Date.now() - startTime;
      
      // 서버 로그 수집
      serverLogCollector.logApiRequest(
        { method: req.method, url: req.url, headers: Object.fromEntries(req.headers.entries()) },
        { statusCode: 200 },
        duration
      );
      
      return NextResponse.json(response);

    } catch (error) {
      // 에러 로깅
      logger.error('API Error:', error);
      
      const duration = Date.now() - startTime;

      // 에러 처리
      const apiError = handleError(error);
      const statusCode = apiError.statusCode || 500;
      
      // 서버 로그 수집 (에러)
      serverLogCollector.logApiRequest(
        { method: req.method, url: req.url, headers: Object.fromEntries(req.headers.entries()) },
        { statusCode },
        duration,
        error instanceof Error ? error : new Error(String(error))
      );
      
      const response = createApiResponse<T>(undefined, apiError);
      
      return NextResponse.json(response, { 
        status: statusCode 
      });
    }
  };
}

/**
 * 페이지네이션을 지원하는 API 핸들러
 */
export function paginatedApiHandler<T>(
  handler: (req: NextRequest, context?: any) => Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
  }>,
  options?: ApiHandlerOptions
) {
  return apiHandler(async (req, context) => {
    const result = await handler(req, context);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / result.pageSize)
    };
  }, options);
}

/**
 * 요청 본문 파싱 헬퍼
 */
export async function parseRequestBody<T>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch (error) {
    throw new AppError(
      ErrorCodes.INVALID_INPUT,
      '잘못된 요청 형식입니다.',
      400
    );
  }
}

/**
 * 쿼리 파라미터 파싱 헬퍼
 */
export function parseSearchParams(req: NextRequest): URLSearchParams {
  const { searchParams } = new URL(req.url);
  return searchParams;
}

/**
 * 페이지네이션 파라미터 파싱
 */
export function parsePaginationParams(req: NextRequest): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const searchParams = parseSearchParams(req);
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
  const offset = (page - 1) * pageSize;
  
  return { page, pageSize, offset };
}

/**
 * ID 파라미터 검증 헬퍼
 */
export function validateId(id: string | undefined): string {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new AppError(
      ErrorCodes.INVALID_INPUT,
      '유효하지 않은 ID입니다.',
      400
    );
  }
  
  return id.trim();
}

/**
 * 필수 필드 검증 헬퍼
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new AppError(
      ErrorCodes.MISSING_REQUIRED_FIELD,
      `필수 항목이 누락되었습니다: ${missingFields.join(', ')}`,
      400,
      { missingFields }
    );
  }
}

/**
 * 날짜 형식 검증 헬퍼
 */
export function validateDateFormat(date: string): string {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    throw new AppError(
      ErrorCodes.INVALID_INPUT,
      '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)',
      400
    );
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new AppError(
      ErrorCodes.INVALID_INPUT,
      '유효하지 않은 날짜입니다.',
      400
    );
  }
  
  return date;
}

/**
 * 시간 형식 검증 헬퍼
 */
export function validateTimeFormat(time: string): string {
  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  
  if (!timeRegex.test(time)) {
    throw new AppError(
      ErrorCodes.INVALID_INPUT,
      '시간 형식이 올바르지 않습니다. (HH:MM)',
      400
    );
  }
  
  return time;
}

/**
 * UUID 형식 검증 헬퍼
 */
export function validateUUID(id: string, fieldName: string = 'ID'): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!id || !uuidRegex.test(id)) {
    throw new AppError(
      ErrorCodes.INVALID_INPUT,
      `유효하지 않은 ${fieldName}입니다.`,
      400
    );
  }
  
  return id;
}

/**
 * createApiHandler - apiHandler의 별칭
 * 기존 코드와의 호환성을 위해 추가
 */
export const createApiHandler = apiHandler;