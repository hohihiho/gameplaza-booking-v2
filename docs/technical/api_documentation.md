# 📡 API 문서

> 최종 업데이트: 2025-07-23

## 개요

광주 게임플라자 예약 시스템의 RESTful API 문서입니다. 모든 API는 `/api` 경로로 시작합니다.

### 기본 정보
- **Base URL**: `https://gameplaza.vercel.app/api`
- **인증 방식**: JWT Token (구글 OAuth 기반)
- **응답 형식**: JSON
- **문자 인코딩**: UTF-8
- **타임존**: KST (한국 표준시)

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

### 인증 헤더
인증이 필요한 API는 다음 헤더를 포함해야 합니다:
```http
Authorization: Bearer {jwt_token}
```

---

## 🔐 인증 API

### 구글 OAuth 로그인
구글 계정으로 로그인을 시작합니다.

```http
GET /api/auth/google
```

#### 응답
- 구글 OAuth URL로 리다이렉트

### 전화번호 OTP 발송
SMS OTP 인증 코드를 발송합니다.

```http
POST /api/auth/phone
```

#### Request Body
```json
{
  "phone": "010-1234-5678"
}
```

#### 응답 예시
```json
{
  "success": true,
  "message": "인증 코드가 발송되었습니다"
}
```

### 전화번호 OTP 검증
발송된 OTP 코드를 검증합니다.

```http
POST /api/auth/phone/verify
```

#### Request Body
```json
{
  "phone": "010-1234-5678",
  "code": "123456"
}
```

### 전화번호 중복 확인
전화번호 사용 가능 여부를 확인합니다.

```http
POST /api/auth/phone/check
```

#### Request Body
```json
{
  "phone": "010-1234-5678"
}
```

### 프로필 조회/수정
현재 로그인한 사용자의 프로필 정보를 관리합니다.

```http
GET /api/auth/profile
PUT /api/auth/profile
```

#### PUT Request Body
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "marketing_agreed": true
}
```

### 토큰 갱신
만료된 인증 토큰을 갱신합니다.

```http
POST /api/auth/refresh
```

### 회원가입
신규 회원가입을 처리합니다.

```http
POST /api/auth/signup
```

#### Request Body
```json
{
  "email": "user@example.com",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

### 회원 탈퇴
현재 계정을 삭제합니다.

```http
DELETE /api/auth/withdraw
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
| status | string | No | 예약 상태 필터 (pending, approved, rejected, cancelled, completed, checked_in, no_show) |
| page | number | No | 페이지 번호 (기본값: 1) |
| pageSize | number | No | 페이지당 항목 수 (기본값: 10) |

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "res_123",
        "reservation_number": "250701-001",
        "devices": {
          "device_number": 1,
          "device_types": {
            "name": "마이마이 DX"
          }
        },
        "date": "2025-07-01",
        "start_time": "14:00",
        "end_time": "18:00",
        "status": "approved",
        "total_amount": 40000,
        "credit_type": "freeplay",
        "created_at": "2025-07-01T10:00:00Z"
      }
    ],
    "totalCount": 25
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
  "date": "2025-07-01",
  "start_time": "14:00:00",
  "end_time": "18:00:00",
  "device_id": "device_123",
  "player_count": 1,
  "total_amount": 40000,
  "credit_type": "freeplay",
  "user_notes": "친구와 함께 이용 예정"
}
```

#### 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "res_456",
    "reservation_number": "250701-002",
    "status": "pending",
    "message": "예약이 접수되었습니다. 관리자 승인을 기다려주세요."
  }
}
```

### 예약 수정
예약 정보를 수정합니다.

```http
PATCH /api/reservations/{id}
```

#### Request Body
```json
{
  "user_notes": "변경된 메모"
}
```

### 예약 취소
예약을 취소합니다.

```http
DELETE /api/reservations/{id}
```

### 예약 가능 여부 확인
특정 시간대의 예약 가능 여부를 확인합니다.

```http
POST /api/reservations/check-availability
```

#### Request Body
```json
{
  "date": "2025-07-01",
  "start_time": "14:00:00",
  "end_time": "18:00:00",
  "device_id": "device_123"
}
```

### 예약 통계
사용자의 예약 통계를 조회합니다.

```http
GET /api/reservations/stats
```

---

## 👤 마이페이지 API

### 프로필 정보 조회
마이페이지 프로필 정보를 조회합니다.

```http
GET /api/mypage/profile
```

### 프로필 정보 수정
프로필 정보를 수정합니다.

```http
PUT /api/mypage/profile
```

#### Request Body
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

### 예약 통계 상세
상세한 예약 통계를 조회합니다.

```http
GET /api/mypage/reservation-stats
```

### 마케팅 수신 동의 설정
마케팅 수신 동의를 업데이트합니다.

```http
PUT /api/mypage/update-marketing
```

#### Request Body
```json
{
  "marketing_agreed": true
}
```

---

## 🌐 공개 API

### 운영 일정 조회
월별 운영 일정과 예약 현황을 조회합니다.

```http
GET /api/public/schedule
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | Yes | 연도 (예: 2025) |
| month | number | Yes | 월 (1-12) |

