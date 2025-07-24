# 관리자 관리 API

## 개요
관리자 권한 시스템을 위한 API 엔드포인트입니다. 모든 엔드포인트는 슈퍼관리자 권한이 필요합니다.

## 인증
모든 요청은 인증된 사용자여야 하며, 슈퍼관리자 권한이 필요합니다.

### 헤더
```
Authorization: Bearer {supabase_access_token}
```

## 엔드포인트

### 1. 관리자 목록 조회
```http
GET /api/admin/admins
```

#### Query Parameters
- `includeSuperAdmins` (boolean, optional): 슈퍼관리자 포함 여부 (기본값: true)
- `includeRegularAdmins` (boolean, optional): 일반 관리자 포함 여부 (기본값: true)
- `limit` (number, optional): 조회할 개수 (기본값: 20)
- `offset` (number, optional): 시작 위치 (기본값: 0)

#### Response
```json
{
  "admins": [
    {
      "id": "admin-123",
      "userId": "user-456",
      "user": {
        "id": "user-456",
        "email": "admin@example.com",
        "fullName": "홍길동",
        "profileImageUrl": null
      },
      "permissions": {
        "reservations": true,
        "users": true,
        "devices": true,
        "cms": true,
        "settings": false
      },
      "isSuperAdmin": false,
      "createdAt": "2025-01-24T09:00:00Z",
      "updatedAt": "2025-01-24T09:00:00Z"
    }
  ],
  "total": 10,
  "limit": 20,
  "offset": 0
}
```

### 2. 관리자 생성
```http
POST /api/admin/admins
```

#### Request Body
```json
{
  "userId": "user-789",
  "permissions": {
    "reservations": true,
    "users": false,
    "devices": true,
    "cms": false,
    "settings": false
  },
  "isSuperAdmin": false
}
```

#### Response (201 Created)
```json
{
  "id": "admin-new-123",
  "userId": "user-789",
  "user": {
    "id": "user-789",
    "email": "newadmin@example.com",
    "fullName": "김철수",
    "profileImageUrl": null
  },
  "permissions": {
    "reservations": true,
    "users": false,
    "devices": true,
    "cms": false,
    "settings": false
  },
  "isSuperAdmin": false,
  "createdAt": "2025-01-24T10:00:00Z",
  "updatedAt": "2025-01-24T10:00:00Z"
}
```

### 3. 관리자 상세 조회
```http
GET /api/admin/admins/{adminId}
```

#### Path Parameters
- `adminId` (string, required): 관리자 ID

#### Response
```json
{
  "id": "admin-123",
  "userId": "user-456",
  "user": {
    "id": "user-456",
    "email": "admin@example.com",
    "fullName": "홍길동",
    "profileImageUrl": null
  },
  "permissions": {
    "reservations": true,
    "users": true,
    "devices": true,
    "cms": true,
    "settings": false
  },
  "isSuperAdmin": false,
  "createdAt": "2025-01-24T09:00:00Z",
  "updatedAt": "2025-01-24T09:00:00Z"
}
```

### 4. 관리자 권한 수정
```http
PATCH /api/admin/admins/{adminId}
```

#### Path Parameters
- `adminId` (string, required): 관리자 ID

#### Request Body
```json
{
  "permissions": {
    "reservations": true,
    "users": true,
    "devices": true,
    "cms": true,
    "settings": true
  }
}
```

#### Response
```json
{
  "id": "admin-123",
  "userId": "user-456",
  "user": {
    "id": "user-456",
    "email": "admin@example.com",
    "fullName": "홍길동",
    "profileImageUrl": null
  },
  "permissions": {
    "reservations": true,
    "users": true,
    "devices": true,
    "cms": true,
    "settings": true
  },
  "isSuperAdmin": false,
  "createdAt": "2025-01-24T09:00:00Z",
  "updatedAt": "2025-01-24T11:00:00Z"
}
```

### 5. 관리자 삭제
```http
DELETE /api/admin/admins/{adminId}
```

#### Path Parameters
- `adminId` (string, required): 관리자 ID

#### Response
```json
{
  "success": true,
  "adminId": "admin-123",
  "message": "관리자가 성공적으로 삭제되었습니다"
}
```

## 오류 응답

### 401 Unauthorized
```json
{
  "error": "인증 정보가 없습니다"
}
```

### 403 Forbidden
```json
{
  "error": "슈퍼관리자 권한이 필요합니다"
}
```

### 404 Not Found
```json
{
  "error": "관리자를 찾을 수 없습니다"
}
```

### 409 Conflict
```json
{
  "error": "이미 관리자로 등록된 사용자입니다"
}
```

### 400 Bad Request
```json
{
  "error": "슈퍼관리자는 삭제할 수 없습니다"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## 권한 설명

### 관리자 권한 종류
- `reservations`: 예약 관리
- `users`: 사용자 관리
- `devices`: 기기 관리
- `cms`: 콘텐츠 관리
- `settings`: 설정 관리

### 역할
- **슈퍼관리자** (isSuperAdmin: true)
  - 모든 권한 자동 부여
  - 다른 관리자 추가/삭제/수정 가능
  - 삭제 불가능
  
- **일반 관리자** (isSuperAdmin: false)
  - 부여받은 권한만 사용 가능
  - 다른 관리자 관리 불가

## 사용 예시

### cURL로 관리자 목록 조회
```bash
curl -X GET \
  'http://localhost:3000/api/admin/admins?limit=10' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### JavaScript/TypeScript 예시
```typescript
// 관리자 생성
const response = await fetch('/api/admin/admins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    userId: 'user-123',
    permissions: {
      reservations: true,
      users: false,
      devices: true,
      cms: false,
      settings: false
    },
    isSuperAdmin: false
  })
});

const newAdmin = await response.json();
```