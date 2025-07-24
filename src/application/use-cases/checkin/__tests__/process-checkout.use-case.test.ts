import { ProcessCheckOutUseCase } from '../process-checkout.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';
import { Reservation } from '@/src/domain/entities/reservation';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime';
import { TimeSlot } from '@/src/domain/value-objects/time-slot';
import { ReservationStatus } from '@/src/domain/value-objects/reservation-status';

describe('ProcessCheckOutUseCase', () => {
  let useCase: ProcessCheckOutUseCase;
  let checkInRepository: jest.Mocked<CheckInRepository>;
  let reservationRepository: jest.Mocked<ReservationRepository>;

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

    reservationRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByDeviceId: jest.fn(),
      findByDate: jest.fn(),
      findAll: jest.fn(),
      findConflicting: jest.fn(),
      findUserConflicts: jest.fn(),
      delete: jest.fn()
    } as any;

    useCase = new ProcessCheckOutUseCase(checkInRepository, reservationRepository);
  });

  describe('execute', () => {
    const request = {
      checkInId: 'checkin-123',
      notes: '정상 이용 완료'
    };

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const mockCheckIn = new CheckIn({
      id: 'checkin-123',
      reservationId: 'reservation-456',
      deviceId: 'device-789',
      checkInTime: oneHourAgo,
      paymentStatus: PaymentStatusType.COMPLETED,
      paymentMethod: PaymentMethodType.CASH,
      paymentAmount: 30000,
      status: CheckInStatusType.IN_USE,
      actualStartTime: oneHourAgo,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo
    });

    const mockReservation = Reservation.create({
      id: 'reservation-456',
      userId: 'user-123',
      deviceId: 'device-789',
      date: KSTDateTime.create(now),
      timeSlot: TimeSlot.create(10, 12),
      status: ReservationStatus.create('checked_in')
    });

    it('성공적으로 체크아웃을 처리한다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      
      // 체크아웃 후 상태
      const completedCheckIn = new CheckIn({
        ...mockCheckIn.toJSON(),
        checkOutTime: now,
        actualEndTime: now,
        status: CheckInStatusType.COMPLETED,
        notes: '정상 이용 완료'
      });
      checkInRepository.update.mockResolvedValue(completedCheckIn);
      
      reservationRepository.findById.mockResolvedValue(mockReservation);
      reservationRepository.update.mockResolvedValue(mockReservation);

      const result = await useCase.execute(request);

      expect(result.checkIn).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTime).toBeGreaterThan(0);
      expect(result.summary.finalAmount).toBe(30000);
      expect(result.summary.paymentMethod).toBe('현금');
      expect(result.message).toContain('체크아웃이 완료되었습니다');
      expect(checkInRepository.update).toHaveBeenCalled();
      expect(reservationRepository.update).toHaveBeenCalled();
    });

    it('체크인 정보를 찾을 수 없으면 에러를 던진다', async () => {
      checkInRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(request))
        .rejects.toThrow('체크인 정보를 찾을 수 없습니다');
    });

    it('사용중이 아닌 체크인은 체크아웃할 수 없다', async () => {
      const checkedInCheckIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: oneHourAgo,
        paymentStatus: PaymentStatusType.PENDING,
        paymentAmount: 30000,
        status: CheckInStatusType.CHECKED_IN,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
      });

      checkInRepository.findById.mockResolvedValue(checkedInCheckIn);

      await expect(useCase.execute(request))
        .rejects.toThrow('사용 중인 체크인만 체크아웃할 수 있습니다');
    });

    it('결제가 완료되지 않은 체크인은 체크아웃할 수 없다', async () => {
      const unpaidCheckIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: oneHourAgo,
        paymentStatus: PaymentStatusType.PENDING,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        actualStartTime: oneHourAgo,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
      });

      checkInRepository.findById.mockResolvedValue(unpaidCheckIn);

      await expect(useCase.execute(request))
        .rejects.toThrow('결제가 완료되지 않은 체크인은 체크아웃할 수 없습니다');
    });

    it('메모 없이도 체크아웃할 수 있다', async () => {
      // 체크인 객체를 복사해서 사용
      const checkInForTest = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: oneHourAgo,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        actualStartTime: oneHourAgo,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
      });
      
      checkInRepository.findById.mockResolvedValue(checkInForTest);
      
      // update 호출 시 체크아웃 완료 상태로 반환
      checkInRepository.update.mockImplementation(async (checkIn) => {
        return new CheckIn({
          ...checkIn.toJSON(),
          checkOutTime: now,
          actualEndTime: now,
          status: CheckInStatusType.COMPLETED
        });
      });
      
      reservationRepository.findById.mockResolvedValue(mockReservation);
      reservationRepository.update.mockResolvedValue(mockReservation);

      const requestWithoutNotes = { checkInId: 'checkin-123' };
      const result = await useCase.execute(requestWithoutNotes);

      expect(result.checkIn).toBeDefined();
      expect(checkInRepository.update).toHaveBeenCalled();
    });

    it('예약 정보가 없어도 체크아웃은 처리된다', async () => {
      // 체크인 객체를 복사해서 사용
      const checkInForTest = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: oneHourAgo,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        actualStartTime: oneHourAgo,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
      });
      
      checkInRepository.findById.mockResolvedValue(checkInForTest);
      
      // update 호출 시 체크아웃 완료 상태로 반환
      checkInRepository.update.mockImplementation(async (checkIn) => {
        return new CheckIn({
          ...checkIn.toJSON(),
          checkOutTime: now,
          actualEndTime: now,
          status: CheckInStatusType.COMPLETED,
          notes: '정상 이용 완료'
        });
      });
      
      reservationRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(request);

      expect(result.checkIn).toBeDefined();
      expect(checkInRepository.update).toHaveBeenCalled();
      expect(reservationRepository.update).not.toHaveBeenCalled();
    });

    it('시간을 올바른 형식으로 표시한다', async () => {
      // 2시간 30분 사용한 체크인
      const twoHoursAgo = new Date(now.getTime() - 150 * 60 * 1000);
      const longCheckIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: twoHoursAgo,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        actualStartTime: twoHoursAgo,
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo
      });

      checkInRepository.findById.mockResolvedValue(longCheckIn);
      checkInRepository.update.mockImplementation(async (checkIn) => {
        // actualEndTime이 설정되었다고 가정
        const updatedCheckIn = new CheckIn({
          ...checkIn.toJSON(),
          actualEndTime: now,
          status: CheckInStatusType.COMPLETED
        });
        return updatedCheckIn;
      });
      reservationRepository.findById.mockResolvedValue(mockReservation);

      const result = await useCase.execute(request);

      expect(result.message).toContain('2시간 30분');
    });
  });
});