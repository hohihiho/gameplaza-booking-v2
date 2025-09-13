# 배포 가이드 (완전 초보용)

이 문서는 아무것도 모르는 상태에서도 프리뷰(검수용) → 프로덕션(실서비스)까지 배포할 수 있도록 단계별로 안내합니다.

최종 목표
- PR(기능 브랜치)을 올리면 Vercel에서 프리뷰 링크가 자동 생성됨
- 프리뷰에서 테스트 후, `main`에 병합하면 프로덕션에 자동 배포
- Cloudflare에 연결한 나의 도메인으로 서비스 접속 가능

준비물(계정/도구)
- GitHub 계정과 이 저장소(Repository)
- Vercel 계정(무료 플랜 가능) https://vercel.com
- 도메인과 Cloudflare 계정(선택, 직접 도메인 연결 시) https://cloudflare.com
- Node.js 18 이상(또는 20), npm

자주 쓰는 명령어
- 개발 서버 실행: `npm run dev`
- 타입/린트/테스트: `npm run type-check` / `npm run lint` / `npm test`
- 프로덕션 빌드: `npm run build`

중요 용어
- 프리뷰(Preview): PR마다 자동으로 만들어지는 테스트용 배포 링크
- 프로덕션(Production): 실제 사용자에게 공개되는 배포 링크(메인 도메인)
- 환경 변수(Env Vars): 비밀키/설정값. 코드에 넣지 말고 Vercel/로컬 `.env`로 관리

---

## 1. 로컬에서 한 번 확인하기(필수)

1) 저장소를 클론하고 의존성 설치
   - `git clone <repo-url>`
   - `cd gameplaza-v2`
   - `npm ci` (없다면 `npm install`)

2) 개발 서버가 뜨는지 확인
   - `npm run dev` → 브라우저에서 `http://localhost:3000`

3) 품질 체크 통과시키기
   - `npm run type-check`
   - `npm run lint`
   - `npm test` (있다면 통과 확인)
   - `npm run build` (에러 없이 빌드되는지)

문제 생기면 메시지를 읽고 수정 후 다시 실행하세요. 에러가 0이 되는 게 목표입니다.

---

## 2. 환경 변수 준비하기(아주 중요)

1) 루트에 있는 `.env.example` 파일을 열어 필요한 키 목록을 확인합니다.
2) 로컬 테스트용으로는 `.env.local` 파일을 만들고 값을 채웁니다(이 파일은 커밋하지 마세요).
3) 같은 키를 나중에 Vercel에도 입력합니다(Development/Preview/Production 환경 각각).

예시 이름(프로젝트에 따라 다를 수 있음)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 서버 전용 키(절대 `NEXT_PUBLIC_` 붙이지 않음): 웹훅 시크릿, 서비스 롤 키 등

안전 수칙
- 절대 비밀값을 Git에 커밋하지 마세요
- 프리뷰에는 가급적 테스트/스테이징 자원을 사용하세요

### 2.1 환경 변수 상세 (.env.example 기준)

데이터베이스
- `DATABASE_URL`, `DIRECT_URL`: 서버 사이드에서만 사용. 로컬 개발/테스트 목적으로만 입력하세요.

