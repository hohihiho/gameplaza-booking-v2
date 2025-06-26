# GitHub Issues 생성 스크립트

아래 명령어들을 순서대로 실행하여 프로젝트 이슈들을 생성합니다.

## 마일스톤 생성

```bash
# Phase 0: 프로젝트 설정
gh milestone create --title "Phase 0: 프로젝트 설정" --description "GitHub 설정, 개발 환경 구축" --due-date 2024-06-29

# Phase 1: 기초 인프라
gh milestone create --title "Phase 1: 기초 인프라" --description "Supabase, Next.js, PWA 기본 설정" --due-date 2024-07-06

# Phase 2: 인증 시스템
gh milestone create --title "Phase 2: 인증 시스템" --description "Google OAuth, 전화번호 인증" --due-date 2024-07-13

# Phase 3: 예약 시스템
gh milestone create --title "Phase 3: 예약 시스템" --description "예약 신청, 관리, 알림" --due-date 2024-07-27

# Phase 4: 관리자 시스템
gh milestone create --title "Phase 4: 관리자 시스템" --description "기기 관리, 체크인, CMS, 통계" --due-date 2024-08-10

# Phase 5: UX 개선
gh milestone create --title "Phase 5: UX 개선" --description "UI 최적화, 추가 기능" --due-date 2024-08-17

# Phase 6: 테스트 및 최적화
gh milestone create --title "Phase 6: 테스트 및 최적화" --description "테스트, 성능 최적화" --due-date 2024-08-24

# Phase 7: 배포
gh milestone create --title "Phase 7: 배포" --description "프로덕션 배포, 문서화" --due-date 2024-08-27
```

## Phase 0 이슈 생성

```bash
# 프로젝트 설정
gh issue create --title "[setup] 개발 환경 초기 설정" --body "- TypeScript, ESLint, Prettier 설정\n- 프로젝트 구조 생성\n- 기본 의존성 설치" --label "chore,P1,devops" --milestone "Phase 0: 프로젝트 설정"

gh issue create --title "[docs] README 및 기본 문서 작성" --body "- README.md 작성\n- 개발 가이드 작성\n- 프로젝트 설명 추가" --label "docs,P2,pm" --milestone "Phase 0: 프로젝트 설정"

gh issue create --title "[setup] GitHub Actions CI/CD 설정" --body "- 빌드 파이프라인 구성\n- 테스트 자동화\n- Vercel 배포 연동" --label "chore,P1,devops" --milestone "Phase 0: 프로젝트 설정"
```

## Phase 1 이슈 생성

```bash
# Backend Setup
gh issue create --title "[feat] Supabase 프로젝트 생성 및 설정" --body "- Supabase 프로젝트 생성\n- 환경 변수 설정\n- 클라이언트 라이브러리 설정" --label "feat,P0,backend" --milestone "Phase 1: 기초 인프라"

gh issue create --title "[feat] 데이터베이스 스키마 설계" --body "- users, devices, reservations 테이블 설계\n- 관계 정의\n- 인덱스 설정" --label "feat,P0,backend" --milestone "Phase 1: 기초 인프라"

gh issue create --title "[feat] RLS 정책 구현" --body "- 각 테이블별 RLS 정책\n- 권한별 접근 제어\n- 보안 규칙 테스트" --label "feat,P0,backend,security" --milestone "Phase 1: 기초 인프라"

# Frontend Setup
gh issue create --title "[feat] Next.js 프로젝트 초기화" --body "- App Router 설정\n- 기본 라우팅 구조\n- 레이아웃 컴포넌트" --label "feat,P0,frontend" --milestone "Phase 1: 기초 인프라"

gh issue create --title "[feat] Tailwind CSS 및 디자인 시스템 설정" --body "- Tailwind 설정\n- 색상 팔레트 정의\n- 컴포넌트 스타일 가이드" --label "feat,P1,frontend,ui-ux" --milestone "Phase 1: 기초 인프라"

gh issue create --title "[feat] PWA 기본 설정" --body "- manifest.json 생성\n- Service Worker 설정\n- 아이콘 및 스플래시 화면" --label "feat,P1,frontend" --milestone "Phase 1: 기초 인프라"
```

