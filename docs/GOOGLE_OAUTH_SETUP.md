# Google OAuth 프로덕션 설정 가이드

## 1. Google Cloud Console 설정

### 접속 및 프로젝트 선택
1. https://console.cloud.google.com/ 접속
2. 프로젝트 선택 (gameplaza-kr0)

### OAuth 2.0 클라이언트 설정
1. **API 및 서비스** → **사용자 인증 정보**
2. OAuth 2.0 클라이언트 ID 선택
3. **승인된 리디렉션 URI** 추가

## 2. 리다이렉트 URI 설정

### 프로덕션 URI (필수)
```
https://gameplaza-v2.vercel.app/api/auth/callback/google
```

### Vercel 프리뷰 도메인 (선택)
```
https://gameplaza-v2-*.vercel.app/api/auth/callback/google
```
*참고: 와일드카드는 지원하지 않으므로 필요시 개별 추가*

### 커스텀 도메인 (있는 경우)
```
https://gameplaza.kr/api/auth/callback/google
https://www.gameplaza.kr/api/auth/callback/google
```

### 개발 환경 (필수)
```
http://localhost:3000/api/auth/callback/google
```

## 3. Vercel 환경변수 설정

### Production 환경변수
Vercel 대시보드에서 다음 환경변수 설정:

```bash
# NextAuth 설정 (Production)
NEXTAUTH_URL=https://gameplaza-v2.vercel.app
NEXTAUTH_SECRET=[프로덕션용 시크릿 키]

# Google OAuth (Production)
GOOGLE_CLIENT_ID=44559014883-rlrsl4sfl09o2q9qip3kbppc7er1imls.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Supabase 설정 (Production DB)
NEXT_PUBLIC_SUPABASE_URL=https://rfcxbqlgvppqjxgpwnzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[프로덕션 anon key]
SUPABASE_SERVICE_ROLE_KEY=[프로덕션 service role key]
```

### Preview 환경변수
Preview 환경에는 개발 DB 사용:

```bash
# NextAuth 설정 (Preview)
NEXTAUTH_URL=https://[자동생성도메인].vercel.app
NEXTAUTH_SECRET=[개발용 시크릿 키]

# Google OAuth (Development)
GOOGLE_CLIENT_ID=44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Supabase 설정 (Development DB)
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[개발 anon key]
SUPABASE_SERVICE_ROLE_KEY=[개발 service role key]
```

## 4. 환경별 OAuth 클라이언트 분리 (권장)

보안과 관리 편의를 위해 환경별로 별도의 OAuth 클라이언트를 만드는 것을 권장:

### 개발용 OAuth 클라이언트
- 이름: GamePlaza Development
- 리다이렉트 URI: http://localhost:3000/api/auth/callback/google
- Client ID: 44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com

### 프로덕션용 OAuth 클라이언트  
- 이름: GamePlaza Production
- 리다이렉트 URI: https://gameplaza-v2.vercel.app/api/auth/callback/google
- Client ID: 44559014883-rlrsl4sfl09o2q9qip3kbppc7er1imls.apps.googleusercontent.com

## 5. 테스트 체크리스트

### 로컬 환경
- [ ] http://localhost:3000 에서 Google 로그인 가능
- [ ] 로그인 후 올바른 페이지로 리다이렉트
- [ ] 세션 정보 정상 표시

### 프로덕션 환경
- [ ] https://gameplaza-v2.vercel.app 에서 Google 로그인 가능
- [ ] 로그인 후 올바른 페이지로 리다이렉트
- [ ] 관리자 권한 정상 작동
- [ ] 세션 유지 확인

## 6. 일반적인 문제 해결

### "redirect_uri_mismatch" 에러
- Google Console에 정확한 URI가 추가되었는지 확인
- HTTPS/HTTP 프로토콜 확인
- 마지막 슬래시(/) 없는지 확인

### 500 Internal Server Error
- Vercel 환경변수가 모두 설정되었는지 확인
- NEXTAUTH_SECRET이 설정되었는지 확인
- NEXTAUTH_URL이 올바른지 확인

### 로그인 후 리다이렉트 실패
- NEXTAUTH_URL이 실제 도메인과 일치하는지 확인
- auth.ts의 redirect 콜백 로직 확인

## 7. 보안 주의사항

1. **프로덕션 시크릿 관리**
   - NEXTAUTH_SECRET은 강력한 랜덤 문자열 사용
   - 환경별로 다른 시크릿 사용
   - 절대 코드에 하드코딩하지 않음

2. **OAuth 클라이언트 보안**
   - Client Secret은 절대 클라이언트 코드에 노출하지 않음
   - 사용하지 않는 리다이렉트 URI는 제거
   - 정기적으로 클라이언트 시크릿 갱신

3. **CORS 및 CSP 설정**
   - Content Security Policy에 Google 도메인 포함
   - CORS 설정에서 신뢰할 수 있는 도메인만 허용