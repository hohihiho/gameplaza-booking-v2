import { RefundPaymentUseCase } from '../refund-payment.use-case'
import { Payment } from '@/src/domain/entities/payment'
import { PaymentRepository } from '@/src/domain/repositories/payment.repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { User } from '@/src/domain/entities/user'
import { Reservation } from '@/src/domain/entities/reservation'
import { Money } from '@/src/domain/value-objects/money'
import { ReservationStatus } from '@/src/domain/value-objects/reservation-status'
import { UserRole } from '@/src/domain/value-objects/user-role'

describe('RefundPaymentUseCase', () => {
  let useCase: RefundPaymentUseCase
  let paymentRepository: PaymentRepository
  let reservationRepository: ReservationRepository
  let userRepository: UserRepository

  // Mock 객체들
  const mockAdmin = {
    id: 'admin-123',
    name: '관리자',
    email: 'admin@example.com',
    phone: '010-1111-2222',
    role: 'admin' as const,
    getRoleValue: () => 'admin' as const,
    isAdmin: () => true,
    createdAt: new Date(),
    updatedAt: new Date()
  } as User

  const mockCustomer = {
    id: 'user-123',
    name: '홍길동',
    email: 'customer@example.com',
    phone: '010-3333-4444',
    role: 'user' as const,
    getRoleValue: () => 'user' as const,
    isAdmin: () => false,
    createdAt: new Date(),
    updatedAt: new Date()
  } as User

  const mockPayment = {
    id: 'payment-123',
    reservationId: 'reservation-123',
    userId: 'user-123',
    amount: 30000,
    paymentMethod: 'cash' as const,
    status: 'paid' as const,
    isRefundable: jest.fn().mockReturnValue(true),
    getRefundableAmount: jest.fn().mockReturnValue(30000),
    refund: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Payment

  const mockReservation = {
    id: 'reservation-123',
    userId: 'user-123',
    status: { value: 'approved' },
    cancel: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Reservation

  beforeEach(() => {
    // Repository Mocks
    paymentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findByReservationId: jest.fn(),
      findByUserId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn()
    }

    reservationRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByDate: jest.fn(),
      findByDeviceAndTimeSlot: jest.fn(),
      checkTimeSlotAvailability: jest.fn(),
      delete: jest.fn()
    }

    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    useCase = new RefundPaymentUseCase(
      paymentRepository,
      reservationRepository,
      userRepository
    )
  })

  describe('환불 처리', () => {
    it('관리자가 정상적으로 환불을 처리할 수 있어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '고객 요청으로 인한 부분 환불'
      }

      const updatedPayment = {
        ...mockPayment,
        status: 'partial_refunded' as const,
        getRefundableAmount: jest.fn().mockReturnValue(20000)
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)
      ;(reservationRepository.findById as jest.Mock).mockResolvedValue(mockReservation)
      ;(paymentRepository.update as jest.Mock).mockResolvedValue(updatedPayment)
      ;(userRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockCustomer)

      // When
      const result = await useCase.execute(request)

      // Then
      expect(result.refundedAmount).toBe(10000)
      expect(result.remainingAmount).toBe(20000)
      expect(result.message).toContain('홍길동님께 현금 10,000원을 환불했습니다')
      expect(mockPayment.refund).toHaveBeenCalledWith(10000, '고객 요청으로 인한 부분 환불')
      expect(paymentRepository.update).toHaveBeenCalledWith(mockPayment)
    })

    it('전액 환불 시 예약도 취소되어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 30000, // 전액 환불
        reason: '고객 요청으로 인한 전액 환불'
      }

      const updatedPayment = {
        ...mockPayment,
        status: 'refunded' as const,
        getRefundableAmount: jest.fn().mockReturnValue(0)
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)
      ;(reservationRepository.findById as jest.Mock).mockResolvedValue(mockReservation)
      ;(paymentRepository.update as jest.Mock).mockResolvedValue(updatedPayment)
      ;(userRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockCustomer)

      // When
      const result = await useCase.execute(request)

      // Then
      expect(result.refundedAmount).toBe(30000)
      expect(result.remainingAmount).toBe(0)
      expect(mockReservation.cancel).toHaveBeenCalled()
      expect(reservationRepository.update).toHaveBeenCalledWith(mockReservation)
    })

    it('일반 사용자는 환불을 처리할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'user-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '환불 요청'
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockCustomer)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('관리자만 환불을 처리할 수 있습니다')
    })

    it('환불 가능 금액을 초과하여 환불할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 35000, // 원금 30,000원 초과
        reason: '환불 요청'
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('환불 가능 금액(30,000원)을 초과했습니다')
    })

    it('이미 체크인한 예약은 환불할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '환불 요청'
      }

      const checkedInReservation = {
        ...mockReservation,
        status: { value: 'checked_in' }
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)
      ;(reservationRepository.findById as jest.Mock).mockResolvedValue(checkedInReservation)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('이미 이용한 예약은 환불할 수 없습니다')
    })

    it('환불 불가능한 상태의 결제는 환불할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '환불 요청'
      }

      const nonRefundablePayment = {
        ...mockPayment,
        isRefundable: jest.fn().mockReturnValue(false)
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(nonRefundablePayment)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('환불 가능한 상태가 아닙니다')
    })

    it('0원 이하의 금액은 환불할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 0,
        reason: '환불 요청'
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('환불 금액은 0보다 커야 합니다')
    })

    it('존재하지 않는 결제는 환불할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'non-existent-payment',
        amount: 10000,
        reason: '환불 요청'
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('결제 정보를 찾을 수 없습니다')
    })

    it('예약 정보가 없는 결제는 환불할 수 없어야 한다', async () => {
      // Given
      const request = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '환불 요청'
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)
      ;(reservationRepository.findById as jest.Mock).mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute(request)).rejects.toThrow('예약 정보를 찾을 수 없습니다')
    })
  })

  describe('부분 환불', () => {
    it('여러 번 부분 환불이 가능해야 한다', async () => {
      // Given - 첫 번째 환불
      const firstRequest = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '첫 번째 부분 환불'
      }

      const afterFirstRefund = {
        ...mockPayment,
        status: 'partial_refunded' as const,
        getRefundableAmount: jest.fn().mockReturnValue(20000)
      }

      ;(userRepository.findById as jest.Mock).mockResolvedValue(mockAdmin)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment)
      ;(reservationRepository.findById as jest.Mock).mockResolvedValue(mockReservation)
      ;(paymentRepository.update as jest.Mock).mockResolvedValue(afterFirstRefund)
      ;(userRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockCustomer)

      // When
      const firstResult = await useCase.execute(firstRequest)

      // Then
      expect(firstResult.refundedAmount).toBe(10000)
      expect(firstResult.remainingAmount).toBe(20000)

      // Given - 두 번째 환불
      const secondRequest = {
        userId: 'admin-123',
        paymentId: 'payment-123',
        amount: 10000,
        reason: '두 번째 부분 환불'
      }

      const afterSecondRefund = {
        ...mockPayment,
        status: 'partial_refunded' as const,
        getRefundableAmount: jest.fn().mockReturnValue(10000)
      }

      afterFirstRefund.getRefundableAmount = jest.fn().mockReturnValue(20000)
      ;(paymentRepository.findById as jest.Mock).mockResolvedValue(afterFirstRefund)
      ;(paymentRepository.update as jest.Mock).mockResolvedValue(afterSecondRefund)

      // When
      const secondResult = await useCase.execute(secondRequest)

      // Then
      expect(secondResult.refundedAmount).toBe(10000)
      expect(secondResult.remainingAmount).toBe(10000)
    })
  })
})