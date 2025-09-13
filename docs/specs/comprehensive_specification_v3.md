# 광주 게임플라자 예약 시스템 V3 통합 명세서

> 📌 **문서 안내**: 이 문서는 `docs/planning/complete_specification.md` 기획서와 `docs/specs/` 폴더의 모든 기술 명세서를 통합한 최종 버전입니다. 기술적 충돌 시 `docs/specs/`의 내용이 우선 적용되었습니다.

## 1. 📋 프로젝트 개요

### 1.1. 목적
- 카카오톡 오픈채팅 기반 예약을 **웹 기반 PWA**로 전환
- **모바일 퍼스트** 설계로 99% 모바일 사용자 최적화
- **실시간 알림**과 **통합 관리**로 운영 효율성 극대화
- **1인 1대 대여** 원칙으로 간소화된 예약 시스템

### 1.2. 핵심 특징
- 🔐 **Better Auth 기반 구글 OAuth 단일 인증**
- 📱 **PWA 웹앱** (홈화면 추가, 실시간 알림)
- 🔧 **직관적인 V3 관리자 시스템** (예약/기기/회원 통합 관리)
- 🎮 **리듬게임 전문 오락실** (제조사별 관리, 기종별 2P 등)
- 🕐 **KST 타임존 고정**: 모든 시간 처리는 한국 표준시(KST) 기준
- ⏰ **영업일 기준 06시 리셋**: 모든 날짜 전환은 익일 06시 기준
- 🔒 **AI + 수동 기반 보안**: 닉네임 비속어 필터링 및 스팸 차단
- 💬 **카카오톡 1:1 채팅 문의**: https://open.kakao.com/o/sJPbo3Sb

---

## 2. 🏗️ 기술 스택 및 배포

### 2.1. Frontend
- **Next.js 14**: App Router, Server Components
- **React 18**: Concurrent Features
- **TypeScript**
- **PWA**: Service Worker, 오프라인 지원, 푸시 알림
- **Tailwind CSS**: 유틸리티 우선 CSS
- **Zustand**: 전역 상태 관리
- **React Query (TanStack Query)**: 서버 상태 관리

### 2.2. Backend & Database
- **런타임**: Cloudflare Workers / Pages Functions
- **데이터베이스**: **Cloudflare D1 (SQLite 호환)**
- **인증**: **Better Auth** (NextAuth.js에서 전환)
- **AI 필터링**: **Google Perspective API 프록시** (Cloudflare Worker)

### 2.3. 배포 & 호스팅 (Cloudflare)
- **Vercel**에서 **Cloudflare** 중심으로 전환
- **GitHub Actions**: 크론잡 (기기 상태 업데이트, Supabase 활성화 유지 등)
- **Cloudflare D1 바인딩**:
  - `wrangler.toml`을 통해 D1 데이터베이스를 워커에 바인딩
  - 앱 환경변수 `D1_ENABLED='true'`로 D1 어댑터 활성화
  - `D1_BINDING_NAME`으로 바인딩명 지정 (기본값: `DB`)

#### `wrangler.toml` 예시
```toml
name = "gameplaza-v3"
main = "server.js"
compatibility_date = "2024-09-01"

[[ d1_databases ]]
binding = "DB"              # D1_BINDING_NAME과 일치해야 함
database_name = "gameplaza"
database_id = "<YOUR-D1-ID>"
```

### 2.4. AI 기반 비속어/스팸 차단
- **구조**: App Server → Moderation Worker (Webhook) → Perspective API
- **수동 금지어 관리**: 관리자 API를 통해 수동 금지어 목록 관리
  - `GET /api/v3/admin/banned-words`
  - `POST /api/v3/admin/banned-words`
- **통합 검사 API**: 수동 금지어와 AI 검사 결과를 병합하여 반환
  - `POST /api/v3/moderation/check`
- **Moderation Worker**: Google Perspective API를 무료 할당량 내에서 사용하기 위한 프록시
  - **위치**: `workers/moderation-worker.js`
  - **환경변수**: `PERSPECTIVE_API_KEY`, `WEBHOOK_TOKEN`

---

## 3. 👥 사용자 인증 및 권한 (v3 Policy)

> 📄 **Source**: `docs/specs/database/user-management-role-policy.md`

### 3.1. 인증 프로세스
1. **Better Auth 기반 구글 OAuth 단일 로그인**
2. **신규 사용자 회원가입**
   - 닉네임 입력 (AI+수동 비속어 필터링)
   - 약관 동의
3. **인증 완료** → 역할에 따른 기능 이용

### 3.2. 직급(역할) 계층
- `super_admin`: 슈퍼관리자 (최상위 권한)
- `gp_vip`: 겜플VIP (월간 랭킹 1-5위)
- `gp_regular`: 겜플단골 (월간 랭킹 6-20위)
- `gp_user`: 겜플유저 (일반)
- `restricted`: 제한 유저 (예약 금지)

