# 📝 게임플라자 예약 시스템 - 테스트 템플릿 가이드

## 🎯 테스트 작성 원칙

1. **AAA 패턴**: Arrange(준비) → Act(실행) → Assert(검증)
2. **테스트 이름**: 한국어로 명확하게 작성
3. **독립성**: 각 테스트는 독립적으로 실행 가능
4. **단일 책임**: 하나의 테스트는 하나의 기능만 검증

---

## 🧪 단위 테스트 템플릿

### 1. 도메인 엔티티 테스트
```typescript
// src/domain/entities/__tests__/reservation.test.ts
import { Reservation } from '../reservation.entity';
import { InvalidReservationError } from '../errors';

describe('Reservation 엔티티', () => {
  describe('생성', () => {
    it('유효한 데이터로 예약을 생성할 수 있다', () => {
      // Arrange
      const reservationData = {
        userId: 'user-123',
        deviceId: 'device-456',
        startTime: new Date(2025, 0, 15, 14, 0), // KST 2025-07-15 14:00
        endTime: new Date(2025, 0, 15, 16, 0),   // KST 2025-07-15 16:00
      };

      // Act
      const reservation = new Reservation(reservationData);

      // Assert
      expect(reservation).toBeDefined();
      expect(reservation.userId).toBe('user-123');
      expect(reservation.deviceId).toBe('device-456');
      expect(reservation.status).toBe('pending');
    });

    it('시작 시간이 종료 시간보다 늦으면 에러를 발생시킨다', () => {
      // Arrange
      const invalidData = {
        userId: 'user-123',
        deviceId: 'device-456',
        startTime: new Date(2025, 0, 15, 16, 0),
        endTime: new Date(2025, 0, 15, 14, 0),
      };

      // Act & Assert
      expect(() => new Reservation(invalidData))
        .toThrow(InvalidReservationError);
    });
  });

  describe('24시간 제한 검증', () => {
    it('24시간 이내 예약은 허용된다', () => {
      // Arrange
      const now = new Date();
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

      // Act
      const isValid = Reservation.isWithin24HourLimit(in23Hours);

      // Assert
      expect(isValid).toBe(true);
    });

    it('24시간 이후 예약은 거부된다', () => {
      // Arrange
      const now = new Date();
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Act
      const isValid = Reservation.isWithin24HourLimit(in25Hours);

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
```

### 2. 유스케이스 테스트
```typescript
// src/application/use-cases/__tests__/create-reservation.test.ts
import { CreateReservationUseCase } from '../create-reservation.use-case';
import { MockReservationRepository } from '@/test-utils/mocks';

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase;
  let mockRepository: MockReservationRepository;

  beforeEach(() => {
    // Arrange - 테스트 환경 설정
    mockRepository = new MockReservationRepository();
    useCase = new CreateReservationUseCase(mockRepository);
  });

  it('1인 1대 원칙에 따라 기존 예약이 있으면 생성을 거부한다', async () => {
    // Arrange
    const userId = 'user-123';
    mockRepository.setActiveReservation({
      id: 'existing-reservation',
      userId,
      status: 'confirmed',
    });

    // Act & Assert
    await expect(useCase.execute({
      userId,
      deviceId: 'device-456',
      startTime: '2025-07-15T14:00:00',
      endTime: '2025-07-15T16:00:00',
    })).rejects.toThrow('이미 진행 중인 예약이 있습니다');
  });

  it('모든 검증을 통과하면 예약을 생성한다', async () => {
    // Arrange
    const reservationData = {
      userId: 'user-123',
      deviceId: 'device-456',
      startTime: '2025-07-15T14:00:00',
      endTime: '2025-07-15T16:00:00',
    };

    // Act
    const result = await useCase.execute(reservationData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      userId: 'user-123',
      deviceId: 'device-456',
      status: 'pending',
    });
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

### 3. React 컴포넌트 테스트
```typescript
// src/components/__tests__/ReservationCard.test.tsx
import { render, screen, fireEvent } from '@/test-utils';
import { ReservationCard } from '../ReservationCard';
import { mockReservation } from '@/test-utils/fixtures';

