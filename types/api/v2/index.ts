/**
 * 게임플라자 예약 시스템 API v2 타입 정의
 * 
 * 이 파일은 OpenAPI 명세를 기반으로 생성되었습니다.
 * 수동으로 수정하지 마세요. API 명세가 변경되면 재생성됩니다.
 */

// ===== 공통 타입 =====

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
}

// ===== 예약 관련 타입 =====

export type ReservationStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'checked_in'
  | 'completed'
  | 'no_show';

export interface TimeSlot {
  startHour: number;
  endHour: number;
  displayStartTime?: string;
  displayEndTime?: string;
}

export interface Reservation {
  id: string;
  userId: string;
  deviceId: string;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  status: ReservationStatus;
  reservationNumber: string; // GP-YYYYMMDD-NNNN
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  deviceId: string;
  date: string;
  timeSlot: {
    startHour: number;
    endHour: number;
  };
}

export interface UpdateReservationStatusDto {
  status: Exclude<ReservationStatus, 'pending'>;
}

export interface CheckAvailabilityDto {
  deviceId: string;
  date: string;
  timeSlot: {
    startHour: number;
    endHour: number;
  };
}

export interface AvailabilityResponse {
  available: boolean;
  reason?: string;
  conflicts?: Reservation[];
}

export interface ActiveReservationsResponse {
  data: Reservation[];
  count: number;
}

// ===== 시간대 관련 타입 =====

export type TimeSlotType = 'default' | 'custom';

export interface TimeSlotTemplate {
  id: string;
  name: string;
  description?: string;
  startHour: number; // 0-29
  endHour: number; // 1-30
  displayTime: string; // "07:00 - 12:00"
  duration: number; // 시간
  price: number;
  type: TimeSlotType;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeSlotTemplateDto {
  name: string;
  description?: string;
  startHour: number;
  endHour: number;
  price: number;
  type?: TimeSlotType;
  priority?: number;
  active?: boolean;
}

export interface UpdateTimeSlotTemplateDto {
  name?: string;
  description?: string;
  price?: number;
  priority?: number;
  active?: boolean;
}

export interface TimeSlotSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  deviceTypeId: string;
  timeSlots: TimeSlotTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeSlotScheduleDto {
  date: string;
  deviceTypeId: string;
  timeSlotIds: string[];
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    daysOfWeek?: number[]; // 0-6 (일-토)
  };
}

export interface AvailableTimeSlot {
  timeSlot: TimeSlotTemplate;
  available: boolean;
  remainingSlots: number;
  price: number;
}

// ===== API 클라이언트 인터페이스 =====

export interface ReservationApiClient {
  // 예약 목록 조회
  getReservations(params?: {
    status?: ReservationStatus;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Reservation[]>>;

  // 예약 생성
  createReservation(data: CreateReservationDto): Promise<Reservation>;

  // 예약 상세 조회
  getReservation(id: string): Promise<Reservation>;

  // 예약 상태 변경
  updateReservationStatus(id: string, data: UpdateReservationStatusDto): Promise<Reservation>;

  // 예약 가능 여부 확인
  checkAvailability(data: CheckAvailabilityDto): Promise<AvailabilityResponse>;

  // 사용자 활성 예약 조회
  getUserActiveReservations(userId: string): Promise<ActiveReservationsResponse>;
}

export interface TimeSlotApiClient {
  // 시간대 템플릿 목록 조회
  getTimeSlotTemplates(params?: {
    type?: TimeSlotType;
    active?: boolean;
  }): Promise<ApiResponse<TimeSlotTemplate[]>>;

  // 시간대 템플릿 생성
  createTimeSlotTemplate(data: CreateTimeSlotTemplateDto): Promise<TimeSlotTemplate>;

  // 시간대 템플릿 상세 조회
  getTimeSlotTemplate(id: string): Promise<TimeSlotTemplate>;

  // 시간대 템플릿 수정
  updateTimeSlotTemplate(id: string, data: UpdateTimeSlotTemplateDto): Promise<TimeSlotTemplate>;

  // 시간대 템플릿 삭제
  deleteTimeSlotTemplate(id: string): Promise<void>;

  // 시간대 스케줄 조회
  getTimeSlotSchedules(params: {
    startDate: string;
    endDate: string;
    deviceTypeId?: string;
  }): Promise<ApiResponse<TimeSlotSchedule[]>>;

  // 시간대 스케줄 설정
  createTimeSlotSchedule(data: CreateTimeSlotScheduleDto): Promise<TimeSlotSchedule[]>;

  // 예약 가능한 시간대 조회
  getAvailableTimeSlots(params: {
    date: string;
    deviceId: string;
  }): Promise<ApiResponse<AvailableTimeSlot[]>>;
}

// ===== 유틸리티 타입 =====

/**
 * API 요청 옵션
 */
export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * API 에러 응답
 */
export class ApiErrorResponse extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: Record<string, any>,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiErrorResponse';
  }
}

/**
 * 시간 표시 유틸리티
 */
export const TimeDisplayUtils = {
  /**
   * 24시간 확장 표시 형식으로 변환
   * @param hour 0-23 범위의 시간
   * @returns 0-29 범위의 표시 시간
   */
  toExtendedHour(hour: number): number {
    return hour < 6 ? hour + 24 : hour;
  },

  /**
   * 표시 시간을 실제 시간으로 변환
   * @param displayHour 0-29 범위의 표시 시간
   * @returns 0-23 범위의 실제 시간
   */
  toRealHour(displayHour: number): number {
    return displayHour >= 24 ? displayHour - 24 : displayHour;
  },

  /**
   * 시간을 표시 형식으로 변환
   * @param hour 0-29 범위의 시간
   * @returns "HH:00" 형식의 문자열
   */
  formatHour(hour: number): string {
    const displayHour = hour >= 24 ? hour - 24 : hour;
    return `${displayHour.toString().padStart(2, '0')}:00`;
  },

  /**
   * 시간대를 표시 형식으로 변환
   * @param startHour 시작 시간
   * @param endHour 종료 시간
   * @returns "HH:00 - HH:00" 형식의 문자열
   */
  formatTimeSlot(startHour: number, endHour: number): string {
    return `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`;
  }
};