### 3.3. 제한/정지 정책
- **기간 제한**: `user_restrictions` 테이블에 시작/종료일과 사유를 저장. 기간 동안 예약이 금지되며, 만료 시 자동 해제됩니다.
- **영구 정지**: `blocked_identities` 테이블에 OAuth 제공자의 `subject`(고유 식별자) 또는 이메일 해시를 기록하여 재가입을 원천 차단합니다.

### 3.4. 자동 직급 부여 (랭킹 기반)
- **기준**: 월간 대여 랭킹 (KST 기준)
- **업데이트**: 매일 06:00 KST에 스케줄러(배치)를 통해 전월/금월 랭킹을 집계하고 `gp_*` 역할을 갱신합니다.
- `restricted` 또는 `super_admin` 역할 보유자는 자동 갱신에서 제외됩니다.

### 3.5. 관련 데이터베이스 스키마
- `user_roles`: 사용자의 역할을 저장.
- `user_restrictions`: 사용자의 기간 제한 정보를 저장.
- `oauth_identities`: 사용자의 OAuth 정보를 저장.
- `blocked_identities`: 영구 정지된 사용자의 식별자를 저장.

---

## 4. 🎯 핵심 기능 (v3 API 기반)

### 4.1. 📝 예약 시스템

> 📄 **Source**: `docs/specs/database/reservations-d1-schema.md`

#### 데이터베이스 스키마: `reservations`
```sql
CREATE TABLE IF NOT EXISTS reservations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  device_id       TEXT NOT NULL,
  date            TEXT NOT NULL,       -- YYYY-MM-DD (KST)
  start_time      TEXT NOT NULL,       -- HH:MM
  end_time        TEXT NOT NULL,       -- HH:MM
  player_count    INTEGER NOT NULL DEFAULT 1,
  credit_type     TEXT NOT NULL,       -- 'freeplay', 'fixed', 'unlimited'
  fixed_credits   INTEGER,
  total_amount    INTEGER NOT NULL DEFAULT 0,
  user_notes      TEXT,
  slot_type       TEXT NOT NULL,       -- 'normal', 'early', 'overnight'
  status          TEXT NOT NULL,       -- 'pending', 'approved', 'checked_in', 'completed', 'cancelled', 'no_show'
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  check_in_at     TEXT,
  payment_method  TEXT CHECK (payment_method IN ('cash','transfer')),
  payment_amount  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations (date);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations (device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
```

#### 상태 머신
- `pending` → `approved` → `checked_in` → `completed`
- `cancelled` (사용자/관리자 취소)
- `no_show` (관리자 수동 처리)

#### API 엔드포인트 (v3)
- `GET /api/v3/reservations`: 예약 목록 조회
- `POST /api/v3/reservations`: 새 예약 생성
- `GET /api/v3/reservations/:id`: 특정 예약 조회
- `DELETE /api/v3/reservations/:id`: 예약 삭제
- `POST /api/v3/reservations/:id/checkin`: 체크인 처리

### 4.2. 💰 가격 정책 및 계산

> 📄 **Source**: `docs/specs/database/pricing-policy-mapping.md`

#### 데이터베이스 스키마: `device_pricing`
```sql
CREATE TABLE IF NOT EXISTS device_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  option_type TEXT CHECK (option_type IN ('fixed','freeplay','unlimited')) NOT NULL,
  price INTEGER NOT NULL,
  price_2p_extra INTEGER,
  enable_extra_people INTEGER DEFAULT 0 NOT NULL,
  extra_per_person INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_device_pricing_option ON device_pricing (device_type_id, option_type);
```

#### 금액 산정 원칙
1.  **기본 가격**: `device_pricing.price` (선택한 기기 종류와 크레딧 옵션 기준)
2.  **2인 플레이 추가금**: `device_pricing.price_2p_extra` (is_2p=true일 경우)
3.  **추가 인원 요금**: `(참가 인원 - 1) * extra_per_person` (enable_extra_people=true이고 2인 이상일 경우)
4.  **현장 조정 금액**: `extra_fee`
5.  **최종 금액**: 위 항목들을 모두 합산. 1,000원 단위, 0 이상.

#### 서버 동작
- `POST /api/v3/reservations` 요청 시 `total_amount`가 없으면, 서버는 `device_type_id`, `credit_option_type` 등의 파라미터를 기반으로 위 원칙에 따라 금액을 자동 산정합니다.

### 4.3. 🎮 기기 관리 시스템

> 📄 **Source**: `docs/specs/database/device-management-schema.md`

