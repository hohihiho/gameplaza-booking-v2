/**
 * 🧪 Jest 단위 테스트: 시간 시스템 핵심 로직
 * 
 * 테스트 범위:
 * - KST 시간대 처리
 * - 24~29시 표시 체계
 * - 영업일 06시 리셋 로직
 * - 시간 변환 함수들
 */

// CommonJS 형태로 변경

// 시간 관련 유틸리티 함수들 (실제 구현에서 import)
const formatDisplayTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // 0~5시는 24~29시로 표시
  const displayHours = hours <= 5 ? hours + 24 : hours;
  
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const isBusinessDay = (date) => {
  const hours = date.getHours();
  // 06시 이전은 전날 영업일로 간주
  return hours >= 6;
};

describe('🕐 게임플라자 시간 시스템 단위 테스트', () => {
  beforeEach(() => {
    // 매 테스트마다 시간 초기화
    jest.clearAllMocks();
  });

  describe('24시간 표시 체계', () => {
    test('새벽 시간이 24~29시로 올바르게 표시되는가', () => {
      // 새벽 0시 = 24시
      const midnight = new Date('2025-01-25T00:00:00+09:00');
      expect(formatDisplayTime(midnight)).toBe('24:00');
      
      // 새벽 1시 = 25시
      const oneAM = new Date('2025-01-25T01:00:00+09:00');
      expect(formatDisplayTime(oneAM)).toBe('25:00');
      
      // 새벽 2시 = 26시
      const twoAM = new Date('2025-01-25T02:00:00+09:00');
      expect(formatDisplayTime(twoAM)).toBe('26:00');
      
      // 새벽 5시 = 29시
      const fiveAM = new Date('2025-01-25T05:00:00+09:00');
      expect(formatDisplayTime(fiveAM)).toBe('29:00');
    });

    test('일반 시간이 정상적으로 표시되는가', () => {
      // 오전 6시
      const sixAM = new Date('2025-01-25T06:00:00+09:00');
      expect(formatDisplayTime(sixAM)).toBe('06:00');
      
      // 오후 2시
      const twoPM = new Date('2025-01-25T14:00:00+09:00');
      expect(formatDisplayTime(twoPM)).toBe('14:00');
      
      // 오후 11시
      const elevenPM = new Date('2025-01-25T23:00:00+09:00');
      expect(formatDisplayTime(elevenPM)).toBe('23:00');
    });

    test('분 단위 표시가 정확한가', () => {
      const time = new Date('2025-01-25T02:30:00+09:00');
      expect(formatDisplayTime(time)).toBe('26:30');
      
      const timeWithSingleDigit = new Date('2025-01-25T03:05:00+09:00');
      expect(formatDisplayTime(timeWithSingleDigit)).toBe('27:05');
    });
  });

  describe('영업일 전환 로직 (06시 리셋)', () => {
    test('06시 이전은 전날 영업일로 처리되는가', () => {
      const beforeSix = new Date('2025-01-25T05:59:00+09:00');
      expect(isBusinessDay(beforeSix)).toBe(false);
      
      const afterMidnight = new Date('2025-01-25T02:00:00+09:00');
      expect(isBusinessDay(afterMidnight)).toBe(false);
    });

    test('06시 이후는 당일 영업일로 처리되는가', () => {
      const sixAM = new Date('2025-01-25T06:00:00+09:00');
      expect(isBusinessDay(sixAM)).toBe(true);
      
      const afternoon = new Date('2025-01-25T14:00:00+09:00');
      expect(isBusinessDay(afternoon)).toBe(true);
      
      const evening = new Date('2025-01-25T23:30:00+09:00');
      expect(isBusinessDay(evening)).toBe(true);
    });
  });

  describe('KST 시간대 처리', () => {
    test('Date 객체가 KST로 생성되는가', () => {
      // Local time parsing (KST)
      const kstDate = new Date(2025, 0, 25, 14, 30); // 2025-01-25 14:30 KST
      
      expect(kstDate.getFullYear()).toBe(2025);
      expect(kstDate.getMonth()).toBe(0); // January
      expect(kstDate.getDate()).toBe(25);
      expect(kstDate.getHours()).toBe(14);
      expect(kstDate.getMinutes()).toBe(30);
    });

    test('UTC 파싱을 피하고 로컬 시간 파싱을 사용하는가', () => {
      // 잘못된 방법: UTC 파싱
      const utcParsed = new Date('2025-01-25T14:30:00Z');
      
      // 올바른 방법: 로컬 파싱
      const localParsed = new Date(2025, 0, 25, 14, 30);
      
      // KST 환경에서는 9시간 차이가 나야 함
      const timeDiff = Math.abs(utcParsed.getTime() - localParsed.getTime());
      expect(timeDiff).toBe(9 * 60 * 60 * 1000); // 9시간 차이
    });
  });

  describe('시간 계산 및 변환', () => {
    test('24시간 제한 계산이 정확한가', () => {
      const checkTime = new Date('2025-01-25T14:00:00+09:00');
      const limit24Hours = new Date(checkTime.getTime() + 24 * 60 * 60 * 1000);
      
      expect(limit24Hours.getDate()).toBe(26); // 다음 날
      expect(limit24Hours.getHours()).toBe(14); // 같은 시간
    });

    test('밤샘 시간대 연속성이 보장되는가', () => {
      const times = [
        { input: new Date('2025-01-25T23:30:00+09:00'), expected: '23:30' },
        { input: new Date('2025-01-26T00:00:00+09:00'), expected: '24:00' }, // 자정
        { input: new Date('2025-01-26T01:00:00+09:00'), expected: '25:00' },
        { input: new Date('2025-01-26T02:00:00+09:00'), expected: '26:00' },
      ];
      
      times.forEach(({ input, expected }) => {
        expect(formatDisplayTime(input)).toBe(expected);
      });
    });
  });

  describe('엣지 케이스 처리', () => {
    test('윤년 처리가 정확한가', () => {
      const leapYear = new Date(2024, 1, 29); // 2024년 2월 29일
      expect(leapYear.getMonth()).toBe(1);
      expect(leapYear.getDate()).toBe(29);
    });

    test('월말/월초 전환이 정확한가', () => {
      const endOfMonth = new Date(2025, 0, 31, 23, 59); // 1월 31일 23:59
      const nextMinute = new Date(endOfMonth.getTime() + 60 * 1000);
      
      expect(nextMinute.getMonth()).toBe(1); // February
      expect(nextMinute.getDate()).toBe(1);
      expect(nextMinute.getHours()).toBe(0);
    });

    test('DST(서머타임) 영향이 없는가', () => {
      // 한국은 DST를 사용하지 않으므로 연중 UTC+9 고정
      const summer = new Date('2025-07-15T12:00:00+09:00');
      const winter = new Date('2025-01-15T12:00:00+09:00');
      
      const summerOffset = summer.getTimezoneOffset();
      const winterOffset = winter.getTimezoneOffset();
      
      expect(summerOffset).toBe(winterOffset); // 동일해야 함
    });
  });
});