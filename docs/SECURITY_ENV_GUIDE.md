# 🔐 보안 환경변수 설정 가이드

## 개요
이 가이드는 게임플라자 예약 시스템의 보안을 위한 환경변수 설정 방법을 안내합니다.

## ⚠️ 중요 보안 원칙

### 1. 절대 금지 사항
- ❌ 환경변수를 코드에 하드코딩
- ❌ .env 파일을 git에 커밋
- ❌ 민감한 정보를 로그에 출력
- ❌ 프로덕션 키를 개발환경에서 사용

### 2. 필수 준수 사항
- ✅ 모든 민감한 정보는 환경변수로만 관리
- ✅ .env 파일은 .gitignore에 포함
- ✅ 환경변수 누락 시 서버 시작 차단
- ✅ 정기적인 키 로테이션

## 🔧 필수 환경변수 설정

### 1. JWT 인증 (필수)
```bash
# 강력한 랜덤 키 생성 (32자 이상 권장)
JWT_SECRET=your-super-secure-random-jwt-secret-key-here
```

**생성 방법:**
```bash
# Node.js로 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL로 생성
openssl rand -hex 32
```

### 2. 데이터베이스 연결
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**보안 주의사항:**
- 강력한 비밀번호 사용 (16자 이상, 특수문자 포함)
- 프로덕션과 개발 DB 분리
- 접근 권한 최소화

### 3. Google OAuth
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**설정 방법:**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. API 및 서비스 > 사용자 인증 정보
4. OAuth 2.0 클라이언트 ID 생성
5. 승인된 리디렉션 URI 설정:
   - 개발: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://gameplaza.kr/api/auth/callback/google`

### 4. PWA Push Notifications
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

**생성 방법:**
```bash
# VAPID 키 생성 스크립트 실행
node scripts/generate-vapid-keys.js
```

### 5. 기타 보안 설정
```bash
# Cron Job 보안
CRON_SECRET=your-secure-cron-secret

# 텔레메트리 비활성화
NEXT_TELEMETRY_DISABLED=1

# 공휴일 API 키
NEXT_PUBLIC_HOLIDAY_API_KEY=your-encoded-api-key
```

## 📁 환경별 파일 구조

```
├── .env.local              # 로컬 개발용 (git 무시)
├── .env.local.example      # 설정 예제 (git 추적)
├── .env.test              # 테스트용 (git 무시)
└── .env.production        # 프로덕션용 (git 무시)
```

## 🔒 환경변수 검증 시스템

### 자동 검증 로직
```typescript
// lib/auth.ts 예시
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.');
}
```

### 시작 시 검증 체크리스트
서버 시작 시 다음 환경변수들이 자동으로 검증됩니다:
- ✅ JWT_SECRET
- ✅ DATABASE_URL
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET

## 🚀 배포 환경 설정

### Vercel 배포 시
1. Vercel 대시보드 > Project Settings > Environment Variables
2. 각 환경변수를 개별적으로 추가
3. Production, Preview, Development 환경별로 적절한 값 설정

### 환경변수 우선순위
```
1. .env.local (최우선)
2. .env.development (개발 모드)
3. .env.production (프로덕션 모드)
4. .env (기본값)
```

## 🔍 보안 점검 체크리스트

### 정기 점검 항목 (월 1회)
- [ ] JWT_SECRET 로테이션
- [ ] Google OAuth 클라이언트 시크릿 확인
- [ ] VAPID 키 갱신
- [ ] 데이터베이스 접근 권한 검토
- [ ] 로그 파일에서 민감 정보 누출 검사

### 배포 전 점검
- [ ] .env 파일이 git에 포함되지 않았는지 확인
- [ ] 모든 필수 환경변수가 설정되었는지 확인
- [ ] 프로덕션용 키가 개발환경과 분리되었는지 확인
- [ ] 환경변수 검증 로직이 작동하는지 테스트

## ⚡ 문제 해결

### 자주 발생하는 오류

#### 1. JWT_SECRET 누락
```
Error: JWT_SECRET 환경변수가 설정되지 않았습니다.
```
**해결:** `.env.local` 파일에 JWT_SECRET 추가

#### 2. 데이터베이스 연결 실패
```
Error: getaddrinfo ENOTFOUND
```
**해결:** DATABASE_URL 형식 및 접근 권한 확인

#### 3. Google OAuth 오류
```
Error: invalid_client
```
**해결:** Client ID/Secret 재확인 및 리디렉션 URI 점검

## 📞 긴급 상황 대응

### 키 노출 시 대응 절차
1. **즉시 조치**: 노출된 키 비활성화
2. **새 키 생성**: 새로운 보안 키 발급
3. **시스템 업데이트**: 모든 환경에 새 키 배포
4. **모니터링**: 비정상적인 접근 시도 감시
5. **문서화**: 사고 내용 및 대응 과정 기록

### 연락처
- 개발팀 긴급 연락망: [팀 연락처]
- 보안 담당자: [보안 담당자 연락처]

---

**⚠️ 주의: 이 가이드를 팀 전체와 공유하고, 정기적으로 업데이트하세요.**