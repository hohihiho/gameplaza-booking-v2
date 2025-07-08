/**
 * API 응답 및 요청에 대한 타입 정의
 */

// 기본 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

// API 에러 타입
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 인증 관련 타입
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    phoneNumber?: string;
    isAdmin?: boolean;
  };
  session?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: string;
  };
}

// 예약 관련 타입
export interface ReservationRequest {
  deviceId: string;
  date: string;
  timeSlot: string;
  purpose: string;
  participants: number;
}

export interface ReservationResponse {
  id: string;
  userId: string;
  deviceId: string;
  date: string;
  timeSlot: string;
  purpose: string;
  participants: number;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 기기 관련 타입
export interface DeviceResponse {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'maintenance';
  description?: string;
  image?: string;
  playModes?: PlayMode[];
}

export interface PlayMode {
  id: string;
  name: string;
  maxPlayers: number;
  description?: string;
}

// 일정 관련 타입
export interface ScheduleEventResponse {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'holiday' | 'maintenance' | 'event';
  affectedDevices?: string[];
}

// 관리자 관련 타입
export interface AdminStatsResponse {
  totalUsers: number;
  totalReservations: number;
  todayReservations: number;
  activeDevices: number;
  popularDevices: Array<{
    deviceId: string;
    deviceName: string;
    reservationCount: number;
  }>;
  recentActivity: Array<{
    type: 'reservation' | 'cancellation' | 'user_registration';
    timestamp: string;
    details: string;
  }>;
}

// 금지어 관련 타입
export interface BannedWordResponse {
  id: string;
  word: string;
  category: 'profanity' | 'spam' | 'inappropriate' | 'other';
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  createdBy: string;
}

// 유틸리티 타입
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestConfig {
  method: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
}