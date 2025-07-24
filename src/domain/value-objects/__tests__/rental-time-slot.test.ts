import { RentalTimeSlot } from '../rental-time-slot'

describe('RentalTimeSlot', () => {
  describe('생성', () => {
    it('유효한 시간대를 생성할 수 있다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular',
        name: '평일 영업시간'
      })

      expect(slot.dayOfWeek).toBe(1)
      expect(slot.startHour).toBe(10)
      expect(slot.endHour).toBe(22)
      expect(slot.type).toBe('regular')
      expect(slot.name).toBe('평일 영업시간')
      expect(slot.isActive).toBe(true)
    })

    it('자정을 넘는 시간대를 생성할 수 있다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 5,
        startHour: 22,
        endHour: 26,
        type: 'overnight',
        name: '금요일 밤샘'
      })

      expect(slot.startHour).toBe(22)
      expect(slot.endHour).toBe(26)
      expect(slot.duration).toBe(4)
    })

    it('매일 적용되는 시간대를 생성할 수 있다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot.dayOfWeek).toBe(-1)
      expect(slot.getDayName()).toBe('매일')
    })

    it('잘못된 요일은 에러가 발생한다', () => {
      expect(() => RentalTimeSlot.create({
        dayOfWeek: 7,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })).toThrow('요일은 -1(매일) 또는 0-6(일-토) 사이여야 합니다')
    })

    it('잘못된 시작 시간은 에러가 발생한다', () => {
      expect(() => RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: -1,
        endHour: 22,
        type: 'regular'
      })).toThrow('시작 시간은 0-29 사이여야 합니다')
    })

    it('같은 날 내에서 종료 시간이 시작 시간보다 이전이면 에러가 발생한다', () => {
      expect(() => RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 15,
        endHour: 10,
        type: 'regular'
      })).toThrow('종료 시간은 시작 시간보다 늦어야 합니다')
    })
  })

  describe('시간 포함 여부', () => {
    it('시간대 내의 시간은 포함된다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot.containsHour(10)).toBe(true)
      expect(slot.containsHour(15)).toBe(true)
      expect(slot.containsHour(21)).toBe(true)
    })

    it('시간대 외의 시간은 포함되지 않는다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot.containsHour(9)).toBe(false)
      expect(slot.containsHour(22)).toBe(false)
      expect(slot.containsHour(23)).toBe(false)
    })

    it('자정을 넘는 시간대는 올바르게 처리된다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 22,
        endHour: 26,
        type: 'overnight'
      })

      expect(slot.containsHour(22)).toBe(true)
      expect(slot.containsHour(23)).toBe(true)
      expect(slot.containsHour(24)).toBe(true)
      expect(slot.containsHour(25)).toBe(true)
      expect(slot.containsHour(26)).toBe(false)
      expect(slot.containsHour(21)).toBe(false)
    })

    it('비활성화된 시간대는 어떤 시간도 포함하지 않는다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular',
        isActive: false
      })

      expect(slot.containsHour(15)).toBe(false)
    })
  })

  describe('가용성 확인', () => {
    it('정규 시간대는 대여 가능하다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot.isAvailableAt(1, 15)).toBe(true)
    })

    it('점검 시간대는 대여 불가능하다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 6,
        endHour: 10,
        type: 'maintenance'
      })

      expect(slot.isAvailableAt(1, 8)).toBe(false)
    })

    it('다른 요일은 대여 불가능하다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot.isAvailableAt(2, 15)).toBe(false)
    })

    it('매일 적용되는 시간대는 모든 요일에 가능하다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot.isAvailableAt(0, 15)).toBe(true)
      expect(slot.isAvailableAt(3, 15)).toBe(true)
      expect(slot.isAvailableAt(6, 15)).toBe(true)
    })
  })

  describe('시간대 겹침 확인', () => {
    it('같은 요일의 겹치는 시간대를 감지한다', () => {
      const slot1 = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 18,
        type: 'regular'
      })

      const slot2 = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 16,
        endHour: 22,
        type: 'regular'
      })

      expect(slot1.overlapsWith(slot2)).toBe(true)
    })

    it('다른 요일의 시간대는 겹치지 않는다', () => {
      const slot1 = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      const slot2 = RentalTimeSlot.create({
        dayOfWeek: 2,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(slot1.overlapsWith(slot2)).toBe(false)
    })

    it('연속된 시간대는 겹치지 않는다', () => {
      const slot1 = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 18,
        type: 'regular'
      })

      const slot2 = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 18,
        endHour: 22,
        type: 'regular'
      })

      expect(slot1.overlapsWith(slot2)).toBe(false)
    })
  })

  describe('표시 정보', () => {
    it('요일 이름을 올바르게 표시한다', () => {
      const monday = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      const everyday = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      expect(monday.getDayName()).toBe('월요일')
      expect(everyday.getDayName()).toBe('매일')
    })

    it('시간 범위를 올바르게 표시한다', () => {
      const slot = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 22,
        endHour: 26,
        type: 'overnight'
      })

      expect(slot.getTimeRange()).toBe('22시-26시')
    })

    it('전체 표시명을 올바르게 생성한다', () => {
      const slot1 = RentalTimeSlot.create({
        dayOfWeek: 1,
        startHour: 10,
        endHour: 22,
        type: 'regular'
      })

      const slot2 = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 22,
        endHour: 26,
        type: 'overnight',
        name: '밤샘 타임'
      })

      expect(slot1.getDisplayName()).toBe('월요일 10시-22시')
      expect(slot2.getDisplayName()).toBe('밤샘 타임')
    })
  })
})