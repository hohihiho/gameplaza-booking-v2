# 8. API 명세

## 8.1 API 설계 원칙

### 8.1.1 RESTful 설계
- **리소스 기반 URL**
- **HTTP 메서드 활용** (GET, POST, PUT, DELETE)
- **상태 코드 표준화**
- **JSON 응답 형식**

### 8.1.2 인증 방식
- **Better Auth JWT 토큰**
- **Bearer Token 헤더**
- **토큰 자동 갱신**

### 8.1.3 에러 처리
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

## 8.2 인증 API

### POST /api/auth/signin
**Google OAuth 로그인**
```typescript
// Request
{
  "provider": "google",
  "accessToken": "google-oauth-token"
}

// Response (200 OK)
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "profileImage": "https://...",
    "role": "user"
  },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### POST /api/auth/signout
**로그아웃**
```typescript
// Headers
Authorization: Bearer {token}

// Response (200 OK)
{
  "message": "Successfully signed out"
}
```

### GET /api/auth/session
**세션 확인**
```typescript
// Headers
Authorization: Bearer {token}

// Response (200 OK)
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "user"
  },
  "expiresAt": "2025-01-31T00:00:00Z"
}
```

## 8.3 기기 API

### GET /api/devices
**기기 목록 조회**
```typescript
// Query Parameters
?type=ps5,switch  // 기기 타입 필터
&status=available // 상태 필터

// Response (200 OK)
{
  "devices": [
    {
      "id": "device-1",
      "name": "PlayStation 5 #1",
      "type": "ps5",
      "status": "available",
      "location": "A-01",
      "hourlyRate": 5000,
      "maxHours": 3,
      "specs": {
        "model": "CFI-1200A",
        "storage": "825GB",
        "controllers": 2
      },
      "currentUser": null,
      "nextAvailable": null
    }
  ],
  "total": 15
}
```

### GET /api/devices/:id
**기기 상세 조회**
```typescript
// Response (200 OK)
{
  "id": "device-1",
  "name": "PlayStation 5 #1",
  "type": "ps5",
  "status": "in_use",
  "location": "A-01",
  "hourlyRate": 5000,
  "maxHours": 3,
  "specs": {
    "model": "CFI-1200A",
    "storage": "825GB",
    "controllers": 2,
    "games": ["FC24", "Spider-Man 2", "God of War"]
  },
  "currentUser": {
    "id": "user-123",
    "name": "김철수",
    "startTime": "2025-01-30T14:00:00Z",
    "endTime": "2025-01-30T16:00:00Z"
  },
  "todaySchedule": [
    {
      "startTime": "14:00",
      "endTime": "16:00",
      "userId": "user-123"
    },
    {
      "startTime": "18:00",
      "endTime": "20:00",
      "userId": "user-456"
    }
  ]
}
```

### GET /api/device-types
**기기 타입 조회**
```typescript
// Response (200 OK)
{
  "types": [
    {
      "id": "ps5",
      "name": "PlayStation 5",
      "category": "console",
      "hourlyRate": 5000,
      "maxHours": 3,
      "count": 5,
      "availableCount": 2,
      "image": "/images/ps5.jpg"
    },
    {
      "id": "switch",
      "name": "Nintendo Switch",
      "category": "console",
      "hourlyRate": 3000,
      "maxHours": 3,
      "count": 8,
      "availableCount": 4,
      "image": "/images/switch.jpg"
    }
  ]
}
```

## 8.4 예약 API

### GET /api/reservations
**예약 목록 조회**
```typescript
// Query Parameters
?status=pending,confirmed  // 상태 필터
&date=2025-01-30          // 날짜 필터
&userId=user-123           // 사용자 필터

