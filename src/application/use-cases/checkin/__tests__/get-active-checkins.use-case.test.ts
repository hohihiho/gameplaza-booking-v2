import { GetActiveCheckInsUseCase } from '../get-active-checkins.use-case';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface';
import { DeviceRepository } from '@/src/domain/repositories/device-repository.interface';
import { UserRepository } from '@/src/domain/repositories/user-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';

describe('GetActiveCheckInsUseCase', () => {
  let useCase: GetActiveCheckInsUseCase;
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

    useCase = new GetActiveCheckInsUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository,
      userRepository
    );
  });

  describe('execute', () => {
    const now = new Date();

    const mockActiveCheckIn1 = new CheckIn({
      id: 'checkin-1',
      reservationId: 'reservation-1',
      deviceId: 'device-1',
      checkInTime: now,
      paymentStatus: PaymentStatusType.COMPLETED,
      paymentMethod: PaymentMethodType.CASH,
      paymentAmount: 30000,
      status: CheckInStatusType.IN_USE,
      actualStartTime: now,
      createdAt: now,
      updatedAt: now
    });

    const mockActiveCheckIn2 = new CheckIn({
      id: 'checkin-2',
      reservationId: 'reservation-2',
      deviceId: 'device-2',
      checkInTime: now,
      paymentStatus: PaymentStatusType.PENDING,
      paymentAmount: 25000,
      status: CheckInStatusType.CHECKED_IN,
      createdAt: now,
      updatedAt: now
    });

    it('전체 활성 체크인 목록을 조회한다', async () => {
      checkInRepository.findActiveCheckIns.mockResolvedValue([
        mockActiveCheckIn1,
        mockActiveCheckIn2
      ]);

      // Mock 관련 정보
      reservationRepository.findById
        .mockResolvedValueOnce({ id: 'reservation-1', userId: 'user-1', reservationNumber: 'GP-001' })
        .mockResolvedValueOnce({ id: 'reservation-2', userId: 'user-2', reservationNumber: 'GP-002' });

      deviceRepository.findById
        .mockResolvedValueOnce({ id: 'device-1', deviceNumber: 'PC-01' })
        .mockResolvedValueOnce({ id: 'device-2', deviceNumber: 'PC-02' });

      userRepository.findById
        .mockResolvedValueOnce({ id: 'user-1', fullName: '사용자1' })
        .mockResolvedValueOnce({ id: 'user-2', fullName: '사용자2' });

      const result = await useCase.execute({ includeWaitingPayment: true });

      expect(result.data.checkIns).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
      expect(result.data.checkIns[0].userName).toBe('사용자1');
      expect(result.data.checkIns[1].userName).toBe('사용자2');
    });

    it('특정 기기의 활성 체크인만 조회한다', async () => {
      checkInRepository.findActiveByDeviceId.mockResolvedValue(mockActiveCheckIn1);

      reservationRepository.findById.mockResolvedValue({
        id: 'reservation-1',
        userId: 'user-1',
        reservationNumber: 'GP-001'
      });

      deviceRepository.findById.mockResolvedValue({
        id: 'device-1',
        deviceNumber: 'PC-01'
      });

      userRepository.findById.mockResolvedValue({
        id: 'user-1',
        fullName: '사용자1'
      });

      const result = await useCase.execute({ deviceId: 'device-1' });

      expect(checkInRepository.findActiveByDeviceId).toHaveBeenCalledWith('device-1');
      expect(result.data.checkIns).toHaveLength(1);
      expect(result.data.checkIns[0].deviceNumber).toBe('PC-01');
    });

    it('결제 대기 중인 체크인을 제외하고 조회한다', async () => {
      checkInRepository.findActiveCheckIns.mockResolvedValue([
        mockActiveCheckIn1,
        mockActiveCheckIn2
      ]);

      reservationRepository.findById.mockResolvedValue({
        id: 'reservation-1',
        userId: 'user-1',
        reservationNumber: 'GP-001'
      });

      deviceRepository.findById.mockResolvedValue({
        id: 'device-1',
        deviceNumber: 'PC-01'
      });

      userRepository.findById.mockResolvedValue({
        id: 'user-1',
        fullName: '사용자1'
      });

      const result = await useCase.execute({ includeWaitingPayment: false });

      expect(result.data.checkIns).toHaveLength(1);
      expect(result.data.checkIns[0].paymentStatus).toBe(PaymentStatusType.COMPLETED);
    });

    it('결제 대기 중인 체크인을 포함하여 조회한다', async () => {
      checkInRepository.findActiveCheckIns.mockResolvedValue([
        mockActiveCheckIn1,
        mockActiveCheckIn2
      ]);

      // Mock 관련 정보
      reservationRepository.findById
        .mockResolvedValueOnce({ id: 'reservation-1', userId: 'user-1' })
        .mockResolvedValueOnce({ id: 'reservation-2', userId: 'user-2' });

      deviceRepository.findById
        .mockResolvedValueOnce({ id: 'device-1', deviceNumber: 'PC-01' })
        .mockResolvedValueOnce({ id: 'device-2', deviceNumber: 'PC-02' });

      userRepository.findById
        .mockResolvedValueOnce({ id: 'user-1', fullName: '사용자1' })
        .mockResolvedValueOnce({ id: 'user-2', fullName: '사용자2' });

      const result = await useCase.execute({ includeWaitingPayment: true });

      expect(result.data.checkIns).toHaveLength(2);
    });

    it('활성 체크인이 없을 때 빈 배열을 반환한다', async () => {
      checkInRepository.findActiveCheckIns.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.data.checkIns).toHaveLength(0);
      expect(result.data.totalCount).toBe(0);
    });

    it('관련 정보가 없어도 체크인 요약 정보를 반환한다', async () => {
      checkInRepository.findActiveCheckIns.mockResolvedValue([mockActiveCheckIn1]);

      reservationRepository.findById.mockResolvedValue(null);
      deviceRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({});

      expect(result.data.checkIns).toHaveLength(1);
      expect(result.data.checkIns[0].userName).toBe('Unknown');
      expect(result.data.checkIns[0].deviceNumber).toBe('Unknown');
      expect(result.data.checkIns[0].reservationNumber).toBe('Unknown');
    });

    it('중복된 사용자 ID를 효율적으로 처리한다', async () => {
      const checkIn3 = new CheckIn({
        id: 'checkin-3',
        reservationId: 'reservation-3',
        deviceId: 'device-3',
        checkInTime: now,
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 20000,
        status: CheckInStatusType.IN_USE,
        actualStartTime: now,
        createdAt: now,
        updatedAt: now
      });

      checkInRepository.findActiveCheckIns.mockResolvedValue([
        mockActiveCheckIn1,
        checkIn3
      ]);

      // 같은 사용자 ID를 가진 예약들
      reservationRepository.findById
        .mockResolvedValueOnce({ id: 'reservation-1', userId: 'user-1' })
        .mockResolvedValueOnce({ id: 'reservation-3', userId: 'user-1' });

      deviceRepository.findById
        .mockResolvedValueOnce({ id: 'device-1' })
        .mockResolvedValueOnce({ id: 'device-3' });

      userRepository.findById.mockResolvedValue({ id: 'user-1', fullName: '사용자1' });

      const result = await useCase.execute({});

      // 사용자 정보는 한 번만 조회되어야 함
      expect(userRepository.findById).toHaveBeenCalledTimes(1);
      expect(result.data.checkIns).toHaveLength(2);
      expect(result.data.checkIns[0].userName).toBe('사용자1');
      expect(result.data.checkIns[1].userName).toBe('사용자1');
    });
  });
});