import { formatTime24Plus, parseTime24Plus, isValidTimeRange, calculateDuration } from '../time'

describe('시간 처리 유틸리티', () => {
  describe('formatTime24Plus', () => {
    it('0시~5시를 24시~29시로 변환한다', () => {
      expect(formatTime24Plus('00:00')).toBe('24:00')
      expect(formatTime24Plus('01:00')).toBe('25:00')
      expect(formatTime24Plus('02:00')).toBe('26:00')
      expect(formatTime24Plus('03:00')).toBe('27:00')
      expect(formatTime24Plus('04:00')).toBe('28:00')
      expect(formatTime24Plus('05:00')).toBe('29:00')
    })

    it('6시~23시는 그대로 유지한다', () => {
      expect(formatTime24Plus('06:00')).toBe('06:00')
      expect(formatTime24Plus('12:00')).toBe('12:00')
      expect(formatTime24Plus('18:00')).toBe('18:00')
      expect(formatTime24Plus('23:00')).toBe('23:00')
    })

    it('분 단위도 정확히 처리한다', () => {
      expect(formatTime24Plus('00:30')).toBe('24:30')
      expect(formatTime24Plus('05:45')).toBe('29:45')
    })

    it('잘못된 형식의 시간은 그대로 반환한다', () => {
      expect(formatTime24Plus('invalid')).toBe('invalid')
      expect(formatTime24Plus('')).toBe('')
      expect(formatTime24Plus(null as any)).toBe(null)
    })
  })

  describe('parseTime24Plus', () => {
    it('24시~29시를 0시~5시로 변환한다', () => {
      expect(parseTime24Plus('24:00')).toBe('00:00')
      expect(parseTime24Plus('25:00')).toBe('01:00')
      expect(parseTime24Plus('26:00')).toBe('02:00')
      expect(parseTime24Plus('27:00')).toBe('03:00')
      expect(parseTime24Plus('28:00')).toBe('04:00')
      expect(parseTime24Plus('29:00')).toBe('05:00')
    })

    it('0시~23시는 그대로 유지한다', () => {
      expect(parseTime24Plus('00:00')).toBe('00:00')
      expect(parseTime24Plus('06:00')).toBe('06:00')
      expect(parseTime24Plus('12:00')).toBe('12:00')
      expect(parseTime24Plus('23:00')).toBe('23:00')
    })
  })

  describe('isValidTimeRange', () => {
    it('정상적인 시간 범위는 유효하다', () => {
      expect(isValidTimeRange('10:00', '12:00')).toBe(true)
      expect(isValidTimeRange('18:00', '23:00')).toBe(true)
    })

    it('밤샘 시간대도 유효하다', () => {
      expect(isValidTimeRange('22:00', '26:00')).toBe(true) // 22시~새벽2시
      expect(isValidTimeRange('23:00', '29:00')).toBe(true) // 23시~새벽5시
    })

    it('시작 시간이 종료 시간보다 늦으면 무효하다', () => {
      expect(isValidTimeRange('14:00', '12:00')).toBe(false)
      expect(isValidTimeRange('29:00', '28:00')).toBe(false)
    })

    it('24시간을 초과하면 무효하다', () => {
      expect(isValidTimeRange('10:00', '35:00')).toBe(false) // 25시간
    })

    it('잘못된 형식은 무효하다', () => {
      expect(isValidTimeRange('invalid', '12:00')).toBe(false)
      expect(isValidTimeRange('10:00', 'invalid')).toBe(false)
      expect(isValidTimeRange('', '')).toBe(false)
    })
  })

  describe('calculateDuration', () => {
    it('일반 시간대의 duration을 계산한다', () => {
      expect(calculateDuration('10:00', '12:00')).toBe(2)
      expect(calculateDuration('09:00', '17:30')).toBe(8.5)
    })

    it('밤샘 시간대의 duration을 계산한다', () => {
      expect(calculateDuration('22:00', '26:00')).toBe(4) // 22시~새벽2시
      expect(calculateDuration('23:00', '29:00')).toBe(6) // 23시~새벽5시
    })

    it('분 단위도 정확히 계산한다', () => {
      expect(calculateDuration('10:15', '11:45')).toBe(1.5)
      expect(calculateDuration('23:30', '25:00')).toBe(1.5)
    })

    it('잘못된 입력은 0을 반환한다', () => {
      expect(calculateDuration('invalid', '12:00')).toBe(0)
      expect(calculateDuration('10:00', 'invalid')).toBe(0)
      expect(calculateDuration('14:00', '12:00')).toBe(0) // 역방향
    })
  })
})