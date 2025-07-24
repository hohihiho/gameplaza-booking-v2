/**
 * 예약 상태를 표현하는 값 객체
 * 예약의 생명주기를 관리
 */
export type ReservationStatusType = 
  | 'pending'      // 승인 대기
  | 'approved'     // 승인됨
  | 'rejected'     // 거부됨
  | 'checked_in'   // 체크인 완료
  | 'completed'    // 이용 완료
  | 'cancelled'    // 취소됨
  | 'no_show'      // 노쇼

export class ReservationStatus {
  private constructor(private readonly _status: ReservationStatusType) {}

  static create(status: ReservationStatusType): ReservationStatus {
    return new ReservationStatus(status)
  }

  static pending(): ReservationStatus {
    return new ReservationStatus('pending')
  }

  get value(): ReservationStatusType {
    return this._status
  }

  get displayName(): string {
    const displayNames: Record<ReservationStatusType, string> = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거부됨',
      checked_in: '체크인 완료',
      completed: '이용 완료',
      cancelled: '취소됨',
      no_show: '노쇼'
    }
    return displayNames[this._status]
  }

  isPending(): boolean {
    return this._status === 'pending'
  }

  isApproved(): boolean {
    return this._status === 'approved'
  }

  isActive(): boolean {
    return this._status === 'approved' || this._status === 'checked_in'
  }

  isFinal(): boolean {
    return ['completed', 'cancelled', 'rejected', 'no_show'].includes(this._status)
  }

  canTransitionTo(newStatus: ReservationStatusType): boolean {
    const transitions: Record<ReservationStatusType, ReservationStatusType[]> = {
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['checked_in', 'cancelled', 'no_show'],
      rejected: [],
      checked_in: ['completed'],
      completed: [],
      cancelled: [],
      no_show: []
    }

    return transitions[this._status].includes(newStatus)
  }

  transitionTo(newStatus: ReservationStatusType): ReservationStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status} to ${newStatus}`
      )
    }
    return new ReservationStatus(newStatus)
  }

  equals(other: ReservationStatus): boolean {
    return this._status === other._status
  }
}