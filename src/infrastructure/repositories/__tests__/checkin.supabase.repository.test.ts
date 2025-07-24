import { CheckInSupabaseRepository } from '../checkin.supabase.repository';
import { CheckIn } from '@/src/domain/entities/checkin';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';

describe('CheckInSupabaseRepository', () => {
  let repository: CheckInSupabaseRepository;
  let mockSupabase: any;

  const mockCheckInData = {
    id: 'checkin-123',
    reservation_id: 'reservation-456',
    device_id: 'device-789',
    check_in_time: '2025-01-24T10:00:00.000Z',
    check_out_time: null,
    payment_status: PaymentStatusType.PENDING,
    payment_method: null,
    payment_amount: 30000,
    adjusted_amount: null,
    adjustment_reason: null,
    actual_start_time: null,
    actual_end_time: null,
    status: CheckInStatusType.CHECKED_IN,
    notes: null,
    created_at: '2025-01-24T10:00:00.000Z',
    updated_at: '2025-01-24T10:00:00.000Z'
  };

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    repository = new CheckInSupabaseRepository(mockSupabase);
  });

  describe('create', () => {
    it('새로운 체크인을 생성할 수 있다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockCheckInData,
        error: null
      });

      const checkIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: new Date('2025-01-24T10:00:00'),
        paymentStatus: PaymentStatusType.PENDING,
        paymentAmount: 30000,
        status: CheckInStatusType.CHECKED_IN,
        createdAt: new Date('2025-01-24T10:00:00'),
        updatedAt: new Date('2025-01-24T10:00:00')
      });

      const result = await repository.create(checkIn);

      expect(mockSupabase.from).toHaveBeenCalledWith('check_ins');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result.id).toBe('checkin-123');
      expect(result.reservationId).toBe('reservation-456');
    });

    it('생성 실패 시 에러를 던진다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: '데이터베이스 오류' }
      });

      const checkIn = new CheckIn({
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

      await expect(repository.create(checkIn))
        .rejects.toThrow('체크인 생성 실패: 데이터베이스 오류');
    });
  });

  describe('update', () => {
    it('체크인을 업데이트할 수 있다', async () => {
      const updatedData = {
        ...mockCheckInData,
        payment_status: PaymentStatusType.COMPLETED,
        payment_method: PaymentMethodType.CASH,
        status: CheckInStatusType.IN_USE
      };

      mockSupabase.single.mockResolvedValue({
        data: updatedData,
        error: null
      });

      const checkIn = new CheckIn({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: new Date('2025-01-24T10:00:00'),
        paymentStatus: PaymentStatusType.COMPLETED,
        paymentMethod: PaymentMethodType.CASH,
        paymentAmount: 30000,
        status: CheckInStatusType.IN_USE,
        createdAt: new Date('2025-01-24T10:00:00'),
        updatedAt: new Date()
      });

      const result = await repository.update(checkIn);

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'checkin-123');
      expect(result.paymentStatus.value).toBe(PaymentStatusType.COMPLETED);
      expect(result.status.value).toBe(CheckInStatusType.IN_USE);
    });
  });

  describe('findById', () => {
    it('ID로 체크인을 조회할 수 있다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockCheckInData,
        error: null
      });

      const result = await repository.findById('checkin-123');

      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'checkin-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('checkin-123');
    });

    it('존재하지 않는 ID로 조회 시 null을 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await repository.findById('not-exist');

      expect(result).toBeNull();
    });
  });

  describe('findByReservationId', () => {
    it('예약 ID로 체크인을 조회할 수 있다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockCheckInData,
        error: null
      });

      const result = await repository.findByReservationId('reservation-456');

      expect(mockSupabase.eq).toHaveBeenCalledWith('reservation_id', 'reservation-456');
      expect(result).not.toBeNull();
      expect(result?.reservationId).toBe('reservation-456');
    });
  });

  describe('findActiveCheckIns', () => {
    it('활성 체크인 목록을 조회할 수 있다', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [mockCheckInData],
        error: null
      });

      const result = await repository.findActiveCheckIns();

      expect(mockSupabase.in).toHaveBeenCalledWith('status', [
        CheckInStatusType.CHECKED_IN,
        CheckInStatusType.IN_USE
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('checkin-123');
    });
  });

  describe('findByDateRange', () => {
    it('날짜 범위로 체크인을 조회할 수 있다', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [mockCheckInData],
        error: null
      });

      const startDate = new Date('2025-01-24T00:00:00');
      const endDate = new Date('2025-01-24T23:59:59');

      const result = await repository.findByDateRange(startDate, endDate);

      expect(mockSupabase.gte).toHaveBeenCalledWith('check_in_time', startDate.toISOString());
      expect(mockSupabase.lte).toHaveBeenCalledWith('check_in_time', endDate.toISOString());
      expect(result).toHaveLength(1);
    });
  });

  describe('findActiveByDeviceId', () => {
    it('기기의 활성 체크인을 조회할 수 있다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockCheckInData,
        error: null
      });

      const result = await repository.findActiveByDeviceId('device-789');

      expect(mockSupabase.eq).toHaveBeenCalledWith('device_id', 'device-789');
      expect(mockSupabase.in).toHaveBeenCalledWith('status', [
        CheckInStatusType.CHECKED_IN,
        CheckInStatusType.IN_USE
      ]);
      expect(result).not.toBeNull();
      expect(result?.deviceId).toBe('device-789');
    });

    it('활성 체크인이 없으면 null을 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await repository.findActiveByDeviceId('device-789');

      expect(result).toBeNull();
    });
  });

  describe('findPendingPayments', () => {
    it('결제 대기 중인 체크인 목록을 조회할 수 있다', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [mockCheckInData],
        error: null
      });

      const result = await repository.findPendingPayments();

      expect(mockSupabase.eq).toHaveBeenCalledWith('payment_status', 'pending');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', CheckInStatusType.CHECKED_IN);
      expect(result).toHaveLength(1);
      expect(result[0].paymentStatus.isPending()).toBe(true);
    });
  });
});