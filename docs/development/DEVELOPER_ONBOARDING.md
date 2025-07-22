# 🚀 게임플라자 개발자 온보딩 가이드

> 광주 게임플라자 예약 시스템 개발팀에 오신 것을 환영합니다! 
> 이 가이드는 새로운 개발자가 프로젝트에 빠르게 적응할 수 있도록 돕습니다.

## 📌 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [개발 환경 설정](#개발-환경-설정)
3. [코드베이스 구조](#코드베이스-구조)
4. [핵심 개념 이해](#핵심-개념-이해)
5. [개발 워크플로우](#개발-워크플로우)
6. [주요 기능별 가이드](#주요-기능별-가이드)
7. [트러블슈팅](#트러블슈팅)

---

## 🎯 프로젝트 개요

### 프로젝트 정보
- **프로젝트명**: 광주 게임플라자 예약 시스템
- **목적**: 리듬게임 전문 오락실의 기기 예약 관리 시스템
- **기술 스택**: Next.js 15, TypeScript, Supabase, Tailwind CSS
- **타겟 플랫폼**: 모바일 웹 (PWA)

### 핵심 특징
- 🔐 구글 OAuth 인증 (전화번호 선택)
- 📱 모바일 퍼스트 PWA
- 🕐 KST 타임존 고정
- ⏰ 24시간 표시 체계 (0~5시는 24~29시)
- 🎮 1인 1대 예약 원칙

### 관련 문서
- [📘 통합 기획서](/docs/planning/complete_specification.md)
- [📡 API 문서](/docs/technical/api_documentation.md)
- [🏗️ 아키텍처 문서](/docs/technical/architecture.md)

---

## 💻 개발 환경 설정

### 1. 필수 요구사항
```bash
# Node.js 18+ 설치 확인
node --version  # v18.0.0 이상

# Git 설치 확인
git --version
```

### 2. 프로젝트 클론 및 설정
```bash
# 1. 저장소 클론
git clone https://github.com/your-org/gameplaza-v2.git
cd gameplaza-v2

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 필요한 값 설정
```

### 3. 환경 변수 설정
```env
# .env.local
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Cron
CRON_SECRET=your_cron_secret
```

### 4. 개발 서버 실행
```bash
# 개발 서버 시작 (포트 3000 고정)
npm run dev

# 포트 3000이 사용 중인 경우
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## 📁 코드베이스 구조

### 프로젝트 구조
```
gameplaza-v2/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지
│   ├── (public)/            # 공개 페이지
│   ├── (user)/              # 사용자 페이지
│   ├── admin/               # 관리자 페이지
│   ├── api/                 # API 라우트
│   └── components/          # 공통 컴포넌트
├── lib/                     # 유틸리티 및 서비스
│   ├── auth/               # 인증 관련
│   ├── supabase/           # DB 연결
│   ├── services/           # 비즈니스 로직
│   └── utils/              # 헬퍼 함수
├── hooks/                   # 커스텀 훅
├── stores/                  # Zustand 스토어
├── types/                   # TypeScript 타입
└── docs/                    # 문서
    ├── planning/           # 기획 문서
    ├── technical/          # 기술 문서
    └── development/        # 개발 가이드
```

### 주요 파일 설명
- `/app/layout.tsx` - 루트 레이아웃
- `/app/api/auth/[...nextauth]/route.ts` - 인증 설정
- `/lib/supabase/index.ts` - Supabase 클라이언트
- `/lib/auth.ts` - 인증 헬퍼
- `/CLAUDE.md` - 프로젝트 규칙 (필독!)

---

## 🧠 핵심 개념 이해

### 1. 시간 처리 (KST)
```typescript
// ❌ 잘못된 방법
const date = new Date("2025-07-22T14:00:00");

// ✅ 올바른 방법
const date = new Date(2025, 6, 22, 14, 0, 0); // 월은 0부터 시작
```

### 2. 24시간 표시 체계
```typescript
// 시간 표시 변환
function formatDisplayTime(hour: number): string {
  if (hour >= 0 && hour < 6) {
    return `${hour + 24}시`; // 0~5시 → 24~29시
  }
  return `${hour}시`;
}
```

### 3. 예약 상태
```typescript
type ReservationStatus = 
  | 'pending'     // 대기 중
  | 'approved'    // 승인됨
  | 'checked_in'  // 체크인
  | 'in_use'      // 사용 중
  | 'completed'   // 완료
  | 'cancelled'   // 취소
  | 'rejected'    // 거절
  | 'no_show';    // 노쇼
```

### 4. 사용자 권한
```typescript
type UserRole = 
  | 'user'        // 일반 사용자
  | 'staff'       // 스태프 (읽기 전용)
  | 'admin'       // 관리자
  | 'super_admin' // 슈퍼 관리자
```

---

## 🔄 개발 워크플로우

### 1. 브랜치 전략
```bash
main          # 프로덕션
├── develop   # 개발
    ├── feature/*    # 새 기능
    ├── fix/*        # 버그 수정
    └── hotfix/*     # 긴급 수정
```

### 2. 커밋 규칙
```bash
# 형식: [타입] 제목

[feat] 예약 생성 기능 추가
[fix] 시간 표시 버그 수정
[docs] API 문서 업데이트
[refactor] 인증 로직 개선
[test] 예약 서비스 테스트 추가
```

### 3. PR 체크리스트
- [ ] 코드가 프로젝트 규칙을 따르는가?
- [ ] 테스트를 작성했는가?
- [ ] 문서를 업데이트했는가?
- [ ] 모바일에서 테스트했는가?
- [ ] KST 시간 처리가 올바른가?

---

## 🛠️ 주요 기능별 가이드

### 1. 인증 시스템
```typescript
// 사용자 정보 가져오기
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);
const user = session?.user;
```

### 2. 예약 생성
```typescript
// API 호출 예시
const createReservation = async (data: ReservationData) => {
  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 3. 실시간 업데이트
```typescript
// Supabase Realtime 구독
const channel = supabase.channel('reservations')
  .on('broadcast', { event: 'update' }, (payload) => {
    // 상태 업데이트
  })
  .subscribe();
```

### 4. 관리자 권한 체크
```typescript
// 미들웨어에서 권한 확인
import { checkAdminAuth } from '@/lib/auth/middleware';

export async function GET(request: Request) {
  const authResult = await checkAdminAuth(request);
  if (!authResult.authorized) {
    return new Response('Unauthorized', { status: 401 });
  }
  // 처리 로직
}
```

---

## 🐛 트러블슈팅

### 자주 발생하는 문제

#### 1. 포트 3000 사용 중
```bash
# 해결 방법
lsof -ti:3000 | xargs kill -9
npm run dev
```

#### 2. Supabase 연결 오류
- `.env.local` 파일의 Supabase URL과 키 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

#### 3. 시간대 문제
- 모든 Date 객체 생성 시 KST 기준 확인
- UTC 파싱 금지

#### 4. 인증 오류
- Google OAuth 설정 확인
- `NEXTAUTH_URL` 환경 변수 확인

### 디버깅 팁
```typescript
// 개발 환경에서만 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

---

## 📚 추가 학습 자료

### 필독 문서
1. [CLAUDE.md](/CLAUDE.md) - 프로젝트 규칙
2. [기획 문서 가이드](/docs/planning/README.md)
3. [API 문서](/docs/technical/api_documentation.md)

### 기술 스택 공식 문서
- [Next.js 15](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 팀 규칙
1. **단순성 최우선** - 복잡한 추상화보다 명확한 코드
2. **모바일 퍼스트** - 모든 기능은 모바일에서 먼저 테스트
3. **한국어 우선** - 주석, 커밋 메시지는 한국어로
4. **점진적 개선** - 큰 변경보다 작은 개선

---

## 🤝 도움 요청

### 팀 커뮤니케이션
- **기술 문의**: 팀 슬랙 #dev-help 채널
- **기획 문의**: 기획서 참조 또는 PM에게 문의
- **긴급 이슈**: 팀 리더에게 직접 연락

### 코드 리뷰 요청
1. PR 생성 시 적절한 리뷰어 지정
2. 변경 사항 요약 작성
3. 테스트 결과 첨부
4. 관련 이슈 연결

---

## ✅ 온보딩 체크리스트

### 첫 주
- [ ] 개발 환경 설정 완료
- [ ] 프로젝트 실행 성공
- [ ] CLAUDE.md 숙독
- [ ] 기획서 이해
- [ ] 첫 PR 생성

### 둘째 주
- [ ] 주요 기능 파악
- [ ] 코드 스타일 익히기
- [ ] 간단한 버그 수정
- [ ] 테스트 작성 연습

### 셋째 주
- [ ] 새 기능 개발 시작
- [ ] 코드 리뷰 참여
- [ ] 문서 기여

---

**환영합니다! 🎉** 게임플라자 팀의 일원이 되신 것을 축하드립니다. 
질문이 있으시면 언제든 팀에게 문의해주세요!