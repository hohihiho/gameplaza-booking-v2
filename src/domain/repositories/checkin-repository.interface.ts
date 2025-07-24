import { CheckIn } from '../entities/checkin';

/**
 * 체크인 리포지토리 인터페이스
 */
export interface CheckInRepository {
  /**
   * 체크인 생성
   */
  create(checkIn: CheckIn): Promise<CheckIn>;

  /**
   * 체크인 업데이트
   */
  update(checkIn: CheckIn): Promise<CheckIn>;

  /**
   * ID로 체크인 조회
   */
  findById(id: string): Promise<CheckIn | null>;

  /**
   * 예약 ID로 체크인 조회
   */
  findByReservationId(reservationId: string): Promise<CheckIn | null>;

  /**
   * 기기 ID로 체크인 목록 조회
   */
  findByDeviceId(deviceId: string): Promise<CheckIn[]>;

  /**
   * 활성 체크인 목록 조회 (checked_in, in_use 상태)
   */
  findActiveCheckIns(): Promise<CheckIn[]>;

  /**
   * 날짜 범위로 체크인 목록 조회
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<CheckIn[]>;

  /**
   * 특정 기기의 활성 체크인 조회
   */
  findActiveByDeviceId(deviceId: string): Promise<CheckIn | null>;

  /**
   * 특정 상태의 체크인 목록 조회
   */
  findByStatus(status: string): Promise<CheckIn[]>;

  /**
   * 결제 대기 중인 체크인 목록 조회
   */
  findPendingPayments(): Promise<CheckIn[]>;
}