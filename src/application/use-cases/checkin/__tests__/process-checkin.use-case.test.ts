import { ProcessCheckInUseCase } from '../process-checkin.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface';
import { DeviceRepository } from '@/src/domain/repositories/device-repository.interface';
import { Reservation } from '@/src/domain/entities/reservation';
import { Device } from '@/src/domain/entities/device';
import { CheckIn } from '@/src/domain/entities/checkin';
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime';
import { TimeSlot } from '@/src/domain/value-objects/time-slot';
import { ReservationStatus } from '@/src/domain/value-objects/reservation-status';
import { DeviceStatus } from '@/src/domain/value-objects/device-status';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';

describe('ProcessCheckInUseCase', () => {
  let useCase: ProcessCheckInUseCase;
  let checkInRepository: jest.Mocked<CheckInRepository>;
  let reservationRepository: jest.Mocked<ReservationRepository>;
  let deviceRepository: jest.Mocked<DeviceRepository>;

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

    useCase = new ProcessCheckInUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository
    );
  });

  describe('execute', () => {
    const request = {
      reservationId: 'reservation-123',
      deviceId: 'device-456'
    };

    const now = new Date();
    // 30분 후 예약으로 설정 (1시간 전부터 체크인 가능하므로)
    const futureDate = new Date(now);
    futureDate.setMinutes(futureDate.getMinutes() + 30);

    const mockReservation = Reservation.create({
      id: 'reservation-123',
      userId: 'user-123',
      deviceId: 'device-456',
      date: KSTDateTime.create(futureDate),
      timeSlot: TimeSlot.create(10, 12),
      status: ReservationStatus.create('approved'),
      reservationNumber: 'GP-20250124-1234',
      assignedDeviceNumber: 'PC-01'
    });

    const mockDevice = Device.create({
      id: 'device-456',
      deviceTypeId: 'type-123',
      deviceNumber: 'PC-01',
      status: DeviceStatus.available(),
      location: 'A-1'
    });

    it('성공적으로 체크인을 처리한다', async () => {
      const mockCheckIn = new CheckIn({
        id: 'checkin-789',
        reservationId: request.reservationId,
        deviceId: request.deviceId,
        checkInTime: new Date(),
        paymentStatus: PaymentStatusType.PENDING,
        paymentAmount: 30000,
        status: CheckInStatusType.CHECKED_IN,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      reservationRepository.findById.mockResolvedValue(mockReservation);
      deviceRepository.findById.mockResolvedValue(mockDevice);
      checkInRepository.findByReservationId.mockResolvedValue(null);
      checkInRepository.findActiveByDeviceId.mockResolvedValue(null);
      checkInRepository.create.mockResolvedValue(mockCheckIn);
      reservationRepository.update.mockResolvedValue(mockReservation);

      const result = await useCase.execute(request);

      expect(result.checkIn).toBeDefined();
      expect(result.message).toBe('체크인이 완료되었습니다. 결제를 진행해주세요.');
      expect(checkInRepository.create).toHaveBeenCalled();
      expect(reservationRepository.update).toHaveBeenCalled();
    });

    it('예약을 찾을 수 없으면 에러를 던진다', async () => {
      reservationRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(request))
        .rejects.toThrow('예약을 찾을 수 없습니다');
    });

    it('승인되지 않은 예약은 체크인할 수 없다', async () => {
      const pendingReservation = Reservation.create({
        id: 'reservation-123',
        userId: 'user-123',
        deviceId: 'device-456',
        date: KSTDateTime.create(futureDate),
        timeSlot: TimeSlot.create(10, 12),
        status: ReservationStatus.create('pending'),
        reservationNumber: 'GP-20250124-1234',
        assignedDeviceNumber: 'PC-01'
      });

      reservationRepository.findById.mockResolvedValue(pendingReservation);

      await expect(useCase.execute(request))
        .rejects.toThrow('승인되지 않은 예약은 체크인할 수 없습니다');
    });

    it('이미 체크인된 예약은 다시 체크인할 수 없다', async () => {
      const existingCheckIn = new CheckIn({
        id: 'checkin-existing',
        reservationId: request.reservationId,
        deviceId: request.deviceId,
        checkInTime: new Date(),
        paymentStatus: PaymentStatusType.PENDING,
        paymentAmount: 30000,
        status: CheckInStatusType.CHECKED_IN,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      reservationRepository.findById.mockResolvedValue(mockReservation);
      checkInRepository.findByReservationId.mockResolvedValue(existingCheckIn);

      await expect(useCase.execute(request))
        .rejects.toThrow('이미 체크인된 예약입니다');
    });

    it('기기를 찾을 수 없으면 에러를 던진다', async () => {
      reservationRepository.findById.mockResolvedValue(mockReservation);
      checkInRepository.findByReservationId.mockResolvedValue(null);
      deviceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(request))
        .rejects.toThrow('기기를 찾을 수 없습니다');
    });

    it('사용할 수 없는 기기는 체크인할 수 없다', async () => {
      const unavailableDevice = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PC-01',
        status: DeviceStatus.maintenance(),
        location: 'A-1'
      });

      reservationRepository.findById.mockResolvedValue(mockReservation);
      checkInRepository.findByReservationId.mockResolvedValue(null);
      deviceRepository.findById.mockResolvedValue(unavailableDevice);

      await expect(useCase.execute(request))
        .rejects.toThrow('사용할 수 없는 기기입니다');
    });

    it('이미 사용 중인 기기는 체크인할 수 없다', async () => {
      const activeCheckIn = new CheckIn({
        id: 'checkin-active',
        reservationId: 'other-reservation',
        deviceId: request.deviceId,
        checkInTime: new Date(),
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      reservationRepository.findById.mockResolvedValue(mockReservation);
      checkInRepository.findByReservationId.mockResolvedValue(null);
      deviceRepository.findById.mockResolvedValue(mockDevice);
      checkInRepository.findActiveByDeviceId.mockResolvedValue(activeCheckIn);

      await expect(useCase.execute(request))
        .rejects.toThrow('이미 사용 중인 기기입니다');
    });
  });
});