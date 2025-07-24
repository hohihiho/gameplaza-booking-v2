# 체크인 API 문서

## 개요

체크인 시스템 관련 REST API 엔드포인트를 제공합니다. 모든 엔드포인트는 관리자 권한이 필요합니다.

## 기본 정보

- **Base URL**: `/api/v2/checkins`
- **인증**: Bearer Token (Authorization 헤더)
- **Content-Type**: `application/json`

## 엔드포인트 목록

### 1. 체크인 생성

**POST** `/api/v2/checkins`

예약을 기반으로 새로운 체크인을 생성합니다.

#### 요청

```json
{
  "reservationId": "reservation-uuid",
  "deviceId": "device-uuid"
}
```

#### 응답 (201 Created)

```json
{
  "checkIn": {
    "id": "checkin-uuid",
    "status": "체크인됨",
    "paymentStatus": "대기중"
  },
  "message": "체크인이 성공적으로 생성되었습니다"
}
```

#### 에러 응답

- **400 Bad Request**: 필수 필드 누락 또는 체크인 시간 제약 위반
- **404 Not Found**: 예약 또는 기기를 찾을 수 없음
- **409 Conflict**: 이미 체크인된 예약, 사용 중인 기기, 또는 체크인 불가능한 상태

### 2. 활성 체크인 목록 조회

**GET** `/api/v2/checkins`

현재 활성화된 체크인 목록을 조회합니다.

#### 쿼리 파라미터

- `deviceId` (optional): 특정 기기의 체크인만 조회
- `includeWaitingPayment` (optional, boolean): 결제 대기 중인 체크인 포함 여부 (기본값: false)

#### 응답 (200 OK)

```json
{
  "checkIns": [
    {
      "id": "checkin-uuid",
      "reservationNumber": "GP-20250124-1234",
      "userName": "홍길동",
      "deviceNumber": "PC-01",
      "checkInTime": "2025-07-24T10:00:00.000Z",
      "status": "IN_USE",
      "paymentStatus": "COMPLETED",
      "finalAmount": 30000,
      "remainingMinutes": 45
    }
  ],
  "totalCount": 1
}
```

### 3. 체크인 상세 조회

**GET** `/api/v2/checkins/{id}`

특정 체크인의 상세 정보를 조회합니다.

#### 응답 (200 OK)

```json
{
  "checkIn": {
    "id": "checkin-uuid",
    "reservationId": "reservation-uuid",
    "deviceId": "device-uuid",
    "checkInTime": "2025-07-24T10:00:00.000Z",
    "checkOutTime": null,
    "paymentStatus": "COMPLETED",
    "paymentMethod": "CASH",
    "paymentAmount": 30000,
    "adjustedAmount": null,
    "adjustmentReason": null,
    "actualStartTime": "2025-07-24T10:05:00.000Z",
    "actualEndTime": null,
    "actualDuration": null,
    "finalAmount": 30000,
    "status": "IN_USE",
    "notes": null,
    "createdAt": "2025-07-24T10:00:00.000Z",
    "updatedAt": "2025-07-24T10:05:00.000Z",
    "reservation": {
      "id": "reservation-uuid",
      "userId": "user-uuid",
      "userName": "홍길동",
      "userPhone": "010-1234-5678",
      "reservationNumber": "GP-20250124-1234",
      "date": "2025-07-24",
      "startTime": "10:00",
      "endTime": "12:00"
    },
    "device": {
      "id": "device-uuid",
      "deviceNumber": "PC-01",
      "deviceType": "고성능PC",
      "location": "A-1"
    }
  }
}
```

### 4. 결제 확인

**PATCH** `/api/v2/checkins/{id}/payment`

체크인의 결제를 확인하고 이용을 시작합니다.

#### 요청

```json
{
  "paymentMethod": "CASH" | "BANK_TRANSFER" | "CARD"
}
```

#### 응답 (200 OK)

```json
{
  "checkIn": {
    "id": "checkin-uuid",
    "status": "사용중",
    "paymentStatus": "완료",
    "paymentMethod": "현금"
  },
  "message": "결제가 확인되었습니다. 이용을 시작할 수 있습니다."
}
```

### 5. 시간/금액 조정

