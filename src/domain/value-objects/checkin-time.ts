/**
 * 체크인 가능 시간을 관리하는 값 객체
 */
export class CheckInTime {
  private constructor(
    private readonly _reservationStartTime: Date
  ) {}

  static create(reservationStartTime: Date): CheckInTime {
    if (!reservationStartTime || !(reservationStartTime instanceof Date)) {
      throw new Error('유효한 예약 시작 시간이 필요합니다');
    }
    return new CheckInTime(reservationStartTime);
  }

  /**
   * 체크인 가능 여부 확인 (예약 시작 1시간 전부터 가능)
   */
  canCheckIn(currentTime: Date = new Date()): boolean {
    const checkInAvailableTime = this.getCheckInAvailableTime();
    return currentTime >= checkInAvailableTime;
  }

  /**
   * 체크인 가능 시작 시간 반환
   */
  getCheckInAvailableTime(): Date {
    const oneHourBefore = new Date(this._reservationStartTime);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    return oneHourBefore;
  }

  /**
   * 체크인 가능까지 남은 시간 (분 단위)
   */
  getMinutesUntilCheckInAvailable(currentTime: Date = new Date()): number {
    const availableTime = this.getCheckInAvailableTime();
    const diff = availableTime.getTime() - currentTime.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60)));
  }

  /**
   * 예약 시작 시간
   */
  get reservationStartTime(): Date {
    return new Date(this._reservationStartTime);
  }

  /**
   * 체크인 가능 시간 문자열 반환
   */
  getCheckInAvailableTimeString(): string {
    const availableTime = this.getCheckInAvailableTime();
    const hours = availableTime.getHours().toString().padStart(2, '0');
    const minutes = availableTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 체크인 가능 상태 메시지 반환
   */
  getCheckInStatusMessage(currentTime: Date = new Date()): string {
    if (this.canCheckIn(currentTime)) {
      return '체크인 가능';
    }
    
    const minutesRemaining = this.getMinutesUntilCheckInAvailable(currentTime);
    if (minutesRemaining < 60) {
      return `${minutesRemaining}분 후 체크인 가능`;
    }
    
    const hoursRemaining = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    if (mins === 0) {
      return `${hoursRemaining}시간 후 체크인 가능`;
    }
    return `${hoursRemaining}시간 ${mins}분 후 체크인 가능`;
  }
}