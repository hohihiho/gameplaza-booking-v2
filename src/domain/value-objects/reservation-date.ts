/**
 * 예약 날짜를 나타내는 Value Object
 * KST 기준으로 날짜를 처리합니다
 */
export class ReservationDate {
  private readonly _value: Date;

  constructor(value: Date | string) {
    if (typeof value === 'string') {
      // YYYY-MM-DD 형식의 문자열을 KST 기준으로 파싱
      const [year, month, day] = value.split('-').map(Number);
      
      // month와 day가 undefined인 경우 처리
      if (!month || !day) {
        throw new Error('유효하지 않은 날짜 형식입니다');
      }
      
      this._value = new Date(year, month - 1, day);
    } else {
      this._value = new Date(value);
    }

    // 유효성 검증
    if (isNaN(this._value.getTime())) {
      throw new Error('유효하지 않은 날짜입니다');
    }
  }

  /**
   * 오늘 날짜로 ReservationDate 생성
   */
  static today(): ReservationDate {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new ReservationDate(today);
  }

  /**
   * 내일 날짜로 ReservationDate 생성
   */
  static tomorrow(): ReservationDate {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return new ReservationDate(tomorrow);
  }

  /**
   * Date 객체 반환
   */
  get value(): Date {
    return new Date(this._value);
  }

  /**
   * YYYY-MM-DD 형식의 문자열로 변환
   */
  toString(): string {
    const year = this._value.getFullYear();
    const month = String(this._value.getMonth() + 1).padStart(2, '0');
    const day = String(this._value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 날짜 포맷팅 (한국어)
   */
  toKoreanFormat(): string {
    const year = this._value.getFullYear();
    const month = this._value.getMonth() + 1;
    const day = this._value.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][this._value.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  }

  /**
   * 동등성 비교
   */
  equals(other: ReservationDate): boolean {
    return this.toString() === other.toString();
  }

  /**
   * 날짜가 이전인지 확인
   */
  isBefore(other: ReservationDate): boolean {
    return this._value < other._value;
  }

  /**
   * 날짜가 이후인지 확인
   */
  isAfter(other: ReservationDate): boolean {
    return this._value > other._value;
  }

  /**
   * 오늘 날짜인지 확인
   */
  isToday(): boolean {
    return this.equals(ReservationDate.today());
  }

  /**
   * 과거 날짜인지 확인
   */
  isPast(): boolean {
    return this.isBefore(ReservationDate.today());
  }

  /**
   * 미래 날짜인지 확인
   */
  isFuture(): boolean {
    return this.isAfter(ReservationDate.today());
  }

  /**
   * 주말인지 확인
   */
  isWeekend(): boolean {
    const day = this._value.getDay();
    return day === 0 || day === 6; // 일요일 또는 토요일
  }

  /**
   * 평일인지 확인
   */
  isWeekday(): boolean {
    return !this.isWeekend();
  }

  /**
   * 날짜 더하기
   */
  addDays(days: number): ReservationDate {
    const newDate = new Date(this._value);
    newDate.setDate(newDate.getDate() + days);
    return new ReservationDate(newDate);
  }

  /**
   * 날짜 빼기
   */
  subtractDays(days: number): ReservationDate {
    return this.addDays(-days);
  }

  /**
   * 두 날짜 사이의 일수 차이 계산
   */
  daysDifference(other: ReservationDate): number {
    const oneDay = 24 * 60 * 60 * 1000; // 밀리초 단위
    return Math.floor((this._value.getTime() - other._value.getTime()) / oneDay);
  }
}