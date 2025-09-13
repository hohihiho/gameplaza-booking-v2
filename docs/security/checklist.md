웹 애플리케이션 보안 점검 체크리스트 (실행 가이드)

핵심 목표
- 인증/권한 경계 확인(일반 사용자 ↔ 관리자)
- 민감 데이터 노출 방지(로그, 헤더, 오류 응답)
- 입력값 검증 및 SSRF/XSS 방어 확인
- 서드파티/크론 엔드포인트 보호 여부 확인

체크리스트
- 인증/권한
  - [ ] 비로그인 사용자의 관리자 페이지 접근 → 401/403 또는 로그인 리다이렉트
  - [ ] 일반 사용자의 관리자 API 접근 → 403
  - [ ] 공개 API(랭킹 등)는 최소 정보만 제공, 개인 식별 정보 마스킹
  - [ ] `/api/cron/*` 엔드포인트 `Authorization: Bearer <CRON_SECRET>` 필수 확인

- 헤더/보안정책
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy` 최소화 (예: geolocation=())
  - [ ] (선택) CSP(Content-Security-Policy) 적용 계획 수립

- 오류/로그
  - [ ] 오류 응답에서 stack/쿼리 등 내부정보 미노출
  - [ ] 서버 로그에 토큰/쿠키/개인정보 미기록

- 입력값 검증
  - [ ] 관리자/예약/결제 등 주요 API의 파라미터 스키마 검증(zod/yup 등)
  - [ ] 페이징/정렬 인자의 화이트리스트 처리

- 비밀/환경변수
  - [ ] `.env*` 저장소 무유출(이미 .gitignore)
  - [ ] 프로덕션 환경에서 디버그 로그/디버그 라우트 비활성화

운영 가이드
- E2E 커버리지: `tests/e2e/specs/*.spec.ts` 전체 실행으로 기본 경계 확인
- 관리자 수동 직급 재빌드: `/api/v3/admin/users/roles/rebuild`는 슈퍼관리자만 사용 가능
- 크론 엔드포인트는 반드시 `CRON_SECRET` 설정 후 배포

