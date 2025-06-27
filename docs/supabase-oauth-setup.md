# Supabase OAuth 설정 가이드

## Google OAuth에서 Supabase URL 숨기기

현재 Google 로그인 시 `rupeyejnfurlcpgneekg.supabase.co`와 같은 Supabase URL이 표시되는 문제를 해결하는 방법입니다.

### 해결 방법

1. **Supabase Dashboard에서 설정**
   - [Supabase Dashboard](https://app.supabase.com) 로그인
   - 프로젝트 선택
   - Authentication > Providers > Google 설정으로 이동

2. **Google Cloud Console에서 설정**
   - [Google Cloud Console](https://console.cloud.google.com) 로그인
   - OAuth 2.0 클라이언트 ID 설정 편집
   - 승인된 리디렉션 URI에 커스텀 도메인 추가

3. **커스텀 도메인 설정 (권장)**
   - Vercel 등에서 커스텀 도메인 설정 (예: auth.gameplaza.kr)
   - Supabase Edge Functions 또는 Next.js API Routes를 통한 프록시 설정

### 임시 해결책 (빠른 수정)

로그인 페이지에서 다음과 같이 수정하여 사용자 경험을 개선할 수 있습니다:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
      // 앱 이름 표시를 위한 추가 파라미터
      hd: 'gameplaza.kr', // 도메인 힌트
    },
  },
});
```

### 완전한 해결책

1. **Next.js API Route를 통한 프록시**
   ```typescript
   // app/api/auth/google/route.ts
   export async function GET() {
     // Google OAuth URL 생성 및 리다이렉트
   }
   ```

2. **환경 변수 설정**
   ```env
   NEXT_PUBLIC_APP_NAME="광주 게임플라자"
   NEXT_PUBLIC_APP_URL="https://gameplaza.kr"
   ```

3. **Supabase Auth Hook 커스터마이징**
   - 로그인 플로우를 커스텀 API를 통해 처리
   - Supabase URL이 직접 노출되지 않도록 래핑

### 주의사항

- Google OAuth 설정 변경 시 기존 사용자의 로그인이 영향받을 수 있음
- 프로덕션 환경에서는 반드시 커스텀 도메인 사용 권장
- 보안을 위해 OAuth 리다이렉트 URI는 정확히 설정해야 함