// API 클라이언트 - v2 전용
import { logger } from '@/lib/utils/logger';
import { ApiError, ErrorCode, ErrorResponse } from '@/lib/api/response';
import { errorInterceptorManager } from '@/lib/api/error-interceptor';

// API 응답 타입
export interface ApiResponse<T = any> {
  data?: T;
  error?: string | ApiError;
  message?: string;
  status: number;
  success?: boolean;
}

// v2 API 에러 타입 (ApiError로 통합)
export interface V2ApiError extends ApiError {}

// 예약 타입 (v2)
export interface V2Reservation {
  id: string;
  user_id: string;
  device_id: string;
  date: string;
  start_time: string;
  end_time: string;
  player_count: number;
  credit_type: string;
  fixed_credits?: number;
  total_amount: number;
  user_notes?: string;
  slot_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  device?: {
    id: string;
    device_number: number;
    device_type: {
      id: string;
      name: string;
      model_name?: string;
    };
  };
}

// API 클라이언트 클래스
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/v2';
  }

  // 공통 fetch 래퍼 - 에러 처리와 로깅 포함
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    logger.info(`API v2 Request:`, {
      url,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        logger.error('JSON Parse Error:', { responseText });
        throw new Error('서버 응답을 파싱할 수 없습니다');
      }

      logger.info(`API v2 Response:`, {
        status: response.status,
        data
      });

      if (!response.ok) {
        // v2 API 에러 형식 처리
        if (data?.error) {
          const error = data.error as ApiError;
          throw error; // ApiError 객체를 그대로 throw
        }
        
        // 기본 에러
        const errorMessage = data?.message || '요청 처리 중 오류가 발생했습니다';
          
        // HTTP 상태 코드에 따른 에러 코드 매핑
        let errorCode: string = ErrorCode.INTERNAL_ERROR;
        switch (response.status) {
          case 400:
            errorCode = ErrorCode.VALIDATION_ERROR;
            break;
          case 401:
            errorCode = ErrorCode.UNAUTHORIZED;
            break;
          case 403:
            errorCode = ErrorCode.FORBIDDEN;
            break;
          case 404:
            errorCode = ErrorCode.NOT_FOUND;
            break;
          case 409:
            errorCode = ErrorCode.CONFLICT;
            break;
          case 429:
            errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
            break;
        }
        
        throw new ErrorResponse(errorMessage, errorCode as any);
      }

      return {
        data,
        status: response.status
      };
    } catch (error) {
      logger.error(`API v2 Error:`, error);
      
      let apiError: ApiError;
      
      // 이미 ApiError 형식인 경우
      if (error instanceof ErrorResponse || (error as any)?.code) {
        apiError = error as ApiError;
      }
      // 네트워크 에러 처리
      else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        apiError = new ErrorResponse(
          '네트워크 연결을 확인해주세요',
          ErrorCode.EXTERNAL_SERVICE_ERROR as any
        );
      }
      // 타임아웃 에러
      else if (error instanceof Error && error.name === 'AbortError') {
        apiError = new ErrorResponse(
          '요청 시간이 초과되었습니다',
          ErrorCode.EXTERNAL_SERVICE_ERROR as any
        );
      }
      // 기타 에러
      else if (error instanceof Error) {
        apiError = new ErrorResponse(
          error.message || '알 수 없는 오류가 발생했습니다',
          ErrorCode.INTERNAL_ERROR as any
        );
      } else {
        apiError = new ErrorResponse(
          '알 수 없는 오류가 발생했습니다',
          ErrorCode.INTERNAL_ERROR as any
        );
      }
      
      // 글로벌 에러 인터셉터 실행
      const handled = await errorInterceptorManager.handleError(apiError);
      
      // 에러가 처리되지 않은 경우에만 throw
      if (!handled) {
        throw apiError;
      }
      
      // 에러가 처리된 경우 빈 응답 반환
      return {
        data: null,
        status: 0,
        error: apiError
      };
    }
  }

  // 예약 생성 (v2 API)
  async createReservation(data: {
    deviceId: string;
    date: string;
    startHour: number;
    endHour: number;
    userNotes?: string;
  }): Promise<V2Reservation> {
    const endpoint = '/reservations/create';
    const response = await this.fetch<{ reservation: V2Reservation }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.data?.reservation) {
      throw new Error('예약 데이터가 없습니다');
    }

    return response.data.reservation;
  }

  // 예약 목록 조회
  async getReservations(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    reservations: V2Reservation[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const endpoint = `/reservations${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.fetch<{
      reservations: V2Reservation[];
      total: number;
      page: number;
      pageSize: number;
    }>(endpoint);

    return response.data || {
      reservations: [],
      total: 0,
      page: 1,
      pageSize: 10
    };
  }

  // 예약 상세 조회
  async getReservation(id: string): Promise<V2Reservation> {
    const endpoint = `/reservations/${id}`;
    const response = await this.fetch<V2Reservation>(endpoint);

    if (!response.data) {
      throw new Error('예약 정보를 찾을 수 없습니다');
    }

    return response.data;
  }

  // 예약 취소
  async cancelReservation(id: string): Promise<void> {
    const endpoint = `/reservations/${id}`;
    await this.fetch(endpoint, {
      method: 'DELETE',
    });
  }

  // GET 요청 메서드
  async get<T>(endpoint: string, options?: {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
  }): Promise<{ ok: boolean; json: () => Promise<T> }> {
    let url = `${this.baseUrl}${endpoint}`;
    
    // URL 파라미터 추가
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return {
      ok: response.ok,
      json: async () => {
        const text = await response.text();
        return text ? JSON.parse(text) : null;
      }
    };
  }
}

// v2 API 클라이언트 (메인 인스턴스)
export const api = new ApiClient();

// v2 API 메서드들을 직접 export
export const createReservation = api.createReservation.bind(api);
export const getReservations = api.getReservations.bind(api);
export const getReservation = api.getReservation.bind(api);
export const cancelReservation = api.cancelReservation.bind(api);

// v1 API 호환성을 위한 기존 함수들 내보내기
export { getDeviceTypes, getTimeSlots } from './reservations';