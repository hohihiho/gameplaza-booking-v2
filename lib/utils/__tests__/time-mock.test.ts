import { setMockDate, getNow } from '../kst-date';

describe('시간 모킹 테스트', () => {
  afterEach(() => {
    // 테스트 후 모킹 해제
    setMockDate(null);
    delete process.env.MOCK_DATE;
  });

  test('setMockDate로 시간을 모킹할 수 있다', () => {
    const mockDate = new Date('2025-08-15T10:00:00+09:00');
    setMockDate(mockDate);
    
    expect(getNow()).toEqual(mockDate);
  });

  test('환경 변수로 시간을 모킹할 수 있다', () => {
    process.env.MOCK_DATE = '2025-08-15T10:00:00+09:00';
    
    const now = getNow();
    expect(now.getFullYear()).toBe(2025);
    expect(now.getMonth()).toBe(7); // 8월 (0부터 시작)
    expect(now.getDate()).toBe(15);
  });

  test('모킹이 해제되면 실제 시간을 반환한다', () => {
    const beforeMock = new Date();
    
    // 시간 모킹
    setMockDate(new Date('2025-12-25T00:00:00+09:00'));
    expect(getNow().getMonth()).toBe(11); // 12월
    
    // 모킹 해제
    setMockDate(null);
    const afterMock = getNow();
    
    // 실제 시간과 비슷해야 함 (1초 이내)
    expect(Math.abs(afterMock.getTime() - beforeMock.getTime())).toBeLessThan(1000);
  });
});