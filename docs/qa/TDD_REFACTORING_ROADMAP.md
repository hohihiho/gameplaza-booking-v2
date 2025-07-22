# 🔄 TDD 리팩토링 로드맵

> 📚 **관련 문서**: [TDD 가이드](/docs/development/TDD_GUIDE.md) | [테스트 전략](/docs/qa/TEST_STRATEGY.md)

## 📋 현재 상황 분석

### 🚨 주요 문제점
1. **테스트 커버리지 0%** - 전체 프로젝트에서 테스트 파일 1개
2. **거대한 함수** - 121줄짜리 createReservation 함수
3. **중복 코드** - 모든 API에서 인증 코드 반복
4. **테스트 불가능한 설계** - 의존성 주입 없음, 강한 결합도

## 🎯 TDD 리팩토링 목표

### 단기 목표 (2주)
- 핵심 비즈니스 로직 테스트 커버리지 80%
- 거대 함수 분해 (최대 50줄)
- 중복 코드 제거

### 중기 목표 (1개월)
- 전체 테스트 커버리지 60%
- 의존성 주입 패턴 적용
- E2E 테스트 기본 구축

## 📝 단계별 실행 계획

### Phase 1: 기반 구축 (3일)

#### 1.1 테스트 구조 설계
```
/tests
  /unit
    /services      # 비즈니스 로직 테스트
    /utils         # 유틸리티 함수 테스트
    /components    # React 컴포넌트 테스트
  /integration
    /api          # API 라우트 테스트
    /db           # 데이터베이스 테스트
  /e2e
    /flows        # 사용자 시나리오 테스트
  /fixtures       # 테스트 데이터
  /mocks         # Mock 객체
  /helpers       # 테스트 헬퍼 함수
```

#### 1.2 테스트 픽스처 생성
```typescript
// tests/fixtures/reservation.fixture.ts
export const mockReservation = {
  id: 'test-reservation-1',
  userId: 'test-user-1',
  deviceId: 'test-device-1',
  startTime: '10:00',
  endTime: '12:00',
  status: 'approved',
  createdAt: new Date('2025-01-01'),
}

export const mockDevice = {
  id: 'test-device-1',
  name: 'PlayStation 5',
  status: 'available',
  hourlyRate: 5000,
}
```

#### 1.3 Mock 팩토리 함수
```typescript
// tests/mocks/repository.mock.ts
export function createMockReservationRepository() {
  return {
    findById: jest.fn(),
    findByDateAndDevice: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}
```

### Phase 2: 비즈니스 로직 추출 (1주)

#### 2.1 예약 서비스 리팩토링

**현재 코드 (121줄)**:
```typescript
// lib/services/reservation.service.ts
async createReservation(userId: string, data: CreateReservationDto) {
  // 121줄의 모든 로직이 한 함수에...
}
```

**TDD 리팩토링 계획**:

1. **테스트 먼저 작성**
```typescript
// tests/unit/services/reservation.service.test.ts
describe('ReservationService', () => {
  describe('createReservation', () => {
    it('should validate user exists', async () => {
      // Given
      const mockUserRepo = createMockUserRepository()
      mockUserRepo.findById.mockResolvedValue(null)
      
      const service = new ReservationService({
        userRepo: mockUserRepo,
        // ... other deps
      })
      
      // When/Then
      await expect(service.createReservation('invalid-user', mockData))
        .rejects.toThrow('사용자를 찾을 수 없습니다')
    })
    
    it('should check reservation limit', async () => {
      // 예약 개수 제한 테스트
    })
    
    it('should validate device availability', async () => {
      // 기기 사용 가능 여부 테스트
    })
    
    it('should detect time slot conflicts', async () => {
      // 시간대 충돌 검사 테스트
    })
  })
})
```

2. **함수 분해**
```typescript
// lib/services/reservation.service.ts
export class ReservationService {
  constructor(
    private userRepo: IUserRepository,
    private deviceRepo: IDeviceRepository,
    private reservationRepo: IReservationRepository,
    private eventBus: IEventBus
  ) {}
  
  async createReservation(userId: string, data: CreateReservationDto) {
    // 각 단계를 명확히 분리
    const user = await this.validateUser(userId)
    await this.checkReservationLimit(user)
    const device = await this.validateDevice(data.deviceId)
    await this.checkTimeSlotAvailability(device.id, data.startTime, data.endTime)
    
    const reservation = await this.createReservationTransaction({
      user,
      device,
      ...data
    })
    
    await this.publishReservationCreatedEvent(reservation)
    return reservation
  }
  
  private async validateUser(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }
    return user
  }
  
  private async checkReservationLimit(user: User): Promise<void> {
    if (user.role === 'admin') return
    
    const activeReservations = await this.reservationRepo.countActiveByUser(user.id)
    if (activeReservations >= 3) {
      throw new ReservationLimitExceededError()
    }
  }
  
  // ... 나머지 private 메서드들
}
```

#### 2.2 시간 처리 유틸리티 완성

**실패하는 테스트 수정**:
```typescript
// lib/utils/time.ts 수정
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  // 역방향 시간 검증 로직 수정
  if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
    // 다음날로 넘어가는 경우 체크
    if (endHour < 6 && startHour >= 18) {
      // 18:00 ~ 05:00 같은 밤샘 예약은 허용
      endTotalMinutes += 24 * 60
    } else {
      return false
    }
  }
}
```

