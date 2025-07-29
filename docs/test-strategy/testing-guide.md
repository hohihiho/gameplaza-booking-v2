# 🧪 게임플라자 예약 시스템 - 테스트 가이드 및 베스트 프랙티스

## 📋 목차
1. [테스트 철학](#테스트-철학)
2. [테스트 전략 개요](#테스트-전략-개요)
3. [테스트 작성 가이드](#테스트-작성-가이드)
4. [테스트 실행 방법](#테스트-실행-방법)
5. [CI/CD 통합](#cicd-통합)
6. [성능 테스트](#성능-테스트)
7. [모바일 테스트](#모바일-테스트)
8. [트러블슈팅](#트러블슈팅)
9. [베스트 프랙티스](#베스트-프랙티스)

---

## 🎯 테스트 철학

### 핵심 원칙
- **모바일 퍼스트**: 99% 모바일 사용자를 위한 테스트
- **실용주의**: 비즈니스 가치에 집중한 테스트
- **자동화**: 반복 가능하고 신뢰할 수 있는 테스트
- **피드백 루프**: 빠른 피드백으로 품질 향상

### 테스트 피라미드
```
      E2E (10%)
     /         \
Integration (30%)
   /             \
Unit Tests (60%)
```

- **단위 테스트**: 비즈니스 로직, 유틸리티 함수
- **통합 테스트**: API, 데이터베이스 연동
- **E2E 테스트**: 핵심 사용자 시나리오

---

## 📊 테스트 전략 개요

### 우선순위 매트릭스

#### 🔴 Critical (위험도 10)
- 예약 생성/취소
- 24시간 제한 검증
- KST 시간대 처리
- 결제 시스템

#### 🟠 High (위험도 7-9)
- 사용자 인증
- 관리자 기능
- 모바일 성능

#### 🟡 Medium (위험도 4-6)
- 알림 시스템
- 검색/필터링
- 데이터 표시

#### 🟢 Low (위험도 1-3)
- UI/UX 일관성
- 접근성
- 에러 처리

### 커버리지 목표
- **전체 평균**: 80%
- **Critical 영역**: 95%
- **High Priority**: 90%
- **Medium Priority**: 80%
- **Low Priority**: 70%

---

## ✍️ 테스트 작성 가이드

### 1. 단위 테스트

#### 파일 구조
```
src/
├── domain/
│   ├── entities/
│   │   ├── reservation.entity.ts
│   │   └── __tests__/
│   │       └── reservation.entity.test.ts
├── application/
│   ├── use-cases/
│   │   ├── create-reservation.use-case.ts
│   │   └── __tests__/
│   │       └── create-reservation.use-case.test.ts
```

#### 작성 패턴
```typescript
// AAA 패턴 (Arrange, Act, Assert)
describe('ReservationEntity', () => {
  describe('생성', () => {
    it('유효한 데이터로 예약을 생성할 수 있다', () => {
      // Arrange
      const validData = {
        userId: 'user-123',
        deviceId: 'device-456',
        startTime: new Date(2025, 0, 15, 14, 0),
        endTime: new Date(2025, 0, 15, 16, 0),
      };

      // Act
      const reservation = new Reservation(validData);

      // Assert
      expect(reservation).toBeDefined();
      expect(reservation.userId).toBe('user-123');
      expect(reservation.status).toBe('pending');
    });
  });
});
```

### 2. 통합 테스트

#### API 테스트 예시
```typescript
describe('POST /api/v2/reservations', () => {
  beforeEach(() => {
    // 테스트 데이터 초기화
    jest.clearAllMocks();
  });

  it('유효한 예약을 생성한다', async () => {
    // Arrange
    const requestData = {
      deviceId: 'device-123',
      startTime: '2025-07-15T14:00:00',
      endTime: '2025-07-15T16:00:00',
    };

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null, // 기존 예약 없음
    });

    // Act
    const response = await POST(createMockRequest(requestData));
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.status).toBe('pending');
  });
});
```

### 3. E2E 테스트

#### 사용자 시나리오 테스트
```typescript
test('전체 예약 프로세스를 완료할 수 있다', async ({ page }) => {
  // 로그인
  await loginAsUser(page);

  // 기기 선택
  await page.goto('/devices');
  await page.click('[data-testid="device-card"]:first-child');

  // 시간 선택
  await page.click('[data-testid="time-slot-14-00"]');

  // 예약 확인
  await page.click('[data-testid="reserve-button"]');
  await page.click('[data-testid="confirm-button"]');

  // 성공 확인
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

---

## 🚀 테스트 실행 방법

### 로컬 환경

#### 기본 명령어
```bash
# 모든 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage

# 감시 모드
npm run test:watch

# E2E 테스트
npm run test:e2e

# 특정 테스트 파일
npm test -- reservation.test.ts

# 테스트 패턴 매칭
npm test -- --testNamePattern="예약 생성"
```

#### 로컬 테스트 스위트 실행
```bash
# 전체 테스트 스위트 (권장)
./scripts/test-local.sh

# 개별 테스트 타입
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:mobile
npm run test:performance
```

### 환경 변수 설정
```bash
# .env.test
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

---

## 🔄 CI/CD 통합

### GitHub Actions 워크플로우

#### PR 테스트 (test-ci.yml)
- 단위 테스트 + 커버리지
- 코드 품질 검사
- E2E 테스트 (멀티 브라우저)
- 모바일 테스트
- 성능 테스트 (Lighthouse)
- 보안 스캔

#### 야간 테스트 (nightly-tests.yml)
- 전체 회귀 테스트
- 부하 테스트
- 보안 감사
- 데이터베이스 무결성

### 테스트 실패 시 대응
1. **Critical 테스트 실패**: 즉시 개발 중단
2. **High Priority 실패**: 24시간 내 수정
3. **Medium/Low Priority**: 다음 스프린트 반영

---

## ⚡ 성능 테스트

### Lighthouse 기준
```yaml
모바일 (3G):
  Performance: ≥ 90점
  Accessibility: ≥ 95점
  Best Practices: ≥ 95점
  SEO: ≥ 90점

Core Web Vitals:
  LCP: ≤ 2.5초
  FID: ≤ 100ms
  CLS: ≤ 0.1
```

### 실행 방법
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --config=lighthouse.config.js

# 개별 페이지 테스트
lighthouse http://localhost:3000 --view

# CI 환경에서 자동 실행
npm run test:performance
```

---

## 📱 모바일 테스트

### 테스트 디바이스
- **iPhone 12/13/14** (iOS Safari)
- **Galaxy S21/S22** (Android Chrome)
- **iPhone SE** (소형 화면)
- **iPad Pro** (태블릿)

### 네트워크 조건
```typescript
// 3G 쓰로틀링
const networkConditions = {
  offline: false,
  downloadThroughput: 1.75 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 40,
};
```

### 실행 방법
```bash
# 모든 모바일 디바이스 테스트
npm run test:e2e:mobile

# 특정 디바이스
npx playwright test --project="iPhone 12"
npx playwright test --project="Galaxy S21"

# 3G 네트워크 시뮬레이션
npx playwright test --project="iPhone 12" --grep="3G"
```

---

## 🔧 트러블슈팅

### 자주 발생하는 문제

#### 1. 테스트 타임아웃
```bash
# Jest 타임아웃 늘리기
jest.setTimeout(30000);

# Playwright 타임아웃 설정
test.setTimeout(60000);
```

#### 2. Mock 설정 오류
```typescript
// Supabase mock 완전성 확인
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));
```

#### 3. E2E 테스트 불안정성
```typescript
// 안정적인 대기
await page.waitForSelector('[data-testid="element"]');
await page.waitForLoadState('networkidle');

// 재시도 메커니즘
await expect(async () => {
  await page.click('[data-testid="button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
}).toPass({ timeout: 10000 });
```

### 성능 문제 해결
```bash
# 병렬 테스트 수 조정
npm test -- --maxWorkers=4

# 테스트 파일 분할
npm test -- --shard=1/4
```

---

## 🏆 베스트 프랙티스

### 1. 테스트 작성 원칙

#### DO ✅
- **명확한 테스트 이름**: 한국어로 의도 명확히 표현
- **단일 책임**: 하나의 테스트는 하나의 동작만 검증
- **독립성**: 테스트 간 의존성 없이 독립적 실행
- **데이터 주도**: 테스트 데이터는 팩토리 함수 사용

#### DON'T ❌
- **구현 세부사항 테스트**: 내부 구현보다 동작에 집중
- **과도한 Mock**: 필요한 경우에만 Mock 사용
- **Magic Number**: 하드코딩된 값 대신 의미 있는 상수
- **Long Test**: 긴 테스트는 여러 개로 분할

### 2. 테스트 구조

#### Given-When-Then 패턴
```typescript
it('24시간 이내 예약만 허용한다', () => {
  // Given (Arrange)
  const now = new Date();
  const validTime = addHours(now, 23);
  const invalidTime = addHours(now, 25);

  // When (Act)
  const validResult = isWithin24Hours(validTime);
  const invalidResult = isWithin24Hours(invalidTime);

  // Then (Assert)
  expect(validResult).toBe(true);
  expect(invalidResult).toBe(false);
});
```

### 3. Mock 전략

#### 의존성 주입 활용
```typescript
class CreateReservationUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private deviceRepo: DeviceRepository,
    private timeValidator: TimeValidator,
  ) {}
}

// 테스트에서
const mockReservationRepo = createMockRepository();
const mockDeviceRepo = createMockRepository();
const mockTimeValidator = createMockValidator();

const useCase = new CreateReservationUseCase(
  mockReservationRepo,
  mockDeviceRepo,
  mockTimeValidator,
);
```

### 4. 테스트 데이터 관리

#### 팩토리 패턴
```typescript
// test-utils/factories/reservation.factory.ts
export const createReservation = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  deviceId: faker.string.uuid(),
  startTime: faker.date.future(),
  endTime: faker.date.future(),
  status: 'pending',
  ...overrides,
});

export const createKSTReservation = (date: Date, hour: number) => {
  const startTime = new Date(date);
  startTime.setHours(hour, 0, 0, 0);
  
  return createReservation({
    startTime,
    endTime: addHours(startTime, 2),
  });
};
```

### 5. E2E 테스트 안정성

#### 페이지 객체 모델
```typescript
// e2e/page-objects/reservation-page.ts
export class ReservationPage {
  constructor(private page: Page) {}

  async selectDevice(deviceName: string) {
    await this.page.click(`[data-testid="device-${deviceName}"]`);
  }

  async selectTimeSlot(time: string) {
    await this.page.click(`[data-testid="time-slot-${time}"]`);
  }

  async confirmReservation() {
    await this.page.click('[data-testid="confirm-button"]');
    await this.page.waitForSelector('[data-testid="success-message"]');
  }
}
```

### 6. 성능 테스트 최적화

#### 조건부 실행
```typescript
// 성능 테스트는 CI에서만 실행
const runPerformanceTests = process.env.CI === 'true';

test.describe('Performance Tests', () => {
  test.skip(!runPerformanceTests, 'Performance tests only run in CI');
  
  test('페이지 로드 성능', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
```

---

## 📚 추가 자료

### 문서 링크
- [테스트 우선순위 매트릭스](./test-priority-matrix.md)
- [테스트 환경 검토](./test-environment-review.md)
- [테스트 템플릿](./test-templates.md)
- [성능 테스트 기준](./performance-test-standards.md)
- [모바일 테스트 전략](./mobile-testing-strategy.md)
- [커버리지 개선 계획](./coverage-improvement-plan.md)

### 도구 및 라이브러리
- **Jest**: 단위/통합 테스트 프레임워크
- **Playwright**: E2E 테스트 및 브라우저 자동화
- **MSW**: API 모킹
- **Lighthouse**: 성능 측정
- **Testing Library**: React 컴포넌트 테스트

### 유용한 명령어
```bash
# 테스트 관련
npm run test                    # 전체 테스트
npm run test:coverage          # 커버리지 포함
npm run test:watch             # 감시 모드
npm run test:e2e               # E2E 테스트
npm run test:e2e:ui            # Playwright UI 모드
npm run test:e2e:debug         # 디버그 모드

# 품질 검사
npm run lint                   # ESLint
npm run type-check             # TypeScript 검사
npm run build                  # 빌드 테스트

# 로컬 테스트 스위트
./scripts/test-local.sh        # 전체 테스트 실행
```

---

## 🎯 마무리

이 가이드를 통해 게임플라자 예약 시스템의 품질을 체계적으로 관리할 수 있습니다. 

### 핵심 기억사항
1. **모바일 퍼스트**: 모든 테스트는 모바일 사용자 중심
2. **실용적 접근**: 비즈니스 가치에 집중한 테스트
3. **지속적 개선**: 커버리지와 품질 지표 모니터링
4. **자동화**: CI/CD를 통한 품질 게이트 운영

### 지원 및 문의
- **내부 문의**: QA 팀
- **기술 이슈**: GitHub Issues
- **긴급 상황**: 온콜 담당자

**Happy Testing! 🧪✨**