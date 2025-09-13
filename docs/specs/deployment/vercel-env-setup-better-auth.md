Vercel 환경변수 정리 – Better Auth + Cloudflare 기준

개요
- 기존 Supabase/Firebase/NextAuth 중심 설정을 정리하고, Better Auth + (선택) Cloudflare D1 기준으로 Vercel 환경변수를 구성합니다.

핵심 결론
- 필수(예)
  - `DATABASE_URL` (Better Auth/앱 DB, 예: Neon/Railway/Cloud SQL 등)
  - `BETTER_AUTH_URL` (배포 URL, 예: https://your-app.vercel.app)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google 로그인 사용 시)
  - `NEXT_PUBLIC_APP_URL` (클라이언트에서 절대경로 호출 시 사용)
  - `CRON_SECRET` (크론 훅 보호)
- 선택
  - `NEXTAUTH_SECRET` (일부 내부 JWT/서명 용도로 남겨둘 수 있음. 현재 인증은 Better Auth 사용)
- 비활성/삭제(현재 미사용)
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Firebase: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_*`
  - NextAuth: `NEXTAUTH_URL`, `NEXTAUTH_DEBUG`

단계별 가이드
1) Vercel Project Settings → Environment Variables
   - Add
     - `DATABASE_URL`: PostgreSQL 연결 문자열
     - `BETTER_AUTH_URL`: `https://<your-project>.vercel.app`
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: 필요 시
     - `NEXT_PUBLIC_APP_URL`: 동일 `https://<your-project>.vercel.app`
     - `CRON_SECRET`: 충분히 랜덤한 문자열
     - (선택) `NEXTAUTH_SECRET`: 최소 32자 이상 랜덤 문자열
   - Remove/Unset (또는 빈 값)
     - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_*`
     - `NEXTAUTH_URL`, `NEXTAUTH_DEBUG`

2) Vercel Cron Jobs (선택 – 자동 직급 부여)
   - Schedule: `0 21 * * *` (매일 06:00 KST)
   - Target: `GET /api/cron/rebuild-roles`
   - 보호: `CRON_SECRET` 검사(이미 라우트에서 Authorization 헤더로 검사)

3) Cloudflare D1 사용하는 경우(참고)
   - Vercel 환경에서는 `D1_ENABLED=false`로 두고, API는 D1이 비활성일 때 자동으로 오류를 반환(테스트용). 실제 운영은 Cloudflare Workers/Pages에서 D1과 연동해 사용.
   - Cloudflare에서 크론 트리거로 `/api/cron/rebuild-roles`를 호출하거나, Worker 내부에서 D1 접근으로 직접 처리하는 것도 가능(별도 문서: `docs/specs/deployment/ranking-roles-cron.md`).

점검 체크리스트
- [ ] `/api/auth/session` 응답이 정상(401 또는 세션 JSON)
- [ ] `/api/v3/ranking` 정상 응답
- [ ] `/api/cron/rebuild-roles` 호출 시 Authorization 필수(401/403 없을 때만 성공)
- [ ] 불필요한 Supabase/Firebase 변수 제거로 빌드/런타임 경고 없음

