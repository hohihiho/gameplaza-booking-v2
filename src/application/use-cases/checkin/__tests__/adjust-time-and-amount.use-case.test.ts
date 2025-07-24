import { AdjustTimeAndAmountUseCase } from '../adjust-time-and-amount.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';

describe('AdjustTimeAndAmountUseCase', () => {
  let useCase: AdjustTimeAndAmountUseCase;
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

    useCase = new AdjustTimeAndAmountUseCase(checkInRepository);
  });

  describe('execute', () => {
    const checkInId = 'checkin-123';
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const mockCheckIn = new CheckIn({
      id: checkInId,
      reservationId: 'reservation-456',
      deviceId: 'device-789',
      checkInTime: now,
      paymentStatus: PaymentStatusType.COMPLETED,
      paymentAmount: 30000,
      status: CheckInStatusType.IN_USE,
      actualStartTime: now,
      createdAt: now,
      updatedAt: now
    });

    it('시간을 성공적으로 조정한다', async () => {
      const newStartTime = new Date(now.getTime() - 30 * 60 * 1000); // 30분 전
      const newEndTime = oneHourLater;

      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      checkInRepository.update.mockResolvedValue({
        ...mockCheckIn,
        actualStartTime: newStartTime,
        actualEndTime: newEndTime
      } as CheckIn);

      const result = await useCase.execute({
        checkInId,
        actualStartTime: newStartTime,
        actualEndTime: newEndTime
      });

      expect(result.checkIn.actualStartTime).toEqual(newStartTime);
      expect(result.checkIn.actualEndTime).toEqual(newEndTime);
      expect(result.message).toBe('시간이 조정되었습니다');
      expect(checkInRepository.update).toHaveBeenCalled();
    });

    it('금액을 성공적으로 조정한다', async () => {
      const adjustedAmount = 25000;
      const adjustmentReason = '할인 적용';

      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      const updatedCheckIn = new CheckIn({
        id: checkInId,
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: now,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentAmount: 30000,
        adjustedAmount,
        adjustmentReason,
        status: CheckInStatusType.IN_USE,
        actualStartTime: now,
        createdAt: now,
        updatedAt: now
      });
      checkInRepository.update.mockResolvedValue(updatedCheckIn);

      const result = await useCase.execute({
        checkInId,
        adjustedAmount,
        adjustmentReason
      });

      expect(result.checkIn.adjustedAmount).toBe(adjustedAmount);
      expect(result.checkIn.adjustmentReason).toBe(adjustmentReason);
      expect(result.message).toBe('금액이 25,000원으로 조정되었습니다');
    });

    it('시간과 금액을 동시에 조정한다', async () => {
      const newStartTime = new Date(now.getTime() - 30 * 60 * 1000);
      const adjustedAmount = 20000;
      const adjustmentReason = '시간 단축으로 인한 할인';

      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      const updatedCheckIn = new CheckIn({
        id: checkInId,
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: now,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentAmount: 30000,
        adjustedAmount,
        adjustmentReason,
        status: CheckInStatusType.IN_USE,
        actualStartTime: newStartTime,
        createdAt: now,
        updatedAt: now
      });
      checkInRepository.update.mockResolvedValue(updatedCheckIn);

      const result = await useCase.execute({
        checkInId,
        actualStartTime: newStartTime,
        adjustedAmount,
        adjustmentReason
      });

      expect(result.message).toBe('시간이 조정되었습니다. 금액이 20,000원으로 조정되었습니다');
    });

    it('체크인 정보를 찾을 수 없으면 에러를 던진다', async () => {
      checkInRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({
        checkInId,
        adjustedAmount: 25000,
        adjustmentReason: '할인'
      })).rejects.toThrow('체크인 정보를 찾을 수 없습니다');
    });

    it('활성 상태가 아닌 체크인은 조정할 수 없다', async () => {
      const completedCheckIn = new CheckIn({
        id: checkInId,
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: now,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentAmount: 30000,
        status: CheckInStatusType.COMPLETED,
        actualStartTime: now,
        createdAt: now,
        updatedAt: now
      });

      checkInRepository.findById.mockResolvedValue(completedCheckIn);

      await expect(useCase.execute({
        checkInId,
        adjustedAmount: 25000,
        adjustmentReason: '할인'
      })).rejects.toThrow('활성 상태의 체크인만 조정할 수 있습니다');
    });

    it('금액 조정 시 사유가 없으면 에러를 던진다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);

      await expect(useCase.execute({
        checkInId,
        adjustedAmount: 25000
      })).rejects.toThrow('금액 조정 시 사유를 입력해주세요');
    });

    it('빈 조정 사유는 허용하지 않는다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);

      await expect(useCase.execute({
        checkInId,
        adjustedAmount: 25000,
        adjustmentReason: ''
      })).rejects.toThrow('금액 조정 시 사유를 입력해주세요');
    });

    it('음수 금액으로 조정 시 에러를 던진다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);

      await expect(useCase.execute({
        checkInId,
        adjustedAmount: -1000,
        adjustmentReason: '잘못된 조정'
      })).rejects.toThrow('금액 조정 실패: 금액은 0원 이상이어야 합니다');
    });
  });
});