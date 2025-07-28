/**
 * KST 시간을 표현하는 값 객체
 * 0-5시를 24-29시로 표시하는 특별한 규칙 적용
 */
export class KSTDateTime {
  private constructor(private readonly _date: Date) {}

  static create(date: Date): KSTDateTime {
    return new KSTDateTime(new Date(date))
  }

  static fromDate(date: Date): KSTDateTime {
    return new KSTDateTime(new Date(date))
  }

  static fromString(dateString: string): KSTDateTime {
    if (!dateString) {
      throw new Error('날짜 문자열이 필요합니다')
    }
    
    const parts = dateString.split(/[- T:]/)
    if (parts.length < 3) {
      throw new Error('유효하지 않은 날짜 형식입니다')
    }
    
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const day = parseInt(parts[2])
    const hours = parts.length > 3 ? parseInt(parts[3]) : 0
    const minutes = parts.length > 4 ? parseInt(parts[4]) : 0
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error('유효하지 않은 날짜 값입니다')
    }
    
    return new KSTDateTime(new Date(year, month, day, hours, minutes))
  }

  static now(): KSTDateTime {
    // 테스트 환경에서 모킹된 날짜 사용
    if (process.env.MOCK_DATE) {
      return new KSTDateTime(new Date(process.env.MOCK_DATE))
    }
    return new KSTDateTime(new Date())
  }

  static fromDateAndHour(date: KSTDateTime, hour: number): KSTDateTime {
    const [year, month, day] = date.dateString.split('-').map(Number)
    
    // month와 day가 undefined인 경우 처리
    if (!month || !day) {
      throw new Error('유효하지 않은 날짜 형식입니다')
    }
    
    const adjustedHour = hour >= 24 ? hour - 24 : hour
    const adjustedDay = hour >= 24 ? day + 1 : day
    return new KSTDateTime(new Date(year, month - 1, adjustedDay, adjustedHour, 0))
  }

  get date(): Date {
    return new Date(this._date)
  }

  get displayHour(): number {
    const hours = this._date.getHours()
    // 0-5시는 24-29시로 표시
    return hours < 6 ? hours + 24 : hours
  }

  get displayTime(): string {
    const displayHour = this.displayHour
    const minutes = this._date.getMinutes().toString().padStart(2, '0')
    return `${displayHour}:${minutes}`
  }

  get dateString(): string {
    const year = this._date.getFullYear()
    const month = (this._date.getMonth() + 1).toString().padStart(2, '0')
    const day = this._date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  addHours(hours: number): KSTDateTime {
    const newDate = new Date(this._date)
    newDate.setHours(newDate.getHours() + hours)
    return new KSTDateTime(newDate)
  }

  addDays(days: number): KSTDateTime {
    const newDate = new Date(this._date)
    newDate.setDate(newDate.getDate() + days)
    return new KSTDateTime(newDate)
  }

  isAfter(other: KSTDateTime): boolean {
    return this._date.getTime() > other._date.getTime()
  }

  isBefore(other: KSTDateTime): boolean {
    return this._date.getTime() < other._date.getTime()
  }

  isSameDay(other: KSTDateTime): boolean {
    return this.dateString === other.dateString
  }

  differenceInHours(other: KSTDateTime): number {
    const diff = this._date.getTime() - other._date.getTime()
    return Math.abs(diff) / (1000 * 60 * 60)
  }

  differenceInMinutes(other: KSTDateTime): number {
    const diff = this._date.getTime() - other._date.getTime()
    return Math.abs(diff) / (1000 * 60)
  }

  addMinutes(minutes: number): KSTDateTime {
    const newDate = new Date(this._date.getTime() + minutes * 60 * 1000)
    return new KSTDateTime(newDate)
  }

  equals(other: KSTDateTime): boolean {
    return this._date.getTime() === other._date.getTime()
  }

  toDate(): Date {
    return this.date
  }

  toISOString(): string {
    return this._date.toISOString()
  }

  startOfDay(): KSTDateTime {
    const newDate = new Date(this._date)
    newDate.setHours(0, 0, 0, 0)
    return new KSTDateTime(newDate)
  }

  endOfDay(): KSTDateTime {
    const newDate = new Date(this._date)
    newDate.setHours(23, 59, 59, 999)
    return new KSTDateTime(newDate)
  }

  startOfWeek(): KSTDateTime {
    const newDate = new Date(this._date)
    const dayOfWeek = newDate.getDay() // 0=일요일, 1=월요일, ...
    const daysSinceMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) // 월요일을 주의 시작으로
    newDate.setDate(newDate.getDate() - daysSinceMonday)
    newDate.setHours(0, 0, 0, 0)
    return new KSTDateTime(newDate)
  }

  endOfWeek(): KSTDateTime {
    const startOfWeek = this.startOfWeek()
    const newDate = new Date(startOfWeek.date)
    newDate.setDate(newDate.getDate() + 6)
    newDate.setHours(23, 59, 59, 999)
    return new KSTDateTime(newDate)
  }

  differenceInDays(other: KSTDateTime): number {
    const diff = this._date.getTime() - other._date.getTime()
    return Math.abs(diff) / (1000 * 60 * 60 * 24)
  }
}