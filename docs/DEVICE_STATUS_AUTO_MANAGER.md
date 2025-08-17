# 기기 상태 자동 관리 시스템

## 개요

크론잡 대신 사용자 액션 기반으로 작동하는 기기 상태 자동 관리 시스템입니다. 
모든 주요 API 호출 시 자동으로 만료된 예약을 확인하고 기기 상태를 업데이트합니다.

## 주요 특징

- ✅ **사용자 액션 기반**: API 호출 시마다 자동 실행
- ✅ **중복 방지**: 1분 이내 중복 체크 방지
- ✅ **KST 시간대 정확 처리**: 한국 표준시 기준으로 모든 시간 계산
- ✅ **성능 최적화**: 최소한의 오버헤드로 동작
- ✅ **에러 핸들링**: 실패해도 메인 API 기능에 영향 없음
- ✅ **기존 코드 최소 변경**: import 한 줄과 함수 호출로 간단 적용

## 구현된 파일들

### 핵심 시스템
- `/lib/device-status-manager.ts` - 핵심 자동 관리 로직
- `/lib/client-timer-manager.ts` - 클라이언트 실시간 타이머 (선택적)

### 적용된 API들
- `/api/v2/reservations/route.ts` - 예약 조회/생성
- `/api/v2/check-ins/process/route.ts` - 체크인 처리
- `/api/v2/check-ins/[id]/check-out/route.ts` - 체크아웃 처리
- `/api/v2/devices/route.ts` - 기기 목록 조회
- `/api/v2/time-slots/available/route.ts` - 시간대 조회
- `/api/v2/device-status/auto-check/route.ts` - 관리자 테스트/상태 확인

### 레거시 호환성
- `/api/cron/update-device-status/route.ts` - 기존 크론잡 리다이렉트
- `/api/cron/check-rental-start/route.ts` - 기존 크론잡 리다이렉트

## 작동 원리

### 1. 자동 체크 조건
- API 호출 시마다 `autoCheckDeviceStatus()` 실행
- 마지막 체크로부터 1분 경과 시에만 실제 체크 수행
- 1분 이내 재호출 시 스킵하여 성능 최적화

### 2. 처리 작업
**만료된 예약 처리:**
- `checked_in` 상태이면서 종료 시간이 지난 예약들 검색
- 예약 상태를 `completed`로 변경
- 해당 기기 상태를 `available`로 변경

**시작되어야 할 예약 처리:**
- `checked_in` 상태이면서 시작 시간이 된 예약들 검색
- `actual_start_time` 기록
- 해당 기기 상태를 `in_use`로 변경

### 3. KST 시간 처리
```typescript
function getCurrentKSTTime(): Date {
  const now = new Date();
  // KST는 UTC+9
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kstTime;
}
```

## 사용법

### API에 자동 체크 추가
```typescript
import { autoCheckDeviceStatus } from '@/lib/device-status-manager'

export async function GET(request: NextRequest) {
  try {
    // 자동 기기 상태 체크 실행
    try {
      const statusCheck = await autoCheckDeviceStatus()
      if (statusCheck.executed) {
        console.log(`✅ Auto status check completed - Expired: ${statusCheck.expiredCount}, Started: ${statusCheck.startedCount}`)
      }
    } catch (statusError) {
      console.error('❌ Auto status check failed:', statusError)
      // 상태 체크 실패해도 메인 기능은 계속 진행
    }

    // 기존 API 로직...
  }
}
```

### 관리자 테스트
```bash
# 현재 상태 확인
GET /api/v2/device-status/auto-check

# 강제 실행
POST /api/v2/device-status/auto-check
{
  "force": true
}
```

### 클라이언트 실시간 타이머 (선택적)
```typescript
import { useReservationTimer } from '@/lib/client-timer-manager'

const timer = useReservationTimer(reservations, {
  onExpired: (ids) => {
    console.log('만료된 예약:', ids)
    // UI 업데이트
  },
  onStarting: (ids) => {
    console.log('시작된 예약:', ids)
    // UI 업데이트
  }
})
```

## 테스트 방법

### 1. 기본 동작 테스트
```bash
# 예약 목록 조회 (자동 체크 포함)
GET /api/v2/reservations

# 응답에서 자동 체크 실행 로그 확인
# ✅ Auto status check completed - Expired: 2, Started: 1
```

### 2. 강제 실행 테스트
```bash
# 관리자로 로그인 후
POST /api/v2/device-status/auto-check
{
  "force": true
}

# 응답 예시:
{
  "success": true,
  "executed": true,
  "results": {
    "expiredReservations": 2,
    "startedReservations": 1,
    "errors": []
  },
  "statusInfo": {
    "currentTime": "2025-01-17T15:30:00.000Z",
    "expiredReservations": 2,
    "pendingStartReservations": 1
  }
}
```

### 3. 성능 테스트
```bash
# 1분 이내 연속 호출로 중복 방지 확인
GET /api/v2/reservations  # 실제 체크 실행
GET /api/v2/reservations  # 스킵됨 (1분 이내)
GET /api/v2/reservations  # 스킵됨 (1분 이내)
```

## 모니터링

### 로그 확인
```bash
# 성공 로그
✅ Auto status check completed - Expired: 2, Started: 1

# 실패 로그  
❌ Auto status check failed: [error details]

# 스킵 로그 (중복 방지)
# (별도 로그 없음 - 성능상 이유)
```

### 상태 정보 조회
```typescript
const statusInfo = await getStatusInfo()
// {
//   currentTime: "2025-01-17T15:30:00.000Z",
//   expiredReservations: 2,
//   pendingStartReservations: 1,
//   lastCheckTime: "2025-01-17T15:29:00.000Z",
//   nextCheckAvailable: true
// }
```

## 장점

1. **실시간성**: 사용자 액션과 동시에 상태 업데이트
2. **안정성**: 크론잡 의존성 제거
3. **성능**: 1분 중복 방지로 불필요한 DB 쿼리 최소화
4. **유지보수**: 단일 파일에서 모든 로직 관리
5. **호환성**: 기존 크론잡 API들과 완전 호환
6. **확장성**: 새로운 API에 쉽게 추가 가능

## 주의사항

1. **서버리스 환경**: 메모리 기반 중복 방지는 서버 재시작 시 초기화됨
2. **에러 처리**: 자동 체크 실패가 메인 API에 영향주지 않도록 try-catch 필수
3. **권한**: Service Role 클라이언트 사용으로 RLS 우회 필요
4. **시간대**: 모든 시간 계산은 KST 기준으로 통일

## 향후 개선 사항

1. **Redis 캐시**: 중복 방지를 Redis로 구현하여 서버 재시작에도 지속
2. **메트릭 수집**: 자동 체크 실행 횟수, 성공률 등 모니터링
3. **알림 시스템**: 연속 실패 시 관리자 알림
4. **배치 최적화**: 여러 예약을 한 번에 처리하는 배치 로직