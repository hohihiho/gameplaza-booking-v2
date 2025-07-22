# 🎯 7대 QA 원칙 & TDD 전략

## 📋 7대 소프트웨어 테스팅 원칙 (ISTQB)

### 1️⃣ 테스팅은 결함의 존재를 보여준다 (Testing shows presence of defects)
- ✅ **원칙**: 테스팅은 결함이 없음을 증명할 수 없고, 결함의 존재만 증명할 수 있다
- 🎮 **게임플라자 적용**:
  - 버그 추적 시스템으로 발견된 결함 기록
  - 테스트를 통과해도 100% 무결함을 보장하지 않음을 인지

### 2️⃣ 완벽한 테스팅은 불가능하다 (Exhaustive testing is impossible)
- ✅ **원칙**: 모든 입력과 조건의 조합을 테스트하는 것은 불가능
- 🎮 **게임플라자 적용**:
  - 리스크 기반 테스팅: 핵심 기능 우선순위
  - 예약 시스템, 결제 프로세스, 인증에 집중

### 3️⃣ 조기 테스팅 (Early testing)
- ✅ **원칙**: 개발 초기 단계부터 테스팅 시작
- 🎮 **게임플라자 적용**:
  - TDD 방식으로 테스트 먼저 작성
  - 기획 단계부터 테스트 시나리오 준비

### 4️⃣ 결함 집중 (Defect clustering)
- ✅ **원칙**: 결함의 대부분은 소수의 모듈에 집중
- 🎮 **게임플라자 적용**:
  - 버그 통계 분석: 예약 시스템(40%), 관리자 기능(30%)
  - 고위험 모듈에 테스트 자원 집중

### 5️⃣ 살충제 패러독스 (Pesticide paradox)
- ✅ **원칙**: 동일한 테스트를 반복하면 새로운 결함을 찾지 못함
- 🎮 **게임플라자 적용**:
  - 테스트 케이스 정기적 검토 및 업데이트
  - 새로운 시나리오와 엣지 케이스 추가

### 6️⃣ 테스팅은 정황에 의존적 (Testing is context dependent)
- ✅ **원칙**: 소프트웨어 유형에 따라 테스팅 방법이 다름
- 🎮 **게임플라자 적용**:
  - 모바일 퍼스트: 모바일 환경 중심 테스트
  - 24시간 운영: 시간대별 시나리오 테스트
  - 실시간 동기화: 동시성 테스트 강화

### 7️⃣ 오류 부재의 오류 (Absence-of-errors fallacy)
- ✅ **원칙**: 결함이 없어도 사용자 요구를 충족하지 못하면 무의미
- 🎮 **게임플라자 적용**:
  - 사용자 피드백 기반 테스트
  - 비즈니스 요구사항 검증
  - UX 테스트 포함

## 🔄 TDD (Test-Driven Development) 현황 점검

### 현재 프로젝트 TDD 적용 현황

```bash
# 테스트 파일 검색 결과
❌ 프로젝트 테스트 파일: 0개
❌ 테스트 스크립트: 없음
❌ 테스트 프레임워크: 미설치
```

### 🚨 문제점
1. **TDD 미적용**: 코드 작성 후 테스트 작성 (또는 테스트 없음)
2. **테스트 환경 부재**: Jest, React Testing Library 미설치
3. **테스트 문화 부재**: 테스트 없이 기능 구현

### 🎯 TDD 도입 전략

#### 1. Red-Green-Refactor 사이클

```typescript
// 1. RED: 실패하는 테스트 작성
describe('예약 생성', () => {
  it('24시간 제한을 초과하면 에러를 반환한다', () => {
    const result = createReservation({
      startTime: '10:00',
      endTime: '11:00', // 다음날
      duration: 25 // 25시간
    });
    expect(result.error).toBe('24시간 제한을 초과했습니다');
  });
});

// 2. GREEN: 테스트 통과하는 최소 코드
function createReservation(data) {
  if (data.duration > 24) {
    return { error: '24시간 제한을 초과했습니다' };
  }
  // ... 예약 생성 로직
}

// 3. REFACTOR: 코드 개선
function createReservation(data) {
  const validationResult = validateReservation(data);
  if (!validationResult.isValid) {
    return { error: validationResult.error };
  }
  // ... 예약 생성 로직
}
```

## 📊 테스트 피라미드 전략

