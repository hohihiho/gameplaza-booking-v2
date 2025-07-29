/**
 * 🧪 Jest 설정 테스트용 샘플
 * 설정이 올바르게 작동하는지 확인하는 기본 테스트
 */

describe('🔧 Jest 설정 검증', () => {
  test('기본 JavaScript 테스트가 작동하는가', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBeTruthy();
  });

  test('환경 변수가 정의되어 있는가', () => {
    // 실제 환경 변수가 설정되어 있는지만 확인
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('Mock 함수가 정상 작동하는가', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('비동기 테스트가 작동하는가', async () => {
    const promise = Promise.resolve('async result');
    const result = await promise;
    
    expect(result).toBe('async result');
  });
});