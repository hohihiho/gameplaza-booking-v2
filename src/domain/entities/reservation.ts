import { KSTDateTime } from '../value-objects/kst-datetime'
import { TimeSlot } from '../value-objects/time-slot'
import { ReservationStatus, ReservationStatusType } from '../value-objects/reservation-status'
import { ReservationDate } from '../value-objects/reservation-date'

export interface ReservationProps {
  id: string
  userId: string
  deviceId: string
  date: KSTDateTime
  timeSlot: TimeSlot
  status?: ReservationStatus
  reservationNumber?: string
  assignedDeviceNumber?: string
  rejectionReason?: string
  checkedInAt?: Date | null
  actualStartTime?: Date | null
  actualEndTime?: Date | null
  note?: string | null
  totalAmount?: number | null
  createdAt?: Date
  updatedAt?: Date
}

export class Reservation {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly deviceId: string,
    private _date: KSTDateTime,
    private _timeSlot: TimeSlot,
    private _status: ReservationStatus,
    private _reservationNumber: string,
    private _assignedDeviceNumber: string | null,
    private _rejectionReason: string | null,
    private _checkedInAt: Date | null,
    private _actualStartTime: Date | null,
    private _actualEndTime: Date | null,
    private _note: string | null,
    private _totalAmount: number | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: ReservationProps): Reservation {
    const now = new Date()
    const reservationNumber = props.reservationNumber || this.generateReservationNumber(props.date)
    
    return new Reservation(
      props.id,
      props.userId,
      props.deviceId,
      props.date,
      props.timeSlot,
      props.status || ReservationStatus.pending(),
      reservationNumber,
      props.assignedDeviceNumber || null,
      props.rejectionReason || null,
      props.checkedInAt || null,
      props.actualStartTime || null,
      props.actualEndTime || null,
      props.note || null,
      props.totalAmount || null,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  private static generateReservationNumber(date: KSTDateTime): string {
    const dateStr = date.dateString.replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `GP-${dateStr}-${random}`
  }

  get date(): KSTDateTime {
    return this._date
  }

  get timeSlot(): TimeSlot {
    return this._timeSlot
  }

  get status(): ReservationStatus {
    return this._status
  }

  get reservationNumber(): string {
    return this._reservationNumber
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get assignedDeviceNumber(): string | null {
    return this._assignedDeviceNumber
  }

  get rejectionReason(): string | null {
    return this._rejectionReason
  }

  get checkedInAt(): Date | null {
    return this._checkedInAt
  }

  get actualStartTime(): Date | null {
    return this._actualStartTime
  }

  get actualEndTime(): Date | null {
    return this._actualEndTime
  }

  get note(): string | null {
    return this._note
  }

  get totalAmount(): number | null {
    return this._totalAmount
  }

  // UseCase 호환성을 위한 별칭 속성
  get totalPrice(): number {
    return this._totalAmount || 0
  }

  get startDateTime(): KSTDateTime {
    const [year, month, day] = this._date.dateString.split('-').map(Number)
    
    // month와 day가 undefined인 경우 처리
    if (!month || !day) {
      throw new Error('유효하지 않은 날짜 형식입니다')
    }
    
    const originalStartHour = this._timeSlot.startHour
    const normalizedStartHour = this._timeSlot.normalizedStartHour
    
    // 24시간 표시에서 0-5시는 실제로 다음날을 의미
    const dateToUse = new Date(year, month - 1, day)
    if (originalStartHour < 6) {
      // 0-5시는 다음 날짜로 처리
      dateToUse.setDate(dateToUse.getDate() + 1)
    }
    
    return KSTDateTime.create(new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate(), normalizedStartHour, 0))
  }

  get endDateTime(): KSTDateTime {
    const [year, month, day] = this._date.dateString.split('-').map(Number)
    
    // month와 day가 undefined인 경우 처리
    if (!month || !day) {
      throw new Error('유효하지 않은 날짜 형식입니다')
    }
    
    const originalEndHour = this._timeSlot.endHour
    const normalizedEndHour = this._timeSlot.normalizedEndHour
    
    // 24시간 표시에서 0-6시는 실제로 다음날을 의미
    const dateToUse = new Date(year, month - 1, day)
    if (originalEndHour <= 6) {
      // 0-6시는 다음 날짜로 처리
      dateToUse.setDate(dateToUse.getDate() + 1)
    }
    
    return KSTDateTime.create(new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate(), normalizedEndHour, 0))
  }

  /**
   * 24시간 사전 예약 규칙 검증
   */
  isValidFor24HourRule(currentTime: KSTDateTime = KSTDateTime.now()): boolean {
    const hoursUntilStart = this.startDateTime.differenceInHours(currentTime)
    return hoursUntilStart >= 24
  }

  /**
   * 예약이 현재 활성 상태인지 확인
   */
  isActive(): boolean {
    return this._status.isActive()
  }

  /**
   * 예약이 최종 상태인지 확인
   */
  isFinal(): boolean {
    return this._status.isFinal()
  }

  /**
   * 다른 예약과 시간이 겹치는지 확인
   */
  conflictsWith(other: Reservation): boolean {
    if (this.id === other.id) return false
    if (!this._date.isSameDay(other._date)) return false
    return this._timeSlot.overlaps(other._timeSlot)
  }

  /**
   * 같은 사용자가 같은 시간대에 다른 기기를 예약했는지 확인
   */
  hasUserConflict(other: Reservation): boolean {
    if (this.userId !== other.userId) return false
    if (this.id === other.id) return false
    // 둘 다 최종 상태가 아닌 경우만 충돌 검사
    if (this.isFinal() || other.isFinal()) return false
    return this.conflictsWith(other)
  }

  /**
   * 예약 상태 변경
   */
  changeStatus(newStatus: ReservationStatusType): Reservation {
    const updatedStatus = this._status.transitionTo(newStatus)
    
    return new Reservation(
      this.id,
      this.userId,
      this.deviceId,
      this._date,
      this._timeSlot,
      updatedStatus,
      this._reservationNumber,
      this._assignedDeviceNumber,
      this._rejectionReason,
      this._checkedInAt,
      this._actualStartTime,
      this._actualEndTime,
      this._note,
      this._totalAmount,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 예약 승인
   */
  approve(): Reservation {
    return this.changeStatus('approved')
  }

  /**
   * 예약 거부
   */
  reject(): Reservation {
    return this.changeStatus('rejected')
  }

  /**
   * 기기 번호 할당
   */
  assignDevice(deviceNumber: string): Reservation {
    if (this._status.value !== 'pending') {
      throw new Error('대기 중인 예약만 기기를 할당할 수 있습니다')
    }
    
    return new Reservation(
      this.id,
      this.userId,
      this.deviceId,
      this._date,
      this._timeSlot,
      this._status,
      this._reservationNumber,
      deviceNumber,
      this._rejectionReason,
      this._checkedInAt,
      this._actualStartTime,
      this._actualEndTime,
      this._note,
      this._totalAmount,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 예약 승인 (기기 번호 할당 포함)
   */
  approveWithDevice(deviceNumber: string): Reservation {
    if (this._status.value !== 'pending') {
      throw new Error('대기 중인 예약만 승인할 수 있습니다')
    }
    
    const updatedStatus = this._status.transitionTo('approved')
    
    return new Reservation(
      this.id,
      this.userId,
      this.deviceId,
      this._date,
      this._timeSlot,
      updatedStatus,
      this._reservationNumber,
      deviceNumber,
      this._rejectionReason,
      this._checkedInAt,
      this._actualStartTime,
      this._actualEndTime,
      this._note,
      this._totalAmount,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 예약 거절 (사유 포함)
   */
  rejectWithReason(reason: string): Reservation {
    if (this._status.value !== 'pending') {
      throw new Error('대기 중인 예약만 거절할 수 있습니다')
    }
    
    if (!reason || reason.trim().length === 0) {
      throw new Error('거절 사유는 필수입니다')
    }
    
    const updatedStatus = this._status.transitionTo('rejected')
    
    return new Reservation(
      this.id,
      this.userId,
      this.deviceId,
      this._date,
      this._timeSlot,
      updatedStatus,
      this._reservationNumber,
      this._assignedDeviceNumber,
      reason,
      this._checkedInAt,
      this._actualStartTime,
      this._actualEndTime,
      this._note,
      this._totalAmount,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 예약 취소
   */
  cancel(): Reservation {
    return this.changeStatus('cancelled')
  }

  /**
   * 체크인
   */
  checkIn(): Reservation {
    if (this._status.value !== 'approved') {
      throw new Error('승인된 예약만 체크인할 수 있습니다')
    }
    
    if (!this._assignedDeviceNumber) {
      throw new Error('기기가 배정되지 않은 예약은 체크인할 수 없습니다')
    }
    
    const now = new Date()
    const updatedStatus = this._status.transitionTo('checked_in')
    
    return new Reservation(
      this.id,
      this.userId,
      this.deviceId,
      this._date,
      this._timeSlot,
      updatedStatus,
      this._reservationNumber,
      this._assignedDeviceNumber,
      this._rejectionReason,
      now, // checkedInAt
      now, // actualStartTime - 체크인 시점을 실제 시작 시간으로 기록
      this._actualEndTime,
      this._note,
      this._totalAmount,
      this.createdAt,
      now
    )
  }

  /**
   * 이용 완료
   */
  complete(): Reservation {
    return this.changeStatus('completed')
  }

  /**
   * 노쇼 처리
   */
  markAsNoShow(): Reservation {
    return this.changeStatus('no_show')
  }

  /**
   * 예약 날짜 변경
   */
  changeDate(newDate: ReservationDate): void {
    if (this.status.value !== 'pending' && this.status.value !== 'confirmed') {
      throw new Error('현재 상태에서는 날짜를 변경할 수 없습니다')
    }
    
    this._date = newDate.toKSTDateTime()
    this._updatedAt = KSTDateTime.now().toDate()
  }

  /**
   * 예약 시간대 변경
   */
  changeTimeSlot(newTimeSlot: TimeSlot): void {
    if (this.status.value !== 'pending' && this.status.value !== 'confirmed') {
      throw new Error('현재 상태에서는 시간을 변경할 수 없습니다')
    }
    
    this._timeSlot = newTimeSlot
    this._updatedAt = KSTDateTime.now().toDate()
  }

  /**
   * 메모 업데이트
   */
  updateNote(note: string): void {
    this._note = note
    this._updatedAt = KSTDateTime.now().toDate()
  }

  /**
   * 예약 시작까지 남은 시간 (시간 단위)
   */
  getHoursUntilStart(): number {
    const now = KSTDateTime.now()
    const startDateTime = this.startDateTime
    return now.differenceInHours(startDateTime)
  }

  /**
   * 결제 완료 확인
   */
  confirmPayment(): void {
    if (this.status.value === 'pending') {
      this.changeStatus('confirmed')
    }
  }
}