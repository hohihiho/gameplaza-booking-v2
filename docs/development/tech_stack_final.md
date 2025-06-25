# 광주 게임플라자 최종 기술스택

## 🎯 선택한 기술스택

### Frontend
**Next.js 14 (App Router)**
- Server Components로 빠른 초기 로딩
- API Routes로 백엔드 로직 처리
- 내장 PWA 지원
- Vercel 최적화 배포

**Tailwind CSS + shadcn/ui**
- 모바일 퍼스트 반응형 디자인
- 재사용 가능한 컴포넌트
- 커스터마이징 용이
- 다크모드 지원

### 인증 시스템
**NextAuth.js v5**
- ✅ **커스텀 로그인 URL** (Supabase URL 숨김)
- 구글 OAuth 직접 연동
- JWT 토큰 관리
- Supabase와 자연스러운 연동

### 데이터베이스
**Supabase (PostgreSQL)**
- 실시간 구독 (Realtime)
- Row Level Security
- 자동 백업
- 무료 티어 충분

### 알림 시스템
**Firebase FCM**
- 웹 푸시 알림
- 전화번호 SMS 인증
- 백그라운드 알림

### 상태 관리
**Zustand + TanStack Query**
- 간단한 전역 상태
- 서버 상태 캐싱
- 실시간 동기화

### UI 라이브러리
**@dnd-kit**
- 모바일 터치 지원
- 드래그앤드롭 (기기 순서)
- 부드러운 애니메이션

**Framer Motion**
- 페이지 전환 효과
- 모바일 제스처
- 마이크로 인터랙션

## 📦 주요 패키지 구성

```json
{
  "dependencies": {
    // Core
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    
    // Auth
    "next-auth": "^5.0.0",
    "@auth/supabase-adapter": "^1.0.0",
    
    // Database
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.5.0",
    
    // State & Data
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    
    // UI
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "framer-motion": "^11.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    
    // PWA
    "next-pwa": "^5.6.0",
    
    // Notifications
    "firebase": "^10.0.0"
  }
}
```

## 🔧 환경 변수 설정

```env
# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key

# Google OAuth (직접 설정)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Firebase
NEXT_PUBLIC_FIREBASE_CONFIG={}
```

## 🏗️ 프로젝트 구조

```
gameplaza-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (public)/          # 공개 페이지
│   ├── (user)/            # 사용자 페이지
│   ├── admin/             # 관리자 페이지
│   └── api/               # API Routes
│       └── auth/[...nextauth]/
├── components/            # 재사용 컴포넌트
├── lib/                   # 유틸리티
│   ├── auth.ts           # NextAuth 설정
│   ├── supabase.ts       # Supabase 클라이언트
│   └── firebase.ts       # FCM 설정
├── hooks/                # Custom Hooks
├── stores/               # Zustand Stores
└── types/                # TypeScript 타입
```

## 🔐 인증 플로우 (NextAuth 커스텀)

```typescript
// lib/auth.ts
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  pages: {
    signIn: '/login',  // 커스텀 로그인 페이지
    error: '/error',   // 에러 페이지
  },
  callbacks: {
    async session({ session, token }) {
      // Supabase 사용자 정보 연동
      return session
    }
  }
}
```

## 💡 Supabase URL 숨기기 핵심

**문제**: Supabase 기본 OAuth 사용시 
```
https://xxxxx.supabase.co/auth/v1/authorize?provider=google
```

**해결**: NextAuth.js 사용시
```
https://yourdomain.com/api/auth/signin/google
```

✅ **결과**: 사용자는 Supabase를 전혀 인지하지 못함

## 🚀 개발 시작 명령어

```bash
# 프로젝트 생성
npx create-next-app@latest gameplaza-v2 --typescript --tailwind --app

# 주요 패키지 설치
npm install next-auth @auth/supabase-adapter @supabase/supabase-js @supabase/ssr
npm install zustand @tanstack/react-query
npm install @radix-ui/themes framer-motion @dnd-kit/sortable
npm install -D @types/node

# 개발 서버 시작
npm run dev
```

## 📝 다음 단계

1. **Next.js 프로젝트 초기화**
2. **NextAuth.js 설정** (구글 OAuth)
3. **Supabase 프로젝트 생성** 및 연동
4. **기본 라우팅 구조** 설정
5. **PWA 설정** 추가

---

**작성일**: 2025년 6월 25일  
**목적**: 최종 기술스택 결정 및 구현 가이드  
**핵심**: NextAuth.js로 Supabase URL 완전 숨김