// API 클라이언트 - v1과 v2 지원
import { logger } from '@/lib/utils/logger';

// Feature flag - 환경변수 또는 로컬스토리지로 제어 가능
export const isV2ApiEnabled = () => {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 로컬스토리지 확인
    const v2Enabled = localStorage.getItem('use_v2_api');
    if (v2Enabled !== null) {
      return v2Enabled === 'true';
    }
  }
  // 서버사이드 또는 로컬스토리지 값이 없을 때는 환경변수 확인
  return process.env.NEXT_PUBLIC_USE_V2_API === 'true';
};

// API 응답 타입
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// v2 API 에러 타입
export interface V2ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

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
  private version: 'v1' | 'v2';

  constructor(version: 'v1' | 'v2' = 'v1') {
    this.version = version;
    this.baseUrl = version === 'v2' ? '/api/v2' : '/api';
  }

  // 공통 fetch 래퍼 - 에러 처리와 로깅 포함
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    logger.info(`API ${this.version} Request:`, {
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

      logger.info(`API ${this.version} Response:`, {
        status: response.status,
        data
      });

      if (!response.ok) {
        // v2 API 에러 형식 처리
        if (this.version === 'v2' && data?.error) {
          const error = data.error as V2ApiError;
          throw new Error(error.message || '요청 처리 중 오류가 발생했습니다');
        }
        // v1 API 에러 형식 처리
        throw new Error(data?.error || data?.message || '요청 처리 중 오류가 발생했습니다');
      }

      return {
        data,
        status: response.status
      };
    } catch (error) {
      logger.error(`API ${this.version} Error:`, error);
      
      // 네트워크 에러 등의 처리
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('네트워크 연결을 확인해주세요');
      }
      
      throw error;
    }
  }

  // 예약 생성
  async createReservation(data: {
    date: string;
    start_time: string;
    end_time: string;
    device_id: string;
    player_count?: number;
    credit_type?: string;
    fixed_credits?: number;
    user_notes?: string;
    slot_type?: string;
    total_amount?: number;
  }): Promise<V2Reservation> {
    const endpoint = '/reservations';
    const response = await this.fetch<V2Reservation>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.data) {
      throw new Error('예약 데이터가 없습니다');
    }

    return response.data;
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
}

// v1 API 클라이언트 (기존 호환성 유지)
export const apiV1 = new ApiClient('v1');

// v2 API 클라이언트
export const apiV2 = new ApiClient('v2');

// 동적 API 클라이언트 (feature flag 기반)
export const api = {
  createReservation: async (data: Parameters<ApiClient['createReservation']>[0]) => {
    const client = isV2ApiEnabled() ? apiV2 : apiV1;
    return client.createReservation(data);
  },
  
  getReservations: async (params?: Parameters<ApiClient['getReservations']>[0]) => {
    const client = isV2ApiEnabled() ? apiV2 : apiV1;
    return client.getReservations(params);
  },
  
  getReservation: async (id: string) => {
    const client = isV2ApiEnabled() ? apiV2 : apiV1;
    return client.getReservation(id);
  },
  
  cancelReservation: async (id: string) => {
    const client = isV2ApiEnabled() ? apiV2 : apiV1;
    return client.cancelReservation(id);
  }
};

// v1 API 호환성을 위한 기존 함수들 내보내기
export { getDeviceTypes, getTimeSlots } from './reservations';