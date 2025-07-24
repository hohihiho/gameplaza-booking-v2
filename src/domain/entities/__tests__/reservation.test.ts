import { Reservation } from '../reservation'
import { KSTDateTime } from '../../value-objects/kst-datetime'
import { TimeSlot } from '../../value-objects/time-slot'
import { ReservationStatus } from '../../value-objects/reservation-status'

describe('Reservation Entity', () => {
  const createReservation = (props?: Partial<Parameters<typeof Reservation.create>[0]>) => {
    return Reservation.create({
      id: 'reservation-1',
      userId: 'user-1',
      deviceId: 'device-1',
      date: KSTDateTime.fromString('2025-07-23'),
      timeSlot: TimeSlot.create(14, 16),
      ...props
    })
  }

  describe('create', () => {
    it('should create reservation with default pending status', () => {
      const reservation = createReservation()
      
      expect(reservation.id).toBe('reservation-1')
      expect(reservation.userId).toBe('user-1')
      expect(reservation.deviceId).toBe('device-1')
      expect(reservation.status.value).toBe('pending')
    })

    it('should generate reservation number if not provided', () => {
      const reservation = createReservation()
      
      expect(reservation.reservationNumber).toMatch(/^GP-20250723-\d{4}$/)
    })

    it('should use provided reservation number', () => {
      const reservation = createReservation({
        reservationNumber: 'GP-20250723-0001'
      })
      
      expect(reservation.reservationNumber).toBe('GP-20250723-0001')
    })
  })

  describe('date and time handling', () => {
    it('should calculate start and end datetime correctly', () => {
      const reservation = createReservation({
        date: KSTDateTime.fromString('2025-07-23'),
        timeSlot: TimeSlot.create(14, 16)
      })
      
      expect(reservation.startDateTime.displayTime).toBe('14:00')
      expect(reservation.endDateTime.displayTime).toBe('16:00')
    })

    it('should handle late night slots crossing midnight', () => {
      const reservation = createReservation({
        date: KSTDateTime.fromString('2025-07-23'),
        timeSlot: TimeSlot.create(22, 24)
      })
      
      expect(reservation.startDateTime.date.getDate()).toBe(23)
      expect(reservation.endDateTime.date.getDate()).toBe(24)
      expect(reservation.endDateTime.displayTime).toBe('24:00')
    })

    it('should handle early morning slots with 24+ hours', () => {
      const reservation = createReservation({
        date: KSTDateTime.fromString('2025-07-23'),
        timeSlot: TimeSlot.create(26, 28)
      })
      
      expect(reservation.startDateTime.displayTime).toBe('26:00')
      expect(reservation.endDateTime.displayTime).toBe('28:00')
      expect(reservation.startDateTime.date.getHours()).toBe(2)
      expect(reservation.endDateTime.date.getHours()).toBe(4)
    })
  })

  describe('24-hour rule validation', () => {
    it('should validate 24-hour advance booking rule', () => {
      const now = KSTDateTime.create(new Date(2025, 6, 22, 10, 0))
      
      const validReservation = createReservation({
        date: KSTDateTime.fromString('2025-07-23'),
        timeSlot: TimeSlot.create(14, 16)
      })
      
      const invalidReservation = createReservation({
        date: KSTDateTime.fromString('2025-07-22'),
        timeSlot: TimeSlot.create(14, 16)
      })
      
      expect(validReservation.isValidFor24HourRule(now)).toBe(true)
      expect(invalidReservation.isValidFor24HourRule(now)).toBe(false)
    })
  })

  describe('conflict detection', () => {
    it('should detect time conflicts on same day', () => {
      const reservation1 = createReservation({
        timeSlot: TimeSlot.create(14, 16)
      })
      
      const reservation2 = createReservation({
        id: 'reservation-2',
        timeSlot: TimeSlot.create(15, 17)
      })
      
      const reservation3 = createReservation({
        id: 'reservation-3',
        timeSlot: TimeSlot.create(16, 18)
      })
      
      expect(reservation1.conflictsWith(reservation2)).toBe(true)
      expect(reservation1.conflictsWith(reservation3)).toBe(false)
    })

    it('should not conflict with different days', () => {
      const reservation1 = createReservation({
        date: KSTDateTime.fromString('2025-07-23'),
        timeSlot: TimeSlot.create(14, 16)
      })
      
      const reservation2 = createReservation({
        id: 'reservation-2',
        date: KSTDateTime.fromString('2025-07-24'),
        timeSlot: TimeSlot.create(14, 16)
      })
      
      expect(reservation1.conflictsWith(reservation2)).toBe(false)
    })

    it('should not conflict with itself', () => {
      const reservation = createReservation()
      expect(reservation.conflictsWith(reservation)).toBe(false)
    })
  })

  describe('user conflict detection', () => {
    it('should detect user conflicts for same time', () => {
      const reservation1 = createReservation({
        userId: 'user-1',
        deviceId: 'device-1',
        status: ReservationStatus.create('approved')
      })
      
      const reservation2 = createReservation({
        id: 'reservation-2',
        userId: 'user-1',
        deviceId: 'device-2',
        status: ReservationStatus.create('approved')
      })
      
      expect(reservation1.hasUserConflict(reservation2)).toBe(true)
    })

    it('should not detect conflict for different users', () => {
      const reservation1 = createReservation({
        userId: 'user-1'
      })
      
      const reservation2 = createReservation({
        id: 'reservation-2',
        userId: 'user-2'
      })
      
      expect(reservation1.hasUserConflict(reservation2)).toBe(false)
    })

    it('should not detect conflict for final state reservations', () => {
      const reservation1 = createReservation({
        status: ReservationStatus.create('cancelled')
      })
      
      const reservation2 = createReservation({
        id: 'reservation-2',
        status: ReservationStatus.create('approved')
      })
      
      expect(reservation1.hasUserConflict(reservation2)).toBe(false)
    })
  })

  describe('status changes', () => {
    it('should transition through reservation lifecycle', () => {
      let reservation = createReservation()
      
      expect(reservation.status.value).toBe('pending')
      
      reservation = reservation.approve()
      expect(reservation.status.value).toBe('approved')
      expect(reservation.isActive()).toBe(true)
      
      reservation = reservation.checkIn()
      expect(reservation.status.value).toBe('checked_in')
      expect(reservation.isActive()).toBe(true)
      
      reservation = reservation.complete()
      expect(reservation.status.value).toBe('completed')
      expect(reservation.isFinal()).toBe(true)
    })

    it('should allow cancellation from pending or approved', () => {
      const pendingReservation = createReservation()
      const cancelledFromPending = pendingReservation.cancel()
      expect(cancelledFromPending.status.value).toBe('cancelled')
      
      const approvedReservation = createReservation().approve()
      const cancelledFromApproved = approvedReservation.cancel()
      expect(cancelledFromApproved.status.value).toBe('cancelled')
    })

    it('should handle rejection', () => {
      const reservation = createReservation()
      const rejected = reservation.reject()
      
      expect(rejected.status.value).toBe('rejected')
      expect(rejected.isFinal()).toBe(true)
    })

    it('should handle no-show', () => {
      const reservation = createReservation().approve()
      const noShow = reservation.markAsNoShow()
      
      expect(noShow.status.value).toBe('no_show')
      expect(noShow.isFinal()).toBe(true)
    })

    it('should update timestamp on status change', () => {
      const reservation = createReservation({
        createdAt: new Date('2025-07-22T10:00:00'),
        updatedAt: new Date('2025-07-22T10:00:00')
      })
      
      const approved = reservation.approve()
      
      expect(approved.updatedAt.getTime()).toBeGreaterThan(reservation.updatedAt.getTime())
    })

    it('should throw error for invalid transitions', () => {
      const completed = createReservation().approve().checkIn().complete()
      
      expect(() => completed.approve()).toThrow(
        'Invalid status transition from completed to approved'
      )
    })
  })
})