# OAuth AccessDenied 최종 해결 가이드

## 현재 상황
- 테스트 모드 설정 완료
- 테스트 사용자 추가 완료
- 그러나 여전히 AccessDenied 에러 발생

## 문제의 원인
Google OAuth 문제가 아니라 NextAuth 설정 문제일 가능성이 높음

## 체크리스트

### 1. ✅ 로컬 환경 변수 (.env.local)
```
GOOGLE_CLIENT_ID=377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
AUTH_SECRET=s+buiCTuHYFj6iSQkRaY17VAOIvINq2gS6F1yIO+IxI=
NEXTAUTH_SECRET=s+buiCTuHYFj6iSQkRaY17VAOIvINq2gS6F1yIO+IxI=
NEXTAUTH_URL=http://localhost:3000
```

### 2. ⚠️ Vercel 환경 변수 확인 필요
https://vercel.com/[your-team]/gameplaza-v2/settings/environment-variables

**반드시 확인할 항목:**
```
GOOGLE_CLIENT_ID (같은 값)
GOOGLE_CLIENT_SECRET (같은 값)
AUTH_SECRET (프로덕션용 시크릿)
NEXTAUTH_SECRET (프로덕션용 시크릿)
NEXTAUTH_URL=https://gameplaza-v2.vercel.app (또는 https://www.gameplaza.kr)
AUTH_URL=https://gameplaza-v2.vercel.app (또는 https://www.gameplaza.kr)
```

### 3. Google Cloud Console 확인
https://console.cloud.google.com/apis/credentials

**Authorized redirect URIs에 다음이 모두 포함되어야 함:**
- https://gameplaza-v2.vercel.app/api/auth/callback/google
- https://www.gameplaza.kr/api/auth/callback/google
- http://localhost:3000/api/auth/callback/google (개발용)

### 4. 코드 수정 완료
- `signIn` 함수에서 `redirect: false` 제거 (Google OAuth는 리다이렉트 필요)

## 즉시 해결 방법

### 방법 1: Vercel 환경 변수 업데이트
1. https://vercel.com 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수들이 있는지 확인:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `AUTH_SECRET` (없으면 추가)
   - `AUTH_URL` (없으면 추가)
5. 값이 올바른지 확인
6. Save 후 Redeploy

### 방법 2: 로컬에서 먼저 테스트
```bash
# 로컬에서 테스트
npm run dev

# http://localhost:3000/login 에서 로그인 시도
# 로컬에서 작동하면 Vercel 환경 변수 문제
# 로컬에서도 안 되면 Google OAuth 설정 문제
```

### 방법 3: 디버깅 모드 활성화
auth.ts에 이미 `debug: true`가 설정되어 있음
Vercel Functions 로그에서 에러 확인:
https://vercel.com/[your-team]/gameplaza-v2/functions

## 예상 원인과 해결책

### 원인 1: Vercel에 AUTH_SECRET 누락
**해결:** Vercel 환경 변수에 AUTH_SECRET 추가

### 원인 2: NEXTAUTH_URL이 잘못됨
**해결:** 
- 도메인을 사용 중이면: `NEXTAUTH_URL=https://www.gameplaza.kr`
- Vercel URL 사용 중이면: `NEXTAUTH_URL=https://gameplaza-v2.vercel.app`

### 원인 3: Google OAuth redirect URI 불일치
**해결:** Google Cloud Console에서 현재 사용 중인 도메인의 redirect URI 추가

## 테스트 순서
1. 브라우저 캐시/쿠키 완전 삭제
2. 시크릿 모드 사용
3. 로그인 시도
4. 에러 발생 시 Vercel Functions 로그 확인

## 성공 신호
- Google 로그인 화면 표시
- 권한 동의 화면 표시
- 로그인 후 홈페이지로 리다이렉트
- 세션 생성 확인