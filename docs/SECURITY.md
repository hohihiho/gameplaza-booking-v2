# 🔐 보안 가이드

## 개요

광주 게임플라자 예약 시스템의 보안 설정 및 관리 가이드입니다. 이 문서는 개발자와 운영자가 시스템의 보안을 유지하고 관리하는 데 필요한 정보를 제공합니다.

## 🛡️ 구현된 보안 기능

### 1. 보안 헤더

모든 HTTP 응답에 다음 보안 헤더가 자동으로 설정됩니다:

- **X-Frame-Options**: 클릭재킹 공격 방지
- **X-Content-Type-Options**: MIME 타입 스니핑 방지
- **X-XSS-Protection**: XSS 필터링 활성화
- **Content-Security-Policy**: 악성 스크립트 실행 방지
- **Strict-Transport-Security**: HTTPS 강제 (프로덕션)
- **Referrer-Policy**: 리퍼러 정보 제한

### 2. Rate Limiting

API 엔드포인트별로 요청 제한이 적용됩니다:

- **일반 API**: 분당 60회
- **인증 API**: 분당 5회
- **예약 생성**: 분당 10회
- **관리자 API**: 분당 100회

### 3. 입력 검증 및 Sanitization

- Zod 스키마를 통한 타입 안전 입력 검증
- SQL Injection 패턴 탐지 및 차단
- XSS 방지를 위한 HTML 태그 필터링
- 디렉토리 순회 공격 방지

### 4. 인증 및 세션 보안

- **NextAuth.js v5** 기반 안전한 인증
- **JWT** 기반 세션 관리 (7일 만료)
- **Secure Cookie** 설정 (프로덕션)
- **CSRF 토큰** 자동 생성 및 검증

### 5. 악성 요청 차단

미들웨어에서 다음 요청들을 자동으로 차단합니다:

- 알려진 취약점 스캐너 (SQLMap, Nikto 등)
- SQL Injection 시도
- XSS 공격 시도
- 디렉토리 순회 공격
- 과도한 경로 깊이

## 🔧 보안 설정 가이드

### 환경 변수 보안

#### 필수 환경 변수

```bash
# NextAuth 보안
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_DEBUG=false

# Supabase 연결
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 보안 권장사항

1. **NEXTAUTH_SECRET**은 최소 32자 이상의 랜덤 문자열 사용
2. 프로덕션에서는 **NEXTAUTH_DEBUG=false** 설정
3. 환경 변수에 절대 하드코딩하지 않기
4. `.env.local` 파일을 git에 커밋하지 않기

### 쿠키 보안

프로덕션 환경에서는 자동으로 안전한 쿠키 설정이 적용됩니다:

```javascript
{
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  domain: 'your-domain.com'
}
```

### HTTPS 강제

프로덕션 환경에서는 HSTS 헤더가 자동으로 설정되어 HTTPS가 강제됩니다:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## 🚨 보안 점검 목록

### 배포 전 필수 점검

- [ ] 환경 변수가 올바르게 설정되었는지 확인
- [ ] NEXTAUTH_SECRET이 강력한 랜덤 값인지 확인
- [ ] 프로덕션에서 디버그 모드가 비활성화되었는지 확인
- [ ] HTTPS가 올바르게 설정되었는지 확인
- [ ] 보안 헤더가 정상적으로 설정되는지 확인

### 보안 검증 스크립트 실행

```bash
npx tsx scripts/security-check.ts
```

이 스크립트는 다음을 검증합니다:
- 필수 환경 변수 존재 여부
- NextAuth 시크릿 강도
- 하드코딩된 시크릿 탐지
- 보안 헤더 설정
- 프로덕션 환경 설정

## 🔍 모니터링 및 감사

### 로그 관리

- 민감한 정보는 로그에 기록하지 않음
- 프로덕션에서는 에러 로그만 출력
- 개발 환경에서만 상세 디버그 정보 제공

### 보안 이벤트 모니터링

다음 이벤트들이 자동으로 감지되고 차단됩니다:
- Rate limit 초과
- 악성 요청 패턴
- 인증 실패
- 권한 없는 접근 시도

## 🚀 보안 업데이트

### 정기 업데이트

1. **의존성 업데이트**: 매월 보안 패치 확인
2. **NextAuth 업데이트**: 새 버전 출시 시 검토
3. **Supabase 정책**: 정기적인 RLS 정책 검토

### 취약점 대응

1. 취약점 발견 시 즉시 패치 적용
2. 긴급 배포 프로세스 활용
3. 사용자에게 필요시 알림 제공

## 📞 보안 문의

보안 관련 문제나 취약점을 발견한 경우:

- **이메일**: security@gameplaza.kr
- **긴급시**: admin@gameplaza.kr
- **GitHub Issues**: 민감하지 않은 보안 개선사항

## 📚 추가 자료

- [NextAuth.js 보안 가이드](https://next-auth.js.org/getting-started/security)
- [Supabase 보안 모범사례](https://supabase.com/docs/guides/auth/security)
- [OWASP 보안 체크리스트](https://owasp.org/www-project-web-security-testing-guide/)
- [Next.js 보안 가이드](https://nextjs.org/docs/advanced-features/security-headers)

---

⚠️ **중요**: 이 문서는 정기적으로 업데이트되며, 모든 개발자는 보안 관련 변경사항을 숙지해야 합니다.