인증(NextAuth)
- `NEXTAUTH_URL`: 로컬은 `http://localhost:3000`, 프로덕션은 `https://도메인`
- `NEXTAUTH_SECRET`: 길이 32자 이상 임의 문자열(https://generate-secret.vercel.app/32)
- `NEXTAUTH_DEBUG`: 로컬 디버그시 `true`, 프로덕션은 `false`

OAuth (Google)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google Cloud 콘솔에서 발급, Redirect URI를 환경별로 등록

Supabase
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 클라이언트 공개 키(안전 범위)
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용(절대 클라이언트로 노출 금지)
 - (선택) `SUPABASE_DB_URL`: 직접 DB 연결이 필요할 때만 사용

Firebase (전화번호 인증)
- `NEXT_PUBLIC_FIREBASE_*`: 공개 키
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: 서버 전용 Admin SDK 키

PWA Web Push
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: 공개키
- `VAPID_PRIVATE_KEY`: 서버 전용, `VAPID_EMAIL`: 관리 연락 메일

버전 정보(선택)
- `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_BUILD_DATE`, `NEXT_PUBLIC_BUILD_COMMIT`: 빌드 표시용

플래그/보안/분석
- `NEXT_PUBLIC_ENABLE_PWA`: `true/false`
- `NEXT_PUBLIC_CANARY_ENABLED`, `NEXT_PUBLIC_CANARY_PERCENTAGE`: 카나리 릴리스 토글
- `NEXT_PUBLIC_GA_ID`: Google Analytics ID(선택)
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN(선택)
 - (선택) `NEXT_PUBLIC_APP_URL`: 절대 URL 필요 시 사용(예: SSR fetch)
 - (선택) `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JS API 키

기타(선택)
- `BETTER_AUTH_URL`: 인증 콜백/기준 URL을 강제해야 할 때 사용

프로덕션 전용(선택)
- `FORCE_HTTPS`, `SECURE_COOKIES`: 보안 강제 옵션(서버/프로덕션에서만)

Vercel에 입력하는 방법
1) Vercel 프로젝트 → Settings → Environment Variables
2) “Environment”를 Development/Preview/Production으로 나눠 같은 키를 각각 입력
3) 서버 전용 키는 “Encrypted”로 저장되고, `NEXT_PUBLIC_` 접두사는 브라우저로 노출됨을 이해하세요
4) 변경 후에는 재배포가 필요합니다(다음 커밋 또는 수동 Redeploy)

---

## 3. Vercel에 연결하고 프리뷰 만들기

1) Vercel 가입 후, New Project → Import Git Repository → 이 저장소를 선택합니다.
2) Framework Preset은 Next.js로 자동 감지됩니다(맞는지 확인).
3) Build 설정은 기본값 사용
   - Install Command: `npm ci`
   - Build Command: `npm run build`
4) Environment Variables에서 필요한 키를 추가합니다
   - Environment: Development, Preview, Production 각각에 맞는 값 입력
   - 저장 후 Deploy 버튼을 누릅니다

성공하면
- 메인 페이지에 “첫 배포”가 생성됩니다
- PR을 만들면 자동으로 “Preview Deployment” 링크가 PR에 표시됩니다

---

## 4. 프리뷰에서 테스트하기(검수 단계)

1) GitHub에서 PR을 생성합니다(브랜치 이름 예: `feat/…`)
2) PR 화면에 붙는 Vercel Preview URL을 클릭합니다(예: `https://<hash>-project.vercel.app`)
3) 아래를 빠르게 확인합니다(스모크 테스트)
   - 페이지 이동이 잘 되는가
   - 이미지/폰트가 로드되는가
   - 폼 제출/로그인 같은 핵심 기능이 동작하는가
   - 콘솔 에러가 없는가
4) E2E 테스트가 있다면 실행합니다: `npm run test:e2e`

문제 없으면 리뷰를 받고 PR을 승인/병합합니다.

---

## 5. 프로덕션 배포(자동)

1) PR을 `main`에 병합하면 Vercel이 자동으로 Production 배포를 만듭니다.
2) 배포가 끝나면 Production URL로 접속해 스모크 테스트를 한 번 더 합니다.
3) 문제가 생기면 Vercel의 Deployments 화면에서 직전 성공 배포를 Promote(바로 롤백)합니다.

---

## 6. 내 도메인 연결하기(Cloudflare 사용)

사전 조건: 도메인이 Cloudflare DNS에 추가되어 있어야 합니다.

1) Vercel에서 프로젝트 → Settings → Domains로 이동해 내 도메인(`example.com`)을 추가합니다.
2) Cloudflare 대시보드 → DNS → Records에서 아래와 같이 설정합니다.
   - 루트 도메인(@): CNAME, Target `cname.vercel-dns.com`, Proxy Status는 Proxied(주황 구름)
   - `www`: CNAME, Target `cname.vercel-dns.com`, Proxy Status Proxied
   - 참고: A 레코드 `@ → 76.76.21.21`로도 동작하지만 CNAME 방식 권장
3) Cloudflare → SSL/TLS에서
   - Encryption mode: Full(Strict)
   - Edge Certificates: Always Use HTTPS ON, TLS 1.3 ON, HSTS는 필요 시 ON(주의 깊게 설정)
4) Vercel Domains 화면에서 ‘Verify’(또는 자동 검증 완료)를 확인합니다(전파에 수분~수십분).

이제 `https://example.com` 또는 `https://www.example.com`으로 접속 가능합니다.

---

## 7. 이미지/리다이렉트/보안 헤더(선택)

이미지
- 외부 이미지를 쓴다면 `next.config.js`의 `images.domains` 또는 `images.remotePatterns`에 도메인을 추가합니다.

리다이렉트/리라이트/헤더
- `next.config.js` 또는 `vercel.json`에 규칙을 추가합니다.
- 보안 헤더 예: CSP, HSTS, X-Frame-Options, Referrer-Policy 등

---

