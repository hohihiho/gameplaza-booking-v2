import { CheckInTime } from '../checkin-time';

describe('CheckInTime Value Object', () => {
  describe('생성', () => {
    it('유효한 예약 시작 시간으로 생성할 수 있다', () => {
      const startTime = new Date('2025-01-24T15:00:00');
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.reservationStartTime).toEqual(startTime);
    });

    it('유효하지 않은 시간으로 생성하면 에러가 발생한다', () => {
      expect(() => {
        CheckInTime.create(null as any);
      }).toThrow('유효한 예약 시작 시간이 필요합니다');

      expect(() => {
        CheckInTime.create('invalid' as any);
      }).toThrow('유효한 예약 시작 시간이 필요합니다');
    });
  });

  describe('체크인 가능 여부', () => {
    it('예약 시작 1시간 전부터 체크인 가능하다', () => {
      const now = new Date('2025-01-24T14:00:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 1시간 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.canCheckIn(now)).toBe(true);
    });

    it('예약 시작 1시간 이상 전에는 체크인 불가능하다', () => {
      const now = new Date('2025-01-24T13:00:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 2시간 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.canCheckIn(now)).toBe(false);
    });

    it('예약 시작 시간이 지나도 체크인 가능하다', () => {
      const now = new Date('2025-01-24T16:00:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 1시간 전
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.canCheckIn(now)).toBe(true);
    });
  });

  describe('체크인 가능 시간', () => {
    it('체크인 가능 시작 시간을 올바르게 계산한다', () => {
      const startTime = new Date('2025-01-24T15:00:00');
      const checkInTime = CheckInTime.create(startTime);
      const availableTime = checkInTime.getCheckInAvailableTime();

      expect(availableTime).toEqual(new Date('2025-01-24T14:00:00'));
    });

    it('체크인 가능 시간 문자열을 올바르게 반환한다', () => {
      const startTime = new Date('2025-01-24T15:30:00');
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getCheckInAvailableTimeString()).toBe('14:30');
    });
  });

  describe('남은 시간 계산', () => {
    it('체크인 가능까지 남은 시간을 분 단위로 계산한다', () => {
      const now = new Date('2025-01-24T12:00:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 3시간 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getMinutesUntilCheckInAvailable(now)).toBe(120); // 2시간 = 120분
    });

    it('이미 체크인 가능한 경우 0을 반환한다', () => {
      const now = new Date('2025-01-24T14:30:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 30분 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getMinutesUntilCheckInAvailable(now)).toBe(0);
    });
  });

  describe('상태 메시지', () => {
    it('체크인 가능한 경우 적절한 메시지를 반환한다', () => {
      const now = new Date('2025-01-24T14:30:00');
      const startTime = new Date('2025-01-24T15:00:00');
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getCheckInStatusMessage(now)).toBe('체크인 가능');
    });

    it('1시간 미만 남은 경우 분 단위 메시지를 반환한다', () => {
      const now = new Date('2025-01-24T13:30:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 1시간 30분 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getCheckInStatusMessage(now)).toBe('30분 후 체크인 가능');
    });

    it('1시간 이상 남은 경우 시간 단위 메시지를 반환한다', () => {
      const now = new Date('2025-01-24T12:00:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 3시간 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getCheckInStatusMessage(now)).toBe('2시간 후 체크인 가능');
    });

    it('시간과 분이 모두 있는 경우 복합 메시지를 반환한다', () => {
      const now = new Date('2025-01-24T12:20:00');
      const startTime = new Date('2025-01-24T15:00:00'); // 2시간 40분 후
      const checkInTime = CheckInTime.create(startTime);

      expect(checkInTime.getCheckInStatusMessage(now)).toBe('1시간 40분 후 체크인 가능');
    });
  });
});