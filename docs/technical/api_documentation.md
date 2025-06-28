# 📡 API 문서

## 개요

광주 게임플라자 예약 시스템의 RESTful API 문서입니다. 모든 API는 `/api` 경로로 시작합니다.

### 기본 정보
- **Base URL**: `https://gameplaza.vercel.app/api`
- **인증 방식**: Bearer Token (JWT)
- **응답 형식**: JSON
- **문자 인코딩**: UTF-8

### 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": { ... }
  }
}
```

### HTTP 상태 코드
- `200 OK`: 요청 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

## 🔐 인증 API

### 세션 확인
현재 로그인된 사용자의 세션 정보를 확인합니다.

```http
GET /api/auth/session
```

#### 응답 예시
```json
{
  "user": {
    "name": "홍길동",
    "email": "hong@gmail.com",
    "image": "https://...",
    "role": "user"
  },
  "expires": "2024-02-01T00:00:00.000Z"
}
```

### 로그아웃
현재 세션을 종료합니다.

```http
POST /api/auth/signout
```

---

## 📅 예약 API

### 예약 목록 조회
사용자의 예약 목록을 조회합니다.

```http
GET /api/reservations
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | 예약 상태 필터 (pending, approved, rejected, cancelled, completed) |
| page | number | No | 페이지 번호 (기본값: 1) |
| limit | number | No | 페이지당 항목 수 (기본값: 10) |

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "res_123",
        "device_type": {
          "id": "type_001",
          "name": "마이마이 DX"
        },
        "date": "2024-01-25",
        "time_slot": "14:00-18:00",
        "status": "approved",
        "total_price": 40000,
        "created_at": "2024-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 예약 상세 조회
특정 예약의 상세 정보를 조회합니다.

```http
GET /api/reservations/{id}
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | 예약 ID |

### 예약 신청
새로운 예약을 신청합니다.

```http
POST /api/reservations
```

#### Request Body
```json
{
  "rental_time_slot_id": "slot_123",
  "device_number": 1,
  "player_count": 1,
  "credit_option": "1시간",
  "total_price": 40000,
  "notes": "친구와 함께 이용 예정"
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "reservation_id": "res_456",
    "status": "pending",
    "message": "예약이 접수되었습니다. 관리자 승인을 기다려주세요."
  }
}
```

### 예약 취소
예약을 취소합니다.

```http
DELETE /api/reservations/{id}
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | 예약 ID |

---

## 👨‍💼 관리자 API

> 관리자 권한이 필요한 API입니다.

### 예약 승인
대기 중인 예약을 승인합니다.

```http
POST /api/admin/reservations/{id}/approve
```

#### Request Body
```json
{
  "assigned_device_number": 2,
  "admin_notes": "승인 완료"
}
```

### 예약 거절
대기 중인 예약을 거절합니다.

```http
POST /api/admin/reservations/{id}/reject
```

#### Request Body
```json
{
  "reason": "해당 시간대에 이미 예약이 있습니다",
  "admin_notes": "중복 예약"
}
```

### 체크인 처리
승인된 예약을 체크인 처리합니다.

```http
POST /api/admin/reservations/{id}/checkin
```

#### Request Body
```json
{
  "device_number": 2,
  "payment_method": "cash",
  "notes": "현금 결제 완료"
}
```

### 결제 확인
계좌이체 결제를 확인 처리합니다.

```http
POST /api/admin/reservations/{id}/confirm-payment
```

---

## 🎮 기기 관리 API

### 기기 목록 조회
전체 기기 목록을 조회합니다.

```http
GET /api/admin/devices
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | 카테고리 필터 |
| status | string | No | 상태 필터 (available, rental, maintenance, unavailable) |

### 기기 상태 변경
기기의 상태를 변경합니다.

```http
PATCH /api/admin/devices/{id}/status
```

#### Request Body
```json
{
  "status": "maintenance",
  "notes": "정기 점검"
}
```

### 기기 타입 추가
새로운 기종을 추가합니다.

```http
POST /api/admin/device-types
```

#### Request Body
```json
{
  "category_id": "cat_001",
  "name": "마이마이 DX",
  "description": "최신 리듬게임",
  "play_modes": [
    {"name": "스탠다드", "price": 500},
    {"name": "DX 모드", "price": 1000}
  ],
  "is_rentable": true,
  "device_count": 4
}
```

---

## 📊 통계 API

### 대시보드 통계
관리자 대시보드용 통계를 조회합니다.

```http
GET /api/admin/analytics/dashboard
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "today": {
      "reservations": 15,
      "revenue": 600000,
      "checkins": 12
    },
    "week": {
      "reservations": 85,
      "revenue": 3400000,
      "popular_device": "마이마이 DX"
    }
  }
}
```

### 매출 통계
기간별 매출 통계를 조회합니다.

```http
GET /api/admin/analytics/revenue
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string | Yes | 시작일 (YYYY-MM-DD) |
| end_date | string | Yes | 종료일 (YYYY-MM-DD) |
| group_by | string | No | 그룹 기준 (day, week, month) |

---

## 🔄 크론잡 API

### 기기 상태 업데이트
예약이 종료된 기기의 상태를 자동으로 업데이트합니다.

```http
GET /api/cron/update-device-status
```

#### Headers
| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Authorization | Bearer {CRON_SECRET} | Yes | 크론잡 인증 토큰 |

#### 응답 예시
```json
{
  "success": true,
  "message": "Device status updated successfully",
  "timestamp": "2024-01-20T15:00:00Z",
  "devicesChecked": 12
}
```

---

## 🔔 알림 API

### 푸시 토큰 등록
FCM 푸시 토큰을 등록합니다.

```http
POST /api/notifications/register
```

#### Request Body
```json
{
  "token": "fcm_token_here",
  "device_info": {
    "platform": "web",
    "browser": "Chrome"
  }
}
```

### 알림 발송
특정 사용자에게 알림을 발송합니다. (관리자 전용)

```http
POST /api/admin/notifications/send
```

#### Request Body
```json
{
  "user_id": "user_123",
  "title": "예약이 승인되었습니다",
  "body": "1월 25일 14:00 예약이 승인되었습니다.",
  "data": {
    "type": "reservation_approved",
    "reservation_id": "res_123"
  }
}
```

---

## 🛡️ 보안 고려사항

### 인증 헤더
인증이 필요한 모든 API는 다음 헤더를 포함해야 합니다:

```http
Authorization: Bearer {jwt_token}
```

### Rate Limiting
- 일반 사용자: 분당 60회
- 관리자: 분당 300회
- 크론잡: 제한 없음

### CORS 설정
```javascript
// 허용된 도메인만 접근 가능
const allowedOrigins = [
  'https://gameplaza.vercel.app',
  'http://localhost:3000'
];
```

---

## 에러 코드 참조

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | 인증이 필요합니다 |
| INVALID_TOKEN | 유효하지 않은 토큰입니다 |
| PERMISSION_DENIED | 권한이 없습니다 |
| RESOURCE_NOT_FOUND | 리소스를 찾을 수 없습니다 |
| VALIDATION_ERROR | 입력값 검증 실패 |
| DUPLICATE_RESERVATION | 중복된 예약입니다 |
| RESERVATION_LIMIT | 24시간 룰 위반 |
| DEVICE_UNAVAILABLE | 기기를 사용할 수 없습니다 |
| SERVER_ERROR | 서버 오류가 발생했습니다 |

---

이 문서는 API가 추가되거나 변경될 때마다 업데이트됩니다.