// Response (200 OK)
{
  "reservations": [
    {
      "id": "res-001",
      "userId": "user-123",
      "userName": "홍길동",
      "deviceId": "device-1",
      "deviceName": "PlayStation 5 #1",
      "date": "2025-01-30",
      "startTime": "14:00",
      "endTime": "16:00",
      "duration": 2,
      "status": "confirmed",
      "totalAmount": 10000,
      "createdAt": "2025-01-29T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasNext": true
  }
}
```

### POST /api/reservations
**예약 생성**
```typescript
// Request
{
  "deviceId": "device-1",
  "date": "2025-01-30",
  "startTime": "14:00",
  "duration": 2
}

// Response (201 Created)
{
  "id": "res-002",
  "userId": "user-123",
  "deviceId": "device-1",
  "deviceName": "PlayStation 5 #1",
  "date": "2025-01-30",
  "startTime": "14:00",
  "endTime": "16:00",
  "duration": 2,
  "status": "pending",
  "totalAmount": 10000,
  "qrCode": "data:image/png;base64,...",
  "createdAt": "2025-01-30T09:00:00Z"
}
```

### PUT /api/reservations/:id
**예약 수정**
```typescript
// Request
{
  "startTime": "15:00",
  "duration": 1
}

// Response (200 OK)
{
  "id": "res-001",
  "startTime": "15:00",
  "endTime": "16:00",
  "duration": 1,
  "totalAmount": 5000,
  "modifiedAt": "2025-01-30T10:00:00Z"
}
```

### DELETE /api/reservations/:id
**예약 취소**
```typescript
// Response (200 OK)
{
  "message": "Reservation cancelled successfully",
  "refundAmount": 10000
}
```

### POST /api/reservations/:id/checkin
**체크인**
```typescript
// Request (optional)
{
  "qrCode": "res-001-qr-code"
}

// Response (200 OK)
{
  "message": "Check-in successful",
  "deviceId": "device-1",
  "startTime": "2025-01-30T14:00:00Z",
  "endTime": "2025-01-30T16:00:00Z"
}
```

### POST /api/reservations/:id/checkout
**체크아웃**
```typescript
// Response (200 OK)
{
  "message": "Check-out successful",
  "duration": 2,
  "totalAmount": 10000,
  "endTime": "2025-01-30T16:00:00Z"
}
```

## 8.5 관리자 API

### GET /api/admin/dashboard
**대시보드 데이터**
```typescript
// Headers
Authorization: Bearer {admin-token}

// Response (200 OK)
{
  "stats": {
    "todayVisitors": 45,
    "todayReservations": 32,
    "todayRevenue": 250000,
    "activeDevices": 12,
    "pendingCheckins": 3
  },
  "devices": [
    // 기기 상태 목록
  ],
  "recentReservations": [
    // 최근 예약 목록
  ],
  "alerts": [
    {
      "type": "no_show",
      "message": "홍길동님이 체크인하지 않았습니다",
      "time": "14:15"
    }
  ]
}
```

### POST /api/admin/devices/:id/status
**기기 상태 변경**
```typescript
// Request
{
  "status": "maintenance",
  "reason": "컨트롤러 고장"
}

// Response (200 OK)
{
  "id": "device-1",
  "status": "maintenance",
  "updatedAt": "2025-01-30T10:00:00Z"
}
```

### GET /api/admin/users
**사용자 목록**
```typescript
// Query Parameters
?search=홍길동       // 검색
&blacklisted=true    // 블랙리스트 필터

// Response (200 OK)
{
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "totalReservations": 25,
      "totalHours": 50,
      "noShowCount": 2,
      "isBlacklisted": false,
      "joinedAt": "2024-06-15T00:00:00Z",
      "lastVisit": "2025-01-29T14:00:00Z"
    }
  ],
  "total": 1234
}
```

### GET /api/admin/analytics
**통계 데이터**
```typescript
// Query Parameters
?period=month        // day, week, month, year
&startDate=2025-01-01
&endDate=2025-01-31

// Response (200 OK)
{
  "revenue": {
    "total": 5000000,
    "chart": [
      { "date": "2025-01-01", "amount": 150000 },
      { "date": "2025-01-02", "amount": 180000 }
      // ...
    ]
  },
  "visitors": {
    "total": 1500,
    "unique": 800,
    "chart": [
      { "date": "2025-01-01", "count": 45 }
      // ...
    ]
  },
  "devices": {
    "utilizationRate": 0.75,
    "byType": [
      { "type": "ps5", "hours": 250, "revenue": 1250000 },
      { "type": "switch", "hours": 180, "revenue": 540000 }
    ]
  },
  "peakHours": [
    { "hour": 14, "avgVisitors": 25 },
    { "hour": 15, "avgVisitors": 28 },
    { "hour": 19, "avgVisitors": 32 }
  ]
}
```

## 8.6 실시간 API (SSE)

### GET /api/sse/devices
**기기 상태 실시간 업데이트**
```typescript
// Headers
Accept: text/event-stream

// Response (SSE Stream)
data: {"deviceId":"device-1","status":"available","timestamp":"2025-01-30T14:00:00Z"}

data: {"deviceId":"device-2","status":"in_use","userId":"user-456","timestamp":"2025-01-30T14:01:00Z"}
```

### GET /api/sse/reservations
**예약 상태 실시간 업데이트**
```typescript
// Response (SSE Stream)
data: {"type":"new","reservation":{"id":"res-003","deviceId":"device-3","status":"pending"}}

data: {"type":"checkin","reservationId":"res-001","timestamp":"2025-01-30T14:00:00Z"}

data: {"type":"cancelled","reservationId":"res-002","timestamp":"2025-01-30T13:45:00Z"}
```

## 8.7 CMS API

### GET /api/cms/terms
**약관 조회**
```typescript
// Response (200 OK)
{
  "version": "1.2.0",
  "effectiveDate": "2025-01-01",
  "content": "...",
  "sections": [
    {
      "title": "이용 약관",
      "content": "..."
    },
    {
      "title": "개인정보 처리방침",
      "content": "..."
    }
  ]
}
```

### GET /api/cms/business-info
**업체 정보 조회**
```typescript
// Response (200 OK)
{
  "name": "광주 게임플라자",
  "registration": "123-45-67890",
  "representative": "홍길동",
  "address": "광주광역시 동구 문화전당로 38",
  "phone": "062-123-4567",
  "email": "info@gameplaza.kr",
  "hours": {
    "weekday": "13:00 - 24:00",
    "weekend": "11:00 - 24:00",
    "holiday": "11:00 - 24:00"
  }
}
```

## 8.8 응답 코드

### 성공 코드 (2xx)
- **200 OK**: 요청 성공
- **201 Created**: 리소스 생성 성공
- **204 No Content**: 성공, 응답 내용 없음

### 클라이언트 오류 (4xx)
- **400 Bad Request**: 잘못된 요청
- **401 Unauthorized**: 인증 필요
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스 없음
- **409 Conflict**: 충돌 (예: 중복 예약)
- **422 Unprocessable Entity**: 유효성 검증 실패
- **429 Too Many Requests**: 요청 한도 초과

### 서버 오류 (5xx)
- **500 Internal Server Error**: 서버 오류
- **502 Bad Gateway**: 게이트웨이 오류
- **503 Service Unavailable**: 서비스 이용 불가
- **504 Gateway Timeout**: 게이트웨이 타임아웃