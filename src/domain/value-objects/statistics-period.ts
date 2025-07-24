import { KSTDateTime } from './kst-datetime'

/**
 * 통계 기간을 나타내는 값 객체
 */
export class StatisticsPeriod {
  constructor(
    public readonly startDate: KSTDateTime,
    public readonly endDate: KSTDateTime
  ) {
    this.validate()
  }

  private validate(): void {
    if (this.startDate.isAfter(this.endDate)) {
      throw new Error('시작일은 종료일보다 이전이어야 합니다')
    }
  }

  /**
   * 일별 통계 기간 생성
   */
  static forDay(date: KSTDateTime): StatisticsPeriod {
    const startOfDay = date.startOfDay()
    const endOfDay = date.endOfDay()
    return new StatisticsPeriod(startOfDay, endOfDay)
  }

  /**
   * 주별 통계 기간 생성
   */
  static forWeek(date: KSTDateTime): StatisticsPeriod {
    const startOfWeek = date.startOfWeek()
    const endOfWeek = date.endOfWeek()
    return new StatisticsPeriod(startOfWeek, endOfWeek)
  }

  /**
   * 월별 통계 기간 생성
   */
  static forMonth(year: number, month: number): StatisticsPeriod {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    const startOfMonth = KSTDateTime.fromDate(firstDay).startOfDay()
    const endOfMonth = KSTDateTime.fromDate(lastDay).endOfDay()
    
    return new StatisticsPeriod(startOfMonth, endOfMonth)
  }

  /**
   * 기간 내 일수 계산
   */
  getDaysCount(): number {
    return this.endDate.differenceInDays(this.startDate) + 1
  }

  /**
   * 기간이 특정 날짜를 포함하는지 확인
   */
  contains(date: KSTDateTime): boolean {
    return !date.isBefore(this.startDate) && !date.isAfter(this.endDate)
  }

  /**
   * 두 기간이 겹치는지 확인
   */
  overlaps(other: StatisticsPeriod): boolean {
    return !this.endDate.isBefore(other.startDate) && 
           !this.startDate.isAfter(other.endDate)
  }
}