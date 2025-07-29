import { GetCheckInsByDateRangeUseCase } from '../get-checkins-by-date-range.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';

describe('GetCheckInsByDateRangeUseCase', () => {
  let useCase: GetCheckInsByDateRangeUseCase;
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

    useCase = new GetCheckInsByDateRangeUseCase(checkInRepository);
  });

  describe('execute', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mockCheckIn1 = new CheckIn({
      id: 'checkin-1',
      reservationId: 'reservation-1',
      deviceId: 'device-1',
      checkInTime: yesterday,
      checkOutTime: yesterday,
      paymentStatus: PaymentStatusType.COMPLETED,
      paymentMethod: PaymentMethodType.CASH,
      paymentAmount: 30000,
      status: CheckInStatusType.COMPLETED,
      actualStartTime: yesterday,
      actualEndTime: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000), // 2시간 후
      createdAt: yesterday,
      updatedAt: yesterday
    });

    const mockCheckIn2 = new CheckIn({
      id: 'checkin-2',
      reservationId: 'reservation-2',
      deviceId: 'device-2',
      checkInTime: now,
      paymentStatus: PaymentStatusType.COMPLETED,
      paymentMethod: PaymentMethodType.BANK_TRANSFER,
      paymentAmount: 25000,
      adjustedAmount: 20000,
      adjustmentReason: '시간 단축',
      status: CheckInStatusType.IN_USE,
      actualStartTime: now,
      createdAt: now,
      updatedAt: now
    });

    const mockCheckIn3 = new CheckIn({
      id: 'checkin-3',
      reservationId: 'reservation-3',
      deviceId: 'device-3',
      checkInTime: now,
      paymentStatus: PaymentStatusType.PENDING,
      paymentAmount: 20000,
      status: CheckInStatusType.CHECKED_IN,
      createdAt: now,
      updatedAt: now
    });

    it('날짜 범위로 체크인 목록을 조회한다', async () => {
      checkInRepository.findByDateRange.mockResolvedValue([
        mockCheckIn1,
        mockCheckIn2,
        mockCheckIn3
      ]);

      const result = await useCase.execute({
        startDate: yesterday,
        endDate: tomorrow,
        includeStatistics: false
      });

      expect(checkInRepository.findByDateRange).toHaveBeenCalledWith(yesterday, tomorrow);
      expect(result.checkIns).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.statistics).toBeUndefined();
    });

    it('통계 정보를 포함하여 조회한다', async () => {
      checkInRepository.findByDateRange.mockResolvedValue([
        mockCheckIn1,
        mockCheckIn2,
        mockCheckIn3
      ]);

      const result = await useCase.execute({
        startDate: yesterday,
        endDate: tomorrow,
        includeStatistics: true
      });

      expect(result.statistics).toBeDefined();
      expect(result.statistics?.totalCheckIns).toBe(3);
      expect(result.statistics?.activeCheckIns).toBe(2); // IN_USE, CHECKED_IN
      expect(result.statistics?.completedCheckIns).toBe(1); // COMPLETED
      expect(result.statistics?.totalRevenue).toBe(70000); // 30000 + 20000 + 20000
      expect(result.statistics?.averageUsageTime).toBe(120); // 2시간 = 120분
    });

    it('시작 날짜가 종료 날짜보다 늦으면 에러를 던진다', async () => {
      await expect(useCase.execute({
        startDate: tomorrow,
        endDate: yesterday,
        includeStatistics: false
      })).rejects.toThrow('시작 날짜는 종료 날짜보다 이전이어야 합니다');
    });

    it('빈 결과도 정상적으로 처리한다', async () => {
      checkInRepository.findByDateRange.mockResolvedValue([]);

      const result = await useCase.execute({
        startDate: yesterday,
        endDate: tomorrow,
        includeStatistics: true
      });

      expect(result.checkIns).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.statistics?.totalCheckIns).toBe(0);
      expect(result.statistics?.activeCheckIns).toBe(0);
      expect(result.statistics?.completedCheckIns).toBe(0);
      expect(result.statistics?.totalRevenue).toBe(0);
      expect(result.statistics?.averageUsageTime).toBe(0);
    });

    it('실제 사용 시간이 없는 체크인도 통계에 포함된다', async () => {
      const checkInWithoutDuration = new CheckIn({
        id: 'checkin-4',
        reservationId: 'reservation-4',
        deviceId: 'device-4',
        checkInTime: now,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 15000,
        status: CheckInStatusType.IN_USE,
        actualStartTime: now,
        createdAt: now,
        updatedAt: now
      });

      checkInRepository.findByDateRange.mockResolvedValue([
        mockCheckIn1, // actualDuration: 120분
        checkInWithoutDuration // actualDuration: undefined
      ]);

      const result = await useCase.execute({
        startDate: yesterday,
        endDate: tomorrow,
        includeStatistics: true
      });

      expect(result.statistics?.totalCheckIns).toBe(2);
      expect(result.statistics?.totalRevenue).toBe(45000); // 30000 + 15000
      expect(result.statistics?.averageUsageTime).toBe(120); // 120분 / 1 (duration이 있는 체크인 수)
    });

    it('조정된 금액이 있는 경우 최종 금액으로 계산한다', async () => {
      checkInRepository.findByDateRange.mockResolvedValue([mockCheckIn2]);

      const result = await useCase.execute({
        startDate: yesterday,
        endDate: tomorrow,
        includeStatistics: true
      });

      // mockCheckIn2는 adjustedAmount가 20000원
      expect(result.statistics?.totalRevenue).toBe(20000);
    });

    it('체크인 DTO 변환이 올바르게 동작한다', async () => {
      checkInRepository.findByDateRange.mockResolvedValue([mockCheckIn1]);

      const result = await useCase.execute({
        startDate: yesterday,
        endDate: tomorrow,
        includeStatistics: false
      });

      const checkInDTO = result.checkIns[0];
      
      // checkInDTO null 체크
      expect(checkInDTO).toBeDefined();
      if (!checkInDTO) return;
      
      expect(checkInDTO.id).toBe('checkin-1');
      expect(checkInDTO.paymentStatus).toBe(PaymentStatusType.COMPLETED);
      expect(checkInDTO.paymentMethod).toBe(PaymentMethodType.CASH);
      expect(checkInDTO.finalAmount).toBe(30000);
      expect(checkInDTO.actualDuration).toBe(120);
      expect(checkInDTO.checkInTime).toBeDefined();
      expect(checkInDTO.checkOutTime).toBeDefined();
    });

    it('같은 날짜로 조회할 수 있다', async () => {
      checkInRepository.findByDateRange.mockResolvedValue([mockCheckIn2, mockCheckIn3]);

      const result = await useCase.execute({
        startDate: now,
        endDate: now,
        includeStatistics: false
      });

      expect(checkInRepository.findByDateRange).toHaveBeenCalledWith(now, now);
      expect(result.checkIns).toHaveLength(2);
    });
  });
});