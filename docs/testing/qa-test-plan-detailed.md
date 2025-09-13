# 게임플라자 예약 시스템 QA 테스트 계획서 (상세)

> 📅 **작성일**: 2025-09-13
> 📊 **기준**: V3 API 완전 구현 기반
> 🔍 **분석 대상**: 15개 specs 문서 분석 완료

## 📋 1. 테스트 개요

### 1.1. 테스트 목적
- **실제 구현된 V3 API 기능**의 정확성 및 안정성 검증
- 게임플라자 비즈니스 로직의 정확한 동작 확인
- Cloudflare D1 + Better Auth 환경에서의 통합 테스트
- 모바일 퍼스트 환경에서의 성능 및 사용성 검증

### 1.2. 테스트 범위
✅ **포함 기능** (모든 V3 API 완전 구현 확인)
- 인증/세션 관리 (Better Auth + Google OAuth)
- 예약 시스템 (상태 머신, 체크인, 결제)
- 기기/가격 관리 (옵션별 가격, 2P 추가, 추가인원)
- 사용자 관리 (역할 계층, 제한/정지, 랭킹 기반 자동 직급)
- 운영 일정 관리 (예약 영향 처리)
- CMS (약관 버전 관리, 가이드 콘텐츠)
- 알림 시스템 (PWA 푸시, 템플릿 관리)
- 통계/분석 (매출, 이용 통계)
- AI 비속어 필터링 (Perspective API + 수동 금지어)
- 크론잡 (랭킹 기반 자동 직급 부여)

❌ **제외 기능**
- UI/UX 테스트 (백엔드 API 중심)
- 성능 부하 테스트 (기능 테스트 우선)

### 1.3. 테스트 환경
- **데이터베이스**: Cloudflare D1 (SQLite 호환)
- **인증**: Better Auth + Google OAuth
- **런타임**: Cloudflare Workers/Pages Functions
- **AI 모더레이션**: Cloudflare Worker + Perspective API
- **시간대**: KST 고정 (한국 표준시)
- **특수 규칙**: 06시 일간 리셋, 24~29시 표기

---

## 📊 2. 데이터베이스 테스트

### 2.1. 스키마 무결성 테스트

#### 2.1.1. reservations 테이블
```sql
-- 필수 제약 조건 검증
INSERT INTO reservations (
  id, user_id, device_id, date, start_time, end_time,
  player_count, credit_type, total_amount, slot_type, status,
  created_at, updated_at
) VALUES (
  'test_res_001', 'user_test_001', 'device_test_001',
  '2025-09-15', '14:00', '16:00',
  1, 'freeplay', 8000, 'normal', 'pending',
  '2025-09-13T10:00:00Z', '2025-09-13T10:00:00Z'
);
```

**검증 포인트**:
- ✅ payment_method CHECK 제약 (`cash`, `transfer`)
- ✅ 인덱스 성능 (`idx_reservations_date`, `idx_reservations_device_date`, `idx_reservations_status`)
- ✅ 외래키 무결성 (user_id, device_id 존재 여부)

#### 2.1.2. device_pricing 테이블
```sql
-- 기기별 가격 정책 제약 검증
INSERT INTO device_pricing (
  device_type_id, option_type, price, price_2p_extra,
  enable_extra_people, extra_per_person
) VALUES (
  1, 'freeplay', 8000, 3000, 1, 2000
);
```

**검증 포인트**:
- ✅ option_type CHECK 제약 (`fixed`, `freeplay`, `unlimited`)
- ✅ UNIQUE 제약 (`device_type_id`, `option_type`)
- ✅ 음수/NULL 가격 처리

#### 2.1.3. user_roles 테이블
```sql
-- 역할 계층 제약 검증
INSERT INTO user_roles (user_id, role_type, granted_at)
VALUES ('user_test_001', 'gp_vip', '2025-09-13T10:00:00Z');
```

**검증 포인트**:
- ✅ role_type CHECK 제약 (`super_admin`, `gp_vip`, `gp_regular`, `gp_user`, `restricted`)
- ✅ 중복 역할 허용 여부
- ✅ 제한 사용자(`restricted`) 예약 차단 로직

### 2.2. 데이터 일관성 테스트

#### 2.2.1. 예약 상태 머신 검증
```javascript
// 상태 전환 시나리오
const stateTransitions = [
  { from: null, to: 'pending', valid: true },
  { from: 'pending', to: 'approved', valid: true },
  { from: 'approved', to: 'checked_in', valid: true },
  { from: 'checked_in', to: 'completed', valid: true },
  { from: 'pending', to: 'cancelled', valid: true },
  { from: 'completed', to: 'pending', valid: false }, // 역순 불가
];
```

#### 2.2.2. 1인 1대 원칙 검증
```sql
-- 동일 시간대 중복 예약 방지 테스트
SELECT COUNT(*) FROM reservations
WHERE user_id = 'user_test_001'
  AND date = '2025-09-15'
  AND status NOT IN ('cancelled', 'no_show')
  AND (
    (start_time <= '14:00' AND end_time > '14:00') OR
    (start_time < '16:00' AND end_time >= '16:00') OR
    (start_time >= '14:00' AND end_time <= '16:00')
  );
-- 결과: 1개 이하여야 함
```

---

## 🔌 3. API 엔드포인트 테스트

### 3.1. 인증 API 테스트

#### 3.1.1. Better Auth 세션 검증
```bash
# 세션 상태 확인
curl -X GET "https://localhost:3000/api/auth/session" \
  -H "Cookie: better-auth.session_token=<session_token>"

# 예상 응답 (로그인 시)
{
  "user": {
    "id": "user_google_12345",
    "email": "test@example.com",
    "name": "테스트사용자",
    "nickname": "테스터",
    "image": "https://lh3.googleusercontent.com/...",
    "emailVerified": true,
    "createdAt": "2025-09-13T10:00:00Z",
    "updatedAt": "2025-09-13T10:00:00Z"
  },
  "session": {
    "id": "session_12345",
    "userId": "user_google_12345",
    "expiresAt": "2025-10-13T10:00:00Z",
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  }
}

# 예상 응답 (비로그인 시)
# HTTP 401 Unauthorized
```

