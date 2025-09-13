# 🚀 게임플라자 예약 시스템 v3 통합 기술 명세서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [기술 스택](#기술-스택)
4. [핵심 기능 구현](#핵심-기능-구현)
5. [데이터베이스 설계](#데이터베이스-설계)
6. [API 설계](#api-설계)
7. [보안 및 성능](#보안-및-성능)
8. [배포 및 인프라](#배포-및-인프라)

---

## 🎯 시스템 개요

### 프로젝트 정보
- **버전**: v3.4.0
- **프로젝트명**: 광주 게임플라자 예약 시스템
- **목적**: 게임장 기기 예약 및 관리 시스템
- **대상**: 일반 사용자 (99% 모바일) 및 관리자

### 핵심 요구사항
- **모바일 퍼스트**: 3G 환경에서도 원활한 작동
- **실시간 동기화**: 예약 및 기기 상태 실시간 업데이트
- **KST 시간대**: 모든 시간 처리는 한국 표준시 기준
- **24시간 표시**: 익일 새벽(0~5시)은 24~29시로 표시
- **접근성**: WCAG 2.1 AA 기준 준수

---

## 🏗️ 아키텍처

### 시스템 아키텍처 다이어그램
```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├───────────────┬─────────────────────┬───────────────────────┤
│  Mobile Web   │   PWA Application   │   Admin Dashboard     │
└───────────────┴─────────────────────┴───────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
├───────────────────────────────────────────────────────────────┤
│            Next.js 14 (App Router) + TypeScript             │
├─────────────┬──────────────┬──────────────┬────────────────┤
│   Pages     │  API Routes  │  Middleware  │  Components    │
└─────────────┴──────────────┴──────────────┴────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
├──────────────┬────────────────┬────────────────────────────┤
│ Better Auth  │  Business Logic │  Real-time Services       │
└──────────────┴────────────────┴────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
├─────────────────┬────────────────┬─────────────────────────┤
│  Cloudflare D1  │  Supabase(백업) │  Redis Cache(예정)    │
└─────────────────┴────────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
├──────────────┬────────────────┬────────────────────────────┤
│    Vercel    │  Cloudflare    │    Monitoring (Sentry)    │
└──────────────┴────────────────┴────────────────────────────┘
```

### 아키텍처 패턴
- **모놀리식 → 모듈화**: 초기에는 단일 애플리케이션으로 시작, 점진적 분리
- **서버리스 우선**: Vercel Edge Functions 활용
- **JAMstack**: JavaScript, APIs, Markup 기반 정적 사이트 생성
- **Event-Driven**: 실시간 이벤트 기반 상태 동기화

---

## 💻 기술 스택

### Frontend
| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| **Next.js** | 14.2.x | 풀스택 프레임워크 | SSR/SSG, App Router, 최적화 |
| **TypeScript** | 5.x | 타입 시스템 | 타입 안정성, 개발 생산성 |
| **Tailwind CSS** | 3.4.x | 스타일링 | 유틸리티 우선, 번들 최적화 |
| **Zustand** | 4.x | 전역 상태 관리 | 간단함, TypeScript 지원 |
| **Tanstack Query** | 5.x | 서버 상태 관리 | 캐싱, 동기화, 낙관적 업데이트 |
| **React Hook Form** | 7.x | 폼 관리 | 성능, 검증, DX |
| **Framer Motion** | 11.x | 애니메이션 | 선언적 애니메이션 |

### Backend & Database
| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| **Better Auth** | 1.x | 인증 시스템 | Edge 호환, TypeScript 우선 |
| **Cloudflare D1** | - | 주 데이터베이스 | Edge 네이티브, 글로벌 복제 |
| **Supabase** | 2.x | 백업 DB & 실시간 | PostgreSQL, Realtime |
| **Drizzle ORM** | 0.36.x | ORM | TypeScript, D1 지원 |
| **Zod** | 3.x | 스키마 검증 | 런타임 검증, 타입 추론 |

### DevOps & Tools
| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| **Vercel** | - | 호스팅 | Next.js 최적화, Edge Functions |
| **Cloudflare** | - | CDN & Workers | 글로벌 엣지, D1 통합 |
| **GitHub Actions** | - | CI/CD | 자동화, 통합 테스트 |
| **Sentry** | 8.x | 에러 모니터링 | 실시간 에러 추적 |
| **Playwright** | 1.48.x | E2E 테스트 | 크로스 브라우저 테스트 |

---

## 🔧 핵심 기능 구현

### 1. 인증 시스템 (Better Auth)
```typescript
// lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // D1
    schema: {
      user: users,
      session: sessions,
      account: accounts,
    }
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }
  },
  plugins: [
    admin(),      // 관리자 역할
    twoFactor(),  // 2FA
    organization() // 조직 관리
  ]
});
```

### 2. 예약 시스템
```typescript
// 예약 생성 플로우
interface ReservationFlow {
  // 1. 가용성 체크
  checkAvailability(deviceId: string, date: Date): Promise<TimeSlot[]>

  // 2. 예약 생성 (낙관적 업데이트)
  createReservation(data: ReservationInput): Promise<Reservation>

  // 3. 실시간 상태 동기화
  syncRealtimeStatus(reservationId: string): void

  // 4. 알림 발송
  sendNotification(userId: string, type: NotificationType): void
}

// KST 시간 처리
class KSTTimeHandler {
  // 24시간 표시 체계 (24~29시)
  formatDisplayTime(hour: number): string {
    if (hour >= 0 && hour < 6) {
      return `${24 + hour}시`
    }
    return `${hour}시`
  }

  // Date 객체는 항상 KST로 처리
  parseKSTDate(dateStr: string): Date {
    // UTC 파싱 금지, 로컬 시간대로만 파싱
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
}
```

### 3. 실시간 동기화
```typescript
// Supabase Realtime 통합
const reservationChannel = supabase
  .channel('reservations')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'reservations' },
    (payload) => {
      // Zustand 스토어 업데이트
      updateReservationStore(payload)
      // UI 리렌더링
      invalidateQueries(['reservations'])
    }
  )
  .subscribe()

// Cloudflare Durable Objects (예정)
export class ReservationState extends DurableObject {
  async handleReservation(request: Request) {
    // 분산 잠금 및 상태 관리
    const state = await this.storage.get('reservations')
    // 충돌 방지 로직
    return new Response(JSON.stringify(state))
  }
}
```

### 4. 성능 최적화
```typescript
// 이미지 최적화
<Image
  src={deviceImage}
  alt={deviceName}
  width={300}
  height={200}
  placeholder="blur"
  loading="lazy"
  quality={85}
/>

// 코드 스플리팅
const AdminDashboard = dynamic(
  () => import('@/components/admin/Dashboard'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

// React Query 캐싱
const { data } = useQuery({
  queryKey: ['devices', category],
  queryFn: fetchDevices,
  staleTime: 5 * 60 * 1000, // 5분
  gcTime: 10 * 60 * 1000,   // 10분
})
```

---

## 🗄️ 데이터베이스 설계

### 주요 테이블 구조

#### Users (사용자)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user', -- user, vip, admin, super_admin
  points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Devices (기기)
```sql
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  type_id TEXT REFERENCES device_types(id),
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  status TEXT DEFAULT 'available', -- available, in_use, maintenance
  floor INTEGER NOT NULL,
  position_x INTEGER,
  position_y INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Reservations (예약)
```sql
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  device_id TEXT REFERENCES devices(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, checked_in, completed, cancelled
  amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_date_device (date, device_id),
  INDEX idx_user_status (user_id, status)
);
```

### 데이터베이스 마이그레이션 전략
1. **Supabase → D1 마이그레이션**
   - 단계적 마이그레이션 (읽기 → 쓰기)
   - 이중 쓰기 기간 운영
   - 데이터 일관성 검증

2. **스키마 버전 관리**
   - Drizzle 마이그레이션 사용
   - 롤백 가능한 마이그레이션
   - 자동화된 스키마 동기화

---

## 🔌 API 설계

### RESTful API 엔드포인트

#### 인증 API
```
POST   /api/auth/signin       # 로그인
POST   /api/auth/signup       # 회원가입
POST   /api/auth/signout      # 로그아웃
GET    /api/auth/session      # 세션 확인
POST   /api/auth/refresh      # 토큰 갱신
```

#### 예약 API
```
GET    /api/reservations                 # 예약 목록
POST   /api/reservations                 # 예약 생성
GET    /api/reservations/:id            # 예약 상세
PATCH  /api/reservations/:id            # 예약 수정
DELETE /api/reservations/:id            # 예약 취소
POST   /api/reservations/:id/check-in   # 체크인
```

#### 관리자 API
```
GET    /api/admin/dashboard              # 대시보드 데이터
GET    /api/admin/devices                # 기기 관리
PATCH  /api/admin/devices/:id           # 기기 상태 변경
GET    /api/admin/analytics             # 통계 데이터
POST   /api/admin/schedule/generate     # 스케줄 생성
```

### API 응답 형식
```typescript
// 성공 응답
{
  success: true,
  data: T,
  metadata?: {
    page?: number,
    totalPages?: number,
    totalCount?: number
  }
}

// 에러 응답
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

---

## 🔒 보안 및 성능

### 보안 조치
1. **인증/인가**
   - JWT 기반 인증
   - Role-Based Access Control (RBAC)
   - 2FA 지원

2. **데이터 보호**
   - HTTPS 강제
   - SQL Injection 방지 (Prepared Statements)
   - XSS 방지 (Content Security Policy)
   - CSRF 토큰

3. **Rate Limiting**
   ```typescript
   // Cloudflare Rate Limiting
   export const rateLimiter = {
     windowMs: 15 * 60 * 1000, // 15분
     max: 100, // 최대 100 요청
     standardHeaders: true,
     legacyHeaders: false,
   }
   ```

### 성능 최적화
1. **프론트엔드**
   - Lighthouse 점수: 95+ (모바일)
   - First Contentful Paint: < 1.5s
   - Time to Interactive: < 3s
   - 번들 사이즈: < 200KB (초기 로드)

2. **백엔드**
   - API 응답 시간: < 200ms (p95)
   - 데이터베이스 쿼리: < 50ms
   - 캐시 히트율: > 80%

3. **캐싱 전략**
   ```typescript
   // Edge 캐싱
   export const config = {
     runtime: 'edge',
     regions: ['icn1'], // 서울 리전
   }

   // 브라우저 캐싱
   headers: {
     'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
   }
   ```

---

## 🚀 배포 및 인프라

### 배포 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm ci
          npm run test
          npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Workers to Cloudflare
        run: wrangler deploy --env production
```

### 환경 구성
```env
# Production 환경변수
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gameplaza.kr

# Database
DATABASE_URL=...
D1_DATABASE_ID=...

# Auth
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# External Services
SENTRY_DSN=...
CLOUDFLARE_API_TOKEN=...
```

### 모니터링 및 로깅
1. **에러 추적**: Sentry
2. **성능 모니터링**: Vercel Analytics
3. **로그 수집**: Cloudflare Logpush
4. **업타임 모니터링**: UptimeRobot

---

## 📈 확장 계획

### 단기 (3개월)
- [ ] Redis 캐시 레이어 추가
- [ ] WebSocket 실시간 통신 강화
- [ ] PWA 오프라인 지원
- [ ] 다국어 지원 (i18n)

### 중기 (6개월)
- [ ] 마이크로서비스 분리 (예약, 결제, 알림)
- [ ] GraphQL API 도입
- [ ] ML 기반 수요 예측
- [ ] 네이티브 앱 개발

### 장기 (1년)
- [ ] 멀티테넌시 지원
- [ ] B2B SaaS 전환
- [ ] 글로벌 확장
- [ ] 블록체인 기반 포인트 시스템

---

## 📚 참고 문서
- [Architecture Overview](./architecture.md)
- [Database Schema](./database_schema.md)
- [API Documentation](./api_documentation.md)
- [Security Policy](./security_policy.md)
- [Tech Stack Details](./tech_stack_detail.md)

---

*최종 수정: 2025년 1월 13일*
*버전: 3.4.0*