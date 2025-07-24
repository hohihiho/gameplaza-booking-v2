export type TimeAdjustmentReason = 
  | 'admin_late'        // 관리자 지각
  | 'system_error'      // 시스템 오류
  | 'customer_extend'   // 고객 요청 연장
  | 'early_finish'      // 조기 종료
  | 'other'            // 기타

export interface TimeAdjustmentProps {
  originalStartTime: Date
  originalEndTime: Date
  actualStartTime: Date
  actualEndTime: Date
  reason: TimeAdjustmentReason
  reasonDetail?: string
  adjustedBy: string
  adjustedAt: Date
}

export class TimeAdjustment {
  private constructor(
    public readonly originalStartTime: Date,
    public readonly originalEndTime: Date,
    public readonly actualStartTime: Date,
    public readonly actualEndTime: Date,
    public readonly reason: TimeAdjustmentReason,
    public readonly reasonDetail: string | null,
    public readonly adjustedBy: string,
    public readonly adjustedAt: Date
  ) {}

  static create(props: TimeAdjustmentProps): TimeAdjustment {
    // 시간 유효성 검증
    if (props.actualStartTime > props.actualEndTime) {
      throw new Error('실제 종료 시간은 시작 시간보다 이후여야 합니다')
    }

    return new TimeAdjustment(
      props.originalStartTime,
      props.originalEndTime,
      props.actualStartTime,
      props.actualEndTime,
      props.reason,
      props.reasonDetail || null,
      props.adjustedBy,
      props.adjustedAt
    )
  }

  /**
   * 원래 이용 시간 (분 단위)
   */
  get originalDurationMinutes(): number {
    return Math.floor((this.originalEndTime.getTime() - this.originalStartTime.getTime()) / (1000 * 60))
  }

  /**
   * 실제 이용 시간 (분 단위)
   */
  get actualDurationMinutes(): number {
    return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60))
  }

  /**
   * 조정된 시간 차이 (분 단위, 양수면 연장, 음수면 단축)
   */
  get adjustmentMinutes(): number {
    return this.actualDurationMinutes - this.originalDurationMinutes
  }

  /**
   * 조정 사유 한글 표시
   */
  get reasonText(): string {
    const reasonMap: Record<TimeAdjustmentReason, string> = {
      admin_late: '관리자 지각',
      system_error: '시스템 오류',
      customer_extend: '고객 요청 연장',
      early_finish: '조기 종료',
      other: '기타'
    }
    return reasonMap[this.reason]
  }

  /**
   * 요금 계산용 시간 (30분 단위 올림)
   */
  get chargeableMinutes(): number {
    const minutes = this.actualDurationMinutes
    return Math.ceil(minutes / 30) * 30
  }
}