## Phase 2 이슈 생성

```bash
# 인증 시스템
gh issue create --title "[feat] Google OAuth 구현" --body "- Supabase Auth 설정\n- OAuth 플로우 구현\n- 세션 관리" --label "feat,P0,backend,security" --milestone "Phase 2: 인증 시스템"

gh issue create --title "[feat] Firebase FCM 전화번호 인증" --body "- Firebase 프로젝트 설정\n- SMS 인증 구현\n- 전화번호 검증" --label "feat,P0,backend,security" --milestone "Phase 2: 인증 시스템"

gh issue create --title "[feat] 권한 시스템 구현" --body "- 일반/스태프/관리자 권한\n- 미들웨어 구현\n- 권한별 라우팅" --label "feat,P0,backend,security" --milestone "Phase 2: 인증 시스템"

gh issue create --title "[feat] 회원가입 플로우 UI" --body "- 회원가입 폼\n- 전화번호 인증 UI\n- 프로필 설정" --label "feat,P0,frontend,ui-ux" --milestone "Phase 2: 인증 시스템"

gh issue create --title "[feat] 마이페이지 기본 구조" --body "- 프로필 정보 표시\n- 예약 내역\n- 설정 메뉴" --label "feat,P1,frontend,ui-ux" --milestone "Phase 2: 인증 시스템"
```

## Phase 3 이슈 생성

```bash
# 예약 시스템
gh issue create --title "[feat] 24시간 룰 엔진 구현" --body "- 예약 가능 시간 계산\n- 중복 예약 방지\n- 제한 규칙 적용" --label "feat,P0,backend" --milestone "Phase 3: 예약 시스템"

gh issue create --title "[feat] 예약 신청 API" --body "- 예약 생성 엔드포인트\n- 검증 로직\n- 에러 처리" --label "feat,P0,backend" --milestone "Phase 3: 예약 시스템"

gh issue create --title "[feat] 예약 신청 폼 UI" --body "- 날짜/시간 선택\n- 기기 선택\n- 옵션 선택 (2P)" --label "feat,P0,frontend,ui-ux" --milestone "Phase 3: 예약 시스템"

gh issue create --title "[feat] 실시간 예약 현황" --body "- Supabase Realtime 연동\n- 실시간 업데이트 UI\n- 낙관적 업데이트" --label "feat,P0,frontend" --milestone "Phase 3: 예약 시스템"

gh issue create --title "[feat] FCM 푸시 알림 구현" --body "- 알림 권한 요청\n- 알림 전송 로직\n- 알림 처리" --label "feat,P0,backend" --milestone "Phase 3: 예약 시스템"

gh issue create --title "[feat] 예약 관리 시스템" --body "- 예약 목록 조회\n- 승인/거절 기능\n- 상태 변경 추적" --label "feat,P0,backend,frontend" --milestone "Phase 3: 예약 시스템"
```

## Phase 4 이슈 생성

```bash
# 관리자 시스템
gh issue create --title "[feat] 기기 관리 CRUD" --body "- 기기 추가/수정/삭제\n- 상태 관리\n- 점검 시간 설정" --label "feat,P0,backend,frontend" --milestone "Phase 4: 관리자 시스템"

gh issue create --title "[feat] 드래그앤드롭 순서 변경" --body "- DnD 라이브러리 연동\n- 순서 저장 로직\n- 최적화" --label "feat,P1,frontend,ui-ux" --milestone "Phase 4: 관리자 시스템"

gh issue create --title "[feat] 체크인 시스템" --body "- 체크인 프로세스\n- 기기 자동 배정\n- QR 코드 생성" --label "feat,P0,backend,frontend" --milestone "Phase 4: 관리자 시스템"

gh issue create --title "[feat] 계좌이체 알림 시스템" --body "- 계좌정보 FCM 전송\n- 복사 기능\n- 백업 시스템" --label "feat,P0,backend,frontend" --milestone "Phase 4: 관리자 시스템"

gh issue create --title "[feat] 노코드 CMS 빌더" --body "- 섹션 관리\n- 드래그앤드롭 편집\n- 실시간 미리보기" --label "feat,P1,frontend,ui-ux" --milestone "Phase 4: 관리자 시스템"

gh issue create --title "[feat] 실시간 대시보드" --body "- 오늘의 예약 현황\n- 실시간 통계\n- 차트 시각화" --label "feat,P1,frontend,data" --milestone "Phase 4: 관리자 시스템"

gh issue create --title "[feat] 데이터 내보내기" --body "- Excel 내보내기\n- CSV 다운로드\n- Google Sheets 연동" --label "feat,P2,backend,data" --milestone "Phase 4: 관리자 시스템"
```

