import { ReservationStatus } from '../reservation-status'

describe('ReservationStatus', () => {
  describe('create', () => {
    it('should create status with valid type', () => {
      const status = ReservationStatus.create('pending')
      expect(status.value).toBe('pending')
    })

    it('should create pending status using factory', () => {
      const status = ReservationStatus.pending()
      expect(status.value).toBe('pending')
      expect(status.isPending()).toBe(true)
    })
  })

  describe('displayName', () => {
    it('should return Korean display names', () => {
      expect(ReservationStatus.create('pending').displayName).toBe('승인 대기')
      expect(ReservationStatus.create('approved').displayName).toBe('승인됨')
      expect(ReservationStatus.create('rejected').displayName).toBe('거부됨')
      expect(ReservationStatus.create('checked_in').displayName).toBe('체크인 완료')
      expect(ReservationStatus.create('completed').displayName).toBe('이용 완료')
      expect(ReservationStatus.create('cancelled').displayName).toBe('취소됨')
      expect(ReservationStatus.create('no_show').displayName).toBe('노쇼')
    })
  })

  describe('status checks', () => {
    it('should check active status correctly', () => {
      expect(ReservationStatus.create('pending').isActive()).toBe(false)
      expect(ReservationStatus.create('approved').isActive()).toBe(true)
      expect(ReservationStatus.create('checked_in').isActive()).toBe(true)
      expect(ReservationStatus.create('completed').isActive()).toBe(false)
    })

    it('should check final status correctly', () => {
      expect(ReservationStatus.create('pending').isFinal()).toBe(false)
      expect(ReservationStatus.create('approved').isFinal()).toBe(false)
      expect(ReservationStatus.create('completed').isFinal()).toBe(true)
      expect(ReservationStatus.create('cancelled').isFinal()).toBe(true)
      expect(ReservationStatus.create('rejected').isFinal()).toBe(true)
      expect(ReservationStatus.create('no_show').isFinal()).toBe(true)
    })
  })

  describe('status transitions', () => {
    it('should allow valid transitions from pending', () => {
      const pending = ReservationStatus.create('pending')
      
      expect(pending.canTransitionTo('approved')).toBe(true)
      expect(pending.canTransitionTo('rejected')).toBe(true)
      expect(pending.canTransitionTo('cancelled')).toBe(true)
      expect(pending.canTransitionTo('checked_in')).toBe(false)
    })

    it('should allow valid transitions from approved', () => {
      const approved = ReservationStatus.create('approved')
      
      expect(approved.canTransitionTo('checked_in')).toBe(true)
      expect(approved.canTransitionTo('cancelled')).toBe(true)
      expect(approved.canTransitionTo('no_show')).toBe(true)
      expect(approved.canTransitionTo('completed')).toBe(false)
    })

    it('should not allow transitions from final states', () => {
      const completed = ReservationStatus.create('completed')
      const cancelled = ReservationStatus.create('cancelled')
      
      expect(completed.canTransitionTo('approved')).toBe(false)
      expect(cancelled.canTransitionTo('approved')).toBe(false)
    })

    it('should transition to new status successfully', () => {
      const pending = ReservationStatus.create('pending')
      const approved = pending.transitionTo('approved')
      
      expect(approved.value).toBe('approved')
      expect(approved.isApproved()).toBe(true)
    })

    it('should throw error for invalid transition', () => {
      const pending = ReservationStatus.create('pending')
      
      expect(() => pending.transitionTo('completed')).toThrow(
        'Invalid status transition from pending to completed'
      )
    })
  })

  describe('equals', () => {
    it('should compare status equality', () => {
      const status1 = ReservationStatus.create('pending')
      const status2 = ReservationStatus.create('pending')
      const status3 = ReservationStatus.create('approved')
      
      expect(status1.equals(status2)).toBe(true)
      expect(status1.equals(status3)).toBe(false)
    })
  })
})