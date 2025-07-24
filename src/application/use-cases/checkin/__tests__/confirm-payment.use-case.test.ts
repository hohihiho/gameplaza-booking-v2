import { ConfirmPaymentUseCase } from '../confirm-payment.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';

describe('ConfirmPaymentUseCase', () => {
  let useCase: ConfirmPaymentUseCase;
  let checkInRepository: jest.Mocked<CheckInRepository>;

  beforeEach(() => {
    checkInRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByReservationId: jest.fn(),
      findByDeviceId: jest.fn(),
      findActiveCheckIns: jest.fn(),
      findByDateRange: jest.fn(),
      findActiveByDeviceId: jest.fn(),
      findByStatus: jest.fn(),
      findPendingPayments: jest.fn()
    };

    useCase = new ConfirmPaymentUseCase(checkInRepository);
  });

  describe('execute', () => {
    const request = {
      checkInId: 'checkin-123',
      paymentMethod: PaymentMethodType.CASH
    };

    const mockCheckIn = new CheckIn({
      id: 'checkin-123',
      reservationId: 'reservation-456',
      deviceId: 'device-789',
      checkInTime: new Date(),
      paymentStatus: PaymentStatusType.PENDING,
      paymentAmount: 30000,
      status: CheckInStatusType.CHECKED_IN,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    it('성공적으로 결제를 확인한다', async () => {
      const updatedCheckIn = new CheckIn({
        ...mockCheckIn,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        status: CheckInStatusType.IN_USE,
        actualStartTime: new Date()
      });

      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      checkInRepository.update.mockResolvedValue(updatedCheckIn);

      const result = await useCase.execute(request);

      expect(result.checkIn.paymentStatus.isCompleted()).toBe(true);
      expect(result.checkIn.paymentMethod?.value).toBe(PaymentMethodType.CASH);
      expect(result.checkIn.status.isInUse()).toBe(true);
      expect(result.message).toBe('결제가 확인되었습니다. 기기를 사용하실 수 있습니다.');
      expect(checkInRepository.update).toHaveBeenCalled();
    });

    it('체크인 정보를 찾을 수 없으면 에러를 던진다', async () => {
      checkInRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(request))
        .rejects.toThrow('체크인 정보를 찾을 수 없습니다');
    });

    it('체크인 상태가 아니면 결제를 확인할 수 없다', async () => {
      const inUseCheckIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: new Date(),
        paymentStatus: PaymentStatusType.PENDING,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      checkInRepository.findById.mockResolvedValue(inUseCheckIn);

      await expect(useCase.execute(request))
        .rejects.toThrow('체크인 상태에서만 결제를 확인할 수 있습니다');
    });

    it('이미 결제가 완료된 경우 에러를 던진다', async () => {
      const paidCheckIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: new Date(),
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 30000,
        status: CheckInStatusType.CHECKED_IN,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      checkInRepository.findById.mockResolvedValue(paidCheckIn);

      await expect(useCase.execute(request))
        .rejects.toThrow('이미 결제가 완료되었습니다');
    });

    it('다양한 결제 방법을 처리할 수 있다', async () => {
      const paymentMethods = [
        PaymentMethodType.CASH,
        PaymentMethodType.BANK_TRANSFER,
        PaymentMethodType.CARD
      ];

      for (const paymentMethod of paymentMethods) {
        const requestWithMethod = { ...request, paymentMethod };
        const freshMockCheckIn = new CheckIn({
          id: 'checkin-123',
          reservationId: 'reservation-456',
          deviceId: 'device-789',
          checkInTime: new Date(),
          paymentStatus: PaymentStatusType.PENDING,
          paymentAmount: 30000,
          status: CheckInStatusType.CHECKED_IN,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const updatedCheckIn = new CheckIn({
          id: 'checkin-123',
          reservationId: 'reservation-456',
          deviceId: 'device-789',
          checkInTime: new Date(),
          paymentStatus: PaymentStatusType.COMPLETED,
          paymentMethod,
          paymentAmount: 30000,
          status: CheckInStatusType.IN_USE,
          actualStartTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        checkInRepository.findById.mockResolvedValue(freshMockCheckIn);
        checkInRepository.update.mockResolvedValue(updatedCheckIn);

        const result = await useCase.execute(requestWithMethod);
        expect(result.checkIn.paymentMethod?.value).toBe(paymentMethod);
      }
    });
  });
});