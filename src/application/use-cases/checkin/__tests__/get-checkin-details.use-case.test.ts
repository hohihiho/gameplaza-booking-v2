import { GetCheckInDetailsUseCase } from '../get-checkin-details.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface';
import { DeviceRepository } from '@/src/domain/repositories/device-repository.interface';
import { UserRepository } from '@/src/domain/repositories/user-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';
import { Reservation } from '@/src/domain/entities/reservation';
import { Device } from '@/src/domain/entities/device';
import { User } from '@/src/domain/entities/user';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime';
import { TimeSlot } from '@/src/domain/value-objects/time-slot';
import { ReservationStatus } from '@/src/domain/value-objects/reservation-status';
import { DeviceStatus } from '@/src/domain/value-objects/device-status';
import { Role } from '@/src/domain/value-objects/role';

describe('GetCheckInDetailsUseCase', () => {
  let useCase: GetCheckInDetailsUseCase;
  let checkInRepository: jest.Mocked<CheckInRepository>;
  let reservationRepository: jest.Mocked<ReservationRepository>;
  let deviceRepository: jest.Mocked<DeviceRepository>;
  let userRepository: jest.Mocked<UserRepository>;

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

    deviceRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      delete: jest.fn()
    } as any;

    userRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as any;

    useCase = new GetCheckInDetailsUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository,
      userRepository
    );
  });

  describe('execute', () => {
    const request = {
      checkInId: 'checkin-123'
    };

    const now = new Date();

    const mockCheckIn = new CheckIn({
      id: 'checkin-123',
      reservationId: 'reservation-456',
      deviceId: 'device-789',
      checkInTime: now,
      paymentStatus: PaymentStatusType.COMPLETED,
      paymentMethod: PaymentMethodType.CASH,
      paymentAmount: 30000,
      status: CheckInStatusType.IN_USE,
      actualStartTime: now,
      createdAt: now,
      updatedAt: now
    });

    const mockReservation = Reservation.create({
      id: 'reservation-456',
      userId: 'user-123',
      deviceId: 'device-789',
      date: KSTDateTime.create(now),
      timeSlot: TimeSlot.create(10, 12),
      status: ReservationStatus.create('checked_in'),
      reservationNumber: 'GP-20250124-1234'
    });

    const mockDevice = Device.create({
      id: 'device-789',
      deviceTypeId: 'type-123',
      deviceNumber: 'PC-01',
      status: DeviceStatus.inUse(),
      location: 'A-1'
    });

    const mockUser = User.create({
      id: 'user-123',
      fullName: '홍길동',
      email: 'hong@example.com',
      phone: '010-1234-5678',
      role: 'user',
      status: 'active'
    });

    it('체크인 상세 정보를 성공적으로 조회한다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      reservationRepository.findById.mockResolvedValue(mockReservation);
      deviceRepository.findById.mockResolvedValue(mockDevice);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(request);

      expect(result.checkIn).toBeDefined();
      expect(result.checkIn.id).toBe('checkin-123');
      expect(result.checkIn.reservation).toBeDefined();
      expect(result.checkIn.reservation?.userName).toBe('홍길동');
      expect(result.checkIn.reservation?.reservationNumber).toBe('GP-20250124-1234');
      expect(result.checkIn.device).toBeDefined();
      expect(result.checkIn.device?.deviceNumber).toBe('PC-01');
    });

    it('체크인 정보를 찾을 수 없으면 에러를 던진다', async () => {
      checkInRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(request))
        .rejects.toThrow('체크인 정보를 찾을 수 없습니다');
    });

    it('관련 정보가 없어도 체크인 정보는 반환한다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      reservationRepository.findById.mockResolvedValue(null);
      deviceRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(request);

      expect(result.checkIn).toBeDefined();
      expect(result.checkIn.id).toBe('checkin-123');
      expect(result.checkIn.reservation).toBeUndefined();
      expect(result.checkIn.device).toBeUndefined();
    });

    it('예약은 있지만 사용자 정보가 없어도 처리된다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      reservationRepository.findById.mockResolvedValue(mockReservation);
      deviceRepository.findById.mockResolvedValue(mockDevice);
      userRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(request);

      expect(result.checkIn).toBeDefined();
      expect(result.checkIn.reservation?.userName).toBe('Unknown');
    });

    it('병렬로 관련 정보를 조회한다', async () => {
      checkInRepository.findById.mockResolvedValue(mockCheckIn);
      
      const reservationPromise = new Promise(resolve => 
        setTimeout(() => resolve(mockReservation), 100)
      );
      const devicePromise = new Promise(resolve => 
        setTimeout(() => resolve(mockDevice), 100)
      );
      
      reservationRepository.findById.mockReturnValue(reservationPromise as any);
      deviceRepository.findById.mockReturnValue(devicePromise as any);
      userRepository.findById.mockResolvedValue(mockUser);

      const startTime = Date.now();
      await useCase.execute(request);
      const endTime = Date.now();

      // 병렬 처리로 인해 100ms 정도만 걸려야 함 (순차 처리면 200ms)
      expect(endTime - startTime).toBeLessThan(150);
    });
  });
});