# 인증 미들웨어 설정 가이드

## 개요

v2 API의 인증 시스템은 JWT 기반으로 구현되어 있으며, Next.js 미들웨어를 통해 모든 API 요청을 검증합니다.

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# JWT 토큰 시크릿 (최소 32자 이상의 랜덤 문자열)
JWT_ACCESS_SECRET=your-access-token-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-here-min-32-chars

# Supabase 설정 (이미 있어야 함)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 시크릿 키 생성 방법

```bash
# Node.js를 사용한 랜덤 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 인증 플로우

### 1. 로그인 (토큰 발급)

```bash
POST /api/v2/auth/google
Content-Type: application/json

{
  "idToken": "google-id-token"
}
```

응답:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "user"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### 2. 인증된 API 요청

```bash
GET /api/v2/checkins
Authorization: Bearer {access-token}
```

### 3. 토큰 갱신

```bash
POST /api/v2/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

## 보호된 경로

다음 경로들은 인증이 필요합니다:

### 관리자 전용 (admin role)
- `/api/v2/checkins/*` - 체크인 관리
- `/api/v2/devices/*` (POST, PATCH, DELETE) - 기기 관리
- `/api/v2/reservations/*/approve` - 예약 승인
- `/api/v2/reservations/*/reject` - 예약 거절
- `/api/v2/reservations/*/no-show` - 노쇼 처리

### 인증된 사용자
- `/api/v2/auth/profile` - 프로필 조회
- `/api/v2/auth/logout` - 로그아웃
- `/api/v2/reservations` (POST) - 예약 생성

## 테스트 토큰 생성

개발/테스트 환경에서 토큰을 생성하려면:

```bash
# 관리자 토큰 생성
npx ts-node scripts/generate-test-token.ts admin@example.com

# 일반 사용자 토큰 생성
npx ts-node scripts/generate-test-token.ts user@example.com
```

## API 테스트

### curl을 사용한 테스트

```bash
# 인증 없이 요청 (401 에러)
curl http://localhost:3000/api/v2/checkins

# 인증 토큰과 함께 요청
curl -H "Authorization: Bearer {access-token}" \
     http://localhost:3000/api/v2/checkins

# 체크인 생성 (관리자 권한 필요)
curl -X POST \
     -H "Authorization: Bearer {admin-access-token}" \
     -H "Content-Type: application/json" \
     -d '{"reservationId": "res-123", "deviceId": "dev-456"}' \
     http://localhost:3000/api/v2/checkins
```

### Postman/Insomnia 설정

1. Authorization 탭에서 "Bearer Token" 선택
2. Token 필드에 access token 입력
3. 요청 전송

## 에러 처리

### 401 Unauthorized
- 토큰이 없거나 유효하지 않음
- 토큰이 만료됨
- 세션이 만료됨

### 403 Forbidden
- 권한이 부족함 (예: 일반 사용자가 관리자 API 호출)

## 보안 고려사항

1. **토큰 저장**: Access token은 메모리나 세션 스토리지에, Refresh token은 HTTP-only 쿠키에 저장
2. **토큰 만료**: Access token은 15분, Refresh token은 7일 권장
3. **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS 사용
4. **CORS 설정**: 허용된 도메인만 API 접근 가능하도록 설정

## 트러블슈팅

### "Missing required environment variables" 에러
- `.env.local` 파일에 JWT 시크릿이 설정되어 있는지 확인
- 서버를 재시작하여 환경 변수 다시 로드

### "Invalid token" 에러
- 토큰 형식이 올바른지 확인 (Bearer 접두사 포함)
- 토큰이 만료되지 않았는지 확인

### "Session expired" 에러
- 새로운 토큰을 발급받거나 refresh token으로 갱신

## 다음 단계

1. 프론트엔드에 인증 로직 통합
2. 토큰 자동 갱신 구현
3. 로그아웃 시 세션 정리
4. Rate limiting 적용