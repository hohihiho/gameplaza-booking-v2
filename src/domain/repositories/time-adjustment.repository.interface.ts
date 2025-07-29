import { TimeAdjustment } from '../value-objects/time-adjustment'

export interface ITimeAdjustmentRepository {
  /**
   * 시간 조정 이력 저장
   */
  save(reservationId: string, timeAdjustment: TimeAdjustment): Promise<void>
  
  /**
   * ID로 시간 조정 이력 조회
   */
  findById(id: string): Promise<TimeAdjustment | null>
  
  /**
   * 예약 ID로 시간 조정 이력 조회
   */
  findByReservationId(reservationId: string): Promise<TimeAdjustment[]>
  
  /**
   * 특정 기간의 시간 조정 이력 조회
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<TimeAdjustment[]>
  
  /**
   * 조정자별 시간 조정 이력 조회
   */
  findByAdjustedBy(userId: string): Promise<TimeAdjustment[]>
}