```
         /\
        /  \  E2E Tests (10%)
       /____\  - 주요 사용자 시나리오
      /      \ Integration Tests (20%)
     /________\  - API 테스트, DB 연동
    /          \ Unit Tests (70%)
   /____________\  - 비즈니스 로직, 유틸리티
```

## 🔧 즉시 실행 가능한 TDD 액션 플랜

### Phase 1: 테스트 환경 구축 (1일)
```bash
# 1. 테스트 프레임워크 설치
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @types/jest ts-jest

# 2. Jest 설정
# jest.config.js 생성

# 3. 테스트 스크립트 추가
# package.json에 추가:
# "test": "jest",
# "test:watch": "jest --watch",
# "test:coverage": "jest --coverage"
```

### Phase 2: 핵심 유틸리티 TDD (3일)
```typescript
// 1. 시간 처리 유틸리티
// __tests__/utils/time.test.ts
describe('formatTime24Plus', () => {
  it('5시를 29시로 변환한다', () => {
    expect(formatTime24Plus('05:00')).toBe('29:00');
  });
});

// 2. 예약 검증 로직
// __tests__/utils/reservation.test.ts
describe('예약 유효성 검증', () => {
  it('중복 예약을 감지한다', () => {
    // 테스트 구현
  });
});

// 3. 금액 계산 로직
// __tests__/utils/payment.test.ts
describe('결제 금액 계산', () => {
  it('시간당 요금을 정확히 계산한다', () => {
    // 테스트 구현
  });
});
```

### Phase 3: 컴포넌트 TDD (5일)
```typescript
// 예약 폼 컴포넌트
// __tests__/components/ReservationForm.test.tsx
describe('ReservationForm', () => {
  it('필수 필드가 비어있으면 제출 버튼이 비활성화된다', () => {
    // 테스트 구현
  });
  
  it('24시간 초과 시 에러 메시지를 표시한다', () => {
    // 테스트 구현
  });
});
```

### Phase 4: API 테스트 (3일)
```typescript
// API 라우트 테스트
// __tests__/api/reservations.test.ts
describe('POST /api/reservations', () => {
  it('유효한 예약을 생성한다', async () => {
    // 테스트 구현
  });
  
  it('인증되지 않은 요청을 거부한다', async () => {
    // 테스트 구현
  });
});
```

### Phase 5: E2E 테스트 (3일)
```typescript
// Playwright E2E 테스트
// e2e/reservation-flow.spec.ts
test('전체 예약 프로세스', async ({ page }) => {
  // 1. 로그인
  // 2. 기기 선택
  // 3. 시간 선택
  // 4. 예약 확인
  // 5. 예약 성공 확인
});
```

## 📈 테스트 메트릭스 목표

### 단기 목표 (1개월)
- 코드 커버리지: 40%
- 핵심 기능 테스트: 100%
- 버그 발견율: 30% 향상

### 중기 목표 (3개월)
- 코드 커버리지: 70%
- 모든 API 엔드포인트 테스트
- E2E 주요 시나리오 자동화

### 장기 목표 (6개월)
- 코드 커버리지: 80%+
- CI/CD 파이프라인 통합
- 성능 테스트 자동화

## 🚀 TDD 문화 정착 방안

### 1. 팀 교육
- TDD 워크샵 진행
- 페어 프로그래밍으로 TDD 실습
- 코드 리뷰 시 테스트 필수 확인

### 2. 프로세스 개선
- PR 시 테스트 커버리지 체크
- 테스트 없는 코드 머지 금지
- 테스트 작성 시간 스프린트에 반영

### 3. 도구 지원
- VS Code 테스트 익스텐션 설치
- 테스트 커버리지 리포트 자동화
- 테스트 실행 시간 모니터링

## ⚠️ 주의사항

### TDD 안티패턴 피하기
1. **테스트를 위한 테스트**: 비즈니스 가치 없는 테스트 작성 금지
2. **깨지기 쉬운 테스트**: 구현 세부사항이 아닌 동작 테스트
3. **느린 테스트**: 단위 테스트는 빠르게 실행되어야 함
4. **중복 테스트**: DRY 원칙 적용

### 게임플라자 특화 테스트 주의점
1. **시간대 테스트**: 모든 시간은 KST 기준
2. **24시간+ 표시**: 새벽 시간대 테스트 필수
3. **실시간 동기화**: 동시성 이슈 테스트
4. **모바일 환경**: 터치 이벤트, 작은 화면 테스트

---

> "테스트 없는 코드는 레거시 코드다" - Michael Feathers

마지막 업데이트: 2025-07-22