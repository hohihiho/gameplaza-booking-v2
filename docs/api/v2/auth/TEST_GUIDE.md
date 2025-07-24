# V2 인증 API 테스트 가이드

## 개요
V2 인증 시스템은 Google OAuth 2.0을 사용한 로그인과 JWT 기반 인증을 제공합니다.

## API 엔드포인트

### 1. Google 로그인
```bash
POST /api/v2/auth/google
Content-Type: application/json

{
  "googleIdToken": "GOOGLE_ID_TOKEN",
  "deviceInfo": {
    "type": "desktop",
    "os": "Windows",
    "browser": "Chrome"
  }
}

# 성공 응답
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "사용자 이름",
    "role": "user",
    "profileImageUrl": "https://..."
  },
  "accessToken": "JWT_ACCESS_TOKEN",
  "refreshToken": "JWT_REFRESH_TOKEN",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### 2. 토큰 갱신
```bash
POST /api/v2/auth/refresh
Content-Type: application/json

{
  "refreshToken": "JWT_REFRESH_TOKEN"
}

# 성공 응답
{
  "accessToken": "NEW_JWT_ACCESS_TOKEN",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### 3. 로그아웃
```bash
POST /api/v2/auth/logout
Authorization: Bearer JWT_ACCESS_TOKEN
Content-Type: application/json

{
  "allDevices": false  # true로 설정 시 모든 디바이스에서 로그아웃
}

# 성공 응답
{
  "message": "로그아웃되었습니다"
}
```

### 4. 프로필 조회
```bash
GET /api/v2/auth/profile
Authorization: Bearer JWT_ACCESS_TOKEN

# 성공 응답
{
  "id": "user-uuid",
  "email": "user@example.com",
  "fullName": "사용자 이름",
  "phone": null,
  "role": "user",
  "status": "active",
  "birthDate": null,
  "profileImageUrl": "https://...",
  "googleId": "google-123",
  "lastLoginAt": "2025-01-01T00:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

## 인증 미들웨어

보호된 API 엔드포인트는 자동으로 인증을 검증합니다:
- `/api/v2/auth/profile` - 인증 필요
- `/api/v2/auth/logout` - 인증 필요
- `/api/v2/auth/google` - 인증 불필요
- `/api/v2/auth/refresh` - 인증 불필요

인증 후 요청 헤더에 다음 정보가 추가됩니다:
- `X-User-Id`: 사용자 ID
- `X-User-Email`: 사용자 이메일
- `X-User-Role`: 사용자 역할
- `X-Session-Id`: 세션 ID

## 에러 응답

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Google ID token is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "인증이 필요합니다"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "권한이 없습니다"
}
```

### 404 Not Found
```json
{
  "error": "User Not Found",
  "message": "사용자를 찾을 수 없습니다"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "서버 오류가 발생했습니다"
}
```

## 테스트 시나리오

### 1. 신규 사용자 가입 및 로그인
1. Google ID Token으로 `/api/v2/auth/google` 호출
2. 응답으로 받은 accessToken 저장
3. accessToken으로 `/api/v2/auth/profile` 호출하여 프로필 확인

### 2. 토큰 갱신
1. refreshToken으로 `/api/v2/auth/refresh` 호출
2. 새로운 accessToken 받기
3. 새 토큰으로 API 호출

### 3. 로그아웃
1. accessToken으로 `/api/v2/auth/logout` 호출
2. 동일한 토큰으로 `/api/v2/auth/profile` 호출 시 401 에러 확인

## 주의사항

1. **Google ID Token 획득**: 프론트엔드에서 Google Sign-In 라이브러리를 사용하여 ID Token을 획득해야 합니다.
2. **토큰 만료**: Access Token은 1시간, Refresh Token은 7일 후 만료됩니다.
3. **CORS**: 모든 엔드포인트는 CORS를 지원합니다.
4. **세션 관리**: 각 디바이스별로 별도의 세션이 생성됩니다.
5. **보안**: HTTPS 환경에서만 사용하세요.