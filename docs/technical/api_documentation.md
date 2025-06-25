# 🔌 API 문서

> 💡 **초보자를 위한 설명**: API는 우리 서비스의 기능을 사용하는 방법을 정리한 것입니다.
> 마치 TV 리모컨의 버튼처럼, 각 버튼(API)을 누르면 특정 기능이 실행됩니다.

## 📖 API란 무엇인가요?

```
사용자가 "예약하기" 버튼 클릭
        ↓
앱이 API로 요청: "철권8을 14시에 예약해주세요"
        ↓
서버가 처리 후 응답: "예약 완료! 번호는 #12345입니다"
        ↓
앱이 사용자에게 결과 표시
```

## 🎯 API 사용의 기본 규칙

### 1. 기본 주소 (Base URL)
```
https://api.gameplaza.com/v1
```
> 모든 API는 이 주소로 시작합니다.

### 2. 인증 방법
```
Authorization: Bearer 당신의_토큰_값
```
> 💡 토큰 = 입장권처럼 본인을 증명하는 디지털 열쇠

### 3. 응답 형식
모든 응답은 JSON 형식으로 옵니다:
```json
{
  "success": true,
  "data": { ... },
  "message": "성공적으로 처리되었습니다"
}
```

## 🔐 1. 인증 관련 API

### 1-1. 구글 로그인
> 구글 계정으로 로그인합니다.

**요청 방법**: `POST /api/auth/google`

**필요한 정보**:
```json
{
  "googleToken": "구글에서_받은_토큰"
}
```

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "kim@gmail.com",
      "name": "김철수",
      "needsPhoneVerification": true
    },
    "token": "우리_서비스_토큰"
  }
}
```

### 1-2. 전화번호 인증 요청
> SMS로 인증번호를 발송합니다.

**요청 방법**: `POST /api/auth/send-sms`

**필요한 정보**:
```json
{
  "phone": "010-1234-5678"
}
```

**성공 응답**:
```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다"
}
```

### 1-3. 인증번호 확인
> 받은 인증번호를 확인합니다.

**요청 방법**: `POST /api/auth/verify-phone`

**필요한 정보**:
```json
{
  "phone": "010-1234-5678",
  "code": "123456"
}
```

**성공 응답**:
```json
{
  "success": true,
  "message": "인증이 완료되었습니다"
}
```

### 1-4. 로그아웃
> 현재 로그인을 종료합니다.

**요청 방법**: `POST /api/auth/logout`

**성공 응답**:
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

## 🎮 2. 기기 관련 API

### 2-1. 대여 가능 기기 목록
> 예약할 수 있는 게임기 목록을 봅니다.

**요청 방법**: `GET /api/machines`

**선택 옵션**:
- `?type=격투게임` - 특정 종류만 보기
- `?available=true` - 현재 예약 가능한 것만

**성공 응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rental_001",
      "name": "철권 8 - A구역",
      "type": "격투게임",
      "hourlyRate": 5000,
      "minHours": 2,
      "maxHours": 4,
      "description": "최신 철권 시리즈",
      "imageUrl": "https://...",
      "isAvailable": true
    }
  ]
}
```

### 2-2. 기기 상세 정보
> 특정 게임기의 자세한 정보를 봅니다.

**요청 방법**: `GET /api/machines/:id`

**예시**: `GET /api/machines/rental_001`

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "id": "rental_001",
    "name": "철권 8 - A구역",
    "type": "격투게임",
    "hourlyRate": 5000,
    "description": "최신 철권 시리즈...",
    "availableSlots": [
      {
        "date": "2024-01-25",
        "times": ["10:00", "14:00", "18:00"]
      }
    ]
  }
}
```

## 📅 3. 예약 관련 API

### 3-1. 내 예약 목록
> 내가 신청한 모든 예약을 봅니다.

**요청 방법**: `GET /api/reservations`

**선택 옵션**:
- `?status=approved` - 승인된 예약만
- `?upcoming=true` - 앞으로 예정된 예약만

**성공 응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "res_20240120_001",
      "machine": {
        "name": "철권 8 - A구역",
        "imageUrl": "https://..."
      },
      "date": "2024-01-25",
      "startTime": "14:00",
      "endTime": "16:00",
      "hours": 2,
      "totalAmount": 10000,
      "status": "approved",
      "statusText": "승인됨"
    }
  ]
}
```

### 3-2. 예약 신청하기
> 새로운 예약을 신청합니다.

**요청 방법**: `POST /api/reservations`

**필요한 정보**:
```json
{
  "machineId": "rental_001",
  "date": "2024-01-25",
  "startTime": "14:00",
  "hours": 2
}
```

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "id": "res_20240120_002",
    "message": "예약이 신청되었습니다. 관리자 승인을 기다려주세요.",
    "estimatedAmount": 10000
  }
}
```

### 3-3. 예약 취소하기
> 내 예약을 취소합니다.

**요청 방법**: `DELETE /api/reservations/:id`

**예시**: `DELETE /api/reservations/res_20240120_001`

**성공 응답**:
```json
{
  "success": true,
  "message": "예약이 취소되었습니다"
}
```

### 3-4. 예약 가능 시간 확인
> 특정 날짜의 예약 가능한 시간을 확인합니다.

**요청 방법**: `GET /api/reservations/available-slots`

**필요한 정보**:
- `?machineId=rental_001` - 기기 번호
- `?date=2024-01-25` - 날짜

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "availableSlots": [
      { "time": "10:00", "available": true },
      { "time": "11:00", "available": true },
      { "time": "12:00", "available": false },
      { "time": "13:00", "available": false },
      { "time": "14:00", "available": true }
    ]
  }
}
```

