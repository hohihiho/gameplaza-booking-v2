# 프로젝트 구조

## 루트 디렉토리
```
gameplaza-v2/
├── app/                    # Next.js App Router
├── components/             # 재사용 컴포넌트
├── lib/                   # 유틸리티 & 설정
├── hooks/                 # 커스텀 React Hook
├── types/                 # TypeScript 타입
├── styles/                # 전역 스타일
├── public/                # 정적 파일
├── docs/                  # 문서
├── tests/                 # 테스트 파일
├── scripts/               # 빌드/배포 스크립트
├── supabase/              # Supabase 설정
└── tools/                 # 개발 도구
```

## 주요 app 디렉토리
- `app/api/`: API 라우트
- `app/admin/`: 관리자 페이지
- `app/reservations/`: 예약 시스템
- `app/machines/`: 기기 관리
- `app/auth/`: 인증 관련
- `app/components/`: 페이지별 컴포넌트

## 설정 파일
- `package.json`: 프로젝트 설정 및 의존성
- `next.config.js`: Next.js 설정
- `tailwind.config.js`: Tailwind CSS 설정
- `tsconfig.json`: TypeScript 설정
- `jest.config.js`: Jest 테스트 설정
- `playwright.config.ts`: Playwright E2E 설정
- `.eslintrc.json`: ESLint 설정
- `CLAUDE.md`: AI 에이전트 룰