#### 3.1.2. 구글 OAuth 로그인 플로우
```bash
# OAuth 초기화
curl -X GET "https://localhost:3000/api/auth/oauth/google" \
  -H "Accept: application/json"

# 예상: 구글 인증 URL 리다이렉트
# Location: https://accounts.google.com/oauth/authorize?client_id=...
```

### 3.2. 예약 API 테스트 (v3)

#### 3.2.1. 예약 생성 API
```bash
# POST /api/v3/reservations
curl -X POST "https://localhost:3000/api/v3/reservations" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -d '{
    "device_type_id": 1,
    "date": "2025-09-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "credit_option_type": "freeplay",
    "is_2p": true,
    "participants": 2,
    "user_notes": "2인 플레이 예약"
  }'

# 예상 응답 (성공)
{
  "success": true,
  "data": {
    "id": "res_20250915_001",
    "user_id": "user_google_12345",
    "device_id": "device_beatmania_001",
    "date": "2025-09-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "player_count": 2,
    "credit_type": "freeplay",
    "total_amount": 11000, # 8000 + 3000 (2P 추가)
    "slot_type": "normal",
    "status": "pending",
    "created_at": "2025-09-13T10:00:00Z",
    "updated_at": "2025-09-13T10:00:00Z"
  }
}

# 예상 응답 (실패 - 중복 예약)
{
  "success": false,
  "error": "DUPLICATE_RESERVATION",
  "message": "해당 시간에 이미 예약이 있습니다",
  "details": {
    "conflicting_reservation_id": "res_20250915_002"
  }
}
```

#### 3.2.2. 예약 목록 조회
```bash
# GET /api/v3/reservations
curl -X GET "https://localhost:3000/api/v3/reservations?date=2025-09-15&status=pending" \
  -H "Cookie: better-auth.session_token=<session_token>"

# 예상 응답
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "res_20250915_001",
        "device_name": "비트매니아 IIDX",
        "date": "2025-09-15",
        "start_time": "14:00",
        "end_time": "16:00",
        "status": "pending",
        "total_amount": 11000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 3.2.3. 체크인 API
```bash
# POST /api/v3/reservations/:id/checkin
curl -X POST "https://localhost:3000/api/v3/reservations/res_20250915_001/checkin" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<admin_session>" \
  -d '{
    "payment_method": "cash",
    "payment_amount": 11000
  }'

# 예상 응답
{
  "success": true,
  "data": {
    "reservation_id": "res_20250915_001",
    "status": "checked_in",
    "check_in_at": "2025-09-15T05:00:00Z", # KST 14:00
    "payment_method": "cash",
    "payment_amount": 11000
  }
}
```

### 3.3. 기기 관리 API 테스트 (v3)

#### 3.3.1. 대여 가능 기기 조회
```bash
# GET /api/v3/devices/available
curl -X GET "https://localhost:3000/api/v3/devices/available"

# 예상 응답
{
  "success": true,
  "data": {
    "device_types": [
      {
        "id": 1,
        "name": "비트매니아 IIDX",
        "is_rentable": true,
        "max_rentable_count": 2,
        "color_code": "#FF6B6B",
        "pricing": [
          {
            "option_type": "freeplay",
            "price": 8000,
            "price_2p_extra": 3000,
            "enable_extra_people": true,
            "extra_per_person": 2000
          },
          {
            "option_type": "fixed",
            "price": 6000,
            "fixed_credits": 100
          }
        ],
        "time_blocks": [
          {
            "slot_type": "early",
            "start_time": "07:00",
            "end_time": "12:00"
          },
          {
            "slot_type": "overnight",
            "start_time": "22:00",
            "end_time": "05:00"
          }
        ]
      }
    ]
  }
}
```

#### 3.3.2. 관리자 기기 등록
```bash
# POST /api/v3/admin/device-types
curl -X POST "https://localhost:3000/api/v3/admin/device-types" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<admin_session>" \
  -d '{
    "name": "DDR A3",
    "is_rentable": true,
    "max_rentable_count": 1,
    "color_code": "#4ECDC4"
  }'

# 예상 응답
{
  "success": true,
  "data": {
    "id": 2,
    "name": "DDR A3",
    "is_rentable": true,
    "max_rentable_count": 1,
    "color_code": "#4ECDC4",
    "created_at": "2025-09-13T10:00:00Z"
  }
}
```

### 3.4. 사용자 관리 API 테스트 (v3)

#### 3.4.1. 역할 관리
```bash
# POST /api/v3/admin/users/user_google_12345/roles
curl -X POST "https://localhost:3000/api/v3/admin/users/user_google_12345/roles" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<admin_session>" \
  -d '{
    "role_type": "gp_vip",
    "reason": "월간 랭킹 1위 달성"
  }'

# 예상 응답
{
  "success": true,
  "data": {
    "user_id": "user_google_12345",
    "role_type": "gp_vip",
    "granted_at": "2025-09-13T10:00:00Z",
    "granted_by": "admin_user_001"
  }
}
```

#### 3.4.2. 사용자 제한
```bash
# POST /api/v3/admin/users/user_google_12345/restrictions
curl -X POST "https://localhost:3000/api/v3/admin/users/user_google_12345/restrictions" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<admin_session>" \
  -d '{
    "restriction_type": "restricted",
    "start_date": "2025-09-13",
    "end_date": "2025-09-20",
    "reason": "부적절한 행동"
  }'

# 예상 응답
{
  "success": true,
  "data": {
    "restriction_id": "rest_001",
    "user_id": "user_google_12345",
    "restriction_type": "restricted",
    "start_date": "2025-09-13",
    "end_date": "2025-09-20",
    "reason": "부적절한 행동",
    "is_active": true
  }
}
```

### 3.5. 랭킹 API 테스트 (v3)

#### 3.5.1. 월간 랭킹 조회
```bash
# GET /api/v3/ranking?period=month
curl -X GET "https://localhost:3000/api/v3/ranking?period=month&page=1&pageSize=20"