describe('ReservationCard 컴포넌트', () => {
  const defaultProps = {
    reservation: mockReservation,
    onCancel: jest.fn(),
    onCheckIn: jest.fn(),
  };

  it('예약 정보를 올바르게 표시한다', () => {
    // Arrange & Act
    render(<ReservationCard {...defaultProps} />);

    // Assert
    expect(screen.getByText('DDR A3')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
    expect(screen.getByText('대기중')).toBeInTheDocument();
  });

  it('대기 상태에서는 취소 버튼을 표시한다', () => {
    // Arrange & Act
    render(<ReservationCard {...defaultProps} />);

    // Assert
    const cancelButton = screen.getByRole('button', { name: '예약 취소' });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).not.toBeDisabled();
  });

  it('취소 버튼 클릭 시 onCancel을 호출한다', () => {
    // Arrange
    render(<ReservationCard {...defaultProps} />);

    // Act
    const cancelButton = screen.getByRole('button', { name: '예약 취소' });
    fireEvent.click(cancelButton);

    // Assert
    expect(defaultProps.onCancel).toHaveBeenCalledWith(mockReservation.id);
  });

  it('완료된 예약에서는 버튼을 표시하지 않는다', () => {
    // Arrange
    const completedReservation = {
      ...mockReservation,
      status: 'completed',
    };

    // Act
    render(
      <ReservationCard
        {...defaultProps}
        reservation={completedReservation}
      />
    );

    // Assert
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

---

## 🔗 통합 테스트 템플릿

### 1. API 엔드포인트 테스트
```typescript
// app/api/v2/reservations/__tests__/route.test.ts
import { POST, GET } from '../route';
import { createMockRequest } from '@/test-utils';
import { mockSupabase } from '@/test-utils/mocks';

describe('POST /api/v2/reservations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('인증되지 않은 요청을 거부한다', async () => {
    // Arrange
    const request = createMockRequest({
      method: 'POST',
      body: { deviceId: 'device-123' },
    });
    mockSupabase.auth.getUser.mockResolvedValue({ user: null });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다');
  });

  it('유효한 예약을 생성한다', async () => {
    // Arrange
    const request = createMockRequest({
      method: 'POST',
      body: {
        deviceId: 'device-123',
        startTime: '2025-07-15T14:00:00',
        endTime: '2025-07-15T16:00:00',
      },
      user: { id: 'user-123', email: 'test@example.com' },
    });

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null, // 기존 예약 없음
    });

    mockSupabase.from().insert().select().single.mockResolvedValue({
      data: {
        id: 'reservation-456',
        user_id: 'user-123',
        device_id: 'device-123',
        status: 'pending',
      },
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.id).toBe('reservation-456');
    expect(data.status).toBe('pending');
  });

  it('24시간 제한을 검증한다', async () => {
    // Arrange
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const request = createMockRequest({
      method: 'POST',
      body: {
        deviceId: 'device-123',
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      },
      user: { id: 'user-123' },
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toContain('24시간');
  });
});
```

### 2. 데이터베이스 통합 테스트
```typescript
// src/infrastructure/repositories/__tests__/reservation.repository.integration.test.ts
import { ReservationRepository } from '../reservation.repository';
import { supabase } from '@/lib/supabase';
import { setupTestDatabase, cleanupTestDatabase } from '@/test-utils/db';

describe('ReservationRepository (통합)', () => {
  let repository: ReservationRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new ReservationRepository(supabase);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 정리
    await supabase.from('reservations').delete().neq('id', '');
  });

  it('예약 충돌을 감지한다', async () => {
    // Arrange - 첫 번째 예약 생성
    const firstReservation = await repository.create({
      userId: 'user-1',
      deviceId: 'device-1',
      startTime: '2025-07-15T14:00:00',
      endTime: '2025-07-15T16:00:00',
    });

    // Act - 동일 시간대 두 번째 예약 시도
    const secondAttempt = repository.create({
      userId: 'user-2',
      deviceId: 'device-1',
      startTime: '2025-07-15T15:00:00',
      endTime: '2025-07-15T17:00:00',
    });

    // Assert
    await expect(secondAttempt).rejects.toThrow('예약 시간이 충돌합니다');
  });

  it('트랜잭션으로 예약과 기기 상태를 함께 업데이트한다', async () => {
    // Arrange
    const reservationData = {
      userId: 'user-1',
      deviceId: 'device-1',
      startTime: '2025-07-15T14:00:00',
      endTime: '2025-07-15T16:00:00',
    };

    // Act
    const result = await repository.createWithTransaction(reservationData);

    // Assert
    expect(result.reservation).toBeDefined();
    expect(result.deviceStatus).toBe('reserved');
    
    // 실제 DB 확인
    const { data: device } = await supabase
      .from('devices')
      .select('status')
      .eq('id', 'device-1')
      .single();
    
    expect(device.status).toBe('reserved');
  });
});
```

---

## 🚀 E2E 테스트 템플릿

### 1. 사용자 시나리오 테스트
```typescript
// tests/e2e/specs/reservation-flow.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsUser, selectDevice, waitForRealtime } from '../helpers';

test.describe('예약 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('전체 예약 프로세스를 완료할 수 있다', async ({ page }) => {
    // 1. 기기 목록 페이지 이동
    await page.goto('/devices');
    await expect(page.getByRole('heading', { name: '기기 목록' }))
      .toBeVisible();

    // 2. 기기 선택
    await selectDevice(page, 'DDR A3');
    
    // 3. 시간 선택
    await page.getByRole('button', { name: '14:00' }).click();
    await page.getByRole('button', { name: '16:00' }).click();
    
    // 4. 예약 확인
    await page.getByRole('button', { name: '예약하기' }).click();
    
    // 5. 확인 모달
    await expect(page.getByText('예약을 진행하시겠습니까?')).toBeVisible();
    await page.getByRole('button', { name: '확인' }).click();
    
    // 6. 성공 메시지 및 리다이렉트
    await expect(page.getByText('예약이 완료되었습니다')).toBeVisible();
    await page.waitForURL('/reservations');
    
    // 7. 예약 목록에서 확인
    await expect(page.getByText('DDR A3')).toBeVisible();
    await expect(page.getByText('14:00 - 16:00')).toBeVisible();
  });

  test('실시간으로 다른 사용자의 예약을 반영한다', async ({ page, context }) => {
    // Arrange - 두 번째 브라우저 컨텍스트
    const secondPage = await context.newPage();
    await loginAsUser(secondPage, 'user2@test.com');

    // Act - 첫 번째 사용자가 예약
    await page.goto('/devices');
    await selectDevice(page, 'DDR A3');
    await page.getByRole('button', { name: '14:00' }).click();

    // Assert - 두 번째 사용자에게 실시간 반영
    await secondPage.goto('/devices');
    await selectDevice(secondPage, 'DDR A3');
    
    // 실시간 업데이트 대기
    await waitForRealtime(secondPage);
    
    // 14:00 시간대가 비활성화되었는지 확인
    const timeSlot = secondPage.getByRole('button', { name: '14:00' });
    await expect(timeSlot).toBeDisabled();
    await expect(timeSlot).toHaveClass(/opacity-50/);
  });
});
```

### 2. 모바일 테스트
```typescript
// tests/e2e/specs/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 12'],
  // 3G 네트워크 시뮬레이션
  offline: false,
  downloadThroughput: 1.75 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 40,
});

test('모바일에서 예약을 생성할 수 있다', async ({ page }) => {
  // Performance 측정 시작
  await page.coverage.startJSCoverage();
  const startTime = Date.now();

  // 페이지 로드
  await page.goto('/');
  
  // 3초 이내 로드 확인
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);

  // 터치 제스처 테스트
  await page.getByRole('button', { name: '메뉴' }).tap();
  await expect(page.getByRole('navigation')).toBeVisible();

  // 스와이프로 메뉴 닫기
  await page.locator('body').swipe({
    startPosition: { x: 200, y: 100 },
    endPosition: { x: 50, y: 100 },
  });
  await expect(page.getByRole('navigation')).not.toBeVisible();
});
```

---

## 🛠️ 테스트 유틸리티

### 1. 테스트 데이터 팩토리
```typescript
// test-utils/factories/reservation.factory.ts
import { faker } from '@faker-js/faker';

export const createReservation = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  deviceId: faker.string.uuid(),
  startTime: faker.date.future(),
  endTime: faker.date.future(),
  status: 'pending',
  createdAt: new Date(),
  ...overrides,
});

export const createReservationWithKST = (date: Date, startHour: number, duration: number) => {
  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);
  
  const end = new Date(start);
  end.setHours(startHour + duration);
  
  return createReservation({
    startTime: start,
    endTime: end,
  });
};
```

### 2. Custom Matchers
```typescript
// test-utils/matchers.ts
expect.extend({
  toBeValidKSTTime(received: Date) {
    const hours = received.getHours();
    const isValid = hours >= 0 && hours <= 29; // 0-5시는 24-29시로 표시
    
    return {
      pass: isValid,
      message: () => 
        `Expected ${received} to be valid KST time (00:00-29:59)`,
    };
  },
  
  toBeWithinBusinessHours(received: Date) {
    const hours = received.getHours();
    const isValid = hours >= 6 || hours < 2; // 06:00 - 02:00
    
    return {
      pass: isValid,
      message: () =>
        `Expected ${received} to be within business hours (06:00-02:00)`,
    };
  },
});
```

### 3. MSW 핸들러 헬퍼
```typescript
// test-utils/msw-helpers.ts
import { http, HttpResponse } from 'msw';

export const createAuthHandlers = (user = null) => [
  http.get('/api/auth/session', () => {
    return HttpResponse.json({ user });
  }),
  
  http.post('/api/auth/signin', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: { email: body.email, id: 'test-user-id' },
    });
  }),
];

export const createReservationHandlers = (reservations = []) => [
  http.get('/api/v2/reservations', () => {
    return HttpResponse.json({ data: reservations });
  }),
  
  http.post('/api/v2/reservations', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: { id: 'new-reservation', ...body },
    }, { status: 201 });
  }),
];
```

---

## 📋 테스트 체크리스트

각 기능 구현 시 다음 테스트를 작성했는지 확인:

### 필수 테스트
- [ ] Happy Path (정상 동작)
- [ ] 에러 케이스
- [ ] 경계값 테스트
- [ ] Null/Undefined 처리
- [ ] 권한 검증

### 추가 고려사항
- [ ] 성능 (응답 시간)
- [ ] 동시성 (Race condition)
- [ ] 트랜잭션 롤백
- [ ] 캐시 무효화
- [ ] 실시간 동기화

### 모바일 특화
- [ ] 터치 인터랙션
- [ ] 느린 네트워크
- [ ] 오프라인 모드
- [ ] 화면 회전
- [ ] PWA 기능