#### 데이터베이스 스키마: `device_types`
```sql
CREATE TABLE device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_rentable INTEGER NOT NULL DEFAULT 0,
  max_rentable_count INTEGER NOT NULL DEFAULT 1,
  color_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### 데이터베이스 스키마: `rental_time_blocks`
```sql
CREATE TABLE rental_time_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  slot_type TEXT CHECK (slot_type IN ('early','overnight')) NOT NULL,
  start_time TEXT NOT NULL,  -- HH:MM
  end_time TEXT NOT NULL,    -- HH:MM
  enable_extra_people INTEGER NOT NULL DEFAULT 0,
  extra_per_person INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### 관리자 API (v3)
- **기기 종류**: `GET /api/v3/admin/device-types`, `POST`, `PUT`, `DELETE`
- **가격 정책**: `GET /api/v3/admin/device-types/:id/pricing`, `POST`, `PUT`, `DELETE`
- **시간 블록**: `GET /api/v3/admin/device-types/:id/time-blocks`, `POST`, `PUT`, `DELETE`

#### 사용자 API (v3)
- `GET /api/v3/devices/available`: 대여 가능한 모든 기기 목록과 관련 가격/시간 정보를 조회합니다.

### 4.4. 📅 운영 일정 관리

> 📄 **Source**: `docs/specs/database/schedule-management-schema.md`

#### 데이터베이스 스키마: `schedule_events`
```sql
CREATE TABLE schedule_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  type TEXT CHECK (type IN ('special','early_open','overnight','early_close','event','reservation_block')) NOT NULL,
  start_time TEXT,
  end_time TEXT,
  affects_reservation INTEGER DEFAULT 0 NOT NULL,
  block_type TEXT CHECK (block_type IN ('early','overnight','all_day')),
  is_auto_generated INTEGER DEFAULT 0 NOT NULL,
  source_type TEXT CHECK (source_type IN ('manual','reservation_auto')),
  source_reference INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### API 엔드포인트 (v3)
- **관리자**: `GET /api/v3/admin/schedule-events`, `POST`, `PUT`, `DELETE`
- **사용자**:
  - `GET /api/v3/schedule/today`: 오늘/내일의 운영 일정 요약
  - `GET /api/v3/schedule?date=YYYY-MM-DD`: 특정 날짜 일정 조회

### 4.5. 📝 콘텐츠 관리 (CMS)

> 📄 **Source**: `docs/specs/database/cms-schema.md`

#### 데이터베이스 스키마: `terms_pages` (약관, 버전 관리)
```sql
CREATE TABLE terms_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK (type IN ('terms_of_service','privacy_policy','marketing','age_confirm')),
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### 데이터베이스 스키마: `guide_categories` & `guide_contents` (이용 안내)
```sql
CREATE TABLE guide_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE guide_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### API 엔드포인트 (v3)
- **관리자**:
  - 약관: `GET /api/v3/admin/terms`, `POST`, `PUT`, `DELETE`, `POST /:id/activate`
  - 가이드: `GET /api/v3/admin/guide-categories`, `GET /api/v3/admin/guide-contents` 등 CRUD
- **사용자**:
  - `GET /api/v3/terms?type=...`: 활성화된 버전의 약관 조회
  - `GET /api/v3/guide?category=...`: 특정 카테고리의 가이드 조회

### 4.6. 🏆 대여 랭킹 및 배지 시스템

> 📄 **Source**: `docs/specs/feature/ranking-badges-display.md`

#### 배지 규칙
- **VIP**: 월간 랭킹 1~5위 (`gp_vip` 역할 부여)
- **단골**: 월간 랭킹 6~20위 (`gp_regular` 역할 부여)
- **일반**: 그 외 (`gp_user` 역할 부여)

#### 표시 위치
- **랭킹 페이지**: 사용자 목록에 배지, 순위, 대여 횟수 표시
- **마이페이지**: 나의 현재 배지와 순위 표시
- **프로필 카드**: 사용자 배지 아이콘/라벨 표시

#### API 연계
- `GET /api/v3/ranking?period=month`: 월간 랭킹 데이터 조회
- `GET /api/v3/me/analytics/summary`: 내 통계 정보에 월간 랭킹(`monthly: { rank, count }`) 포함

---

## 5. 🔄 V3 API 구현 상태 요약

> 📄 **Source**: `docs/specs/status.md`

- **Core (인증, 예약, 금액 계산)**: ✅ 완료
- **Device & Pricing (기기/가격/시간 블록 관리)**: ✅ 완료
- **Schedule (운영 일정 관리)**: ✅ 완료
- **CMS (약관, 이용안내 관리)**: ✅ 완료
- **Users (회원 관리, 역할, 제한/정지)**: ✅ 완료 (랭킹 기반 자동 직급은 구현 대기 🟡)
- **Notifications (PWA 푸시 알림)**: ✅ 완료
- **Analytics (통계)**: ✅ 완료
- **Deployment (Cloudflare 연동)**: ✅ 완료

**문서 버전**: v3.0 (2025.09.13 통합)