**PATCH** `/api/v2/checkins/{id}/adjust`

활성 체크인의 시간 또는 금액을 조정합니다.

#### 요청

```json
{
  "adjustedStartTime": "2025-07-24T10:00:00.000Z",  // optional
  "adjustedEndTime": "2025-07-24T12:30:00.000Z",    // optional
  "adjustedAmount": 25000,                           // optional
  "adjustmentReason": "고객 요청에 따른 할인"         // 금액 조정 시 필수
}
```

#### 응답 (200 OK)

```json
{
  "checkIn": {
    "id": "checkin-uuid",
    "adjustedAmount": 25000,
    "adjustmentReason": "고객 요청에 따른 할인"
  },
  "message": "금액이 조정되었습니다."
}
```

### 6. 체크아웃

**PATCH** `/api/v2/checkins/{id}/checkout`

체크인을 종료하고 최종 이용 정보를 계산합니다.

#### 요청

```json
{
  "notes": "정상 이용 완료"  // optional
}
```

#### 응답 (200 OK)

```json
{
  "checkIn": {
    "id": "checkin-uuid",
    "status": "완료",
    "checkOutTime": "2025-07-24T11:30:00.000Z",
    "actualEndTime": "2025-07-24T11:30:00.000Z"
  },
  "summary": {
    "totalTime": 90,
    "totalTimeDisplay": "1시간 30분",
    "finalAmount": 30000,
    "paymentMethod": "현금"
  },
  "message": "체크아웃이 완료되었습니다. 총 이용시간: 1시간 30분"
}
```

### 7. 체크인 이력 조회

**GET** `/api/v2/checkins/history`

지정된 기간의 체크인 이력을 조회합니다.

#### 쿼리 파라미터

- `startDate` (required): 시작 날짜 (ISO 8601 형식)
- `endDate` (required): 종료 날짜 (ISO 8601 형식)
- `deviceId` (optional): 특정 기기의 체크인만 조회
- `userId` (optional): 특정 사용자의 체크인만 조회

**참고**: 최대 조회 기간은 3개월입니다.

#### 응답 (200 OK)

```json
{
  "checkIns": [
    {
      "id": "checkin-uuid",
      "reservationNumber": "GP-20250124-1234",
      "userName": "홍길동",
      "deviceNumber": "PC-01",
      "checkInTime": "2025-07-24T10:00:00.000Z",
      "checkOutTime": "2025-07-24T11:30:00.000Z",
      "status": "COMPLETED",
      "paymentStatus": "COMPLETED",
      "finalAmount": 30000,
      "actualDuration": 90
    }
  ],
  "totalCount": 1,
  "summary": {
    "totalRevenue": 30000,
    "averageDuration": 90,
    "totalCheckIns": 1,
    "completedCheckIns": 1,
    "cancelledCheckIns": 0
  }
}
```

## 공통 에러 코드

| 상태 코드 | 에러 타입 | 설명 |
|----------|----------|------|
| 400 | Bad Request | 잘못된 요청 형식 또는 유효성 검증 실패 |
| 401 | Unauthorized | 인증 토큰이 없거나 유효하지 않음 |
| 403 | Forbidden | 권한 부족 (관리자 권한 필요) |
| 404 | Not Found | 요청한 리소스를 찾을 수 없음 |
| 409 | Conflict | 리소스 상태 충돌 (예: 이미 체크인된 예약) |
| 500 | Internal Server Error | 서버 내부 오류 |

## 에러 응답 형식

```json
{
  "error": "Error Type",
  "message": "에러에 대한 상세 설명",
  "details": {}  // optional
}
```

## 참고사항

1. **시간대**: 모든 시간은 KST(한국 표준시) 기준으로 처리됩니다.
2. **체크인 시간 제약**: 
   - 예약 시작 시간 30분 전부터 체크인 가능
   - 예약 시작 시간 15분 후까지 체크인 가능
3. **결제 방법**: CASH(현금), BANK_TRANSFER(계좌이체), CARD(카드)
4. **체크인 상태**: CHECKED_IN(체크인됨), IN_USE(사용중), COMPLETED(완료), CANCELLED(취소)
5. **결제 상태**: PENDING(대기중), COMPLETED(완료), CANCELLED(취소)