# 예상 응답
{
  "success": true,
  "data": {
    "period": "month",
    "start_date": "2025-09-01",
    "end_date": "2025-09-30",
    "rankings": [
      {
        "rank": 1,
        "user_id": "user_google_12345",
        "nickname": "프로게이머",
        "count": 15,
        "role": "gp_vip",
        "badge": "VIP"
      },
      {
        "rank": 2,
        "user_id": "user_google_67890",
        "nickname": "리듬마스터",
        "count": 12,
        "role": "gp_vip",
        "badge": "VIP"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 3.6. AI 비속어 필터링 API 테스트 (v3)

#### 3.6.1. 통합 검사 API
```bash
# POST /api/v3/moderation/check
curl -X POST "https://localhost:3000/api/v3/moderation/check" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "바보야 이런 닉네임은 어때?"
  }'

# 예상 응답 (문제 있는 경우)
{
  "success": true,
  "data": {
    "is_safe": false,
    "matches": [
      {
        "word": "바보",
        "category": "insult",
        "severity": "moderate",
        "source": "manual"
      }
    ],
    "manual": {
      "matches": ["바보"],
      "is_safe": false
    },
    "ai": {
      "toxicity_score": 0.7,
      "is_safe": false,
      "attributes": ["INSULT"]
    }
  }
}

# 예상 응답 (안전한 경우)
{
  "success": true,
  "data": {
    "is_safe": true,
    "matches": [],
    "manual": { "matches": [], "is_safe": true },
    "ai": { "toxicity_score": 0.1, "is_safe": true }
  }
}
```

#### 3.6.2. 수동 금지어 관리
```bash
# GET /api/v3/admin/banned-words
curl -X GET "https://localhost:3000/api/v3/admin/banned-words" \
  -H "Cookie: better-auth.session_token=<admin_session>"

# 예상 응답
{
  "success": true,
  "data": {
    "banned_words": [
      {
        "id": 1,
        "word": "바보",
        "category": "insult",
        "severity": "moderate",
        "is_active": true,
        "created_at": "2025-09-13T10:00:00Z"
      }
    ]
  }
}

# POST /api/v3/admin/banned-words
curl -X POST "https://localhost:3000/api/v3/admin/banned-words" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<admin_session>" \
  -d '{
    "word": "멍청이",
    "category": "insult",
    "severity": "high"
  }'
```

---

## 🧠 4. 비즈니스 로직 테스트

### 4.1. 가격 계산 엔진 테스트

#### 4.1.1. 기본 가격 계산
```javascript
// 테스트 시나리오 1: 기본 프리플레이
const testCase1 = {
  device_type_id: 1, // 비트매니아 IIDX
  credit_option_type: 'freeplay',
  is_2p: false,
  participants: 1,
  extra_fee: 0
};
// 예상 결과: 8000원

// 테스트 시나리오 2: 2인 플레이 + 추가 인원
const testCase2 = {
  device_type_id: 1,
  credit_option_type: 'freeplay',
  is_2p: true,
  participants: 3,
  extra_fee: 1000
};
// 예상 결과: 8000 + 3000 + (3-1)*2000 + 1000 = 16000원

// 테스트 시나리오 3: 고정 크레딧
const testCase3 = {
  device_type_id: 1,
  credit_option_type: 'fixed',
  fixed_credits: 100,
  is_2p: false,
  participants: 1
};
// 예상 결과: 6000원
```

#### 4.1.2. 금액 검증 규칙
```javascript
// 검증 포인트
const validationTests = [
  { amount: -1000, valid: false, reason: '음수 금액 불허' },
  { amount: 0, valid: true, reason: '0원 허용' },
  { amount: 500, valid: false, reason: '1000원 단위 아님' },
  { amount: 1000, valid: true, reason: '1000원 단위' },
  { amount: 150000, valid: false, reason: '최대 금액 초과' }
];
```

### 4.2. 예약 상태 머신 테스트

#### 4.2.1. 정상 플로우
```javascript
// 정상적인 예약 생애주기
const normalFlow = [
  { from: null, to: 'pending', action: '예약 생성', allowed: true },
  { from: 'pending', to: 'approved', action: '관리자 승인', allowed: true },
  { from: 'approved', to: 'checked_in', action: '체크인', allowed: true },
  { from: 'checked_in', to: 'completed', action: '완료 처리', allowed: true }
];

// 취소 플로우
const cancelFlow = [
  { from: 'pending', to: 'cancelled', action: '사용자 취소', allowed: true },
  { from: 'approved', to: 'cancelled', action: '관리자 취소', allowed: true }
];

// 노쇼 플로우
const noShowFlow = [
  { from: 'approved', to: 'no_show', action: '노쇼 처리', allowed: true },
  { from: 'checked_in', to: 'no_show', action: '중도 이탈', allowed: false }
];
```

#### 4.2.2. 비정상 플로우 (차단되어야 함)
```javascript
const invalidTransitions = [
  { from: 'completed', to: 'pending', reason: '완료된 예약 되돌리기 불가' },
  { from: 'cancelled', to: 'approved', reason: '취소된 예약 재활성화 불가' },
  { from: 'no_show', to: 'checked_in', reason: '노쇼 후 체크인 불가' }
];
```

### 4.3. 권한 계층 테스트

#### 4.3.1. 역할별 권한 매트릭스
```javascript
const permissionMatrix = {
  super_admin: {
    create_reservation: true,
    manage_devices: true,
    manage_users: true,
    view_analytics: true,
    manage_cms: true
  },
  gp_vip: {
    create_reservation: true,
    priority_booking: true,
    extended_hours: true,
    manage_devices: false,
    manage_users: false
  },
  gp_regular: {
    create_reservation: true,
    priority_booking: false,
    extended_hours: true,
    manage_devices: false,
    manage_users: false
  },
  gp_user: {
    create_reservation: true,
    priority_booking: false,
    extended_hours: false,
    manage_devices: false,
    manage_users: false
  },
  restricted: {
    create_reservation: false,
    view_content: true,
    manage_devices: false,
    manage_users: false
  }
};
```

#### 4.3.2. 랭킹 기반 자동 직급 부여 테스트
```bash
# 크론잡 수동 실행
curl -X GET "https://localhost:3000/api/cron/rebuild-roles" \
  -H "Authorization: Bearer <CRON_SECRET>"

# 예상 응답
{
  "success": true,
  "data": {
    "period": "month",
    "processed_users": 50,
    "role_changes": [
      {
        "user_id": "user_google_12345",
        "old_role": "gp_user",
        "new_role": "gp_vip",
        "rank": 1,
        "count": 15
      }
    ],
    "executed_at": "2025-09-13T21:00:00Z"
  }
}
```

### 4.4. KST 시간대 처리 테스트

#### 4.4.1. 24~29시 표기 테스트
```javascript
// 시간 변환 로직 테스트
const timeDisplayTests = [
  { kst: '00:00', display: '24:00' },
  { kst: '01:30', display: '25:30' },
  { kst: '02:00', display: '26:00' },
  { kst: '05:59', display: '29:59' },
  { kst: '06:00', display: '06:00' }, // 정상 시간대
  { kst: '23:59', display: '23:59' }
];
```

#### 4.4.2. 06시 일간 리셋 테스트
```javascript
// 영업일 기준 테스트
const businessDayTests = [
  {
    current_time: '2025-09-13T05:59:59+09:00', // KST 05:59
    business_date: '2025-09-12', // 전일 영업일
    description: '06시 이전은 전일 영업일'
  },
  {
    current_time: '2025-09-13T06:00:00+09:00', // KST 06:00
    business_date: '2025-09-13', // 당일 영업일
    description: '06시 정각부터 당일 영업일'
  }
];
```

---

## 🔧 5. 테스트 환경 설정

### 5.1. Cloudflare D1 테스트 환경

#### 5.1.1. 로컬 D1 설정
```bash
# Wrangler CLI 설치
npm install -g wrangler

# D1 로컬 데이터베이스 생성
wrangler d1 create gameplaza-test

# 스키마 적용
wrangler d1 execute gameplaza-test --local --file=docs/sql/d1_reservations_and_pricing.sql

# 테스트 데이터 삽입
wrangler d1 execute gameplaza-test --local --file=docs/sql/test_data.sql
```

#### 5.1.2. 환경변수 설정
```bash
# .env.test
D1_ENABLED=true
D1_BINDING_NAME=DB
DATABASE_URL="file:./test.db"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="test_cron_secret_12345"
```

### 5.2. Better Auth 테스트 설정

#### 5.2.1. 구글 OAuth 테스트 클라이언트
```javascript
// Google OAuth 테스트 설정
const testOAuthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID_TEST,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET_TEST,
    redirectUri: 'http://localhost:3000/api/auth/callback/google'
  }
};
```

#### 5.2.2. 세션 모킹
```javascript
// 테스트용 세션 생성
const createTestSession = async (userId, role = 'gp_user') => {
  const sessionToken = generateSecureToken();
  await db.insert(sessions).values({
    id: `session_test_${Date.now()}`,
    userId,
    sessionToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent'
  });
  return sessionToken;
};
```

### 5.3. AI Moderation 테스트 설정

#### 5.3.1. Perspective API 모킹
```javascript
// Perspective API 응답 모킹
const mockPerspectiveResponse = {
  attributeScores: {
    TOXICITY: {
      summaryScore: { value: 0.8 },
      confidenceScore: { value: 0.9 }
    },
    SEVERE_TOXICITY: {
      summaryScore: { value: 0.3 },
      confidenceScore: { value: 0.8 }
    }
  }
};
```

#### 5.3.2. Worker 테스트 설정
```bash
# Moderation Worker 로컬 실행
cd workers
wrangler dev moderation-worker.js --local

# 테스트 요청
curl -X POST "http://localhost:8787" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_webhook_token" \
  -d '{"text":"테스트 비속어"}'
```

---

## 📋 6. 테스트 데이터 설계

### 6.1. 기본 테스트 데이터

#### 6.1.1. 사용자 데이터
```sql
-- 테스트 사용자 생성
INSERT INTO users (id, email, name, nickname, email_verified, created_at, updated_at) VALUES
('user_test_admin', 'admin@gameplaza.test', '관리자', '관리자', 1, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
('user_test_vip', 'vip@gameplaza.test', 'VIP사용자', 'VIP유저', 1, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
('user_test_regular', 'regular@gameplaza.test', '단골사용자', '단골유저', 1, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
('user_test_normal', 'normal@gameplaza.test', '일반사용자', '일반유저', 1, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
('user_test_restricted', 'restricted@gameplaza.test', '제한사용자', '제한유저', 1, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z');

-- 역할 할당
INSERT INTO user_roles (user_id, role_type, granted_at) VALUES
('user_test_admin', 'super_admin', '2025-09-01T00:00:00Z'),
('user_test_vip', 'gp_vip', '2025-09-01T00:00:00Z'),
('user_test_regular', 'gp_regular', '2025-09-01T00:00:00Z'),
('user_test_normal', 'gp_user', '2025-09-01T00:00:00Z'),
('user_test_restricted', 'restricted', '2025-09-01T00:00:00Z');
```

#### 6.1.2. 기기 종류 및 가격 데이터
```sql
-- 테스트 기기 종류
INSERT INTO device_types (id, name, is_rentable, max_rentable_count, color_code, created_at, updated_at) VALUES
(1, '비트매니아 IIDX', 1, 2, '#FF6B6B', '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
(2, 'DDR A3', 1, 1, '#4ECDC4', '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
(3, '사운드 볼텍스', 1, 2, '#45B7D1', '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
(4, 'PS5', 1, 4, '#96CEB4', '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
(5, '레이싱 시뮬레이터', 1, 1, '#FECA57', '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z');

-- 가격 정책
INSERT INTO device_pricing (device_type_id, option_type, price, price_2p_extra, enable_extra_people, extra_per_person, created_at, updated_at) VALUES
-- 비트매니아 IIDX
(1, 'freeplay', 8000, 3000, 1, 2000, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
(1, 'fixed', 6000, 2000, 0, NULL, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
-- DDR A3
(2, 'freeplay', 10000, NULL, 0, NULL, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
(2, 'fixed', 7000, NULL, 0, NULL, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
-- 사운드 볼텍스
(3, 'freeplay', 8000, 3000, 1, 2000, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
-- PS5
(4, 'freeplay', 5000, NULL, 1, 1000, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
-- 레이싱 시뮬레이터
(5, 'freeplay', 15000, NULL, 1, 3000, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z');
```

#### 6.1.3. 예약 테스트 데이터
```sql
-- 다양한 상태의 예약 데이터
INSERT INTO reservations (
  id, user_id, device_id, date, start_time, end_time,
  player_count, credit_type, total_amount, slot_type, status,
  created_at, updated_at, check_in_at, payment_method, payment_amount
) VALUES
-- 대기 중 예약
('res_test_001', 'user_test_vip', 'device_beatmania_001', '2025-09-15', '14:00', '16:00', 2, 'freeplay', 11000, 'normal', 'pending', '2025-09-13T01:00:00Z', '2025-09-13T01:00:00Z', NULL, NULL, NULL),
-- 승인된 예약
('res_test_002', 'user_test_regular', 'device_ddr_001', '2025-09-15', '16:00', '18:00', 1, 'freeplay', 10000, 'normal', 'approved', '2025-09-13T02:00:00Z', '2025-09-13T02:00:00Z', NULL, NULL, NULL),
-- 체크인 완료
('res_test_003', 'user_test_normal', 'device_sdvx_001', '2025-09-15', '18:00', '20:00', 1, 'freeplay', 8000, 'normal', 'checked_in', '2025-09-13T03:00:00Z', '2025-09-13T09:00:00Z', '2025-09-15T09:00:00Z', 'cash', 8000),
-- 완료된 예약
('res_test_004', 'user_test_vip', 'device_ps5_001', '2025-09-14', '20:00', '22:00', 3, 'freeplay', 7000, 'normal', 'completed', '2025-09-12T05:00:00Z', '2025-09-14T13:00:00Z', '2025-09-14T11:00:00Z', 'transfer', 7000),
-- 취소된 예약
('res_test_005', 'user_test_normal', 'device_racing_001', '2025-09-13', '22:00', '01:00', 1, 'freeplay', 15000, 'overnight', 'cancelled', '2025-09-12T10:00:00Z', '2025-09-13T05:00:00Z', NULL, NULL, NULL);
```

#### 6.1.4. 수동 금지어 데이터
```sql
-- 테스트용 금지어 목록
INSERT INTO banned_words (word, category, severity, is_active, created_at) VALUES
('바보', 'insult', 'moderate', 1, '2025-09-01T00:00:00Z'),
('멍청이', 'insult', 'high', 1, '2025-09-01T00:00:00Z'),
('병신', 'insult', 'high', 1, '2025-09-01T00:00:00Z'),
('도박', 'prohibited', 'high', 1, '2025-09-01T00:00:00Z'),
('불법', 'prohibited', 'high', 1, '2025-09-01T00:00:00Z');
```

### 6.2. 테스트 시나리오별 데이터

#### 6.2.1. 가격 계산 테스트 시나리오
```javascript
const pricingTestCases = [
  {
    name: '기본 프리플레이 (비트매니아)',
    input: {
      device_type_id: 1,
      credit_option_type: 'freeplay',
      is_2p: false,
      participants: 1
    },
    expected: {
      base_price: 8000,
      extras: [],
      total: 8000
    }
  },
  {
    name: '2인 플레이 + 추가 인원 (비트매니아)',
    input: {
      device_type_id: 1,
      credit_option_type: 'freeplay',
      is_2p: true,
      participants: 4
    },
    expected: {
      base_price: 8000,
      extras: [
        { type: '2p_extra', amount: 3000 },
        { type: 'extra_people', amount: 6000 } // (4-1) * 2000
      ],
      total: 17000
    }
  },
  {
    name: '고정 크레딧 (비트매니아)',
    input: {
      device_type_id: 1,
      credit_option_type: 'fixed',
      fixed_credits: 100,
      is_2p: true,
      participants: 2
    },
    expected: {
      base_price: 6000,
      extras: [
        { type: '2p_extra', amount: 2000 }
      ],
      total: 8000
    }
  },
  {
    name: '다인원 플레이 (PS5)',
    input: {
      device_type_id: 4,
      credit_option_type: 'freeplay',
      is_2p: false,
      participants: 4
    },
    expected: {
      base_price: 5000,
      extras: [
        { type: 'extra_people', amount: 3000 } // (4-1) * 1000
      ],
      total: 8000
    }
  },
  {
    name: '현장 조정 금액 포함',
    input: {
      device_type_id: 5,
      credit_option_type: 'freeplay',
      is_2p: false,
      participants: 2,
      extra_fee: 2000
    },
    expected: {
      base_price: 15000,
      extras: [
        { type: 'extra_people', amount: 3000 }, // (2-1) * 3000
        { type: 'extra_fee', amount: 2000 }
      ],
      total: 20000
    }
  }
];
```

#### 6.2.2. 권한 테스트 시나리오
```javascript
const permissionTestCases = [
  {
    name: '슈퍼관리자 모든 권한',
    user_role: 'super_admin',
    test_actions: [
      { action: 'create_reservation', expected: true },
      { action: 'manage_devices', expected: true },
      { action: 'manage_users', expected: true },
      { action: 'view_analytics', expected: true },
      { action: 'manage_cms', expected: true }
    ]
  },
  {
    name: 'VIP 사용자 권한',
    user_role: 'gp_vip',
    test_actions: [
      { action: 'create_reservation', expected: true },
      { action: 'manage_devices', expected: false },
      { action: 'manage_users', expected: false },
      { action: 'priority_booking', expected: true }
    ]
  },
  {
    name: '제한 사용자 권한',
    user_role: 'restricted',
    test_actions: [
      { action: 'create_reservation', expected: false },
      { action: 'view_content', expected: true },
      { action: 'manage_devices', expected: false }
    ]
  }
];
```

---

## 🔍 7. 에러 케이스 테스트

### 7.1. 인증 에러 테스트

#### 7.1.1. 세션 만료
```bash
# 만료된 세션으로 API 호출
curl -X GET "https://localhost:3000/api/v3/reservations" \
  -H "Cookie: better-auth.session_token=expired_token"

# 예상 응답: HTTP 401
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "세션이 만료되었습니다",
  "code": 401
}
```

#### 7.1.2. 권한 부족
```bash
# 일반 사용자가 관리자 API 호출
curl -X GET "https://localhost:3000/api/v3/admin/users" \
  -H "Cookie: better-auth.session_token=<normal_user_session>"

# 예상 응답: HTTP 403
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "관리자 권한이 필요합니다",
  "code": 403
}
```

### 7.2. 예약 에러 테스트

#### 7.2.1. 중복 예약 시도
```bash
# 동일 시간대에 예약 시도
curl -X POST "https://localhost:3000/api/v3/reservations" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -d '{
    "device_type_id": 1,
    "date": "2025-09-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "credit_option_type": "freeplay"
  }'

# 예상 응답: HTTP 409
{
  "success": false,
  "error": "DUPLICATE_RESERVATION",
  "message": "해당 시간에 이미 예약이 있습니다",
  "code": 409,
  "details": {
    "conflicting_reservation": {
      "id": "res_test_001",
      "start_time": "14:00",
      "end_time": "16:00"
    }
  }
}
```

#### 7.2.2. 제한 사용자 예약 시도
```bash
# 제한된 사용자가 예약 시도
curl -X POST "https://localhost:3000/api/v3/reservations" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<restricted_user_session>" \
  -d '{
    "device_type_id": 1,
    "date": "2025-09-15",
    "start_time": "20:00",
    "end_time": "22:00",
    "credit_option_type": "freeplay"
  }'

# 예상 응답: HTTP 403
{
  "success": false,
  "error": "USER_RESTRICTED",
  "message": "현재 예약이 제한된 상태입니다",
  "code": 403,
  "details": {
    "restriction": {
      "type": "restricted",
      "start_date": "2025-09-13",
      "end_date": "2025-09-20",
      "reason": "부적절한 행동"
    }
  }
}
```

#### 7.2.3. 잘못된 시간 형식
```bash
# 잘못된 시간 형식으로 예약 시도
curl -X POST "https://localhost:3000/api/v3/reservations" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -d '{
    "device_type_id": 1,
    "date": "2025-09-15",
    "start_time": "25:00",
    "end_time": "26:00",
    "credit_option_type": "freeplay"
  }'

# 예상 응답: HTTP 400
{
  "success": false,
  "error": "INVALID_TIME_FORMAT",
  "message": "시간 형식이 올바르지 않습니다",
  "code": 400,
  "details": {
    "field": "start_time",
    "value": "25:00",
    "expected_format": "HH:MM (00:00-23:59)"
  }
}
```

### 7.3. 가격 계산 에러 테스트

#### 7.3.1. 존재하지 않는 기기 종류
```bash
curl -X POST "https://localhost:3000/api/v3/reservations" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -d '{
    "device_type_id": 999,
    "date": "2025-09-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "credit_option_type": "freeplay"
  }'

# 예상 응답: HTTP 404
{
  "success": false,
  "error": "DEVICE_TYPE_NOT_FOUND",
  "message": "존재하지 않는 기기 종류입니다",
  "code": 404,
  "details": {
    "device_type_id": 999
  }
}
```

#### 7.3.2. 지원하지 않는 옵션
```bash
curl -X POST "https://localhost:3000/api/v3/reservations" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -d '{
    "device_type_id": 2,
    "date": "2025-09-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "credit_option_type": "unlimited"
  }'

# 예상 응답: HTTP 400
{
  "success": false,
  "error": "UNSUPPORTED_OPTION",
  "message": "해당 기기에서 지원하지 않는 옵션입니다",
  "code": 400,
  "details": {
    "device_type_id": 2,
    "device_name": "DDR A3",
    "requested_option": "unlimited",
    "available_options": ["freeplay", "fixed"]
  }
}
```

### 7.4. AI 모더레이션 에러 테스트

#### 7.4.1. Perspective API 서비스 장애
```bash
# Perspective API 응답 없을 때
curl -X POST "https://localhost:3000/api/v3/moderation/check" \
  -H "Content-Type: application/json" \
  -d '{"text":"테스트 텍스트"}'

# 예상 응답: AI 검사 실패, 수동 검사만 수행
{
  "success": true,
  "data": {
    "is_safe": true, # 수동 검사 결과 기준
    "matches": [],
    "manual": {
      "matches": [],
      "is_safe": true
    },
    "ai": {
      "error": "SERVICE_UNAVAILABLE",
      "message": "AI 검사 서비스에 연결할 수 없습니다"
    }
  }
}
```

#### 7.4.2. 웹훅 토큰 불일치
```bash
# 잘못된 토큰으로 Moderation Worker 호출
curl -X POST "https://your-worker.workers.dev" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_token" \
  -d '{"text":"테스트"}'

# 예상 응답: HTTP 401
{
  "error": "UNAUTHORIZED",
  "message": "Invalid webhook token"
}
```

---

## 📊 8. 성능 테스트

### 8.1. API 응답 시간 테스트

#### 8.1.1. 주요 API 응답 시간 목표
```javascript
const performanceTargets = {
  '/api/auth/session': { target: '< 100ms', priority: 'high' },
  '/api/v3/reservations (GET)': { target: '< 200ms', priority: 'high' },
  '/api/v3/reservations (POST)': { target: '< 500ms', priority: 'high' },
  '/api/v3/devices/available': { target: '< 150ms', priority: 'high' },
  '/api/v3/ranking': { target: '< 300ms', priority: 'medium' },
  '/api/v3/admin/analytics/summary': { target: '< 1000ms', priority: 'medium' },
  '/api/v3/moderation/check': { target: '< 2000ms', priority: 'low' }
};
```

#### 8.1.2. 데이터베이스 쿼리 성능
```sql
-- 인덱스 효율성 테스트
EXPLAIN QUERY PLAN
SELECT * FROM reservations
WHERE date = '2025-09-15'
  AND status = 'pending'
ORDER BY start_time;
-- 예상: idx_reservations_date 사용

EXPLAIN QUERY PLAN
SELECT r.*, dt.name as device_name
FROM reservations r
JOIN device_types dt ON r.device_id LIKE dt.name || '%'
WHERE r.user_id = 'user_test_001'
ORDER BY r.date DESC, r.start_time DESC;
-- 예상: Full table scan 주의
```

### 8.2. 동시성 테스트

#### 8.2.1. 동시 예약 생성
```javascript
// 동시에 같은 시간대 예약 시도
const concurrentReservations = Array.from({ length: 5 }, (_, i) => ({
  device_type_id: 1,
  date: '2025-09-15',
  start_time: '14:00',
  end_time: '16:00',
  credit_option_type: 'freeplay',
  user_id: `user_test_${i + 1}`
}));

// 결과: 1개만 성공, 4개는 중복 예약 에러
```

#### 8.2.2. 랭킹 계산 중 예약 생성
```javascript
// 크론잡 실행 중 새 예약 생성 테스트
const testConcurrentRankingAndReservation = async () => {
  // 1. 랭킹 재계산 시작
  const rankingPromise = fetch('/api/cron/rebuild-roles', {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
  });

  // 2. 동시에 예약 생성
  const reservationPromise = fetch('/api/v3/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReservation)
  });

  // 3. 두 작업 모두 성공해야 함
  const [rankingResult, reservationResult] = await Promise.all([
    rankingPromise,
    reservationPromise
  ]);
};
```

---

## 🏁 9. 통합 테스트 시나리오

### 9.1. 완전한 예약 생애주기 테스트

#### 9.1.1. 시나리오: VIP 사용자의 2인 플레이 예약
```javascript
const fullReservationLifecycle = async () => {
  // 1. 사용자 로그인
  const loginResponse = await fetch('/api/auth/signin/google', {
    method: 'POST',
    credentials: 'include'
  });

  // 2. 대여 가능 기기 조회
  const devicesResponse = await fetch('/api/v3/devices/available');
  const devices = await devicesResponse.json();

  // 3. 예약 생성
  const reservationData = {
    device_type_id: devices.data.device_types[0].id,
    date: '2025-09-15',
    start_time: '14:00',
    end_time: '16:00',
    credit_option_type: 'freeplay',
    is_2p: true,
    participants: 2,
    user_notes: '2인 플레이 예약입니다'
  };

  const createResponse = await fetch('/api/v3/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservationData),
    credentials: 'include'
  });

  const reservation = await createResponse.json();

  // 4. 관리자 승인 (관리자 계정으로)
  const approveResponse = await fetch(
    `/api/v3/admin/reservations/${reservation.data.id}/approve`,
    {
      method: 'POST',
      credentials: 'include' // 관리자 세션
    }
  );

  // 5. 체크인 처리
  const checkinResponse = await fetch(
    `/api/v3/reservations/${reservation.data.id}/checkin`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: 'cash',
        payment_amount: reservation.data.total_amount
      }),
      credentials: 'include'
    }
  );

  // 6. 완료 처리
  const completeResponse = await fetch(
    `/api/v3/admin/reservations/${reservation.data.id}/complete`,
    {
      method: 'POST',
      credentials: 'include'
    }
  );

  // 7. 통계 반영 확인
  const analyticsResponse = await fetch('/api/v3/me/analytics/summary', {
    credentials: 'include'
  });

  return {
    reservation: reservation.data,
    final_status: 'completed',
    total_amount: reservation.data.total_amount,
    analytics: await analyticsResponse.json()
  };
};
```

### 9.2. 자동 직급 부여 통합 테스트

#### 9.2.1. 시나리오: 월간 랭킹 1위 → VIP 승격
```javascript
const rankingPromotionTest = async () => {
  // 1. 사용자에게 다수의 완료된 예약 생성 (월간 1위용)
  const reservations = [];
  for (let i = 0; i < 20; i++) {
    const reservation = await createTestReservation({
      user_id: 'user_test_normal',
      date: `2025-09-${String(i + 1).padStart(2, '0')}`,
      status: 'completed'
    });
    reservations.push(reservation);
  }

  // 2. 현재 역할 확인 (gp_user)
  const beforeRoles = await getUserRoles('user_test_normal');

  // 3. 랭킹 기반 직급 재계산 실행
  const cronResponse = await fetch('/api/cron/rebuild-roles', {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
  });

  const cronResult = await cronResponse.json();

  // 4. 역할 변경 확인 (gp_user → gp_vip)
  const afterRoles = await getUserRoles('user_test_normal');

  // 5. 랭킹 API에서 배지 확인
  const rankingResponse = await fetch('/api/v3/ranking?period=month');
  const ranking = await rankingResponse.json();

  return {
    before_role: beforeRoles,
    after_role: afterRoles,
    cron_result: cronResult,
    ranking_position: ranking.data.rankings.find(
      r => r.user_id === 'user_test_normal'
    )
  };
};
```

### 9.3. AI 비속어 필터링 통합 테스트

#### 9.3.1. 시나리오: 닉네임 변경 시 필터링
```javascript
const nicknameFilteringTest = async () => {
  const testCases = [
    { nickname: '정상적인닉네임', expected: 'approved' },
    { nickname: '바보멍청이', expected: 'rejected' },
    { nickname: 'fuck stupid', expected: 'rejected' },
    { nickname: '게임러버', expected: 'approved' }
  ];

  const results = [];

  for (const testCase of testCases) {
    // 1. 닉네임 변경 시도
    const response = await fetch('/api/v3/me/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: testCase.nickname }),
      credentials: 'include'
    });

    // 2. 결과 확인
    if (response.ok) {
      results.push({ ...testCase, actual: 'approved' });
    } else {
      const error = await response.json();
      results.push({
        ...testCase,
        actual: 'rejected',
        reason: error.message
      });
    }
  }

  return results;
};
```

---

## 📝 10. 테스트 실행 가이드

### 10.1. 테스트 환경 준비

#### 10.1.1. 환경 설정 체크리스트
```bash
# 1. 환경변수 확인
echo "D1_ENABLED: $D1_ENABLED"
echo "DATABASE_URL: $DATABASE_URL"
echo "BETTER_AUTH_URL: $BETTER_AUTH_URL"
echo "CRON_SECRET: $CRON_SECRET"

# 2. 데이터베이스 연결 확인
curl -X GET "http://localhost:3000/api/v3/health"

# 3. 인증 시스템 확인
curl -X GET "http://localhost:3000/api/auth/session"

# 4. AI 모더레이션 확인
curl -X POST "http://localhost:3000/api/v3/moderation/check" \
  -H "Content-Type: application/json" \
  -d '{"text":"테스트"}'
```

### 10.2. 테스트 실행 순서

#### 10.2.1. 단계별 실행 가이드
```bash
# 1단계: 데이터베이스 스키마 테스트
npm run test:db-schema

# 2단계: API 단위 테스트
npm run test:api-unit

# 3단계: 비즈니스 로직 테스트
npm run test:business-logic

# 4단계: 통합 테스트
npm run test:integration

# 5단계: 성능 테스트
npm run test:performance

# 전체 테스트 실행
npm run test:all
```

### 10.3. 테스트 결과 검증

#### 10.3.1. 성공 기준
- ✅ **데이터베이스**: 모든 제약 조건 통과, 인덱스 정상 작동
- ✅ **API**: 모든 v3 엔드포인트 정상 응답, 에러 케이스 적절한 처리
- ✅ **비즈니스 로직**: 상태 머신, 가격 계산, 권한 체계 정확한 동작
- ✅ **통합 시나리오**: 완전한 예약 생애주기, 자동 직급 부여 성공
- ✅ **성능**: 목표 응답 시간 만족, 동시성 문제 없음

#### 10.3.2. 실패 시 대응 방안
```javascript
const troubleshootingGuide = {
  'DB_CONNECTION_FAILED': {
    causes: ['D1 바인딩 미설정', '환경변수 누락', 'wrangler.toml 오류'],
    solutions: ['바인딩 설정 확인', 'D1_ENABLED=true 설정', 'database_id 확인']
  },
  'AUTH_SESSION_INVALID': {
    causes: ['Better Auth 설정 오류', '세션 저장소 문제', 'OAuth 클라이언트 오류'],
    solutions: ['BETTER_AUTH_URL 확인', 'Google OAuth 설정 확인', '세션 테이블 확인']
  },
  'PRICING_CALCULATION_ERROR': {
    causes: ['device_pricing 데이터 없음', '가격 정책 불일치', '계산 로직 오류'],
    solutions: ['시드 데이터 확인', '가격 정책 재설정', '계산 엔진 로그 확인']
  },
  'MODERATION_API_FAILED': {
    causes: ['Perspective API 키 오류', 'Worker 배포 안됨', '네트워크 문제'],
    solutions: ['API 키 확인', 'Worker 재배포', '수동 검사만 사용']
  }
};
```

---

## 📊 11. 테스트 결과 문서화

### 11.1. 테스트 보고서 템플릿

#### 11.1.1. 실행 결과 요약
```markdown
# QA 테스트 실행 결과

## 기본 정보
- 실행 일시: 2025-09-13 15:00:00 KST
- 테스트 환경: Local Development
- 데이터베이스: Cloudflare D1 (로컬)
- 총 테스트 케이스: 156개

## 결과 요약
- ✅ 성공: 148개 (94.9%)
- ❌ 실패: 8개 (5.1%)
- ⏭️ 건너뜀: 0개

## 카테고리별 결과
| 카테고리 | 성공 | 실패 | 성공률 |
|---------|------|------|-------|
| 데이터베이스 | 24/25 | 1 | 96% |
| API 엔드포인트 | 45/47 | 2 | 95.7% |
| 비즈니스 로직 | 32/35 | 3 | 91.4% |
| 통합 시나리오 | 15/17 | 2 | 88.2% |
| 성능 테스트 | 32/32 | 0 | 100% |
```

#### 11.1.2. 실패 케이스 분석
```markdown
## 실패한 테스트 케이스

### 1. 예약 중복 검사 (CRITICAL)
- **테스트**: 동일 시간대 중복 예약 방지
- **실패 이유**: 시간 범위 겹침 로직 오류
- **예상**: 중복 예약 차단
- **실제**: 2개 예약 모두 생성됨
- **해결 방안**: 시간 범위 검사 로직 수정 필요

### 2. AI 모더레이션 타임아웃 (MEDIUM)
- **테스트**: 비속어 필터링 API
- **실패 이유**: Perspective API 응답 지연
- **예상**: 2초 이내 응답
- **실제**: 5초 후 타임아웃
- **해결 방안**: 타임아웃 설정 조정 또는 캐싱 적용
```

### 11.2. 성능 측정 결과

#### 11.2.1. API 응답 시간
```markdown
## API 성능 측정 결과

| 엔드포인트 | 목표 | 평균 | 최대 | 상태 |
|-----------|------|------|------|------|
| /api/auth/session | <100ms | 45ms | 89ms | ✅ |
| /api/v3/reservations (GET) | <200ms | 156ms | 234ms | ✅ |
| /api/v3/reservations (POST) | <500ms | 287ms | 456ms | ✅ |
| /api/v3/devices/available | <150ms | 98ms | 167ms | ✅ |
| /api/v3/ranking | <300ms | 245ms | 389ms | ✅ |
| /api/v3/moderation/check | <2000ms | 1245ms | 3456ms | ❌ |
```

### 11.3. 개선 권장사항

#### 11.3.1. 우선순위별 개선사항
```markdown
## 개선 권장사항

### HIGH (즉시 수정 필요)
1. **예약 중복 검사 로직 수정**
   - 시간 범위 겹침 정확한 계산
   - 데이터베이스 트랜잭션 보장

2. **제한 사용자 예약 차단 강화**
   - 모든 예약 생성 경로에서 제한 상태 확인
   - 프론트엔드에서도 사전 차단

### MEDIUM (다음 스프린트에서 개선)
1. **AI 모더레이션 성능 최적화**
   - 응답 캐싱 구현
   - 타임아웃 정책 개선

2. **데이터베이스 쿼리 최적화**
   - 복합 인덱스 추가 검토
   - N+1 쿼리 문제 해결

### LOW (장기 개선)
1. **실시간 알림 시스템 강화**
2. **분석 데이터 캐싱 구현**
```

---

## 📚 12. 참고 자료

### 12.1. API 문서 참조
- **V3 API 명세**: `/docs/specs/comprehensive_specification_v3.md`
- **데이터베이스 스키마**: `/docs/specs/database/*.md`
- **배포 가이드**: `/docs/specs/deployment/*.md`

### 12.2. 테스트 도구 및 프레임워크
- **API 테스트**: Jest + Supertest
- **데이터베이스 테스트**: SQLite + Vitest
- **성능 테스트**: Artillery + Lighthouse
- **모킹**: MSW (Mock Service Worker)

### 12.3. 환경 설정 파일
- **로컬 개발**: `.env.test`
- **CI/CD**: `github/workflows/test.yml`
- **D1 설정**: `wrangler.toml`
- **Better Auth 설정**: `auth.config.ts`

---

> 📝 **문서 관리**
> - 작성자: QA 팀
> - 최종 수정: 2025-09-13
> - 다음 검토: 2025-09-20
> - 버전: 1.0.0

이 테스트 계획서는 게임플라자 예약 시스템의 모든 실제 구현 기능을 기반으로 작성되었으며, 지속적으로 업데이트되어야 합니다.