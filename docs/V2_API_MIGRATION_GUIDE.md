# v2 API 마이그레이션 가이드

## 개요
이 문서는 기존 v1 API에서 v2 API로의 마이그레이션 방법을 설명합니다.

## 주요 변경사항

### 1. API 엔드포인트
- v1: `/api/reservations`
- v2: `/api/v2/reservations`

### 2. 요청/응답 형식 변경

#### 예약 생성 (POST)
**v1 요청:**
```json
{
  "date": "2025-07-01",
  "device_type_id": "uuid",
  "device_id": "uuid",
  "start_time": "14:00",
  "end_time": "16:00",
  "player_count": 1,
  "credit_type": "freeplay",
  "user_notes": "메모",
  "total_amount": 10000
}
```

**v2 요청:**
```json
{
  "date": "2025-07-01",
  "device_id": "uuid",  // device_type_id 제거
  "start_time": "14:00",
  "end_time": "16:00",
  "player_count": 1,
  "credit_type": "freeplay",
  "fixed_credits": null,  // 새 필드
  "user_notes": "메모",
  "slot_type": "regular",  // 새 필드
  "total_amount": 10000
}
```

### 3. 에러 응답 형식

**v1 에러:**
```json
{
  "error": "에러 메시지"
}
```

**v2 에러:**
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "에러 메시지",
    "details": {}
  }
}
```

## Feature Flag 사용법

### 1. 환경변수 설정
```env
NEXT_PUBLIC_USE_V2_API=true
```

### 2. 런타임 토글
```javascript
// 활성화
localStorage.setItem('use_v2_api', 'true');

// 비활성화
localStorage.setItem('use_v2_api', 'false');
```

### 3. 코드에서 확인
```typescript
import { useV2Api } from '@/lib/api/client';

const isV2Enabled = useV2Api();
```

## 마이그레이션 단계

### Phase 1: 준비 (완료)
- [x] v2 API 클라이언트 구현
- [x] Feature flag 시스템 구축
- [x] 타입 정의 업데이트

### Phase 2: 점진적 전환
- [x] 예약 생성 페이지 v2 지원
- [ ] 예약 목록 페이지 v2 지원
- [ ] 마이페이지 v2 지원
- [ ] 관리자 페이지 v2 지원

### Phase 3: 테스트
- [ ] A/B 테스트 설정
- [ ] 성능 모니터링
- [ ] 에러 추적

### Phase 4: 완전 전환
- [ ] v1 API 사용 중단 공지
- [ ] 모든 클라이언트 v2로 전환
- [ ] v1 API 제거

## 컴포넌트별 마이그레이션

### 예약 생성 페이지
```typescript
// 기존 v1 코드
const response = await fetch('/api/reservations', {
  method: 'POST',
  body: JSON.stringify(data)
});

// v2 지원 코드
import { api } from '@/lib/api/client';

const reservation = await api.createReservation(data);
```

### 예약 목록
```typescript
// 기존 v1 코드
const response = await fetch('/api/reservations');
const data = await response.json();

// v2 지원 코드
import { useReservations } from '@/lib/hooks/useReservations';

const { reservations, loading, error } = useReservations();
```

## 모바일 최적화

### 1. 로딩 상태
- 스켈레톤 로더 사용
- Progressive enhancement
- Optimistic updates

### 2. 오프라인 지원
- Service Worker 캐싱
- 실패 시 재시도 로직
- 오프라인 큐

### 3. 성능 최적화
- 요청 배치 처리
- 응답 캐싱
- 이미지 lazy loading

## 문제 해결

### v2 API가 작동하지 않을 때
1. Feature flag 확인
2. 네트워크 탭에서 요청 URL 확인
3. 콘솔 로그 확인
4. 로컬스토리지 초기화

### 타입 에러가 발생할 때
1. TypeScript 서버 재시작
2. node_modules 재설치
3. 타입 정의 파일 확인

## 모니터링

### 로그 확인
```typescript
// 모든 API 요청/응답은 자동으로 로깅됨
import { logger } from '@/lib/utils/logger';
```

### 성능 메트릭
- API 응답 시간
- 에러율
- 사용자 전환율

## 롤백 계획

문제 발생 시:
1. Feature flag를 false로 변경
2. 페이지 새로고침
3. v1 API로 자동 전환됨

## 연락처

문제나 질문이 있으시면:
- 기술 지원: tech@gameplaza.kr
- 긴급 상황: 010-XXXX-XXXX