import { v4 as uuidv4 } from 'uuid'
import { KSTDateTime } from '../value-objects/kst-datetime'

export type CheckInStatus = 'checked_in' | 'checked_out' | 'cancelled'

export interface CheckInProps {
  id: string
  reservationId: string
  userId: string
  deviceId: string
  checkInTime: KSTDateTime
  checkOutTime?: KSTDateTime
  status: CheckInStatus
  checkInBy: string // 체크인 처리한 관리자 ID
  checkOutBy?: string // 체크아웃 처리한 관리자 ID
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class CheckIn {
  private constructor(private props: CheckInProps) {}

  // Getters
  get id(): string { return this.props.id }
  get reservationId(): string { return this.props.reservationId }
  get userId(): string { return this.props.userId }
  get deviceId(): string { return this.props.deviceId }
  get checkInTime(): KSTDateTime { return this.props.checkInTime }
  get checkOutTime(): KSTDateTime | undefined { return this.props.checkOutTime }
  get status(): CheckInStatus { return this.props.status }
  get checkInBy(): string { return this.props.checkInBy }
  get checkOutBy(): string | undefined { return this.props.checkOutBy }
  get notes(): string | undefined { return this.props.notes }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  // 체크인 중인지 확인
  isCheckedIn(): boolean {
    return this.props.status === 'checked_in'
  }

  // 체크아웃 완료인지 확인
  isCheckedOut(): boolean {
    return this.props.status === 'checked_out'
  }

  // 사용 시간 계산 (분 단위)
  getUsageMinutes(): number | null {
    if (!this.props.checkOutTime) {
      return null
    }

    const checkInDate = this.props.checkInTime.toDate()
    const checkOutDate = this.props.checkOutTime.toDate()
    const diffMs = checkOutDate.getTime() - checkInDate.getTime()
    
    return Math.floor(diffMs / (1000 * 60))
  }

  // 체크아웃 처리
  checkOut(adminId: string, checkOutTime: KSTDateTime, notes?: string): CheckIn {
    if (this.props.status !== 'checked_in') {
      throw new Error('체크인 상태가 아닌 경우 체크아웃할 수 없습니다')
    }

    if (checkOutTime.toDate() <= this.props.checkInTime.toDate()) {
      throw new Error('체크아웃 시간은 체크인 시간보다 이후여야 합니다')
    }

    return new CheckIn({
      ...this.props,
      checkOutTime: checkOutTime,
      checkOutBy: adminId,
      status: 'checked_out',
      notes: notes || this.props.notes,
      updatedAt: new Date()
    })
  }

  // 체크인 취소
  cancel(adminId: string, reason?: string): CheckIn {
    if (this.props.status === 'checked_out') {
      throw new Error('이미 체크아웃이 완료된 경우 취소할 수 없습니다')
    }

    return new CheckIn({
      ...this.props,
      status: 'cancelled',
      notes: reason ? `취소 사유: ${reason}` : this.props.notes,
      updatedAt: new Date()
    })
  }

  // 메모 업데이트
  updateNotes(notes: string): CheckIn {
    return new CheckIn({
      ...this.props,
      notes: notes,
      updatedAt: new Date()
    })
  }

  // 정적 팩토리 메서드
  static create(props: Omit<CheckInProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CheckIn {
    const now = new Date()
    return new CheckIn({
      ...props,
      id: props.id || uuidv4(),
      createdAt: now,
      updatedAt: now
    })
  }
}