## 8. 데이터베이스(Supabase 등)와 마이그레이션(선택)

1) 스키마 변경 전: 프리뷰/스테이징 환경에서 먼저 적용 후 테스트
2) 타입 재생성: `npm run verify-schema` → `npm run generate-types`
3) 프로덕션 적용 시: 다운타임 최소화, 문제가 생기면 Vercel 롤백 + DB 롤백 계획 준비
4) 필요 시 시드: `npm run seed`, `npm run seed:superadmin`

---

## 9. 문제 해결(트러블슈팅)

빌드가 실패해요
- Vercel 빌드 로그를 열어 가장 첫 에러를 확인하세요
- 로컬에서 `npm run build`가 성공하는지 확인 후, 같은 수정 적용

이미지가 안 보여요
- 외부 도메지면 `next.config.js`의 이미지 도메인 허용을 추가하세요

프리뷰에서 로그인/콜백이 실패해요
- OAuth/웹훅 콜백 URL에 프리뷰 도메인을 허용했는지 확인하세요

HTTPS/SSL 오류가 떠요
- Cloudflare SSL 모드를 Full(Strict)로, Always Use HTTPS를 ON으로 설정했는지 확인하세요

프로덕션에서 문제가 생겼어요
- Vercel → Deployments에서 이전 성공 배포를 Promote하여 즉시 롤백하세요

---

## 10. 체크리스트(요약)

- [ ] 로컬에서 `type-check`, `lint`, `test`, `build` 모두 통과
- [ ] `.env.local` 구성, Vercel 환경 변수(Dev/Preview/Prod) 입력
- [ ] PR 생성 → Vercel Preview에서 스모크 테스트
- [ ] `main` 병합 → 자동으로 Production 배포 확인
- [ ] 도메인 연결(Cloudflare DNS) 및 SSL/TLS 설정
- [ ] 배포 후 스모크 테스트/로그 확인, 필요 시 롤백

무엇을 더 자동화하고 싶나요?
- PR마다 E2E 자동화, 린트/타입 체크 CI, 알람 연동 등을 원하시면 알려주세요. 프로젝트에 맞게 추가해 드립니다.

---

## 11. CI 설정 (GitHub Actions)

이 저장소에는 기본 CI와 E2E 워크플로가 포함되어 있습니다.

- 기본 CI: `.github/workflows/ci.yml`
  - PR/`main` 푸시에 동작
  - `npm ci` → `type-check` → `lint` → 단위/통합 테스트 → `build`
  - 참고: 단위/통합 테스트가 없으면 스킵되도록 무해하게 구성됨

- E2E(수동): `.github/workflows/e2e.yml`
  - Actions 탭에서 “Run workflow”로 직접 실행
  - Playwright 브라우저 설치 후 `npm run test:e2e` 실행, 리포트를 아티팩트로 업로드

팁
- Vercel 프리뷰 URL을 대상으로 테스트하려면 Playwright 설정의 `baseURL`을 프리뷰 링크로 바꾸고 실행하세요.
- CI에서 환경 변수가 필요하면 GitHub → Settings → Secrets and variables → Actions에 추가하세요.

추가 자동화(적용됨)
- PR CI에서 스모크 E2E를 헤드리스로 실행해 기본 동작을 빠르게 검증합니다.
- PR에 라벨 `e2e:preview`를 달면, Vercel이 올린 PR 코멘트에서 프리뷰 링크를 찾아 그 URL로 스모크 E2E를 실행합니다.
  - 워크플로 파일: `.github/workflows/e2e-preview.yml`
  - 필요 시 라벨 제거로 실행을 중단할 수 있습니다.

---

## 12. 로깅/모니터링 (Sentry 간단 설정)

가장 쉬운 시작은 프런트엔드 DSN만 설정하는 것입니다.

1) https://sentry.io 에서 프로젝트를 만들고 DSN을 발급받습니다.
2) Vercel의 Environment Variables에 `NEXT_PUBLIC_SENTRY_DSN`을 Dev/Preview/Prod에 각각 입력합니다.
3) 앱 시작 시 Sentry 초기화 코드를 추가합니다(예: `lib/monitoring.ts`).
   - 초보자는 우선 DSN만 세팅하고 런타임 에러가 캡처되는지 확인하세요.
4) 소스맵 업로드, 서버사이드 캡처(Edge/Route handlers) 등은 추후 확장 가능합니다.

주의
- 민감 정보가 이벤트에 포함되지 않도록 필터링 옵션을 설정하세요.
- 노이즈가 많다면 샘플링 비율을 조정하세요.