### Phase 3: 인증 미들웨어 추출 (3일)

#### 3.1 현재 중복 코드
```typescript
// 모든 API 라우트에서 반복
const user = await getCurrentUser()
if (!user) {
  throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401)
}
```

#### 3.2 미들웨어 패턴 적용
```typescript
// lib/middleware/auth.middleware.ts
export function withAuth<T extends any[], R>(
  handler: (user: AuthUser, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const user = await getCurrentUser()
    if (!user) {
      throw new UnauthorizedError()
    }
    return handler(user, ...args)
  }
}

// 사용 예시
export const POST = withAuth(async (user, req: NextRequest) => {
  // user는 이미 검증됨
  const data = await req.json()
  return reservationService.createReservation(user.id, data)
})
```

### Phase 4: 의존성 주입 구현 (1주)

#### 4.1 인터페이스 정의
```typescript
// lib/interfaces/repositories.ts
export interface IReservationRepository {
  findById(id: string): Promise<Reservation | null>
  findByDateAndDevice(date: Date, deviceId: string): Promise<Reservation[]>
  create(data: CreateReservationData): Promise<Reservation>
  update(id: string, data: UpdateReservationData): Promise<Reservation>
}

// lib/interfaces/services.ts
export interface IReservationService {
  createReservation(userId: string, data: CreateReservationDto): Promise<Reservation>
  cancelReservation(userId: string, reservationId: string): Promise<void>
}
```

#### 4.2 의존성 컨테이너
```typescript
// lib/container/index.ts
export class Container {
  private static instance: Container
  private services = new Map<string, any>()
  
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }
  
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory())
  }
  
  resolve<T>(token: string): T {
    const service = this.services.get(token)
    if (!service) {
      throw new Error(`Service ${token} not found`)
    }
    return service
  }
}

// 초기화
const container = Container.getInstance()

container.register('ReservationRepository', () => 
  new ReservationRepository(supabase)
)

container.register('ReservationService', () => 
  new ReservationService(
    container.resolve('ReservationRepository'),
    container.resolve('DeviceRepository'),
    container.resolve('UserRepository')
  )
)
```

### Phase 5: 타입 안전성 강화 (3일)

#### 5.1 Branded Types
```typescript
// lib/types/branded.ts
type Brand<K, T> = K & { __brand: T }

export type UserId = Brand<string, 'UserId'>
export type DeviceId = Brand<string, 'DeviceId'>
export type ReservationId = Brand<string, 'ReservationId'>

// 타입 가드
export function isUserId(value: string): value is UserId {
  return /^user_[a-zA-Z0-9]+$/.test(value)
}

// 사용 예시
function getUser(id: UserId): Promise<User> {
  // id는 반드시 UserId 타입
}
```

#### 5.2 DTO 패턴
```typescript
// lib/dto/api-response.dto.ts
export class ApiResponse<T> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: ApiError,
    public meta?: ResponseMeta
  ) {}
  
  static success<T>(data: T, meta?: ResponseMeta): ApiResponse<T> {
    return new ApiResponse(true, data, undefined, meta)
  }
  
  static error(error: ApiError): ApiResponse<never> {
    return new ApiResponse(false, undefined, error)
  }
}

// 사용 예시
export const GET = async (req: NextRequest) => {
  try {
    const reservations = await service.getReservations()
    return NextResponse.json(ApiResponse.success(reservations))
  } catch (error) {
    return NextResponse.json(
      ApiResponse.error({ code: 'INTERNAL_ERROR', message: error.message }),
      { status: 500 }
    )
  }
}
```

## 📊 측정 가능한 성공 지표

### 코드 품질
- [ ] 함수 크기: 최대 50줄
- [ ] 순환 복잡도: 10 이하
- [ ] 테스트 커버리지: 60% 이상
- [ ] TypeScript strict 오류: 0개

### 개발 효율성
- [ ] 버그 수정 시간: 50% 단축
- [ ] 새 기능 추가 시간: 30% 단축
- [ ] 코드 리뷰 시간: 40% 단축

## 🚀 즉시 시작할 수 있는 작업

### Day 1-2: 테스트 환경 완성
```bash
# 1. 테스트 구조 생성
mkdir -p tests/{unit,integration,e2e,fixtures,mocks,helpers}

# 2. 첫 번째 서비스 테스트 작성
touch tests/unit/services/reservation.service.test.ts

# 3. 테스트 실행
npm test -- --watch
```

### Day 3-5: 예약 서비스 리팩토링
1. 실패하는 테스트 작성 (RED)
2. 최소 코드로 통과 (GREEN)
3. 리팩토링 (REFACTOR)

### Day 6-7: 인증 미들웨어 추출
1. 미들웨어 테스트 작성
2. 중복 코드 추출
3. 모든 API 라우트 적용

## ⚠️ 주의사항

1. **점진적 리팩토링**: 한 번에 모든 것을 바꾸지 말 것
2. **테스트 우선**: 항상 테스트를 먼저 작성
3. **작은 커밋**: 각 단계마다 커밋하여 롤백 가능하게
4. **기능 유지**: 리팩토링 중 기능이 깨지지 않도록 주의

---

> "리팩토링은 코드의 외부 동작을 바꾸지 않으면서 내부 구조를 개선하는 것이다" - Martin Fowler

마지막 업데이트: 2025-07-22