# 🧪 게임플라자 TDD(테스트 주도 개발) 가이드

> 테스트 주도 개발(TDD)로 안정적이고 유지보수 가능한 코드를 작성하는 방법을 안내합니다.

## 📌 목차

1. [TDD 소개](#tdd-소개)
2. [테스트 환경 설정](#테스트-환경-설정)
3. [테스트 구조](#테스트-구조)
4. [TDD 워크플로우](#tdd-워크플로우)
5. [테스트 작성 가이드](#테스트-작성-가이드)
6. [실전 예제](#실전-예제)
7. [테스트 전략](#테스트-전략)
8. [베스트 프랙티스](#베스트-프랙티스)

---

## 🎯 TDD 소개

### TDD란?
테스트 주도 개발(Test-Driven Development)은 테스트를 먼저 작성하고, 테스트를 통과하는 코드를 구현하는 개발 방법론입니다.

### TDD 사이클
```
1. Red 🔴 - 실패하는 테스트 작성
2. Green 🟢 - 테스트를 통과하는 최소한의 코드 작성
3. Refactor 🔄 - 코드 개선 (테스트는 계속 통과)
```

### TDD의 장점
- ✅ 안정적인 코드 품질
- ✅ 리팩토링 시 자신감
- ✅ 명확한 요구사항 정의
- ✅ 디버깅 시간 단축
- ✅ 문서화 효과

---

## 🛠️ 테스트 환경 설정

### 1. 필요한 패키지 설치
```bash
# 테스트 프레임워크
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/react-hooks @testing-library/user-event

# TypeScript 지원
npm install -D @types/jest ts-jest

# Mock 도구
npm install -D msw @mswjs/data

# 테스트 유틸리티
npm install -D jest-environment-jsdom
```

### 2. Jest 설정 (jest.config.js)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 3. 테스트 설정 파일 (jest.setup.js)
```javascript
import '@testing-library/jest-dom'
import { server } from './tests/mocks/server'

// MSW 서버 설정
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 환경 변수 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
```

---

## 📁 테스트 구조

### 프로젝트 테스트 구조
```
tests/
├── unit/                    # 단위 테스트
│   ├── services/           # 서비스 로직
│   ├── utils/             # 유틸리티 함수
│   └── components/        # React 컴포넌트
├── integration/            # 통합 테스트
│   ├── api/              # API 엔드포인트
│   └── db/               # 데이터베이스 연동
├── e2e/                   # E2E 테스트
│   └── scenarios/        # 사용자 시나리오
├── fixtures/              # 테스트 데이터
├── mocks/                 # Mock 객체
│   ├── handlers.ts       # MSW 핸들러
│   └── server.ts         # MSW 서버 설정
└── helpers/               # 테스트 헬퍼
```

### 테스트 파일 명명 규칙
```
- 단위 테스트: [파일명].test.ts(x)
- 통합 테스트: [기능명].integration.test.ts
- E2E 테스트: [시나리오명].e2e.test.ts
```

---

## 🔄 TDD 워크플로우

### 1. 요구사항 분석
```typescript
// 예: "예약은 최소 30분 전에만 가능하다"
```

### 2. 테스트 작성 (Red 🔴)
```typescript
describe('예약 생성', () => {
  it('30분 이내 예약 시도 시 에러를 반환한다', async () => {
    // Given
    const now = new Date('2025-07-22 14:00')
    const startTime = new Date('2025-07-22 14:20') // 20분 후
    
    // When
    const result = await createReservation({
      startTime,
      // ... 기타 필드
    })
    
    // Then
    expect(result.success).toBe(false)
    expect(result.error).toBe('예약은 최소 30분 전에 해야 합니다')
  })
})
```

### 3. 최소 구현 (Green 🟢)
```typescript
export async function createReservation(data: CreateReservationDto) {
  const now = new Date()
  const timeDiff = data.startTime.getTime() - now.getTime()
  const minutesDiff = timeDiff / (1000 * 60)
  
  if (minutesDiff < 30) {
    return {
      success: false,
      error: '예약은 최소 30분 전에 해야 합니다'
    }
  }
  
  // ... 나머지 로직
}
```

### 4. 리팩토링 (Refactor 🔄)
```typescript
// 상수 추출
const MINIMUM_ADVANCE_MINUTES = 30

// 헬퍼 함수 분리
function getMinutesUntil(targetTime: Date, fromTime: Date = new Date()): number {
  return (targetTime.getTime() - fromTime.getTime()) / (1000 * 60)
}

// 검증 로직 분리
function validateReservationTime(startTime: Date): ValidationResult {
  const minutesUntil = getMinutesUntil(startTime)
  
  if (minutesUntil < MINIMUM_ADVANCE_MINUTES) {
    return {
      valid: false,
      error: `예약은 최소 ${MINIMUM_ADVANCE_MINUTES}분 전에 해야 합니다`
    }
  }
  
  return { valid: true }
}
```

---

## 📝 테스트 작성 가이드

### 1. 단위 테스트

#### 서비스 테스트
```typescript
// tests/unit/services/reservation.service.test.ts
import { ReservationService } from '@/lib/services/reservation.service'
import { mockReservationRepository } from '@/tests/mocks/repositories'

describe('ReservationService', () => {
  let service: ReservationService
  let mockRepo: jest.Mocked<ReservationRepository>
  
  beforeEach(() => {
    mockRepo = mockReservationRepository()
    service = new ReservationService(mockRepo)
  })
  
  describe('checkAvailability', () => {
    it('기기가 사용 가능할 때 true를 반환한다', async () => {
      // Given
      mockRepo.findConflicts.mockResolvedValue([])
      
      // When
      const result = await service.checkAvailability(
        'device-1',
        new Date('2025-07-22 14:00'),
        new Date('2025-07-22 16:00')
      )
      
      // Then
      expect(result).toBe(true)
      expect(mockRepo.findConflicts).toHaveBeenCalledWith(
        'device-1',
        expect.any(Date),
        expect.any(Date)
      )
    })
  })
})
```

#### 유틸리티 테스트
```typescript
// tests/unit/utils/time.test.ts
import { formatDisplayTime, parseKSTTime } from '@/lib/utils/time'

describe('시간 유틸리티', () => {
  describe('formatDisplayTime', () => {
    it.each([
      [0, '24시'],
      [1, '25시'],
      [5, '29시'],
      [6, '6시'],
      [23, '23시'],
    ])('시간 %i를 "%s"로 표시한다', (hour, expected) => {
      expect(formatDisplayTime(hour)).toBe(expected)
    })
  })
})
```

### 2. 통합 테스트

#### API 라우트 테스트
```typescript
// tests/integration/api/reservations.test.ts
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/reservations/route'

describe('POST /api/reservations', () => {
  it('유효한 예약 요청을 처리한다', async () => {
    // Given
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        deviceId: 'device-1',
        startTime: '2025-07-22T14:00:00',
        endTime: '2025-07-22T16:00:00',
      }
    })
    
    // When
    const response = await POST(req)
    const data = await response.json()
    
    // Then
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id')
  })
})
```

### 3. 컴포넌트 테스트

#### React 컴포넌트 테스트
```typescript
// tests/unit/components/ReservationForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReservationForm } from '@/app/components/ReservationForm'

describe('ReservationForm', () => {
  it('폼 제출 시 올바른 데이터를 전송한다', async () => {
    // Given
    const mockSubmit = jest.fn()
    const user = userEvent.setup()
    
    render(<ReservationForm onSubmit={mockSubmit} />)
    
    // When
    await user.selectOptions(
      screen.getByLabelText('기기 선택'),
      'device-1'
    )
    await user.type(
      screen.getByLabelText('시작 시간'),
      '14:00'
    )
    await user.click(screen.getByText('예약하기'))
    
    // Then
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        deviceId: 'device-1',
        startTime: expect.any(String),
        // ... 기타 필드
      })
    })
  })
})
```

---

## 🎮 실전 예제

### 예제: 예약 시간 충돌 검사 기능 TDD

#### 1. 요구사항
- 동일 기기에 대해 시간이 겹치는 예약 불가
- 체크인된 예약과도 충돌 검사
- 종료된 예약은 충돌 대상 제외

#### 2. 테스트 작성
```typescript
describe('예약 충돌 검사', () => {
  let service: ReservationConflictChecker
  
  beforeEach(() => {
    service = new ReservationConflictChecker()
  })
  
  it('시간이 겹치지 않으면 충돌하지 않는다', () => {
    // Given
    const existing = {
      startTime: new Date('2025-07-22 10:00'),
      endTime: new Date('2025-07-22 12:00'),
    }
    const newReservation = {
      startTime: new Date('2025-07-22 14:00'),
      endTime: new Date('2025-07-22 16:00'),
    }
    
    // When
    const hasConflict = service.checkConflict(existing, newReservation)
    
    // Then
    expect(hasConflict).toBe(false)
  })
  
  it('시작 시간이 기존 예약 중간에 있으면 충돌한다', () => {
    // Given
    const existing = {
      startTime: new Date('2025-07-22 10:00'),
      endTime: new Date('2025-07-22 12:00'),
    }
    const newReservation = {
      startTime: new Date('2025-07-22 11:00'),
      endTime: new Date('2025-07-22 13:00'),
    }
    
    // When
    const hasConflict = service.checkConflict(existing, newReservation)
    
    // Then
    expect(hasConflict).toBe(true)
  })
})
```

#### 3. 구현
```typescript
export class ReservationConflictChecker {
  checkConflict(
    existing: TimeSlot,
    newReservation: TimeSlot
  ): boolean {
    // 시간 겹침 확인
    const existingStart = existing.startTime.getTime()
    const existingEnd = existing.endTime.getTime()
    const newStart = newReservation.startTime.getTime()
    const newEnd = newReservation.endTime.getTime()
    
    // 겹치지 않는 경우: 
    // 1. 새 예약이 기존 예약 전에 끝남
    // 2. 새 예약이 기존 예약 후에 시작
    if (newEnd <= existingStart || newStart >= existingEnd) {
      return false
    }
    
    return true
  }
}
```

---

## 📊 테스트 전략

### 테스트 피라미드
```
        E2E
       /    \
      /      \
    통합 테스트
   /          \
  /            \
단위 테스트 (많음)
```

### 커버리지 목표
- **단위 테스트**: 80% 이상
- **통합 테스트**: 60% 이상
- **E2E 테스트**: 핵심 시나리오

### 우선순위
1. **핵심 비즈니스 로직** (예약, 결제, 시간 계산)
2. **공통 유틸리티** (날짜 처리, 검증)
3. **API 엔드포인트**
4. **UI 컴포넌트**
5. **E2E 시나리오**

---

## ✅ 베스트 프랙티스

### 1. 테스트 작성 원칙
- **AAA 패턴** 사용: Arrange(준비), Act(실행), Assert(검증)
- **단일 책임**: 하나의 테스트는 하나만 검증
- **독립성**: 테스트 간 의존성 제거
- **명확한 이름**: 무엇을 테스트하는지 명확히

### 2. 좋은 테스트의 특징
- **Fast**: 빠르게 실행
- **Independent**: 독립적 실행
- **Repeatable**: 반복 가능
- **Self-Validating**: 자동 검증
- **Timely**: 적시에 작성

### 3. 테스트 데이터 관리
```typescript
// tests/fixtures/builders.ts
export class ReservationBuilder {
  private reservation = {
    id: 'test-1',
    userId: 'user-1',
    deviceId: 'device-1',
    startTime: new Date(),
    endTime: new Date(),
    status: 'pending' as const,
  }
  
  withId(id: string) {
    this.reservation.id = id
    return this
  }
  
  withStatus(status: ReservationStatus) {
    this.reservation.status = status
    return this
  }
  
  build() {
    return { ...this.reservation }
  }
}

// 사용 예
const reservation = new ReservationBuilder()
  .withStatus('approved')
  .withId('custom-id')
  .build()
```

### 4. Mock 사용 지침
```typescript
// ❌ 나쁜 예: 구현 세부사항 테스트
expect(mockRepo.findById).toHaveBeenCalledTimes(1)

// ✅ 좋은 예: 동작 테스트
expect(result.reservation).toEqual(expectedReservation)
```

### 5. 테스트 유지보수
- 테스트 코드도 프로덕션 코드처럼 관리
- 중복 제거, 헬퍼 함수 활용
- 깨진 테스트는 즉시 수정
- 테스트 실행 시간 모니터링

---

## 🚀 시작하기

### 첫 TDD 실습
1. 간단한 유틸리티 함수부터 시작
2. 테스트 작성 → 구현 → 리팩토링 사이클 연습
3. 점진적으로 복잡한 기능으로 확대

### 테스트 실행
```bash
# 전체 테스트
npm test

# 감시 모드
npm test -- --watch

# 커버리지 확인
npm test -- --coverage

# 특정 파일만
npm test reservation.test.ts
```

### 도움 받기
- 팀 내 TDD 경험자에게 페어 프로그래밍 요청
- 코드 리뷰 시 테스트 코드도 함께 리뷰
- TDD 카타 연습 (간단한 문제로 TDD 연습)

---

**기억하세요**: TDD는 단순히 테스트를 작성하는 것이 아니라, 
더 나은 설계와 안정적인 코드를 만드는 개발 방법론입니다. 🎯