### 기기 타입 목록
전체 기기 타입 목록을 조회합니다.

```http
GET /api/device-types
```

### 예약 가능 기기 목록
현재 예약 가능한 기기 목록을 조회합니다.

```http
GET /api/available-machines
```

### 대여 가능 기기 정보
대여 가능한 기기의 상세 정보를 조회합니다.

```http
GET /api/rental-machines
```

### 예약 가능 시간대
예약 가능한 시간대를 조회합니다.

```http
GET /api/time-slots
```

---

## 👨‍💼 관리자 API

> 모든 관리자 API는 관리자 권한이 필요합니다.

### 권한 확인

#### 관리자 권한 확인
```http
GET /api/admin/auth/check
```

#### 슈퍼 관리자 확인
```http
GET /api/admin/check-super
```

### 관리자 계정 관리

#### 관리자 목록 조회
```http
GET /api/admin/admins
```

#### 관리자 추가
```http
POST /api/admin/admins
```

#### Request Body
```json
{
  "user_id": "user_123",
  "role": "admin"
}
```

#### 관리자 정보 수정
```http
PUT /api/admin/admins/{id}
```

#### 관리자 삭제
```http
DELETE /api/admin/admins/{id}
```

### 대시보드 & 통계

#### 대시보드 통계
```http
GET /api/admin/dashboard
```

#### 매출 분석
```http
GET /api/admin/analytics/revenue
```

##### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| range | string | No | 기간 (week, month, quarter, 6months, yearly, custom) |
| year | number | No | 연도 |
| startDate | string | No | 시작일 (custom range) |
| endDate | string | No | 종료일 (custom range) |

#### 고객 분석
```http
GET /api/admin/analytics/customers
```

#### 기기 분석
```http
GET /api/admin/analytics/devices
```

#### 예약 분석
```http
GET /api/admin/analytics/reservations
```

### 예약 관리

#### 예약 목록 관리
```http
GET /api/admin/reservations
POST /api/admin/reservations
```

#### 예약 시간 조정
```http
POST /api/admin/reservations/{id}/adjust-time
```

##### Request Body
```json
{
  "actual_start_time": "14:30:00",
  "actual_end_time": "18:30:00",
  "reason": "고객 요청",
  "adjustment_type": "customer_request"
}
```

#### 예약 금액 조정
```http
POST /api/admin/reservations/{id}/adjust-amount
```

##### Request Body
```json
{
  "adjusted_amount": 35000,
  "reason": "할인 적용"
}
```

#### 노쇼 처리
```http
POST /api/admin/reservations/{id}/no-show
```

### 체크인 관리

#### 체크인 대기 목록
```http
GET /api/admin/checkin
```

#### 체크인 처리
```http
POST /api/admin/checkin/process
```

##### Request Body
```json
{
  "reservationId": "res_123",
  "additionalNotes": "현금 결제"
}
```

#### 결제 확인
```http
POST /api/admin/checkin/payment-confirm
```

##### Request Body
```json
{
  "reservationId": "res_123",
  "paymentMethod": "bank_transfer"
}
```

### 기기 관리

#### 기기 목록
```http
GET /api/admin/devices
POST /api/admin/devices
```

#### 기기 상세 관리
```http
GET /api/admin/devices/{id}
PUT /api/admin/devices/{id}
DELETE /api/admin/devices/{id}
```

