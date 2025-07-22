# 광주 게임플라자 프로젝트 초기 설정 가이드

> 💡 **신규 개발자라면?** [개발자 온보딩 가이드](./DEVELOPER_ONBOARDING.md)를 먼저 확인하세요!

## 📋 사전 준비사항

### 필수 계정
- [ ] Google Cloud Console 계정 (OAuth 설정)
- [ ] Supabase 계정
- [ ] Firebase 계정 (FCM용)
- [ ] Vercel 계정 (배포용)
- [ ] GitHub 계정

### 개발 환경
- Node.js 18+ 
- npm 또는 yarn
- Git
- VS Code (권장)

## 🚀 Step 1: Next.js 프로젝트 생성

```bash
# 프로젝트 생성
npx create-next-app@latest gameplaza-v2

# 옵션 선택
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → No
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias? → No

# 프로젝트 폴더로 이동
cd gameplaza-v2
```

## 📦 Step 2: 필수 패키지 설치

```bash
# 인증 관련
npm install next-auth@beta
npm install @auth/supabase-adapter

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# 상태 관리
npm install zustand @tanstack/react-query

# UI 컴포넌트
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tabs
npm install framer-motion @dnd-kit/sortable
npm install clsx tailwind-merge

# PWA
npm install next-pwa

# 날짜 처리
npm install date-fns

# 개발 도구
npm install -D @types/node
```

## 🔧 Step 3: 프로젝트 구조 설정

```bash
# 폴더 생성
mkdir -p app/api/auth/[...nextauth]
mkdir -p app/(auth)/login
mkdir -p app/(public)
mkdir -p app/(user)
mkdir -p app/admin
mkdir -p components/ui
mkdir -p lib
mkdir -p hooks
mkdir -p stores
mkdir -p types
mkdir -p public/icons
```

## 🔐 Step 4: Google OAuth 설정

### Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성: "GamePlaza-Gwangju"
3. APIs & Services → Credentials
4. Create Credentials → OAuth client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (개발)
   - `https://yourdomain.com/api/auth/callback/google` (프로덕션)
7. Client ID와 Client Secret 저장

## 🗄️ Step 5: Supabase 프로젝트 설정

### Supabase Dashboard
1. [Supabase](https://supabase.com) 로그인
2. New project 생성
3. Project Settings → API
4. URL과 anon key, service_role key 복사

### 데이터베이스 초기 설정
```sql
-- 사용자 테이블 (NextAuth 자동 생성 + 추가 필드)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 기기 관리 테이블
CREATE TABLE machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rental_type TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 예약 테이블
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  machine_id UUID REFERENCES machines(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  total_price INTEGER NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
```

## 🔥 Step 6: Firebase FCM 설정

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 생성
3. Project Settings → Cloud Messaging
4. Web Push certificates 생성
5. Firebase 설정 객체 복사

## 📝 Step 7: 환경 변수 설정

`.env.local` 파일 생성:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase (JSON 문자열로)
NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","projectId":"...","messagingSenderId":"...","appId":"..."}'
```

## 🎨 Step 8: 기본 설정 파일

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981',
          dark: '#059669',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
```

### `next.config.js` (PWA 설정)
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Google 프로필 이미지
  }
}

module.exports = withPWA(nextConfig)
```

## ✅ Step 9: 초기 설정 확인

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
http://localhost:3000
```

## 🎯 다음 단계

1. **NextAuth 설정 파일 작성** (`lib/auth.ts`)
2. **Supabase 클라이언트 설정** (`lib/supabase.ts`)
3. **기본 레이아웃 구성** (`app/layout.tsx`)
4. **로그인 페이지 구현** (`app/(auth)/login/page.tsx`)
5. **홈페이지 구현** (`app/page.tsx`)

## 🆘 문제 해결

### NEXTAUTH_SECRET 생성
```bash
openssl rand -base64 32
```

### TypeScript 에러
```bash
npm install -D @types/node
```

### Supabase 연결 테스트
```typescript
// lib/supabase.ts 생성 후
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 연결 테스트
const { data, error } = await supabase.from('machines').select('*')
```

---

**작성일**: 2025년 6월 25일  
**다음 업데이트**: 기본 파일 구조 생성 후