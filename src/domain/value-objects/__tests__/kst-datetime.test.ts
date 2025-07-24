import { KSTDateTime } from '../kst-datetime'

describe('KSTDateTime', () => {
  describe('create', () => {
    it('should create KSTDateTime from Date', () => {
      const date = new Date(2025, 6, 23, 14, 30)
      const kstDateTime = KSTDateTime.create(date)
      
      expect(kstDateTime.date.getTime()).toBe(date.getTime())
    })

    it('should create independent copy of date', () => {
      const date = new Date(2025, 6, 23, 14, 30)
      const kstDateTime = KSTDateTime.create(date)
      
      date.setHours(15)
      expect(kstDateTime.date.getHours()).toBe(14)
    })
  })

  describe('displayHour', () => {
    it('should display 0-5 hours as 24-29', () => {
      expect(KSTDateTime.create(new Date(2025, 6, 23, 0, 0)).displayHour).toBe(24)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 1, 0)).displayHour).toBe(25)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 2, 0)).displayHour).toBe(26)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 3, 0)).displayHour).toBe(27)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 4, 0)).displayHour).toBe(28)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 5, 0)).displayHour).toBe(29)
    })

    it('should display 6-23 hours normally', () => {
      expect(KSTDateTime.create(new Date(2025, 6, 23, 6, 0)).displayHour).toBe(6)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 12, 0)).displayHour).toBe(12)
      expect(KSTDateTime.create(new Date(2025, 6, 23, 23, 0)).displayHour).toBe(23)
    })
  })

  describe('displayTime', () => {
    it('should format time with 24-29 hours', () => {
      expect(KSTDateTime.create(new Date(2025, 6, 23, 0, 30)).displayTime).toBe('24:30')
      expect(KSTDateTime.create(new Date(2025, 6, 23, 2, 15)).displayTime).toBe('26:15')
      expect(KSTDateTime.create(new Date(2025, 6, 23, 5, 45)).displayTime).toBe('29:45')
    })

    it('should format time with normal hours', () => {
      expect(KSTDateTime.create(new Date(2025, 6, 23, 14, 30)).displayTime).toBe('14:30')
      expect(KSTDateTime.create(new Date(2025, 6, 23, 9, 5)).displayTime).toBe('9:05')
    })
  })

  describe('fromString', () => {
    it('should parse date string', () => {
      const kstDateTime = KSTDateTime.fromString('2025-07-23')
      expect(kstDateTime.dateString).toBe('2025-07-23')
      expect(kstDateTime.date.getHours()).toBe(0)
    })

    it('should parse datetime string', () => {
      const kstDateTime = KSTDateTime.fromString('2025-07-23 14:30')
      expect(kstDateTime.dateString).toBe('2025-07-23')
      expect(kstDateTime.date.getHours()).toBe(14)
      expect(kstDateTime.date.getMinutes()).toBe(30)
    })
  })

  describe('date operations', () => {
    it('should add hours correctly', () => {
      const kstDateTime = KSTDateTime.create(new Date(2025, 6, 23, 22, 0))
      const added = kstDateTime.addHours(5)
      
      expect(added.date.getDate()).toBe(24)
      expect(added.date.getHours()).toBe(3)
      expect(added.displayHour).toBe(27)
    })

    it('should add days correctly', () => {
      const kstDateTime = KSTDateTime.create(new Date(2025, 6, 23, 14, 0))
      const added = kstDateTime.addDays(2)
      
      expect(added.date.getDate()).toBe(25)
      expect(added.date.getHours()).toBe(14)
    })
  })

  describe('comparisons', () => {
    const earlier = KSTDateTime.create(new Date(2025, 6, 23, 14, 0))
    const later = KSTDateTime.create(new Date(2025, 6, 23, 16, 0))
    const same = KSTDateTime.create(new Date(2025, 6, 23, 14, 0))

    it('should compare times correctly', () => {
      expect(earlier.isBefore(later)).toBe(true)
      expect(later.isAfter(earlier)).toBe(true)
      expect(earlier.equals(same)).toBe(true)
    })

    it('should check same day correctly', () => {
      const nextDay = KSTDateTime.create(new Date(2025, 6, 24, 2, 0))
      expect(earlier.isSameDay(later)).toBe(true)
      expect(earlier.isSameDay(nextDay)).toBe(false)
    })

    it('should calculate hour difference', () => {
      expect(earlier.differenceInHours(later)).toBe(2)
      expect(later.differenceInHours(earlier)).toBe(2)
    })
  })
})