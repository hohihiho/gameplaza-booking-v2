import { CheckIn } from '../checkin';
import { PaymentStatusType } from '../../value-objects/payment-status';
import { PaymentMethodType } from '../../value-objects/payment-method';
import { CheckInStatusType } from '../../value-objects/checkin-status';

describe('CheckIn Entity', () => {
  const validProps = {
    id: 'checkin-123',
    reservationId: 'reservation-456',
    deviceId: 'device-789',
    checkInTime: new Date('2025-01-24T10:00:00'),
    paymentStatus: PaymentStatusType.PENDING,
    paymentAmount: 30000,
    status: CheckInStatusType.CHECKED_IN,
    createdAt: new Date('2025-01-24T10:00:00'),
    updatedAt: new Date('2025-01-24T10:00:00')
  };

  describe('생성', () => {
    it('유효한 속성으로 체크인을 생성할 수 있다', () => {
      const checkIn = new CheckIn(validProps);

      expect(checkIn.id).toBe('checkin-123');
      expect(checkIn.reservationId).toBe('reservation-456');
      expect(checkIn.deviceId).toBe('device-789');
      expect(checkIn.paymentAmount).toBe(30000);
      expect(checkIn.status.value).toBe(CheckInStatusType.CHECKED_IN);
    });

    it('create 메서드로 새 체크인을 생성할 수 있다', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 30); // 30분 후 (체크인 가능 시간 내)

      const checkIn = CheckIn.create({
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        paymentAmount: 30000,
        reservationStartTime: futureTime
      });

      expect(checkIn.reservationId).toBe('reservation-456');
      expect(checkIn.deviceId).toBe('device-789');
      expect(checkIn.paymentAmount).toBe(30000);
      expect(checkIn.status.isCheckedIn()).toBe(true);
      expect(checkIn.paymentStatus.isPending()).toBe(true);
    });

    it('체크인 가능 시간이 아니면 에러가 발생한다', () => {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 2); // 2시간 후

      expect(() => {
        CheckIn.create({
          reservationId: 'reservation-456',
          deviceId: 'device-789',
          paymentAmount: 30000,
          reservationStartTime: futureTime
        });
      }).toThrow();
    });
  });

  describe('결제 확인', () => {
    it('체크인 상태에서 결제를 확인할 수 있다', () => {
      const checkIn = new CheckIn(validProps);

      checkIn.confirmPayment(PaymentMethodType.CASH);

      expect(checkIn.paymentStatus.isCompleted()).toBe(true);
      expect(checkIn.paymentMethod?.value).toBe(PaymentMethodType.CASH);
      expect(checkIn.status.isInUse()).toBe(true);
      expect(checkIn.actualStartTime).toBeDefined();
    });

    it('체크인 상태가 아니면 결제를 확인할 수 없다', () => {
      const checkIn = new CheckIn({
        ...validProps,
        status: CheckInStatusType.IN_USE
      });

      expect(() => {
        checkIn.confirmPayment(PaymentMethodType.CASH);
      }).toThrow('체크인 상태에서만 결제를 확인할 수 있습니다');
    });
  });

  describe('시간 조정', () => {
    it('활성 상태에서 시간을 조정할 수 있다', () => {
      const checkIn = new CheckIn({
        ...validProps,
        status: CheckInStatusType.IN_USE
      });

      const newStartTime = new Date('2025-01-24T10:30:00');
      const newEndTime = new Date('2025-01-24T12:30:00');

      checkIn.adjustTime(newStartTime, newEndTime);

      expect(checkIn.actualStartTime).toEqual(newStartTime);
      expect(checkIn.actualEndTime).toEqual(newEndTime);
      expect(checkIn.actualDuration).toBe(120); // 2시간 = 120분
    });

    it('비활성 상태에서는 시간을 조정할 수 없다', () => {
      const checkIn = new CheckIn({
        ...validProps,
        status: CheckInStatusType.COMPLETED
      });

      expect(() => {
        checkIn.adjustTime(new Date());
      }).toThrow('활성 상태의 체크인만 시간을 조정할 수 있습니다');
    });
  });

  describe('금액 조정', () => {
    it('활성 상태에서 금액을 조정할 수 있다', () => {
      const checkIn = new CheckIn(validProps);

      checkIn.adjustAmount(25000, '할인 적용');

      expect(checkIn.adjustedAmount).toBe(25000);
      expect(checkIn.adjustmentReason).toBe('할인 적용');
      expect(checkIn.finalAmount).toBe(25000);
    });

    it('음수 금액으로 조정할 수 없다', () => {
      const checkIn = new CheckIn(validProps);

      expect(() => {
        checkIn.adjustAmount(-1000, '테스트');
      }).toThrow('금액은 0원 이상이어야 합니다');
    });

    it('조정 사유 없이 금액을 조정할 수 없다', () => {
      const checkIn = new CheckIn(validProps);

      expect(() => {
        checkIn.adjustAmount(25000, '');
      }).toThrow('조정 사유를 입력해주세요');
    });
  });

  describe('체크아웃', () => {
    it('사용중 상태에서 체크아웃할 수 있다', () => {
      const checkIn = new CheckIn({
        ...validProps,
        status: CheckInStatusType.IN_USE,
        actualStartTime: new Date('2025-01-24T10:00:00')
      });

      checkIn.checkOut();

      expect(checkIn.checkOutTime).toBeDefined();
      expect(checkIn.actualEndTime).toBeDefined();
      expect(checkIn.status.isCompleted()).toBe(true);
    });

    it('사용중이 아닌 상태에서는 체크아웃할 수 없다', () => {
      const checkIn = new CheckIn(validProps);

      expect(() => {
        checkIn.checkOut();
      }).toThrow('사용중 상태에서만 체크아웃할 수 있습니다');
    });
  });

  describe('취소', () => {
    it('체크인 상태에서 취소할 수 있다', () => {
      const checkIn = new CheckIn(validProps);

      checkIn.cancel('고객 요청');

      expect(checkIn.status.isCancelled()).toBe(true);
      expect(checkIn.paymentStatus.isCancelled()).toBe(true);
      expect(checkIn.notes).toBe('고객 요청');
    });

    it('사용중 상태에서도 취소할 수 있다', () => {
      const checkIn = new CheckIn({
        ...validProps,
        status: CheckInStatusType.IN_USE
      });

      checkIn.cancel();

      expect(checkIn.status.isCancelled()).toBe(true);
    });

    it('완료된 상태에서는 취소할 수 없다', () => {
      const checkIn = new CheckIn({
        ...validProps,
        status: CheckInStatusType.COMPLETED
      });

      expect(() => {
        checkIn.cancel();
      }).toThrow('취소할 수 없는 상태입니다');
    });
  });

  describe('헬퍼 메서드', () => {
    it('활성 상태 확인이 올바르게 동작한다', () => {
      const checkedIn = new CheckIn(validProps);
      expect(checkedIn.isActive()).toBe(true);

      const inUse = new CheckIn({
        ...validProps,
        status: CheckInStatusType.IN_USE
      });
      expect(inUse.isActive()).toBe(true);

      const completed = new CheckIn({
        ...validProps,
        status: CheckInStatusType.COMPLETED
      });
      expect(completed.isActive()).toBe(false);
    });

    it('결제 대기 상태 확인이 올바르게 동작한다', () => {
      const checkIn = new CheckIn(validProps);
      expect(checkIn.isWaitingPayment()).toBe(true);

      checkIn.confirmPayment(PaymentMethodType.CASH);
      expect(checkIn.isWaitingPayment()).toBe(false);
    });

    it('최종 금액이 올바르게 계산된다', () => {
      const checkIn = new CheckIn(validProps);
      expect(checkIn.finalAmount).toBe(30000);

      checkIn.adjustAmount(25000, '할인');
      expect(checkIn.finalAmount).toBe(25000);
    });
  });

  describe('toJSON', () => {
    it('엔티티를 JSON으로 변환할 수 있다', () => {
      const checkIn = new CheckIn(validProps);
      const json = checkIn.toJSON();

      expect(json).toEqual({
        id: 'checkin-123',
        reservationId: 'reservation-456',
        deviceId: 'device-789',
        checkInTime: validProps.checkInTime,
        checkOutTime: undefined,
        paymentStatus: PaymentStatusType.PENDING,
        paymentMethod: undefined,
        paymentAmount: 30000,
        adjustedAmount: undefined,
        adjustmentReason: undefined,
        actualStartTime: undefined,
        actualEndTime: undefined,
        status: CheckInStatusType.CHECKED_IN,
        notes: undefined,
        createdAt: validProps.createdAt,
        updatedAt: validProps.updatedAt
      });
    });
  });
});