테스트 전용 세션 가장 모드(E2E)

개요
- 실제 OAuth 없이도 로그인/관리자 시나리오를 E2E에서 검증하기 위해, 테스트 모드에서만 활성화되는 세션 가장을 제공합니다.
- 프로덕션(NODE_ENV=production)에서는 비활성화되어 보안에 영향을 주지 않습니다.

동작 방식
- 요청 헤더 `x-e2e-impersonate: user | admin` 를 전달하면 아래 API들이 가짜 세션/권한 응답을 반환합니다.
  - `GET /api/auth/session`
  - `GET /api/v3/auth/session`
  - `GET /api/auth/check-admin`
- 관리자 레이아웃(`app/admin/layout.tsx`)은 NextAuth 세션이 없을 때도 `/api/v3/auth/session`를 조회하여 테스트 모드 헤더를 인식합니다.

사용 방법(자동)
- Playwright 스펙에서 `extraHTTPHeaders`로 자동 지정되어 있습니다.
  - `tests/e2e/specs/site-pages-auth.spec.ts`
    - 일반 사용자 플로우: `x-e2e-impersonate: user`
    - 관리자 플로우: `x-e2e-impersonate: admin`

주의
- 반드시 로컬/테스트 환경에서만 동작합니다. `process.env.NODE_ENV !== 'production'` 조건으로 보호됩니다.
- 운영 환경에서는 정상 인증 체계(Better Auth)를 통해 접근 권한을 확인합니다.

