/**
 * 예약 시간 슬롯을 표현하는 값 객체
 * 유연한 시간 단위의 시간 블록을 관리 (1-12시간)
 */
export class TimeSlot {
  private constructor(
    private readonly _startHour: number,
    private readonly _endHour: number
  ) {}

  static create(startHour: number, endHour: number): TimeSlot {
    if (startHour < 0 || startHour > 29) {
      throw new Error('시작 시간은 0-29 사이여야 합니다')
    }
    if (endHour < 1 || endHour > 30) {
      throw new Error('종료 시간은 1-30 사이여야 합니다')
    }
    if (startHour >= endHour) {
      throw new Error('종료 시간은 시작 시간보다 커야 합니다')
    }
    
    const duration = endHour - startHour
    if (duration < 1) {
      throw new Error('최소 1시간 이상이어야 합니다')
    }
    if (duration > 12) {
      throw new Error('최대 12시간을 초과할 수 없습니다')
    }

    return new TimeSlot(startHour, endHour)
  }

  static fromString(timeSlot: string): TimeSlot {
    const [start, end] = timeSlot.split('-').map(t => {
      const hour = parseInt(t.split(':')[0])
      return hour
    })
    
    return TimeSlot.create(start, end)
  }

  static fromHours(startHour: number, endHour: number): TimeSlot {
    return TimeSlot.create(startHour, endHour)
  }

  get startHour(): number {
    return this._startHour
  }

  get endHour(): number {
    return this._endHour
  }

  get displayString(): string {
    return `${this._startHour}:00-${this._endHour}:00`
  }

  get displayTime(): string {
    return this.formatKST()
  }

  get normalizedStartHour(): number {
    // 24-29시를 0-5시로 정규화
    return this._startHour >= 24 ? this._startHour - 24 : this._startHour
  }

  get normalizedEndHour(): number {
    return this._endHour >= 24 ? this._endHour - 24 : this._endHour
  }

  overlaps(other: TimeSlot): boolean {
    return !(this._endHour <= other._startHour || this._startHour >= other._endHour)
  }

  equals(other: TimeSlot): boolean {
    return this._startHour === other._startHour && this._endHour === other._endHour
  }

  /**
   * 시간대 길이(duration) 계산
   */
  get duration(): number {
    return this._endHour - this._startHour
  }

  /**
   * 한국어 시간 표시 (24시간 확장 형식)
   * 예: "10:00 - 14:00", "22:00 - 26:00"
   */
  formatKST(): string {
    const formatHour = (hour: number): string => {
      const displayHour = hour >= 24 ? hour : hour
      const realHour = hour >= 24 ? hour - 24 : hour
      return `${displayHour.toString().padStart(2, '0')}:00`
    }
    
    return `${formatHour(this._startHour)} - ${formatHour(this._endHour)}`
  }

  /**
   * 조기대여 시간대인지 확인 (일반적으로 10시-18시)
   */
  isEarlySlot(): boolean {
    return this._startHour >= 9 && this._endHour <= 18
  }

  /**
   * 밤샘대여 시간대인지 확인 (일반적으로 22시-익일 5시)
   */
  isOvernightSlot(): boolean {
    return this._startHour >= 22 || this._endHour > 24
  }

  /**
   * 청소년 이용 가능 시간대인지 확인 (9시-22시)
   */
  isYouthAllowed(): boolean {
    return this.normalizedStartHour >= 9 && this.normalizedEndHour <= 22
  }
}