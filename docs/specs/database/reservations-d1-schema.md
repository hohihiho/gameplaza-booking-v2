# D1 Schema: Reservations (v3 Backend)

문서 목적: 게임플라자 예약 도메인의 Cloudflare D1 스키마와 데이터 규칙을 표준화하여, 다른 프로젝트/환경에서도 동일한 모델을 재사용할 수 있도록 정의합니다. (specs > planning 우선 규칙 적용)

## 개요
- 저장소: Cloudflare D1 (SQLite 호환)
- 시간 기준: KST 고정
- 형식 규칙
  - 날짜(`date`): `YYYY-MM-DD` (KST)
  - 시각(`*_time`): `HH:MM` (24시간제, 분 단위까지)
  - 타임스탬프(`*_at`): ISO8601 (예: `2025-09-12T12:34:56.000Z`)
- 개발 모드: 로컬 JSON 저장(`data/local-db/reservations.json`)로 동일 필드 유지. 환경 변수 `D1_ENABLED='true'` 설정 시 D1 사용.

## 테이블: reservations
예약 레코드의 단일 소스. 결제 요약(현금/계좌이체, 금액)과 체크인 시각까지 포함.

```
CREATE TABLE IF NOT EXISTS reservations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  device_id       TEXT NOT NULL,
  date            TEXT NOT NULL,       -- YYYY-MM-DD (KST)
  start_time      TEXT NOT NULL,       -- HH:MM
  end_time        TEXT NOT NULL,       -- HH:MM
  player_count    INTEGER NOT NULL DEFAULT 1,
  credit_type     TEXT NOT NULL,       -- 예: 'freeplay', 'fixed'
  fixed_credits   INTEGER,             -- credit_type='fixed' 시 사용 (NULL 허용)
  total_amount    INTEGER NOT NULL DEFAULT 0, -- 총 결제 금액(원)
  user_notes      TEXT,                -- 사용자 메모
  slot_type       TEXT NOT NULL,       -- 예: 'normal', 'early', 'overnight'
  status          TEXT NOT NULL,       -- 예: 'pending', 'approved', 'checked_in', 'completed', 'cancelled', 'no_show'
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  -- 확장 필드
  check_in_at     TEXT,                -- 체크인 시각(ISO), NULL=미체크인
  payment_method  TEXT CHECK (payment_method IN ('cash','transfer')),
  payment_amount  INTEGER              -- 결제 금액(원), NULL=미기록
);

-- 조회/정합성 보조 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations (date);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations (device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);

-- 중복/충돌 완화를 위한 권고 (필요시 활성화)
-- 1) 동일 기기, 동일 시작시각 중복 방지 (단순 규칙)
-- CREATE UNIQUE INDEX IF NOT EXISTS uidx_device_date_start ON reservations (device_id, date, start_time);
-- 2) 1인 1대 원칙(겹치는 시간대) 보장은 범위 겹침 검사가 필요하므로 앱/트리거 로직으로 처리 권장
```

### 필드 설명
- id: 예약 ID (텍스트 UUID 등)
- user_id: 사용자 ID(인증 시스템 연동)
- device_id: 기기 식별자(도메인에 맞는 규칙 사용)
- date/start_time/end_time: KST 기준 예약 구간
- player_count: 동시 플레이 인원(기본 1)
- credit_type/fixed_credits: 크레딧 정책 (예: 정액/프리플레이)
- total_amount: 총 결제 금액(원) – 결제 요약 용도
- user_notes: 사용자 메모
- slot_type: 시간대 유형(예: normal/early/overnight 등)
- status: 상태 머신 기반 값
- created_at/updated_at: 생성/업데이트 시각(ISO)
- check_in_at: 체크인 시각(ISO)
- payment_method/payment_amount: 결제 요약 값(현금/계좌이체, 금액)

### 상태 머신 권고안
- 생성: `pending`
- 승인: `approved`
- 체크인: `checked_in`
- 완료: `completed`
- 취소: `cancelled`
- 노쇼: `no_show`

체크인은 예약 시작 15분 전부터 허용(비즈니스 규칙). 노쇼는 시작 30분 경과 시 자동 처리 – 배치/잡 또는 앱 로직으로 적용.

