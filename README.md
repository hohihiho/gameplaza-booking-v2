# 🎮 광주 게임플라자 예약 시스템

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Supabase-2.0-green?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss" />
</div>

## 📋 프로젝트 개요

광주 게임플라자의 리듬게임 기기 대여 예약을 관리하는 웹 기반 PWA 시스템입니다.
기존 카카오톡 오픈채팅 예약 방식을 현대적인 웹 시스템으로 전환하여 운영 효율성을 극대화했습니다.

### ✨ 주요 특징

- 🔐 **구글 OAuth + 전화번호 인증** - 간편하고 안전한 로그인
- 📱 **PWA 지원** - 모바일 앱처럼 사용 가능 (홈화면 추가, 푸시 알림)
- ⚡ **실시간 동기화** - Supabase Realtime으로 즉각적인 상태 반영
- 🎯 **24시간 룰** - 1인 1일 1예약 자동 관리
- 🤖 **자동화 시스템** - GitHub Actions로 기기 상태 자동 관리

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **상태관리**: Zustand
- **애니메이션**: Framer Motion
- **폼 관리**: React Hook Form
- **API 통신**: Tanstack Query

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js + Google OAuth
- **실시간**: Supabase Realtime
- **파일 저장**: Supabase Storage
- **알림**: Firebase Cloud Messaging (FCM)

### DevOps
- **호스팅**: Vercel
- **CI/CD**: GitHub Actions
- **크론잡**: GitHub Actions (무료)
- **모니터링**: Vercel Analytics

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 계정
- Google Cloud Console 계정
- Firebase 프로젝트

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Firebase FCM
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cron Job
CRON_SECRET=your_cron_secret
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📁 프로젝트 구조

```
gameplaza-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── admin/             # 관리자 페이지
│   ├── api/               # API 라우트
│   ├── components/        # 공통 컴포넌트
│   ├── guide/             # 이용안내 페이지
│   ├── machines/          # 기기 목록 페이지
│   ├── mypage/            # 마이페이지
│   ├── reservations/      # 예약 관련 페이지
│   └── schedule/          # 예약 현황 페이지
├── docs/                  # 프로젝트 문서
│   ├── planning/          # 기획 문서
│   └── technical/         # 기술 문서
├── hooks/                 # Custom React Hooks
├── lib/                   # 유틸리티 함수
│   ├── api/              # API 클라이언트
│   └── supabase/         # Supabase 설정
├── supabase/             # Supabase 설정
│   └── migrations/       # 데이터베이스 마이그레이션
├── types/                # TypeScript 타입 정의
└── .github/              # GitHub Actions 워크플로우
    └── workflows/        
```

## 🔑 주요 기능

### 사용자 기능
- 📅 **예약 신청** - 날짜, 시간, 기기 선택
- 👤 **마이페이지** - 예약 내역, 프로필 관리
- 📊 **실시간 현황** - 예약 가능 여부 확인
- 🔔 **알림** - 예약 승인/거절 푸시 알림

### 관리자 기능
- ✅ **예약 관리** - 승인/거절, 체크인 처리
- 🎮 **기기 관리** - 상태 변경, 정보 수정
- 💰 **결제 관리** - 현금/계좌이체 처리
- ⏰ **시간 조정** - 실제 이용시간 수동 조정 및 정산
- 📈 **통계** - 실제 이용시간 기준 매출 분석
- 🚫 **블랙리스트** - 악성 사용자 관리

## 🔄 개발 워크플로우

### 브랜치 전략
```
main (production)
├── develop (개발)
│   ├── feature/기능명
│   ├── fix/버그명
│   └── hotfix/긴급수정
```

### 커밋 컨벤션
```
[타입] 제목

본문 (선택)

타입: feat|fix|docs|style|refactor|test|chore
```

## 📚 문서

- [기획서](./docs/planning/complete_specification.md)
- [데이터베이스 스키마](./docs/technical/database_schema.md)
- [API 문서](./docs/technical/api_documentation.md)
- [관리자 플로우](./docs/planning/admin_flow.md)
- [GitHub Actions 설정](./docs/GITHUB_ACTIONS_SETUP.md)

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m '[feat] 놀라운 기능 추가'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

이 프로젝트는 비공개 프로젝트입니다. 무단 복제 및 배포를 금지합니다.

## 👥 팀

- **개발**: [개발자 이름]
- **기획**: [기획자 이름]
- **디자인**: [디자이너 이름]

## 📞 문의

- 이메일: admin@gameplaza.kr
- 전화: 062-XXX-XXXX

---

<div align="center">
  Made with ❤️ by 광주 게임플라자 팀
</div>