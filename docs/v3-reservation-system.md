# V3 예약 시스템 문서

## 개요
V3 예약 시스템은 기존 시스템의 복잡도를 줄이고 핵심 기능에 집중한 단순화된 버전입니다.

## 아키텍처
- **Clean Architecture 제거**: 과도한 추상화 레이어 제거
- **단순한 구조**: API Route → Service/Repository → Database
- **인증 독립성**: Better Auth 의존성 제거, 독립적 작동

## API 엔드포인트

### GET /api/v3/reservations
예약 목록 조회
- Query Parameters:
  - `page`: 페이지 번호 (기본값: 1)
  - `pageSize`: 페이지 크기 (기본값: 10, 최대: 100)
  - `status`: 예약 상태 필터

### POST /api/v3/reservations
새 예약 생성
- Body Parameters:
  - `device_id`: 기기 ID (필수)
  - `date`: 예약 날짜 YYYY-MM-DD (필수)
  - `start_hour`: 시작 시간
  - `end_hour`: 종료 시간
  - `player_count`: 플레이어 수
  - `credit_type`: 크레딧 타입 (fixed/freeplay/unlimited)
  - `total_amount`: 총 금액
  - `user_notes`: 사용자 메모

## 컴포넌트 구조

```
/app/v3/
├── reservations/
│   └── page.tsx          # 메인 페이지
└── components/
    ├── ReservationList.tsx    # 예약 목록 (완료)
    ├── ReservationForm.tsx    # 예약 생성 폼 (예정)
    ├── DeviceSelector.tsx     # 기기 선택 (예정)
    ├── TimeSlotPicker.tsx     # 시간대 선택 (예정)
    └── PricingDisplay.tsx     # 가격 표시 (예정)
```

## 데이터베이스 어댑터
- `/lib/db/adapter.ts`: D1과 로컬 DB 자동 전환
- 환경변수 `D1_ENABLED`로 제어

## 가격 계산 시스템
- `/lib/pricing/index.ts`
- 기기별 가격 계산: `computeTotalFromDeviceType()`
- 시간대별 가격 계산: `computeTotalFromSlotId()`

## 현재 진행 상황
- [x] V3 API 복원 및 설정
- [x] 예약 목록 컴포넌트
- [x] 메인 페이지 UI 구조
- [x] 예약 생성 폼
- [x] 기기 선택 컴포넌트
- [x] 시간대 선택 컴포넌트
- [x] 가격 계산 및 표시
- [x] 예약 상세 모달
- [x] 모바일 반응형 최적화

## 주요 특징
1. **단순성**: 불필요한 추상화 제거
2. **독립성**: 인증 시스템과 분리
3. **확장성**: 필요시 기능 추가 용이
4. **성능**: 최소한의 의존성으로 빠른 로딩

## 다음 단계
1. 예약 생성 폼 구현
2. 기기 선택 UI 구현
3. 시간대 선택 및 가격 계산
4. 모바일 최적화