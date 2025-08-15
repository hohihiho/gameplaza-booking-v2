# OAuth 최종 체크리스트

## 🔍 현재 상황
- 로컬: ✅ 정상 작동
- 프로덕션: ❌ AccessDenied (동의 화면은 표시되지만 로그인 실패)

## 📋 체크리스트

### 1. Vercel 환경 변수 (✅ 확인 필요)
```
GOOGLE_CLIENT_ID=377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
AUTH_SECRET=s3o1xAv6Tu7vtob+gt2vjv4pH9RFa/Qe5kBnlw4hBMk=
NEXTAUTH_SECRET=s3o1xAv6Tu7vtob+gt2vjv4pH9RFa/Qe5kBnlw4hBMk=
NEXTAUTH_URL=https://www.gameplaza.kr
AUTH_URL=https://www.gameplaza.kr
```

### 2. Google Cloud Console - OAuth 2.0 Client (✅ 확인 필요)

**Authorized JavaScript origins:**
```
https://www.gameplaza.kr
https://gameplaza.kr
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://www.gameplaza.kr/api/auth/callback/google
https://gameplaza.kr/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### 3. Google OAuth Consent Screen (✅ 확인 필요)
- Publishing status: **Testing** (테스트 모드)
- Test users에 본인 이메일 추가되어 있는지 확인

## 🐛 디버깅 방법

### Vercel Functions 로그 확인
1. https://vercel.com/[your-team]/gameplaza-v2/functions
2. 최근 로그에서 OAuth 에러 확인
3. 특히 다음 메시지 확인:
   - "Missing required environment variables"
   - "SignIn callback error"
   - OAuth 관련 에러

### 브라우저 개발자 도구
1. Network 탭 열기
2. `/api/auth/callback/google` 요청 확인
3. Response 확인

## 🔧 가능한 해결책

### 1. 쿠키 도메인 문제 (방금 수정함)
- `.gameplaza.kr`로 설정하여 서브도메인 간 쿠키 공유

### 2. OAuth Redirect URI 정확히 매칭
- Google Console에서 정확한 URI 확인
- 프로토콜(https://)과 경로(/api/auth/callback/google) 정확히 일치

### 3. 테스트 모드 확인
- OAuth consent screen이 "Testing" 상태인지 확인
- Test users 목록에 이메일 추가되어 있는지 확인

### 4. 캐시 문제
- 브라우저 쿠키/캐시 완전 삭제
- 시크릿 모드에서 재시도

## 📝 추가 확인 사항

### Google Cloud Console에서 확인:
1. APIs & Services → Credentials
2. OAuth 2.0 Client IDs 클릭
3. Additional information 섹션에서:
   - Type: Web application
   - Status: Enabled

### Vercel에서 확인:
1. Environment Variables에서 모든 값이 정확한지
2. Production, Preview, Development 모두 체크되어 있는지
3. 변경 후 재배포했는지

## 🚨 주의사항
- Google OAuth는 변경사항 적용에 5-10분 걸릴 수 있음
- 도메인 변경 후 DNS 전파 시간 필요 (최대 48시간, 보통 몇 분)
- 쿠키 정책 변경은 즉시 재배포 필요