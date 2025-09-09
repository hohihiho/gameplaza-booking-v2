# 🏗️ 기술 스택

## Frontend

### 프레임워크 및 라이브러리
- **Next.js 14**: App Router 사용, Server Components 활용
- **React 18**: 최신 기능 활용 (Suspense, Concurrent Features)
- **TypeScript**: 타입 안정성 보장
- **PWA**: Service Worker, 오프라인 지원, 푸시 알림

### 스타일링
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Framer Motion**: 애니메이션 라이브러리
- **CSS Modules**: 컴포넌트별 스타일 격리 (필요시)

### 상태 관리
- **Better Auth**: 현대적인 인증 라이브러리 (구글 OAuth 전용)
  - **간단한 설정**: 구글 로그인만 지원으로 복잡성 제거
  - **TypeScript 우선**: 완벽한 타입 안전성 제공
  - **Next.js 최적화**: App Router와 완벽 호환
- **Zustand**: 전역 상태 관리 (예약 정보, UI 상태)
- **React Query (TanStack Query)**: 서버 상태 관리 및 캐싱

### 유틸리티
- **date-fns**: 날짜 처리 (KST 기준)
- **Lucide React**: 아이콘 라이브러리
- **React Hook Form**: 폼 상태 관리
- **Drizzle ORM**: 타입 안전 SQL 쿼리 빌더

## Backend & Database

### 데이터베이스
- **Cloudflare D1** (전역 엣지 SQLite 데이터베이스)
  - **글로벌 엣지 데이터**: 전 세계 300+ 위치에서 지연시간 최소화
  - **무제한 읽기 대역폭**: 전역 커넥션 풀링으로 고속 처리
  - **자동 스케일링**: 트래픽 급증에도 반응속도 일정 유지
  - **완전 무료**: 25GB 저장공간 + 500만 읽기/일 + 10만 쓰기/일
  - **SQL 완벽 지원**: SQLite 기반으로 표준 SQL 지원
  - **실시간 복제**: 전역 데이터 동기화로 일관성 보장
  - **한국 최적화**: 한국 내 엣지 노드에서 < 10ms 응답시간

### ORM & 데이터 접근
- **Drizzle ORM**
  - D1과 완벽한 통합
  - 타입 안전 쿼리
  - 마이그레이션 자동 관리
  - Prepared statements 지원

### 인증 시스템
- **Better Auth** (현대적인 인증 시스템)
  - **간단함과 성능**: 구글 로그인 전용으로 설정 복잡성 제거
  - **Cloudflare D1 연동**: 사용자 데이터를 D1 데이터베이스에 안전하게 저장
  - **TypeScript 우선**: 완벽한 타입 안전성과 개발자 경험
  - **보안 최적화**: CSRF 보호, 세션 관리, 쿠키 보안
- **Google OAuth**: Better Auth를 통한 통합 관리

### 실시간 통신
- **SSE (Server-Sent Events)**: 단방향 실시간 업데이트
- **WebSocket** (예정): 양방향 실시간 통신
- **Polling Fallback**: SSE 미지원 환경 대응

### AI & 자동화
- **Cloudflare Workers AI**: 닉네임/비속어 실시간 처리
- **GitHub Actions**: 크론잡 자동화 (무료)

## 배포 & 인프라

### 호스팅
- **Frontend**: Vercel (Next.js 애플리케이션)
  - 자동 빌드 및 배포
  - Edge Functions 지원
  - 이미지 최적화
  
- **Backend**: Cloudflare Workers
  - 서버리스 엣지 컴퓨팅
  - 자동 스케일링
  - 글로벌 배포

### 데이터베이스 & 스토리지
- **Cloudflare D1**: 메인 데이터베이스
- **Cloudflare R2** (예정): 파일 스토리지
- **Cloudflare KV** (예정): 캐싱 레이어

### 자동화 & CI/CD
- **GitHub Actions**
  - 자동 테스트
  - 빌드 및 배포
  - 크론잡 (10분마다 기기 상태 업데이트)
  - 데이터 백업

### 도메인 & CDN
- **Cloudflare DNS**: 도메인 관리
- **Cloudflare CDN**: 정적 자원 캐싱
- **SSL/TLS**: 무료 SSL 인증서
- **DDoS 보호**: 자동 보호

### 모니터링
- **Cloudflare Analytics**: 트래픽 분석
- **Workers Analytics**: API 성능 모니터링
- **Vercel Analytics**: 프론트엔드 성능 지표
- **Web Vitals**: Core Web Vitals 추적

## 개발 도구

### 필수 도구
- **Node.js**: v18.0.0 이상
- **npm/yarn**: 패키지 관리
- **Git**: 버전 관리
- **VS Code**: 권장 IDE

### CLI 도구
- **Wrangler**: Cloudflare Workers CLI
- **Drizzle Kit**: 데이터베이스 마이그레이션
- **Vercel CLI**: 로컬 개발 환경

### 테스팅
- **Jest**: 단위 테스트
- **React Testing Library**: 컴포넌트 테스트
- **Playwright**: E2E 테스트
- **MSW**: API 모킹

### 코드 품질
- **ESLint**: 코드 린팅
- **Prettier**: 코드 포매팅
- **TypeScript**: 타입 체킹
- **Husky**: Git 훅 관리

## 보안

### 인증 & 인가
- **JWT 토큰**: Better Auth 기반
- **RBAC**: 역할 기반 접근 제어
- **세션 관리**: 보안 쿠키

### 데이터 보호
- **HTTPS**: 모든 통신 암호화
- **환경 변수**: 민감 정보 분리
- **입력 검증**: 모든 사용자 입력 검증

### 보안 도구
- **Rate Limiting**: Cloudflare 기본 제공
- **WAF**: Web Application Firewall
- **Bot Management**: 봇 차단

## 성능 최적화

### 프론트엔드
- **Code Splitting**: 동적 임포트
- **Image Optimization**: Next.js Image 컴포넌트
- **Font Optimization**: 웹폰트 최적화
- **Bundle Size**: Tree shaking

### 백엔드
- **Edge Computing**: 사용자 근처에서 실행
- **Query Optimization**: Prepared statements
- **Caching**: 다층 캐싱 전략
- **Connection Pooling**: 데이터베이스 연결 관리

### 네트워크
- **CDN**: 정적 자원 캐싱
- **Compression**: Brotli/Gzip 압축
- **HTTP/3**: QUIC 프로토콜
- **Prefetching**: 리소스 사전 로드