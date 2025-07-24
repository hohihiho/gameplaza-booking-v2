import { RentalAvailability } from '../rental-availability'

describe('RentalAvailability', () => {
  describe('생성', () => {
    it('유효한 가용성 설정을 생성할 수 있다', () => {
      const availability = RentalAvailability.create({
        totalUnits: 4,
        minUnitsAvailable: 1,
        maxUnitsPerReservation: 2,
        bufferUnits: 1
      })

      expect(availability.totalUnits).toBe(4)
      expect(availability.minUnitsAvailable).toBe(1)
      expect(availability.maxUnitsPerReservation).toBe(2)
      expect(availability.bufferUnits).toBe(1)
    })

    it('기본값으로 생성할 수 있다', () => {
      const availability = RentalAvailability.create({
        totalUnits: 4
      })

      expect(availability.totalUnits).toBe(4)
      expect(availability.minUnitsAvailable).toBe(1)
      expect(availability.maxUnitsPerReservation).toBe(4)
      expect(availability.bufferUnits).toBe(0)
    })

    it('총 유닛이 1개 미만이면 에러가 발생한다', () => {
      expect(() => RentalAvailability.create({
        totalUnits: 0
      })).toThrow('총 유닛은 1개 이상이어야 합니다')
    })

    it('최소 가용 유닛이 총 유닛보다 크면 에러가 발생한다', () => {
      expect(() => RentalAvailability.create({
        totalUnits: 4,
        minUnitsAvailable: 5
      })).toThrow('최소 가용 유닛은 총 유닛보다 클 수 없습니다')
    })

    it('최대 예약 유닛이 총 유닛보다 크면 에러가 발생한다', () => {
      expect(() => RentalAvailability.create({
        totalUnits: 4,
        maxUnitsPerReservation: 5
      })).toThrow('최대 예약 유닛은 총 유닛보다 클 수 없습니다')
    })

    it('버퍼가 총 유닛과 같거나 크면 에러가 발생한다', () => {
      expect(() => RentalAvailability.create({
        totalUnits: 4,
        bufferUnits: 4
      })).toThrow('버퍼는 총 유닛보다 작아야 합니다')
    })
  })

  describe('대여 가능 여부', () => {
    let availability: RentalAvailability

    beforeEach(() => {
      availability = RentalAvailability.create({
        totalUnits: 4,
        minUnitsAvailable: 1,
        maxUnitsPerReservation: 2,
        bufferUnits: 1
      })
    })

    it('가능한 범위 내에서 대여할 수 있다', () => {
      expect(availability.canRent(2, 0)).toBe(true)  // 2개 대여, 현재 0개 사용중
      expect(availability.canRent(1, 1)).toBe(true)  // 1개 대여, 현재 1개 사용중
    })

    it('최대 예약 유닛을 초과하면 대여할 수 없다', () => {
      expect(availability.canRent(3, 0)).toBe(false) // 최대 2개까지만 대여
    })

    it('버퍼를 고려해서 대여 가능한지 확인한다', () => {
      // 총 4개, 버퍼 1개 = 실제 대여 가능 3개
      expect(availability.canRent(3, 0)).toBe(false) // 최대 예약 2개 제한
      expect(availability.canRent(2, 1)).toBe(true)  // 1개 사용중, 2개 추가 = 3개 (OK)
      expect(availability.canRent(2, 2)).toBe(false) // 2개 사용중, 2개 추가 = 4개 (버퍼 침범)
    })

    it('최소 가용 유닛을 보장해야 한다', () => {
      // 총 4개, 버퍼 1개, 최소 보장 1개
      expect(availability.canRent(2, 0)).toBe(true)  // 2개 대여 후 2개 남음 (OK)
      expect(availability.canRent(3, 0)).toBe(false) // 3개 대여 후 1개 남음 (버퍼 침범)
      expect(availability.canRent(1, 2)).toBe(true)  // 3개 대여 후 1개 남음 (최소 보장)
      expect(availability.canRent(2, 2)).toBe(false) // 4개 대여 후 0개 남음 (최소 미달)
    })
  })

  describe('최대 대여 가능 유닛 계산', () => {
    it('정책을 고려한 최대 대여 가능 유닛을 계산한다', () => {
      const availability = RentalAvailability.create({
        totalUnits: 4,
        minUnitsAvailable: 1,
        maxUnitsPerReservation: 2,
        bufferUnits: 0
      })

      expect(availability.getMaxRentableUnits(0)).toBe(2) // 최대 예약 2개
      expect(availability.getMaxRentableUnits(1)).toBe(2) // 여전히 최대 2개
      expect(availability.getMaxRentableUnits(2)).toBe(1) // 최소 1개 보장 때문에
      expect(availability.getMaxRentableUnits(3)).toBe(0) // 더 이상 대여 불가
    })

    it('버퍼를 포함한 최대 대여 가능 유닛을 계산한다', () => {
      const availability = RentalAvailability.create({
        totalUnits: 6,
        minUnitsAvailable: 0,
        maxUnitsPerReservation: 3,
        bufferUnits: 2
      })

      expect(availability.getMaxRentableUnits(0)).toBe(3) // 최대 예약 3개
      expect(availability.getMaxRentableUnits(2)).toBe(2) // 4-2=2개 가능
      expect(availability.getMaxRentableUnits(4)).toBe(0) // 버퍼만 남음
    })
  })

  describe('정보 표시', () => {
    it('요약 정보를 표시한다', () => {
      const simple = RentalAvailability.create({
        totalUnits: 4
      })
      expect(simple.getSummary()).toBe('총 4대')

      const complex = RentalAvailability.create({
        totalUnits: 6,
        minUnitsAvailable: 2,
        maxUnitsPerReservation: 3,
        bufferUnits: 1
      })
      expect(complex.getSummary()).toBe('총 6대, 버퍼 1대, 최소 보장 2대, 최대 예약 3대')
    })

    it('실제 대여 가능한 최대 유닛을 표시한다', () => {
      const availability = RentalAvailability.create({
        totalUnits: 4,
        bufferUnits: 1
      })

      expect(availability.maxRentableUnits).toBe(3)
    })
  })

  describe('동등성 비교', () => {
    it('같은 설정이면 동등하다고 판단한다', () => {
      const a1 = RentalAvailability.create({
        totalUnits: 4,
        minUnitsAvailable: 1,
        maxUnitsPerReservation: 2,
        bufferUnits: 1
      })

      const a2 = RentalAvailability.create({
        totalUnits: 4,
        minUnitsAvailable: 1,
        maxUnitsPerReservation: 2,
        bufferUnits: 1
      })

      expect(a1.equals(a2)).toBe(true)
    })

    it('다른 설정이면 다르다고 판단한다', () => {
      const a1 = RentalAvailability.create({
        totalUnits: 4,
        bufferUnits: 1
      })

      const a2 = RentalAvailability.create({
        totalUnits: 4,
        bufferUnits: 2
      })

      expect(a1.equals(a2)).toBe(false)
    })
  })
})