## 👤 4. 사용자 정보 API

### 4-1. 내 정보 보기
> 내 프로필 정보를 확인합니다.

**요청 방법**: `GET /api/users/me`

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "kim@gmail.com",
    "name": "김철수",
    "phone": "010-****-5678",
    "phoneVerified": true,
    "role": "user",
    "createdAt": "2024-01-15",
    "stats": {
      "totalReservations": 5,
      "completedReservations": 3
    }
  }
}
```

### 4-2. 내 정보 수정
> 프로필 정보를 수정합니다.

**요청 방법**: `PUT /api/users/me`

**수정 가능한 정보**:
```json
{
  "name": "김철수",
  "phone": "010-9876-5432"
}
```

**성공 응답**:
```json
{
  "success": true,
  "message": "정보가 수정되었습니다"
}
```

## 📱 5. 알림 API

### 5-1. 알림 목록
> 받은 알림 목록을 확인합니다.

**요청 방법**: `GET /api/notifications`

**선택 옵션**:
- `?unread=true` - 읽지 않은 것만

**성공 응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "noti_001",
      "type": "reservation_approved",
      "title": "예약이 승인되었습니다",
      "message": "1월 25일 14시 철권8 예약이 승인되었습니다",
      "isRead": false,
      "createdAt": "2024-01-20 11:00"
    }
  ]
}
```

### 5-2. 알림 읽음 처리
> 알림을 읽음으로 표시합니다.

**요청 방법**: `PUT /api/notifications/:id/read`

**예시**: `PUT /api/notifications/noti_001/read`

## 👮 6. 관리자 전용 API

> ⚠️ 관리자 권한이 있는 계정만 사용 가능합니다.

### 6-1. 관리자 대시보드
> 전체 현황을 한눈에 봅니다.

**요청 방법**: `GET /api/admin/dashboard`

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "todayStats": {
      "totalReservations": 15,
      "pendingApprovals": 3,
      "todayCheckIns": 8,
      "todayRevenue": 120000
    },
    "alerts": [
      {
        "type": "pending_reservation",
        "message": "승인 대기 중인 예약이 3건 있습니다"
      }
    ]
  }
}
```

### 6-2. 예약 승인
> 대기 중인 예약을 승인합니다.

**요청 방법**: `PUT /api/admin/reservations/:id/approve`

**예시**: `PUT /api/admin/reservations/res_20240120_001/approve`

**선택 사항**:
```json
{
  "notes": "단골 고객입니다"
}
```

### 6-3. 예약 거절
> 예약을 거절합니다.

**요청 방법**: `PUT /api/admin/reservations/:id/reject`

**필요한 정보**:
```json
{
  "reason": "해당 시간대는 이미 예약이 완료되었습니다"
}
```

### 6-4. 체크인 처리
> 방문한 고객의 체크인을 처리합니다.

**요청 방법**: `POST /api/admin/check-in`

**필요한 정보**:
```json
{
  "reservationId": "res_20240120_001"
}
```

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "checkInId": "checkin_001",
    "paymentInfo": {
      "amount": 10000,
      "bankName": "카카오뱅크",
      "accountNumber": "3333-01-1234567"
    },
    "message": "체크인 완료. 결제 정보가 고객에게 전송되었습니다"
  }
}
```

## 🔧 7. 시스템 API

### 7-1. 서비스 상태 확인
> 서비스가 정상 작동 중인지 확인합니다.

**요청 방법**: `GET /api/health`

**성공 응답**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

## ❌ 오류 응답 형식

모든 오류는 다음과 같은 형식으로 응답됩니다:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "요청이 올바르지 않습니다",
    "details": "전화번호 형식이 잘못되었습니다"
  }
}
```

### 주요 오류 코드
| 코드 | 의미 | 해결 방법 |
|------|------|----------|
| `UNAUTHORIZED` | 로그인 필요 | 로그인 후 다시 시도 |
| `FORBIDDEN` | 권한 없음 | 권한 확인 필요 |
| `NOT_FOUND` | 찾을 수 없음 | 요청 주소나 ID 확인 |
| `INVALID_REQUEST` | 잘못된 요청 | 전송 데이터 확인 |
| `SERVER_ERROR` | 서버 오류 | 잠시 후 다시 시도 |

## 📱 실제 사용 예시

### 예약하기 전체 과정
```
1. 로그인
   → POST /api/auth/google

2. 전화번호 인증
   → POST /api/auth/send-sms
   → POST /api/auth/verify-phone

3. 기기 목록 확인
   → GET /api/machines

4. 예약 가능 시간 확인
   → GET /api/reservations/available-slots

5. 예약 신청
   → POST /api/reservations

6. 예약 상태 확인
   → GET /api/reservations
```

---

> 📌 **참고**: 이 API 문서는 개발자가 앱을 만들 때 참고하는 설명서입니다.
> 실제 사용자는 앱의 버튼을 클릭하면 자동으로 이 API들이 호출됩니다.