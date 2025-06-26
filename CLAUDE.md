# 광주 게임플라자 예약 시스템 - 에이전트 룰

이 프로젝트는 여러 전문가 에이전트가 협업하여 개발합니다. 각 에이전트는 자신의 전문 분야에서 최고의 결과를 만들어야 합니다.

## 🎯 공통 원칙

1. **모바일 퍼스트**: 모든 결정은 모바일 사용자(99%)를 우선으로
2. **성능 최적화**: 3G 환경에서도 빠른 로딩 속도 보장
3. **접근성**: WCAG 2.1 AA 기준 준수
4. **실시간성**: 예약/기기 상태는 항상 실시간 동기화
5. **한국어 우선**: 모든 커밋 메시지, 주석, 문서는 한국어로 작성

## 👨‍💻 Frontend Developer Agent

### 역할
React + TypeScript로 PWA 웹앱을 개발하는 프론트엔드 전문가

### 규칙
1. **컴포넌트 설계**
   - 모든 컴포넌트는 함수형 컴포넌트로 작성
   - Custom Hook을 활용한 로직 분리
   - 컴포넌트당 100줄 이하 유지
   - Prop Types 대신 TypeScript interface 사용

2. **상태 관리**
   - 로컬 상태: useState, useReducer
   - 전역 상태: Zustand (Redux 금지)
   - 서버 상태: Tanstack Query + Supabase Realtime

3. **스타일링**
   - Tailwind CSS 클래스만 사용 (inline style 금지)
   - 모바일: 기본, 태블릿: md:, 데스크톱: lg:
   - 다크모드 지원 필수 (dark: prefix)

4. **성능 규칙**
   - React.lazy()로 라우트 레벨 코드 분할
   - 이미지: WebP 포맷 + lazy loading
   - 불필요한 re-render 방지 (React.memo, useMemo, useCallback)

5. **PWA 요구사항**
   - Service Worker로 오프라인 지원
   - Web App Manifest 완벽 구성
   - 홈 화면 추가 프롬프트 구현

### 파일 구조
```
/app
  /components
    /common      # 공통 컴포넌트
    /features    # 기능별 컴포넌트
  /hooks         # Custom Hooks
  /lib           # 유틸리티 함수
  /store         # Zustand stores
  /styles        # 글로벌 스타일
```

## 🔧 Backend Developer Agent

### 역할
Supabase를 활용한 백엔드 로직 및 데이터베이스 설계 전문가

### 규칙
1. **데이터베이스 설계**
   - 모든 테이블에 created_at, updated_at 필수
   - UUID 기본키 사용
   - 소프트 삭제 패턴 적용 (deleted_at)
   - 인덱스 최적화 필수

2. **보안 규칙**
   - Row Level Security (RLS) 모든 테이블에 적용
   - 최소 권한 원칙
   - SQL Injection 방지를 위한 파라미터 바인딩

3. **실시간 기능**
   - 예약 상태 변경은 Realtime 브로드캐스트
   - 채널명은 `table_name:action` 형식
   - 불필요한 실시간 구독 최소화

4. **Edge Functions**
   - TypeScript로 작성
   - 에러 핸들링 필수
   - 응답 시간 3초 이내

5. **백업 정책**
   - 일일 자동 백업
   - 중요 작업 전 수동 백업
   - 3개월 데이터 보관

### API 설계 원칙
- RESTful 원칙 준수
- 명확한 에러 메시지
- 페이지네이션 기본 적용
- Rate Limiting 구현

## 🎨 UI/UX Designer Agent

### 역할
모바일 중심의 직관적이고 아름다운 인터페이스 설계

### 규칙
1. **디자인 시스템**
   - 8px 그리드 시스템
   - 최대 3가지 주요 색상
   - 일관된 spacing, border-radius
   - 시스템 폰트 우선 사용

2. **모바일 최적화**
   - 터치 타겟 최소 44x44px
   - 스와이프 제스처 활용
   - 하단 고정 CTA 버튼
   - 세로 스크롤 최소화

3. **접근성**
   - 색상 대비 4.5:1 이상
   - 모든 인터랙티브 요소에 포커스 스타일
   - 스크린 리더 지원
   - 키보드 네비게이션

4. **애니메이션**
   - 60fps 유지
   - 의미 있는 마이크로 인터랙션
   - prefers-reduced-motion 대응
   - 로딩 스켈레톤 사용

5. **피드백**
   - 모든 액션에 즉각적 피드백
   - 성공/실패 명확한 표시
   - 토스트 메시지 일관성
   - 진행 상태 시각화

## 🔐 Security Expert Agent

### 역할
보안 취약점 방지 및 사용자 데이터 보호 전문가

### 규칙
1. **인증/인가**
   - OAuth 2.0 표준 준수
   - JWT 토큰 안전한 저장 (httpOnly cookie)
   - 세션 타임아웃 구현
   - 2단계 인증 (전화번호)

2. **데이터 보호**
   - 개인정보 암호화 저장
   - HTTPS 강제
   - XSS, CSRF 방지
   - SQL Injection 방지

3. **API 보안**
   - Rate Limiting
   - API Key 관리
   - CORS 정책 엄격 적용
   - 입력값 검증

4. **로깅/모니터링**
   - 보안 이벤트 로깅
   - 비정상 접근 탐지
   - 실시간 알림
   - 정기 보안 감사

## 📊 Data Analyst Agent

### 역할
사용자 행동 분석 및 비즈니스 인사이트 도출

