import { ReservationRulesService } from '../reservation-rules.service'
import { Reservation } from '../../entities/reservation'
import { KSTDateTime } from '../../value-objects/kst-datetime'
import { TimeSlot } from '../../value-objects/time-slot'
import { ReservationStatus } from '../../value-objects/reservation-status'

describe('ReservationRulesService', () => {
  const createReservation = (props: {
    id?: string
    userId?: string
    deviceId?: string
    date?: KSTDateTime
    timeSlot?: TimeSlot
    status?: ReservationStatus
  }): Reservation => {
    return Reservation.create({
      id: props.id || 'test-id',
      userId: props.userId || 'user-1',
      deviceId: props.deviceId || 'device-1',
      date: props.date || KSTDateTime.create(new Date(2025, 6, 1)),
      timeSlot: props.timeSlot || TimeSlot.fromHours(14, 16),
      status: props.status || ReservationStatus.pending()
    })
  }

  describe('validate24HourRule', () => {
    it('24시간 이상 남은 예약은 유효해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 5, 30, 10, 0)) // 6월 30일 10시
      const reservation = createReservation({
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(14, 16) // 7월 1일 14시
      })

      const result = ReservationRulesService.validate24HourRule(reservation, currentTime)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('24시간 미만 남은 예약은 무효해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0)) // 7월 1일 10시
      const reservation = createReservation({
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(14, 16) // 7월 1일 14시 (4시간 후)
      })

      const result = ReservationRulesService.validate24HourRule(reservation, currentTime)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('예약은 최소 24시간 전에 신청해야 합니다. 현재 4시간 전입니다')
    })

    it('이미 시작된 시간대는 예약할 수 없다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 15, 0)) // 7월 1일 15시
      const reservation = createReservation({
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(14, 16) // 7월 1일 14시 (이미 시작됨)
      })

      const result = ReservationRulesService.validate24HourRule(reservation, currentTime)

      expect(result.isValid).toBe(false)
      // 실제로는 음수 시간으로 계산되어 다른 메시지가 나옴
      expect(result.errors[0]).toMatch(/예약은 최소 24시간 전에 신청해야 합니다/)
    })

    it('자정을 넘어가는 예약도 정확히 검증해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 22, 0)) // 7월 1일 22시
      const reservation = createReservation({
        date: KSTDateTime.create(new Date(2025, 6, 2)),
        timeSlot: TimeSlot.fromHours(23, 26) // 7월 2일 23시~익일 2시 (25시간 후)
      })

      const result = ReservationRulesService.validate24HourRule(reservation, currentTime)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateUserReservationLimit', () => {
    it('활성 예약이 없으면 유효해야 한다', () => {
      const result = ReservationRulesService.validateUserReservationLimit('user-1', [])

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('활성 예약이 1개 이상이면 무효해야 한다', () => {
      const activeReservation = createReservation({
        id: 'active-1',
        userId: 'user-1',
        status: ReservationStatus.approved()
      })

      const result = ReservationRulesService.validateUserReservationLimit('user-1', [activeReservation])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('1인당 동시 예약 가능 건수는 1건입니다. 기존 예약을 완료하거나 취소한 후 신청해주세요')
    })

    it('다른 사용자의 예약은 영향없어야 한다', () => {
      const otherUserReservation = createReservation({
        userId: 'user-2',
        status: ReservationStatus.approved()
      })

      const result = ReservationRulesService.validateUserReservationLimit('user-1', [otherUserReservation])

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('완료된 예약은 제한에 포함되지 않아야 한다', () => {
      const completedReservation = createReservation({
        userId: 'user-1',
        status: ReservationStatus.completed()
      })

      const result = ReservationRulesService.validateUserReservationLimit('user-1', [completedReservation])

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('excludeReservationId로 특정 예약을 제외할 수 있어야 한다', () => {
      const existingReservation = createReservation({
        id: 'existing-1',
        userId: 'user-1',
        status: ReservationStatus.approved()
      })

      const result = ReservationRulesService.validateUserReservationLimit(
        'user-1', 
        [existingReservation],
        'existing-1' // 기존 예약 ID를 제외
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateSpecialOperatingHours', () => {
    describe('밤샘 영업 시간대 (22시 이후)', () => {
      it('24시간 이상 남은 밤샘 예약은 유효해야 한다', () => {
        const currentTime = KSTDateTime.create(new Date(2025, 5, 30, 10, 0)) // 6월 30일 10시
        const reservation = createReservation({
          date: KSTDateTime.create(new Date(2025, 6, 1)),
          timeSlot: TimeSlot.fromHours(23, 26) // 7월 1일 23시~26시
        })

        const result = ReservationRulesService.validateSpecialOperatingHours(reservation, currentTime)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('24시간 미만 남은 밤샘 예약은 무효해야 한다', () => {
        const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0)) // 7월 1일 10시
        const reservation = createReservation({
          date: KSTDateTime.create(new Date(2025, 6, 1)),
          timeSlot: TimeSlot.fromHours(23, 26) // 7월 1일 23시 (13시간 후)
        })

        const result = ReservationRulesService.validateSpecialOperatingHours(reservation, currentTime)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('밤샘 영업 시간대 예약은 24시간 전까지만 신청 가능합니다')
      })
    })

    describe('새벽 시간대 (0-6시)', () => {
      it('24시간 미만 남은 새벽 예약은 무효해야 한다', () => {
        const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0)) // 7월 1일 10시
        const reservation = createReservation({
          date: KSTDateTime.create(new Date(2025, 6, 2)),
          timeSlot: TimeSlot.fromHours(2, 4) // 7월 2일 2시 (16시간 후)
        })

        const result = ReservationRulesService.validateSpecialOperatingHours(reservation, currentTime)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('밤샘 영업 시간대 예약은 24시간 전까지만 신청 가능합니다')
      })
    })

    describe('조기 영업 시간대 (6-12시)', () => {
      it('24시간 이상 남은 조기 예약은 유효해야 한다', () => {
        const currentTime = KSTDateTime.create(new Date(2025, 5, 30, 5, 0)) // 6월 30일 5시
        const reservation = createReservation({
          date: KSTDateTime.create(new Date(2025, 6, 1)),
          timeSlot: TimeSlot.fromHours(8, 10) // 7월 1일 8시
        })

        const result = ReservationRulesService.validateSpecialOperatingHours(reservation, currentTime)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('24시간 미만 남은 조기 예약은 무효해야 한다', () => {
        const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 5, 0)) // 7월 1일 5시
        const reservation = createReservation({
          date: KSTDateTime.create(new Date(2025, 6, 1)),
          timeSlot: TimeSlot.fromHours(8, 10) // 7월 1일 8시 (3시간 후)
        })

        const result = ReservationRulesService.validateSpecialOperatingHours(reservation, currentTime)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('조기 영업 시간대 예약은 24시간 전까지만 신청 가능합니다')
      })
    })

    describe('일반 영업 시간대', () => {
      it('일반 시간대는 특별 제한이 없어야 한다', () => {
        const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0))
        const reservation = createReservation({
          date: KSTDateTime.create(new Date(2025, 6, 1)),
          timeSlot: TimeSlot.fromHours(14, 16) // 일반 시간대
        })

        const result = ReservationRulesService.validateSpecialOperatingHours(reservation, currentTime)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })
  })

  describe('validateTimeConflict', () => {
    it('시간대가 겹치지 않으면 유효해야 한다', () => {
      const reservation1 = createReservation({
        id: 'res-1',
        userId: 'user-1',
        timeSlot: TimeSlot.fromHours(14, 16)
      })

      const reservation2 = createReservation({
        id: 'res-2',
        userId: 'user-1',
        timeSlot: TimeSlot.fromHours(17, 19)
      })

      const result = ReservationRulesService.validateTimeConflict(reservation1, [reservation2])

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('같은 시간대에 이미 예약이 있으면 무효해야 한다', () => {
      const existingReservation = createReservation({
        id: 'existing',
        userId: 'user-1',
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(14, 16),
        status: ReservationStatus.approved()
      })

      const newReservation = createReservation({
        id: 'new',
        userId: 'user-1',
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(15, 17) // 겹침
      })

      const result = ReservationRulesService.validateTimeConflict(newReservation, [existingReservation])

      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('이미 해당 시간대에 예약이 있습니다')
    })

    it('다른 날짜의 예약은 충돌하지 않아야 한다', () => {
      const reservation1 = createReservation({
        userId: 'user-1',
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(14, 16)
      })

      const reservation2 = createReservation({
        userId: 'user-1',
        date: KSTDateTime.create(new Date(2025, 6, 2)),
        timeSlot: TimeSlot.fromHours(14, 16)
      })

      const result = ReservationRulesService.validateTimeConflict(reservation1, [reservation2])

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateAll', () => {
    it('모든 규칙을 종합적으로 검증해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0))
      
      // 문제없는 예약
      const validReservation = createReservation({
        userId: 'user-1',
        date: KSTDateTime.create(new Date(2025, 6, 3)),
        timeSlot: TimeSlot.fromHours(14, 16)
      })

      const result = ReservationRulesService.validateAll(validReservation, [], currentTime)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('여러 규칙 위반을 모두 수집해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0))
      
      // 여러 문제가 있는 예약
      const problematicReservation = createReservation({
        userId: 'user-1',
        date: KSTDateTime.create(new Date(2025, 6, 1)),
        timeSlot: TimeSlot.fromHours(14, 16) // 14시간 후 (24시간 미만)
      })

      const existingReservation = createReservation({
        id: 'existing',
        userId: 'user-1',
        status: ReservationStatus.approved()
      })

      const result = ReservationRulesService.validateAll(
        problematicReservation, 
        [existingReservation], 
        currentTime
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1) // 여러 에러
    })
  })

  describe('getMinimumReservationTime', () => {
    it('현재 시간으로부터 24시간 후를 반환해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0))
      const minimumTime = ReservationRulesService.getMinimumReservationTime(currentTime)

      const hoursDiff = minimumTime.differenceInHours(currentTime)
      expect(hoursDiff).toBe(24)
    })
  })

  describe('isReservableDate', () => {
    it('24시간 이후 날짜는 예약 가능해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0))
      const futureDate = KSTDateTime.create(new Date(2025, 6, 3, 10, 0))

      const result = ReservationRulesService.isReservableDate(futureDate, currentTime)

      expect(result).toBe(true)
    })

    it('24시간 이내 날짜는 예약 불가능해야 한다', () => {
      const currentTime = KSTDateTime.create(new Date(2025, 6, 1, 10, 0))
      const nearDate = KSTDateTime.create(new Date(2025, 6, 1, 20, 0))

      const result = ReservationRulesService.isReservableDate(nearDate, currentTime)

      expect(result).toBe(false)
    })
  })
})