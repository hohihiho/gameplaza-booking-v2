import { TimeSlot } from '../time-slot'

describe('TimeSlot', () => {
  describe('create', () => {
    it('should create valid 2-hour time slot', () => {
      const slot = TimeSlot.create(10, 12)
      expect(slot.startHour).toBe(10)
      expect(slot.endHour).toBe(12)
    })

    it('should create late night slot with 24+ hours', () => {
      const slot = TimeSlot.create(24, 26)
      expect(slot.startHour).toBe(24)
      expect(slot.endHour).toBe(26)
      expect(slot.displayString).toBe('24:00-26:00')
    })

    it('should throw error for invalid start hour', () => {
      expect(() => TimeSlot.create(-1, 2)).toThrow('시작 시간은 0-29 사이여야 합니다')
      expect(() => TimeSlot.create(30, 32)).toThrow('시작 시간은 0-29 사이여야 합니다')
    })

    it('should throw error for invalid end hour', () => {
      expect(() => TimeSlot.create(10, 30)).toThrow('종료 시간은 0-29 사이여야 합니다')
    })

    it('should throw error if not 2-hour slot', () => {
      expect(() => TimeSlot.create(10, 11)).toThrow('시간 슬롯은 2시간 단위여야 합니다')
      expect(() => TimeSlot.create(10, 13)).toThrow('시간 슬롯은 2시간 단위여야 합니다')
    })

    it('should throw error if start >= end', () => {
      expect(() => TimeSlot.create(12, 10)).toThrow('종료 시간은 시작 시간보다 커야 합니다')
      expect(() => TimeSlot.create(10, 10)).toThrow('종료 시간은 시작 시간보다 커야 합니다')
    })
  })

  describe('fromString', () => {
    it('should parse time slot string', () => {
      const slot = TimeSlot.fromString('14:00-16:00')
      expect(slot.startHour).toBe(14)
      expect(slot.endHour).toBe(16)
    })

    it('should parse late night slot', () => {
      const slot = TimeSlot.fromString('26:00-28:00')
      expect(slot.startHour).toBe(26)
      expect(slot.endHour).toBe(28)
    })
  })

  describe('normalized hours', () => {
    it('should normalize 24+ hours to 0-5', () => {
      const slot = TimeSlot.create(26, 28)
      expect(slot.normalizedStartHour).toBe(2)
      expect(slot.normalizedEndHour).toBe(4)
    })

    it('should keep normal hours as is', () => {
      const slot = TimeSlot.create(14, 16)
      expect(slot.normalizedStartHour).toBe(14)
      expect(slot.normalizedEndHour).toBe(16)
    })
  })

  describe('overlaps', () => {
    it('should detect overlapping slots', () => {
      const slot1 = TimeSlot.create(10, 12)
      const slot2 = TimeSlot.create(11, 13)
      const slot3 = TimeSlot.create(12, 14)
      const slot4 = TimeSlot.create(14, 16)

      expect(slot1.overlaps(slot2)).toBe(true)
      expect(slot1.overlaps(slot3)).toBe(false)
      expect(slot1.overlaps(slot4)).toBe(false)
    })

    it('should detect overlaps across midnight', () => {
      const slot1 = TimeSlot.create(22, 24)
      const slot2 = TimeSlot.create(23, 25)
      const slot3 = TimeSlot.create(24, 26)

      expect(slot1.overlaps(slot2)).toBe(true)
      expect(slot1.overlaps(slot3)).toBe(false)
    })
  })

  describe('getAllSlots', () => {
    it('should generate all possible slots', () => {
      const slots = TimeSlot.getAllSlots()
      
      expect(slots).toHaveLength(9)
      expect(slots[0].displayString).toBe('10:00-12:00')
      expect(slots[slots.length - 1].displayString).toBe('26:00-28:00')
    })

    it('should not include overnight gaps', () => {
      const slots = TimeSlot.getAllSlots()
      
      for (let i = 0; i < slots.length - 1; i++) {
        const current = slots[i]
        const next = slots[i + 1]
        expect(current.endHour).toBe(next.startHour)
      }
    })
  })
})