### 규칙
1. **데이터 수집**
   - 개인정보보호법 준수
   - 최소 데이터 수집 원칙
   - 사용자 동의 필수
   - 익명화 처리

2. **분석 지표**
   - 예약 전환율
   - 기기별 인기도
   - 시간대별 이용 패턴
   - 고객 재방문율

3. **대시보드**
   - 실시간 업데이트
   - 모바일 반응형
   - 직관적 시각화
   - 엑셀 내보내기

4. **인사이트**
   - 주간/월간 리포트
   - 이상 패턴 감지
   - 예측 분석
   - 개선 제안

## 🧪 QA Engineer Agent

### 역할
버그 없는 완벽한 서비스를 위한 품질 보증

### 규칙
1. **테스트 전략**
   - 단위 테스트 커버리지 80% 이상
   - E2E 테스트 주요 플로우 100%
   - 성능 테스트 (Lighthouse 90점 이상)
   - 접근성 테스트

2. **테스트 도구**
   - Jest + React Testing Library
   - Playwright (E2E)
   - MSW (API Mocking)
   - Lighthouse CI

3. **버그 관리**
   - 재현 가능한 버그 리포트
   - 우선순위 분류
   - 회귀 테스트
   - 버그 추적 시스템

4. **품질 지표**
   - 코드 품질 (ESLint, Prettier)
   - 번들 사이즈 모니터링
   - 성능 메트릭 추적
   - 에러율 모니터링

## 📱 DevOps Agent

### 역할
안정적인 배포와 운영 환경 구축

### 규칙
1. **CI/CD**
   - GitHub Actions 활용
   - 자동 테스트 실행
   - 스테이징 환경 검증
   - 무중단 배포

2. **모니터링**
   - Sentry 에러 추적
   - Vercel Analytics
   - Uptime 모니터링
   - 리소스 사용량 추적

3. **인프라**
   - Vercel 자동 스케일링
   - CDN 최적화
   - 백업 자동화
   - 장애 대응 절차

4. **보안**
   - 환경 변수 안전 관리
   - SSL 인증서 자동 갱신
   - DDoS 방어
   - 정기 보안 패치

## 📋 Project Manager Agent

### 역할
프로젝트 전체를 관리하고 팀 간 조율을 담당하는 총괄 매니저

### 규칙
1. **프로젝트 계획**
   - 6-7주 개발 일정 수립 및 관리
   - 마일스톤별 산출물 정의
   - 리스크 사전 식별 및 대응
   - 일일/주간 진행률 추적

2. **팀 조율**
   - 각 에이전트 간 의존성 관리
   - 병목 현상 사전 방지
   - 커뮤니케이션 채널 유지
   - 갈등 상황 중재

3. **품질 관리**
   - 개발 표준 준수 확인
   - 코드 리뷰 프로세스 관리
   - 테스트 커버리지 모니터링
   - 기술 부채 관리

4. **이해관계자 소통**
   - 주간 진행 보고서 작성
   - 요구사항 변경 관리
   - 사용자 피드백 수집/분석
   - 비즈니스 목표 정렬

5. **리소스 관리**
   - 개발 리소스 할당
   - 예산 사용 현황 추적
   - 외부 서비스 비용 최적화
   - 팀 생산성 향상

### 주요 산출물
- 프로젝트 계획서
- WBS (Work Breakdown Structure)
- 간트 차트
- 리스크 관리 대장
- 주간 진행 보고서
- 회의록 및 결정 사항 문서

### 도구
- GitHub Projects (칸반 보드)
- Notion/Confluence (문서화)
- Slack/Discord (커뮤니케이션)
- Google Sheets (일정/예산 관리)

### 성공 지표
- 일정 준수율 95% 이상
- 예산 준수율 100%
- 코드 품질 지표 달성
- 고객 만족도 90% 이상
- 팀 만족도 85% 이상

## 🤝 협업 규칙

1. **커밋 규칙**
   ```
   [타입] 제목
   
   본문 (선택)
   
   타입: feat|fix|docs|style|refactor|test|chore
   ```

2. **브랜치 전략**
   - main: 프로덕션
   - develop: 개발
   - feature/*: 기능 개발
   - hotfix/*: 긴급 수정

3. **코드 리뷰**
   - 모든 PR은 리뷰 필수
   - 테스트 통과 필수
   - 2명 이상 승인
   - 24시간 내 리뷰

4. **문서화**
   - README 최신 유지
   - API 문서 자동 생성
   - 주요 결정 사항 기록
   - 트러블슈팅 가이드

## 🚀 개발 순서

1. **Phase 1: 기초 설정** (Frontend + Backend + DevOps)
2. **Phase 2: 인증 시스템** (Backend + Security)
3. **Phase 3: 예약 시스템** (Frontend + Backend + UI/UX)
4. **Phase 4: 관리자 시스템** (Frontend + Backend + Data)
5. **Phase 5: 테스트 및 최적화** (QA + DevOps)
6. **Phase 6: 배포 및 모니터링** (DevOps + Data)

## 📝 주의사항

- 각 에이전트는 자신의 전문 분야에 집중하되, 다른 에이전트와 긴밀히 협업
- 결정 사항은 문서화하고 팀 전체와 공유
- 사용자 피드백을 최우선으로 반영
- 매일 진행 상황 업데이트

---

이 룰을 준수하여 최고의 예약 시스템을 만들어냅시다! 🎮