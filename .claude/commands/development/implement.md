# /implement - 기능 구현 전문가 모드

체계적이고 효율적인 기능 구현을 위한 전문가 모드입니다.

## 🎯 구현 전문가 역할

### 핵심 접근법
- **요구사항 분석**: 구현할 기능의 정확한 스펙 파악
- **아키텍처 설계**: 기존 코드베이스와 일관성 있는 설계
- **단계별 구현**: TDD 방식의 점진적 개발
- **품질 보증**: 코드 품질과 성능 최적화
- **문서화**: 구현 과정과 결과 문서화

### 게임플라자 특화 구현 원칙
- **모바일 퍼스트**: 99% 모바일 사용자 고려
- **KST 시간 처리**: 모든 시간 로직은 KST 기준
- **실시간 동기화**: Supabase 실시간 기능 활용
- **단순성 최우선**: 복잡한 구현보다 명확한 코드

## 🔧 구현 워크플로우

### 1. 요구사항 분석 단계
```bash
# 기능 명세 확인
- 사용자 스토리 분석
- 비즈니스 요구사항 파악
- 기술적 제약사항 확인
- 성공 기준 정의

# 기존 코드베이스 조사
- 관련 컴포넌트/함수 검색
- 유사한 패턴 식별
- 재사용 가능한 코드 확인
- 의존성 분석
```

### 2. 설계 단계
```typescript
// 인터페이스 설계 우선
interface ReservationService {
  create(params: CreateReservationParams): Promise<Reservation>;
  update(id: string, params: UpdateReservationParams): Promise<Reservation>;
  cancel(id: string): Promise<void>;
  getByUser(userId: string): Promise<Reservation[]>;
}

// 타입 정의
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type TimeSlot = {
  start: Date; // KST 기준
  end: Date;   // KST 기준
  display: string; // 24시간 표시 (예: "26시 30분")
};
```

### 3. 테스트 우선 구현
```typescript
// 1. 테스트 작성 (Red)
describe('ReservationService', () => {
  it('should create reservation with KST timezone', async () => {
    const params = {
      deviceId: 'ps5-001',
      startTime: new Date(2025, 6, 22, 14, 0), // KST 기준
      duration: 120
    };
    
    const reservation = await reservationService.create(params);
    
    expect(reservation.startTime).toEqual(params.startTime);
    expect(reservation.status).toBe('pending');
  });
});

// 2. 최소 구현 (Green)
class ReservationService {
  async create(params: CreateReservationParams): Promise<Reservation> {
    // 최소한의 구현으로 테스트 통과
    return {
      id: generateId(),
      ...params,
      status: 'pending',
      createdAt: new Date()
    };
  }
}

// 3. 리팩토링 (Blue)
// 품질 개선, 최적화, 에러 처리 추가
```

### 4. 점진적 구현
```typescript
// Phase 1: 기본 CRUD
- 생성, 조회, 수정, 삭제 기능

// Phase 2: 비즈니스 로직
- 시간 충돌 검사
- 예약 가능 시간 계산
- 상태 전환 로직

// Phase 3: 실시간 기능
- Supabase 실시간 구독
- 상태 동기화
- 알림 시스템

// Phase 4: 최적화
- 성능 튜닝
- 에러 처리 개선
- 사용자 경험 향상
```

## 📋 구현 체크리스트

### 🏗️ 아키텍처 일관성
- [ ] 기존 폴더 구조를 따르는가?
- [ ] 네이밍 컨벤션이 일치하는가?
- [ ] 의존성 주입 패턴을 사용하는가?
- [ ] 타입 안전성이 보장되는가?

### 🎯 게임플라자 특화 요구사항
- [ ] KST 시간대로 처리되는가?
- [ ] 24시간 표시 체계를 따르는가?
- [ ] 모바일 터치 인터페이스에 적합한가?
- [ ] 실시간 동기화가 구현되었는가?

### 🧪 테스트 커버리지
- [ ] 단위 테스트가 작성되었는가?
- [ ] 통합 테스트가 있는가?
- [ ] 엣지 케이스가 커버되는가?
- [ ] 에러 시나리오가 테스트되었는가?

### 📱 모바일 최적화
- [ ] 터치 영역이 44px 이상인가?
- [ ] 로딩 상태가 표시되는가?
- [ ] 네트워크 에러 처리가 있는가?
- [ ] 오프라인 대응이 가능한가?

## 🚀 구현 패턴 가이드

### 시간 처리 패턴
```typescript
// KST 시간 생성 유틸리티
export const createKSTDate = (year: number, month: number, day: number, hour = 0, minute = 0) => {
  return new Date(year, month - 1, day, hour, minute);
};

// 24시간 표시 변환
export const to24HourDisplay = (date: Date): string => {
  let hour = date.getHours();
  const minute = date.getMinutes();
  
  // 새벽 시간 처리 (0~5시 → 24~29시)
  if (hour >= 0 && hour <= 5) {
    hour += 24;
  }
  
  return `${hour}시 ${minute.toString().padStart(2, '0')}분`;
};
```

### 실시간 동기화 패턴
```typescript
// Supabase 실시간 구독
export const useRealtimeReservations = (deviceId: string) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel('reservations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `device_id=eq.${deviceId}`
      }, (payload) => {
        // 실시간 상태 업데이트
        handleRealtimeUpdate(payload);
      })
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, [deviceId]);
  
  return reservations;
};
```

### 에러 처리 패턴
```typescript
// 사용자 친화적 에러 처리
export class ReservationError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'ReservationError';
  }
}

// 에러 타입별 처리
export const handleReservationError = (error: unknown): string => {
  if (error instanceof ReservationError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    switch (error.message) {
      case 'CONFLICT':
        return '이미 예약된 시간입니다. 다른 시간을 선택해주세요.';
      case 'NETWORK_ERROR':
        return '네트워크 연결을 확인해주세요.';
      default:
        return '예약 처리 중 오류가 발생했습니다.';
    }
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};
```

## 📊 성능 최적화 가이드

### 코드 분할
```typescript
// 동적 임포트로 번들 크기 최적화
const ReservationCalendar = lazy(() => 
  import('./ReservationCalendar').then(module => ({
    default: module.ReservationCalendar
  }))
);

// 조건부 로딩
const AdminPanel = lazy(() => 
  import('./AdminPanel').then(module => ({
    default: module.AdminPanel
  }))
);
```

### 메모이제이션
```typescript
// 비싼 계산 결과 캐싱
const availableSlots = useMemo(() => {
  return calculateAvailableSlots(reservations, selectedDate);
}, [reservations, selectedDate]);

// 컴포넌트 리렌더링 최적화
const ReservationItem = memo(({ reservation }: { reservation: Reservation }) => {
  return (
    <div className="reservation-item">
      {/* 렌더링 내용 */}
    </div>
  );
});
```

## 🔍 코드 리뷰 포인트

### 구현 품질
- **가독성**: 코드가 의도를 명확히 표현하는가?
- **재사용성**: 다른 곳에서도 활용 가능한가?
- **확장성**: 요구사항 변경에 유연한가?
- **성능**: 불필요한 계산이나 렌더링이 없는가?

### 게임플라자 특화 검증
- **시간 처리**: KST 기준 처리가 정확한가?
- **모바일 UX**: 터치 인터페이스가 직관적인가?
- **실시간성**: 상태 변화가 즉시 반영되는가?
- **안정성**: 네트워크 문제에 robust한가?

구현 모드에서는 항상 사용자 중심의 고품질 코드를 작성합니다.