### 무결성/비즈니스 규칙
- 1인 1대 원칙: 동일 시간대 중복 예약 방지
  - 단순 유니크 제약으로는 범위 겹침을 완벽히 방지하지 못함
  - 권장: 앱 레이어에서 겹침 검사 또는 트리거/뷰 도입
- 기기-시간 충돌 방지: `(device_id, date, start_time)` 유니크 인덱스(선택) + 앱에서 시간 범위 검증

## API 매핑(v3)
- GET `/api/v3/reservations` → 인덱스: `date`, `status`, `device_id`
- GET `/api/v3/reservations/:id`
- POST `/api/v3/reservations`
- DELETE `/api/v3/reservations/:id`
- POST `/api/v3/reservations/:id/checkin` → `check_in_at`/`payment_method`/`payment_amount` 업데이트

레코드 포맷은 snake_case로 통일(`ReservationRecord`).

## 환경 구성
- 개발: 로컬 JSON 스토리지
  - 파일: `data/local-db/reservations.json`
  - 동일 스키마 필드 유지
- 운영: Cloudflare D1
  - 환경 변수: `D1_ENABLED='true'`
  - 해당 환경에서 `lib/db/adapter.ts`가 D1 어댑터로 라우팅

## 마이그레이션 가이드(요약)
1) D1에서 아래 SQL 실행: `docs/sql/d1_reservations_and_pricing.sql`
2) 앱 환경 변수에 `D1_ENABLED='true'` 설정
3) 필요 시 로컬 JSON 데이터를 D1로 일괄 import
   - 필드명 동일(snake_case)이라 매핑 불필요

## 예시 쿼리
```
-- 특정 날짜의 기기별 예약 건수
SELECT device_id, COUNT(*) AS cnt
FROM reservations
WHERE date = '2025-09-12'
GROUP BY device_id
ORDER BY cnt DESC;

-- 체크인 완료된 예약 목록
SELECT *
FROM reservations
WHERE status = 'checked_in'
ORDER BY date, start_time;

-- 사용자 예약(최근순)
SELECT *
FROM reservations
WHERE user_id = ?
ORDER BY date DESC, start_time DESC;
```

## 참고
- 예약 시스템 스펙: `docs/specs/002-reservation-system.md`
- 운영 일정 스펙(예약 영향): `docs/specs/007-operation-schedule-management.md`
- 백엔드 어댑터: `lib/db/adapter.ts` (로컬 ↔ D1 스위치)
- 타입: `lib/db/types.ts`
- 가격 정책 매핑: `docs/specs/database/pricing-policy-mapping.md`

## 부속 테이블: device_pricing (권장)
기기종류별 가격/옵션 정의를 저장합니다. 금액 산정은 타임슬롯이 아닌 기기종류를 기준으로 수행합니다.

```
CREATE TABLE IF NOT EXISTS device_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  option_type TEXT CHECK (option_type IN ('fixed','freeplay','unlimited')) NOT NULL,
  price INTEGER NOT NULL,
  price_2p_extra INTEGER,               -- 2인 플레이 추가요금(선택)
  enable_extra_people INTEGER DEFAULT 0 NOT NULL, -- 추가 인원 옵션 활성화 여부
  extra_per_person INTEGER,             -- 인당 추가요금(선택)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_pricing_type ON device_pricing (device_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_device_pricing_option ON device_pricing (device_type_id, option_type);
```

## 구현 상태 (진행형)
- [x] v3 API 스켈레톤 (목록/상세/생성/삭제/체크인)
- [x] 개발 환경 로컬 JSON 저장소 연결(`data/local-db/reservations.json`)
- [x] 어댑터 분리(`lib/db/adapter.ts`) 및 환경 전환(`D1_ENABLED`)
- [x] D1 어댑터 구현(`lib/db/d1.ts`) 및 쿼리 작성 (리스트/상세/생성/삭제/업데이트, time_slot 조회)
- [x] 서버 금액 계산 엔진 연동(명세 기반)
  - `lib/pricing/index.ts` + `POST /api/v3/reservations`에서 `device_type_id + credit_option_type`(우선) 또는 `time_slot_id` 제공 시 서버 계산 적용
- [x] 결제 확인/상태 필드 및 API(`POST /api/v3/admin/reservations/:id/confirm-payment`)
- [ ] 마이그레이션 SQL 실행 및 운영 적용

## 변경 이력
- 2025-09-12: 최초 작성 (스키마/인덱스/상태/매핑/마이그레이션 가이드 포함)