#### 기기 타입 관리
```http
GET /api/admin/devices/types
POST /api/admin/devices/types
```

#### 기기 타입 상세
```http
GET /api/admin/devices/types/{id}
PUT /api/admin/devices/types/{id}
DELETE /api/admin/devices/types/{id}
```

#### 플레이 모드 관리
```http
GET /api/admin/devices/types/{id}/play-modes
POST /api/admin/devices/types/{id}/play-modes
```

#### 카테고리 관리
```http
GET /api/admin/devices/categories
POST /api/admin/devices/categories
```

### 결제 계좌 관리

#### 계좌 목록 조회
```http
GET /api/admin/settings/payment
```

#### 계좌 추가
```http
POST /api/admin/settings/payment
```

##### Request Body
```json
{
  "bank_name": "국민은행",
  "account_number": "123-456-789012",
  "account_holder": "홍길동",
  "is_primary": false
}
```

#### 계좌 정보 수정
```http
PUT /api/admin/settings/payment/{id}
```

#### 계좌 삭제
```http
DELETE /api/admin/settings/payment/{id}
```

#### 기본 계좌 설정
```http
POST /api/admin/settings/payment/{id}/primary
```

#### 계좌 활성화/비활성화
```http
POST /api/admin/settings/payment/{id}/toggle
```

### 운영 관리

#### 운영 일정 관리
```http
GET /api/admin/schedule
POST /api/admin/schedule
PUT /api/admin/schedule/{id}
DELETE /api/admin/schedule/{id}
```

#### 조기 개점 설정
```http
POST /api/admin/schedule/adjust-early-opening
```

#### 예약 동기화
```http
POST /api/admin/schedule/sync-reservations
```

#### 대여 시간대 관리
```http
GET /api/admin/rental-time-slots
POST /api/admin/rental-time-slots
```

#### 금지어 관리
```http
GET /api/admin/banned-words
POST /api/admin/banned-words
DELETE /api/admin/banned-words/{id}
```

#### 가이드 콘텐츠 관리
```http
GET /api/admin/guide-content
POST /api/admin/guide-content
PUT /api/admin/guide-content/{id}
```

---

## 🔧 시스템 API

### 기기 상태 자동 업데이트 (크론잡)
예약이 종료된 기기의 상태를 자동으로 업데이트합니다.

```http
GET /api/cron/update-device-status
```

#### Headers
| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Authorization | Bearer {CRON_SECRET} | Yes | 크론잡 인증 토큰 |

### 자동 일정 테스트
자동 일정 생성 기능을 테스트합니다.

```http
GET /api/test-auto-schedule
```

### 콘텐츠 검열 확인
텍스트 콘텐츠의 적절성을 검사합니다.

```http
POST /api/moderation/check
```

#### Request Body
```json
{
  "text": "검사할 텍스트"
}
```

---

## 🛡️ 보안 고려사항

### Rate Limiting
- 일반 사용자: 분당 60회
- 관리자: 분당 300회
- 크론잡: 제한 없음

### CORS 설정
```javascript
const allowedOrigins = [
  'https://gameplaza.vercel.app',
  'http://localhost:3000'
];
```

### 시간 처리
- 모든 시간은 KST(한국 표준시) 기준
- 익일 새벽 0~5시는 24~29시로 표시
- 영업일 기준 06시 리셋

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
| RESERVATION_LIMIT | 예약 제한 초과 (최대 3개) |
| TIME_CONFLICT | 시간대가 중복됩니다 |
| DEVICE_UNAVAILABLE | 기기를 사용할 수 없습니다 |
| INVALID_TIME_RANGE | 잘못된 시간 범위입니다 |
| PAYMENT_REQUIRED | 결제가 필요합니다 |
| SERVER_ERROR | 서버 오류가 발생했습니다 |

---

## 📝 변경 이력

### 2025-07-23
- 전체 API 엔드포인트 최신화
- 실제 구현과 동기화
- 전화번호 인증 API 추가
- 결제 계좌 관리 API 추가
- 예약 시간 조정 API 추가
- 통계 분석 API 상세화

---

이 문서는 API가 추가되거나 변경될 때마다 업데이트됩니다.