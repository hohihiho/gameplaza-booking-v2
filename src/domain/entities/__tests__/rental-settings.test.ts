import { RentalSettings } from '../rental-settings'
import { RentalTimeSlot } from '../../value-objects/rental-time-slot'
import { RentalPricing } from '../../value-objects/rental-pricing'
import { RentalAvailability } from '../../value-objects/rental-availability'

describe('RentalSettings', () => {
  let defaultTimeSlot: RentalTimeSlot
  let overnightTimeSlot: RentalTimeSlot
  let defaultPricing: RentalPricing
  let overnightPricing: RentalPricing
  let defaultAvailability: RentalAvailability

  beforeEach(() => {
    // 평일 시간대 (매일 10-22시)
    defaultTimeSlot = RentalTimeSlot.create({
      dayOfWeek: -1,
      startHour: 10,
      endHour: 22,
      type: 'regular',
      name: '일반 영업시간'
    })

    // 밤샘 시간대 (22-29시)
    overnightTimeSlot = RentalTimeSlot.create({
      dayOfWeek: -1,
      startHour: 22,
      endHour: 29,
      type: 'overnight',
      name: '밤샘 시간대'
    })

    // 평일 가격 (시간당 5000원)
    defaultPricing = RentalPricing.create({
      name: '평일 가격',
      type: 'hourly',
      basePrice: 5000,
      priority: 1
    })

    // 밤샘 가격 (정액 25000원)
    overnightPricing = RentalPricing.create({
      name: '밤샘 가격',
      type: 'flat',
      basePrice: 25000,
      startHour: 22,
      endHour: 29,
      priority: 2
    })

    // 기본 가용성 (총 4대)
    defaultAvailability = RentalAvailability.create({
      totalUnits: 4,
      minUnitsAvailable: 1,
      maxUnitsPerReservation: 2
    })
  })

  describe('생성', () => {
    it('유효한 설정으로 대여 설정을 생성할 수 있다', () => {
      const settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })

      expect(settings.id).toBe('rental-1')
      expect(settings.deviceTypeId).toBe('type-maimai')
      expect(settings.timeSlots).toHaveLength(1)
      expect(settings.pricing).toHaveLength(1)
      expect(settings.availability).toEqual(defaultAvailability)
      expect(settings.isActive).toBe(true)
    })

    it('시간대가 없으면 에러가 발생한다', () => {
      expect(() => RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })).toThrow('최소 하나의 시간대가 필요합니다')
    })

    it('가격 설정이 없으면 에러가 발생한다', () => {
      expect(() => RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [],
        availability: defaultAvailability,
        isActive: true
      })).toThrow('최소 하나의 가격 설정이 필요합니다')
    })

    it('중복된 시간대가 있으면 에러가 발생한다', () => {
      const duplicateSlot = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 10,
        endHour: 22,
        type: 'regular',
        name: '중복 시간대'
      })

      expect(() => RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot, duplicateSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })).toThrow('중복된 시간대가 있습니다')
    })
  })

  describe('대여 가능 여부 확인', () => {
    let settings: RentalSettings

    beforeEach(() => {
      settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot, overnightTimeSlot],
        pricing: [defaultPricing, overnightPricing],
        availability: defaultAvailability,
        isActive: true
      })
    })

    it('활성화된 시간대에 대여 가능하다', () => {
      expect(settings.isAvailableAt(1, 15)).toBe(true) // 월요일 15시
      expect(settings.isAvailableAt(3, 20)).toBe(true) // 수요일 20시
    })

    it('비활성화된 설정은 대여 불가능하다', () => {
      const inactiveSettings = settings.toggleActive()
      expect(inactiveSettings.isAvailableAt(1, 15)).toBe(false)
    })

    it('설정된 시간대 외에는 대여 불가능하다', () => {
      expect(settings.isAvailableAt(1, 8)).toBe(false)  // 오전 8시
      expect(settings.isAvailableAt(1, 9)).toBe(false)  // 오전 9시
    })
  })

  describe('가격 계산', () => {
    let settings: RentalSettings

    beforeEach(() => {
      settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot, overnightTimeSlot],
        pricing: [defaultPricing, overnightPricing],
        availability: defaultAvailability,
        isActive: true
      })
    })

    it('일반 시간대 가격을 계산할 수 있다', () => {
      const price = settings.calculatePrice(1, 14, 18) // 14시-18시 (4시간)
      expect(price).toBe(20000) // 5000원 × 4시간
    })

    it('밤샘 시간대 가격을 계산할 수 있다', () => {
      const price = settings.calculatePrice(1, 22, 26) // 22시-26시
      expect(price).toBe(25000) // 정액 25000원
    })

    it('이용 가능하지 않은 시간대는 가격 설정이 없으면 에러가 발생한다', () => {
      const morningSettings = RentalSettings.create({
        id: 'rental-2',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })

      expect(() => morningSettings.calculatePrice(1, 6, 8))
        .toThrow('해당 시간대에 적용 가능한 가격 설정을 찾을 수 없습니다')
    })
  })

  describe('시간대 관리', () => {
    let settings: RentalSettings

    beforeEach(() => {
      settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })
    })

    it('시간대를 추가할 수 있다', () => {
      const updated = settings.addTimeSlot(overnightTimeSlot)
      expect(updated.timeSlots).toHaveLength(2)
      expect(updated.hasOvernightSlot()).toBe(true)
    })

    it('겹치는 시간대는 추가할 수 없다', () => {
      const overlappingSlot = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 20,
        endHour: 24,
        type: 'regular'
      })

      expect(() => settings.addTimeSlot(overlappingSlot))
        .toThrow('겹치는 시간대가 있습니다')
    })

    it('시간대를 제거할 수 있다', () => {
      const withOvernight = settings.addTimeSlot(overnightTimeSlot)
      const removed = withOvernight.removeTimeSlot(overnightTimeSlot.id)
      
      expect(removed.timeSlots).toHaveLength(1)
      expect(removed.hasOvernightSlot()).toBe(false)
    })

    it('마지막 시간대는 제거할 수 없다', () => {
      expect(() => settings.removeTimeSlot(defaultTimeSlot.id))
        .toThrow('최소 하나의 시간대가 필요합니다')
    })
  })

  describe('가격 설정 관리', () => {
    let settings: RentalSettings

    beforeEach(() => {
      settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })
    })

    it('가격 설정을 추가할 수 있다', () => {
      const updated = settings.addPricing(overnightPricing)
      expect(updated.pricing).toHaveLength(2)
    })

    it('가격 설정을 제거할 수 있다', () => {
      const withOvernight = settings.addPricing(overnightPricing)
      const removed = withOvernight.removePricing(overnightPricing.id)
      
      expect(removed.pricing).toHaveLength(1)
    })

    it('마지막 가격 설정은 제거할 수 없다', () => {
      expect(() => settings.removePricing(defaultPricing.id))
        .toThrow('최소 하나의 가격 설정이 필요합니다')
    })
  })

  describe('가용성 관리', () => {
    it('가용성 설정을 변경할 수 있다', () => {
      const settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })

      const newAvailability = RentalAvailability.create({
        totalUnits: 6,
        minUnitsAvailable: 2,
        maxUnitsPerReservation: 3
      })

      const updated = settings.updateAvailability(newAvailability)
      expect(updated.availability.totalUnits).toBe(6)
      expect(updated.availability.minUnitsAvailable).toBe(2)
    })
  })

  describe('특수 시간대 확인', () => {
    it('밤샘 시간대 여부를 확인할 수 있다', () => {
      const regularSettings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })

      const overnightSettings = RentalSettings.create({
        id: 'rental-2',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot, overnightTimeSlot],
        pricing: [defaultPricing, overnightPricing],
        availability: defaultAvailability,
        isActive: true
      })

      expect(regularSettings.hasOvernightSlot()).toBe(false)
      expect(overnightSettings.hasOvernightSlot()).toBe(true)
    })

    it('점검 시간대 여부를 확인할 수 있다', () => {
      const maintenanceSlot = RentalTimeSlot.create({
        dayOfWeek: -1,
        startHour: 6,
        endHour: 10,
        type: 'maintenance',
        name: '점검 시간'
      })

      const settings = RentalSettings.create({
        id: 'rental-1',
        deviceTypeId: 'type-maimai',
        timeSlots: [defaultTimeSlot, maintenanceSlot],
        pricing: [defaultPricing],
        availability: defaultAvailability,
        isActive: true
      })

      expect(settings.hasMaintenanceSlot()).toBe(true)
    })
  })
})