## Phase 5 이슈 생성

```bash
# UX 개선
gh issue create --title "[feat] 모바일 최적화 검증" --body "- 터치 영역 검증\n- 스크롤 성능\n- 제스처 지원" --label "feat,P1,frontend,ui-ux" --milestone "Phase 5: UX 개선"

gh issue create --title "[feat] 애니메이션 추가" --body "- 페이지 전환\n- 마이크로 인터랙션\n- 로딩 상태" --label "feat,P2,frontend,ui-ux" --milestone "Phase 5: UX 개선"

gh issue create --title "[feat] 고객 검색 시스템" --body "- 검색 필터\n- 정렬 기능\n- 상세 정보" --label "feat,P1,frontend,backend" --milestone "Phase 5: UX 개선"

gh issue create --title "[feat] 블랙리스트 관리" --body "- 블랙리스트 CRUD\n- 사유 관리\n- 자동 차단" --label "feat,P1,backend,security" --milestone "Phase 5: UX 개선"
```

## Phase 6 이슈 생성

```bash
# 테스트
gh issue create --title "[test] 단위 테스트 작성" --body "- 핵심 로직 테스트\n- 유틸리티 테스트\n- 커버리지 80%" --label "test,P1,qa" --milestone "Phase 6: 테스트 및 최적화"

gh issue create --title "[test] E2E 테스트 구현" --body "- 주요 플로우 테스트\n- Playwright 설정\n- CI 연동" --label "test,P1,qa" --milestone "Phase 6: 테스트 및 최적화"

gh issue create --title "[perf] 성능 최적화" --body "- 번들 사이즈 최적화\n- 이미지 최적화\n- 코드 스플리팅" --label "refactor,P1,frontend" --milestone "Phase 6: 테스트 및 최적화"

gh issue create --title "[test] 보안 테스트" --body "- 취약점 스캔\n- 펜테스트\n- 보안 감사" --label "test,P0,security,qa" --milestone "Phase 6: 테스트 및 최적화"
```

## Phase 7 이슈 생성

```bash
# 배포
gh issue create --title "[deploy] 프로덕션 환경 설정" --body "- 환경 변수 설정\n- 도메인 연결\n- SSL 설정" --label "chore,P0,devops" --milestone "Phase 7: 배포"

gh issue create --title "[docs] 사용자 매뉴얼 작성" --body "- 사용자 가이드\n- FAQ\n- 스크린샷" --label "docs,P1,pm" --milestone "Phase 7: 배포"

gh issue create --title "[docs] 관리자 매뉴얼 작성" --body "- 관리자 기능 설명\n- 운영 가이드\n- 트러블슈팅" --label "docs,P1,pm" --milestone "Phase 7: 배포"

gh issue create --title "[deploy] 모니터링 설정" --body "- Sentry 설정\n- Analytics 설정\n- 알림 설정" --label "chore,P0,devops" --milestone "Phase 7: 배포"
```

## 실행 방법

1. 터미널에서 프로젝트 루트로 이동
2. 위 명령어들을 순서대로 실행
3. 또는 스크립트 파일로 저장하여 실행:

```bash
# 실행 권한 부여
chmod +x scripts/create-issues.sh

# 스크립트 실행
./scripts/create-issues.sh
```