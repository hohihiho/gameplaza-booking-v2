# 게임플라자 프론트엔드 상세 명세서

## 목차

1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [화면별 상세 명세](#화면별-상세-명세)
5. [컴포넌트 라이브러리](#컴포넌트-라이브러리)
6. [모바일 최적화](#모바일-최적화)
7. [상태 관리](#상태-관리)
8. [라우팅 구조](#라우팅-구조)
9. [스타일링 가이드](#스타일링-가이드)
10. [성능 최적화](#성능-최적화)

## 개요

게임플라자 예약 시스템은 모바일 퍼스트로 설계된 Progressive Web App(PWA)으로, 사용자가 리듬게임 기기를 간편하게 예약하고 관리할 수 있는 시스템입니다.

### 핵심 원칙
- **모바일 퍼스트**: 전체 사용자의 99%가 모바일 사용
- **성능 최적화**: 3G 환경에서도 빠른 로딩
- **접근성**: WCAG 2.1 AA 기준 준수
- **실시간성**: 예약 및 기기 상태 실시간 동기화
- **한국어 우선**: 모든 UI 텍스트는 한국어로 표시

## 기술 스택

### 프레임워크 및 라이브러리
- **Next.js 14**: App Router 사용, Server Components 활용
- **React 18**: 최신 기능 활용 (Suspense, Concurrent Features)
- **TypeScript**: 타입 안정성 보장

### 스타일링
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Framer Motion**: 애니메이션 라이브러리
- **CSS Modules**: 컴포넌트별 스타일 격리 (필요시)

### 상태 관리
- **NextAuth.js**: 인증 상태 관리
- **Zustand**: 전역 상태 관리 (예약 정보 등)
- **React Query (TanStack Query)**: 서버 상태 관리 (v2 API 통합)

### 유틸리티
- **date-fns**: 날짜 처리 (KST 기준)
- **Lucide React**: 아이콘 라이브러리
- **React Hook Form**: 폼 상태 관리

## 프로젝트 구조

```
/app
├── (routes)              # 페이지 라우트
│   ├── page.tsx         # 홈페이지
│   ├── login/           # 로그인
│   ├── signup/          # 회원가입
│   ├── reservations/    # 예약 관련
│   │   ├── page.tsx     # 예약 목록
│   │   ├── new/         # 새 예약
│   │   ├── complete/    # 예약 완료
│   │   └── search/      # 예약 검색
│   ├── mypage/          # 마이페이지
│   ├── schedule/        # 영업 일정
│   ├── machines/        # 기기 목록
│   └── admin/           # 관리자 페이지
├── components/          # 공통 컴포넌트
│   ├── mobile/          # 모바일 전용 컴포넌트
│   ├── charts/          # 차트 컴포넌트
│   └── common/          # 공통 UI 컴포넌트
├── hooks/               # 커스텀 훅
├── lib/                 # 유틸리티 함수
├── store/               # 전역 상태 관리
└── contexts/            # React Context

```

## 화면별 상세 명세

### 1. 홈페이지 (/)

#### 구성 요소
1. **QuickReservationWidget**: 실시간 기기 현황 표시
   - 현재 이용 가능한 기기 수
   - 오늘 영업시간 (1층/2층 구분)
   - 실시간 업데이트 (1분 간격)

2. **MainActionButtons**: 주요 기능 바로가기
   - 예약하기 (로그인 필수)
   - 내 예약 (로그인 필수)
   - 이용 안내
   - 카톡 문의

3. **오시는 길 섹션**
   - 지도 앱 연동 (네이버/카카오/구글)
   - 대중교통 안내
   - 주차 정보

4. **커뮤니티 배너**
   - SNS 링크 (X, YouTube, 카카오톡, Discord)

#### 상태 관리
- 실시간 기기 상태는 1분마다 자동 갱신
- 특별 영업시간은 schedule_events 테이블에서 조회

### 2. 예약하기 (/reservations/new)

#### 4단계 프로세스
1. **날짜 선택**
   - 캘린더 UI (30일 표시)
   - 당일 예약 불가 (24시간 전부터 가능)
   - 주말/평일 구분 표시

2. **기기 종류 선택**
   - 대여 가능한 기기만 표시
   - 카테고리별 그룹핑
   - 실시간 가용 대수 표시

3. **시간 선택**
   - 이용 가능한 시간대만 표시
   - 조기대여/밤샘대여/일반 구분
   - 청소년 이용 가능 시간 표시

4. **상세 옵션 및 확인**
   - 기기 번호 선택
   - 크레딧 타입 선택
   - 플레이 인원 선택 (1인/2인)
   - 요청사항 입력
   - 최종 가격 확인

#### 유효성 검증
- 24시간 이내 예약 차단
- 중복 예약 방지
- 실시간 가용성 체크

### 3. 예약 목록 (/reservations)

#### 기능
- 상태별 필터링 (전체/대기중/승인됨/완료/취소)
- 페이지네이션 (5/10/20개 단위)
- 예약 취소 기능 (24시간 전까지)

#### 정렬 규칙
1. 대기중/승인됨/체크인: 대여일 가까운 순
2. 완료/취소: 최신순

#### 표시 정보
- 기기명 및 번호
- 예약 날짜/시간
- 결제 금액
- 크레딧 타입
- 예약 상태

### 4. 마이페이지 (/mypage)

#### 주요 기능
- 프로필 정보 표시/수정
- 예약 통계
  - 총 예약 횟수
  - 이번 달 예약
  - 노쇼 횟수
- 알림 설정
- 로그아웃
- 회원 탈퇴

### 5. 관리자 대시보드 (/admin)

#### 실시간 통계
- 오늘 대여 매출
- 오늘 예약 현황
- 현재 이용중 현황
- 대여 가능 기기

#### 빠른 작업
- 체크인 관리
- 예약 승인
- 기기 관리
- 통계 분석

#### 최근 예약 목록
- 실시간 업데이트
- 상태별 색상 구분

## 컴포넌트 라이브러리

### 레이아웃 컴포넌트

#### LayoutWrapper
- 전체 레이아웃 관리
- 데스크톱 사이드바 / 모바일 하단바 조건부 렌더링
- 프로필 체크 자동 실행

#### BottomTabBar (모바일 전용)
- 고정 하단 내비게이션
- 5개 탭: 홈, 기기, 예약, 일정, MY
- 예약 탭은 Bottom Sheet 형태로 표시

#### DesktopSidebar (데스크톱 전용)
- 좌측 고정 사이드바
- 확장/축소 가능
- 관리자 메뉴 조건부 표시

### UI 컴포넌트

#### Toast
- 알림 메시지 표시
- 자동 닫힘 (3초)
- 진행 바 표시

#### BottomSheet
- 하단에서 올라오는 모달
- 터치/드래그 지원
- 바깥 클릭시 닫힘

#### LoadingButton
- 로딩 상태 표시
- 중복 클릭 방지

#### FormInput
- 라벨, 에러 메시지 통합
- 다양한 input 타입 지원

### 모바일 전용 컴포넌트

#### PullToRefresh
- 당겨서 새로고침
- 로딩 인디케이터

#### SwipeableCard
- 좌우 스와이프 지원
- 삭제/수정 액션

#### TouchRipple
- 터치 피드백 효과
- Material Design 스타일

#### SkeletonLoader
- 로딩 중 스켈레톤 UI
- 다양한 레이아웃 지원

## 모바일 최적화

### 반응형 디자인
```css
/* 브레이크포인트 */
- xs: 475px 이상
- sm: 640px 이상  
- md: 768px 이상
- lg: 1024px 이상
- xl: 1280px 이상
```

### 터치 최적화
- 최소 터치 영역: 44x44px
- 버튼 간격: 최소 8px
- 스와이프 제스처 지원

### 성능 최적화
- 이미지 최적화 (next/image)
- 코드 스플리팅
- 번들 사이즈 최소화
- Service Worker 캐싱

### PWA 기능
- 오프라인 지원
- 홈 화면 추가
- 푸시 알림 (예정)

## 상태 관리

### 인증 상태 (NextAuth)
```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    user_type: 'customer' | 'admin' | 'super_admin';
  }
}
```

### 전역 상태 (Zustand)
```typescript
interface ReservationStore {
  lastReservationId: string | null;
  setLastReservationId: (id: string) => void;
}
```

### 서버 상태 (React Query)
- 예약 목록 캐싱
- 낙관적 업데이트
- 백그라운드 리페칭

## 라우팅 구조

### 공개 라우트
- `/` - 홈페이지
- `/login` - 로그인
- `/signup` - 회원가입
- `/schedule` - 영업 일정
- `/machines` - 기기 목록
- `/privacy` - 개인정보처리방침
- `/terms` - 이용약관

### 인증 필수 라우트
- `/reservations/*` - 예약 관련
- `/mypage/*` - 마이페이지

### 관리자 전용 라우트
- `/admin/*` - 관리자 페이지

## 스타일링 가이드

### 색상 팔레트
```css
/* Primary Colors */
--primary: #6366f1 (indigo-500)
--primary-dark: #4f46e5 (indigo-600)

/* Secondary Colors */
--secondary: #ec4899 (pink-500)
--accent: #f59e0b (amber-500)

/* Status Colors */
--success: #10b981 (emerald-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
--info: #3b82f6 (blue-500)
```

### 다크모드
- 시스템 설정 연동
- 수동 토글 지원
- 색상 자동 변환

### 애니메이션
- Framer Motion 사용
- 부드러운 전환 효과
- 스켈레톤 로딩

## 성능 최적화

### 초기 로딩
- Critical CSS 인라인
- 폰트 프리로드
- 이미지 레이지 로딩

### 런타임 최적화
- React.memo 활용
- useMemo/useCallback 적절히 사용
- 가상화 (긴 목록)

### 네트워크 최적화
- API 요청 최소화
- 데이터 캐싱
- 낙관적 업데이트

### 측정 지표
- LCP < 2.5초
- FID < 100ms
- CLS < 0.1
- TTI < 3.8초

## 개발 가이드

### 코드 컨벤션
- ESLint + Prettier 설정 준수
- 컴포넌트명은 PascalCase
- 함수명은 camelCase
- 상수는 UPPER_SNAKE_CASE

### Git 커밋 메시지
```
[타입] 제목

본문 (선택)

타입: feat|fix|docs|style|refactor|test|chore
```

### 테스트
- Jest + React Testing Library
- 단위 테스트 우선
- E2E 테스트 (Playwright)

### 접근성
- 시맨틱 HTML 사용
- ARIA 속성 적절히 활용
- 키보드 내비게이션 지원
- 스크린 리더 호환성

## 접근성(WCAG 2.1 AA) 체크리스트

### 1. 지각 가능 (Perceivable)

#### 1.1 텍스트 대체
- [ ] 모든 이미지에 의미있는 alt 텍스트 제공
- [ ] 장식용 이미지는 `alt=""` 또는 CSS 배경으로 처리
- [ ] 아이콘 버튼에 aria-label 제공
- [ ] 복잡한 이미지(차트, 그래프)에 상세 설명 제공

#### 1.2 시간 기반 미디어
- [ ] 비디오에 자막 제공 (있는 경우)
- [ ] 자동 재생 컨텐츠 제어 가능

#### 1.3 적응성
- [ ] 정보와 구조를 잃지 않고 다양한 방식으로 표현 가능
- [ ] 시맨틱 HTML 요소 사용 (header, nav, main, aside, footer)
- [ ] 테이블에 적절한 헤더(th) 및 캡션 제공
- [ ] 폼 요소와 레이블 연결 (for 속성 또는 aria-labelledby)

#### 1.4 구별 가능
- [ ] 색상만으로 정보 전달하지 않음
- [ ] 텍스트와 배경의 명도 대비 4.5:1 이상 (일반 텍스트)
- [ ] 텍스트와 배경의 명도 대비 3:1 이상 (큰 텍스트 18pt+)
- [ ] 텍스트 크기 200%까지 확대 가능
- [ ] 이미지 텍스트 사용 최소화

### 2. 운용 가능 (Operable)

#### 2.1 키보드 접근성
- [ ] 모든 기능을 키보드로 사용 가능
- [ ] 키보드 포커스가 갇히지 않음
- [ ] Tab 순서가 논리적
- [ ] 포커스 이동 시 예측 가능한 동작

#### 2.2 충분한 시간
- [ ] 시간 제한이 있는 경우 연장/해제 가능
- [ ] 자동 업데이트 컨텐츠 일시정지/중지 가능
- [ ] 세션 타임아웃 전 경고 제공

#### 2.3 발작 예방
- [ ] 초당 3회 이상 깜빡이는 컨텐츠 없음
- [ ] 애니메이션 감소 옵션 제공 (prefers-reduced-motion)

#### 2.4 탐색 가능
- [ ] 페이지 제목이 명확하고 고유함
- [ ] 링크 텍스트가 목적을 명확히 설명
- [ ] 반복되는 컨텐츠 건너뛰기 링크 제공
- [ ] 현재 위치를 알 수 있는 방법 제공 (브레드크럼 등)

### 3. 이해 가능 (Understandable)

#### 3.1 가독성
- [ ] 페이지 언어 명시 (lang="ko")
- [ ] 전문 용어에 대한 설명 제공
- [ ] 읽기 수준 고려 (중학생 수준)

#### 3.2 예측 가능성
- [ ] 포커스 시 예상치 못한 변경 없음
- [ ] 입력 시 자동으로 컨텍스트 변경하지 않음
- [ ] 일관된 내비게이션
- [ ] 일관된 식별 (같은 기능은 같은 이름)

#### 3.3 입력 지원
- [ ] 오류 자동 감지 및 설명
- [ ] 입력 필드에 레이블 또는 설명 제공
- [ ] 오류 수정 제안 제공
- [ ] 중요한 작업 전 확인 단계

### 4. 견고성 (Robust)

#### 4.1 호환성
- [ ] 유효한 HTML 마크업
- [ ] ARIA 속성 올바르게 사용
- [ ] 스크린 리더와 호환 (NVDA, JAWS, VoiceOver)

### 게임플라자 특화 접근성 구현 가이드

#### 예약 프로세스
```tsx
// 단계별 진행 상태 알림
<div role="progressbar" 
     aria-valuenow={currentStep} 
     aria-valuemin={1} 
     aria-valuemax={4}
     aria-label={`예약 진행: ${currentStep}단계 / 총 4단계`}>
  {/* 시각적 진행 표시 */}
</div>

// 날짜 선택 캘린더
<Calendar
  aria-label="예약 날짜 선택"
  onDateSelect={(date) => {
    announceToScreenReader(`${format(date, 'yyyy년 MM월 dd일')} 선택됨`);
  }}
/>
```

#### 실시간 업데이트 알림
```tsx
// 실시간 상태 변경 알림
<div role="status" aria-live="polite" aria-atomic="true">
  {machineStatus === 'available' 
    ? '현재 이용 가능한 기기입니다'
    : '현재 이용중인 기기입니다'}
</div>
```

#### 모바일 터치 대응
```tsx
// 터치 타겟 최소 크기 보장
<Button 
  className="min-h-[44px] min-w-[44px] p-3"
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
  예약하기
</Button>
```

#### 폼 접근성
```tsx
// 에러 메시지와 입력 필드 연결
<div>
  <label htmlFor="phone">전화번호 *</label>
  <input
    id="phone"
    type="tel"
    aria-required="true"
    aria-invalid={errors.phone ? "true" : "false"}
    aria-describedby={errors.phone ? "phone-error" : undefined}
  />
  {errors.phone && (
    <span id="phone-error" role="alert" className="text-red-500">
      {errors.phone.message}
    </span>
  )}
</div>
```

#### 키보드 네비게이션
```tsx
// 커스텀 드롭다운 키보드 지원
const MachineSelect = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch(e.key) {
      case 'ArrowDown':
        // 다음 옵션으로 이동
        break;
      case 'ArrowUp':
        // 이전 옵션으로 이동
        break;
      case 'Enter':
      case ' ':
        // 선택
        break;
      case 'Escape':
        // 닫기
        break;
    }
  };
  
  return (
    <div role="combobox" 
         aria-expanded={isOpen}
         aria-haspopup="listbox"
         onKeyDown={handleKeyDown}>
      {/* 드롭다운 내용 */}
    </div>
  );
};
```

#### 색상 대비 가이드
```css
/* 접근성을 고려한 색상 팔레트 */
:root {
  /* 높은 대비 색상 */
  --text-primary: #1a1a1a;     /* 배경 #ffffff 대비 21:1 */
  --text-secondary: #4a4a4a;   /* 배경 #ffffff 대비 9.7:1 */
  --text-disabled: #737373;    /* 배경 #ffffff 대비 5.9:1 */
  
  /* 상태 색상 (WCAG AA 준수) */
  --success-text: #047857;     /* 배경 #ffffff 대비 5.2:1 */
  --error-text: #b91c1c;       /* 배경 #ffffff 대비 5.9:1 */
  --warning-text: #b45309;     /* 배경 #ffffff 대비 4.5:1 */
  
  /* 다크모드 */
  --dark-text-primary: #ffffff;
  --dark-bg-primary: #1a1a1a;
}
```

## PWA 기능 상세 명세

### 1. Service Worker 전략

#### 캐싱 전략
```javascript
// service-worker.js
const CACHE_NAME = 'gameplaza-v1';
const STATIC_CACHE_NAME = 'gameplaza-static-v1';
const DYNAMIC_CACHE_NAME = 'gameplaza-dynamic-v1';

// 정적 리소스 캐싱 (Cache First)
const staticAssets = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/*.css',
  '/_next/static/js/*.js'
];

// API 캐싱 전략 (Network First with Cache Fallback)
const apiRoutes = [
  '/api/device-types',
  '/api/schedule',
  '/api/available-machines'
];

// 캐시 우선순위
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 정적 리소스: Cache First
  if (staticAssets.some(asset => url.pathname.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // API 요청: Network First
  if (apiRoutes.some(route => url.pathname.includes(route))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 나머지: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
```

#### 백그라운드 동기화
```javascript
// 오프라인 예약 대기열
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  }
});

async function syncReservations() {
  const pendingReservations = await getPendingReservations();
  
  for (const reservation of pendingReservations) {
    try {
      await fetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify(reservation),
        headers: { 'Content-Type': 'application/json' }
      });
      await removePendingReservation(reservation.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

### 2. 오프라인 기능 범위

#### 완전 오프라인 지원
- 홈페이지 기본 정보
- 기기 목록 (캐시된 데이터)
- 영업 일정 (캐시된 데이터)
- 이용 안내 페이지
- 연락처 정보

#### 부분 오프라인 지원
- 예약 목록 조회 (캐시된 데이터)
- 예약 상세 정보 (캐시된 데이터)
- 오프라인 예약 저장 (온라인 시 동기화)

#### 온라인 필수 기능
- 실시간 기기 상태
- 예약 생성/수정/취소
- 로그인/회원가입
- 결제 관련 기능

#### 오프라인 UI
```tsx
// components/OfflineIndicator.tsx
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 text-center z-50">
      <p className="text-sm font-medium">
        오프라인 모드입니다. 일부 기능이 제한될 수 있습니다.
      </p>
    </div>
  );
}
```

### 3. 푸시 알림 시나리오

#### 알림 종류 및 타이밍

##### 예약 알림
```typescript
// 예약 관련 알림 타입
interface ReservationNotification {
  type: 'reservation_reminder' | 'reservation_approved' | 'reservation_cancelled';
  data: {
    reservationId: string;
    machineType: string;
    dateTime: string;
    message: string;
  };
}

// 예약 1일 전 알림
scheduleNotification({
  type: 'reservation_reminder',
  sendAt: dayBefore(reservation.dateTime),
  title: '내일 예약이 있습니다! 🎮',
  body: `${reservation.machineType} ${format(reservation.dateTime, 'HH:mm')} 예약`,
  tag: `reminder-${reservation.id}`,
  requireInteraction: true
});

// 예약 승인 즉시 알림
sendNotification({
  type: 'reservation_approved',
  title: '예약이 승인되었습니다 ✅',
  body: `${reservation.machineType} 예약이 승인되었습니다`,
  tag: `approved-${reservation.id}`,
  icon: '/icons/check-circle.png'
});
```

##### 마케팅 알림 (동의 필수)
```typescript
// 프로모션 알림
interface MarketingNotification {
  type: 'promotion' | 'event' | 'maintenance';
  requiresConsent: true;
  data: {
    title: string;
    message: string;
    link?: string;
    expiresAt?: Date;
  };
}

// 주말 특가 알림
if (await hasMarketingConsent(userId)) {
  sendNotification({
    type: 'promotion',
    title: '🎉 주말 특가 이벤트!',
    body: '주말 밤샘 대여 20% 할인',
    data: { url: '/promotions/weekend-special' },
    badge: '/icons/badge-sale.png'
  });
}
```

#### 알림 권한 요청 UX
```tsx
// hooks/usePushNotifications.ts
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    // 적절한 타이밍에 권한 요청
    if ('Notification' in window && permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToNotifications();
      }
    }
  };

  const subscribeToNotifications = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });
    
    // 서버에 구독 정보 전송
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  return { permission, requestPermission };
}
```

#### 알림 설정 UI
```tsx
// components/NotificationSettings.tsx
export function NotificationSettings() {
  const [settings, setSettings] = useState({
    reservationReminders: true,
    statusUpdates: true,
    marketing: false,
    nighttime: false // 야간 알림 차단 (22:00 - 08:00)
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">알림 설정</h3>
      
      <div className="space-y-3">
        <Switch
          label="예약 알림"
          description="예약 전날 및 상태 변경 시 알림"
          checked={settings.reservationReminders}
          onChange={(checked) => updateSettings({ reservationReminders: checked })}
        />
        
        <Switch
          label="기기 상태 알림"
          description="관심 기기가 이용 가능해질 때 알림"
          checked={settings.statusUpdates}
          onChange={(checked) => updateSettings({ statusUpdates: checked })}
        />
        
        <Switch
          label="이벤트 및 프로모션"
          description="특가 정보 및 이벤트 소식"
          checked={settings.marketing}
          onChange={(checked) => updateSettings({ marketing: checked })}
        />
        
        <Switch
          label="야간 알림 차단"
          description="22:00 - 08:00 알림 차단"
          checked={settings.nighttime}
          onChange={(checked) => updateSettings({ nighttime: checked })}
        />
      </div>
    </div>
  );
}
```

### 4. 홈 화면 추가 UX

#### 설치 프롬프트
```tsx
// hooks/useInstallPrompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 설치 여부 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      trackEvent('pwa_installed');
    }
    
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt, isInstalled, install };
}
```

#### 설치 유도 배너
```tsx
// components/InstallBanner.tsx
export function InstallBanner() {
  const { canInstall, install } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!canInstall || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40 max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <img src="/icons/icon-48x48.png" alt="앱 아이콘" className="w-12 h-12" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">앱으로 설치하기</h4>
          <p className="text-sm text-gray-600 mt-1">
            홈 화면에 추가하여 더 빠르게 이용하세요
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3 mt-4">
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-1 px-4 py-2 text-gray-600 text-sm"
        >
          나중에
        </button>
        <button
          onClick={install}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          설치하기
        </button>
      </div>
    </div>
  );
}
```

### 5. 캐싱 전략

#### 리소스별 캐싱 정책
```javascript
// 캐시 정책 정의
const cacheStrategies = {
  // 정적 리소스 (1년)
  static: {
    cacheName: 'static-v1',
    maxAge: 365 * 24 * 60 * 60,
    strategy: 'CacheFirst'
  },
  
  // API 응답 (5분)
  api: {
    cacheName: 'api-v1',
    maxAge: 5 * 60,
    strategy: 'NetworkFirst'
  },
  
  // 이미지 (30일)
  images: {
    cacheName: 'images-v1',
    maxAge: 30 * 24 * 60 * 60,
    strategy: 'CacheFirst',
    maxEntries: 50
  },
  
  // 오프라인 페이지
  offline: {
    cacheName: 'offline-v1',
    strategy: 'CacheOnly'
  }
};
```

#### 캐시 업데이트 전략
```javascript
// 버전 관리 및 캐시 업데이트
self.addEventListener('activate', async (event) => {
  const cacheWhitelist = [
    'static-v1',
    'api-v1', 
    'images-v1',
    'offline-v1'
  ];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

## 실시간 업데이트 UI/UX 전략

### 1. Supabase Realtime 활용 방안

#### 실시간 구독 설정
```typescript
// hooks/useRealtimeSubscription.ts
export function useRealtimeSubscription() {
  const supabase = createClientComponentClient();

  useEffect(() => {
    // 기기 상태 실시간 구독
    const machineChannel = supabase
      .channel('machine-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_machines'
        },
        (payload) => {
          handleMachineUpdate(payload);
        }
      )
      .subscribe();

    // 예약 상태 실시간 구독
    const reservationChannel = supabase
      .channel('reservation-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          handleReservationUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(machineChannel);
      supabase.removeChannel(reservationChannel);
    };
  }, [userId]);
}
```

### 2. 실시간 업데이트가 필요한 화면

#### 홈페이지
- **실시간 기기 현황**: 1분마다 자동 갱신 + 실시간 변경 감지
- **영업 상태**: 특별 영업시간 변경 시 즉시 반영

#### 예약하기
- **기기 가용성**: 다른 사용자의 예약/취소 시 즉시 반영
- **시간대 선택**: 실시간으로 예약 가능 시간 업데이트

#### 예약 목록
- **예약 상태 변경**: 관리자 승인/거절 시 즉시 알림
- **체크인 상태**: 체크인 완료 시 실시간 반영

#### 관리자 대시보드
- **실시간 통계**: 매출, 예약, 이용 현황 실시간 업데이트
- **예약 목록**: 새 예약 발생 시 즉시 표시

### 3. 업데이트 알림 UI 패턴

#### 토스트 알림
```tsx
// components/RealtimeToast.tsx
export function RealtimeToast({ update }: { update: RealtimeUpdate }) {
  const { type, message, action } = update;
  
  return (
    <Toast
      variant={type === 'success' ? 'success' : 'info'}
      duration={5000}
      action={action}
    >
      <div className="flex items-center space-x-2">
        {type === 'machine_available' && <CheckCircle className="w-5 h-5" />}
        {type === 'reservation_approved' && <ThumbsUp className="w-5 h-5" />}
        <span>{message}</span>
      </div>
    </Toast>
  );
}
```

#### 인라인 업데이트 표시
```tsx
// components/LiveUpdateIndicator.tsx
export function LiveUpdateIndicator({ lastUpdate }: { lastUpdate: Date }) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      {isUpdating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>업데이트 중...</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          <span>최근 업데이트: {formatDistanceToNow(lastUpdate, { locale: ko })}</span>
        </>
      )}
    </div>
  );
}
```

#### 실시간 배지
```tsx
// components/RealtimeBadge.tsx
export function RealtimeBadge({ count, type }: { count: number; type: 'new' | 'update' }) {
  if (count === 0) return null;
  
  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full",
      type === 'new' ? "bg-red-500 text-white" : "bg-blue-500 text-white",
      "animate-pulse"
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
```

### 4. 충돌 해결 UX

#### 낙관적 업데이트 with 롤백
```typescript
// hooks/useOptimisticUpdate.ts
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();
  
  const updateWithRollback = async (
    mutationFn: () => Promise<any>,
    optimisticUpdate: () => void,
    rollback: () => void
  ) => {
    // 낙관적 업데이트
    optimisticUpdate();
    
    try {
      await mutationFn();
      // 성공 시 서버 데이터로 동기화
      queryClient.invalidateQueries();
    } catch (error) {
      // 실패 시 롤백
      rollback();
      
      // 사용자에게 알림
      toast.error('변경사항을 저장할 수 없습니다. 다시 시도해주세요.');
    }
  };
  
  return { updateWithRollback };
}
```

#### 동시 편집 감지
```tsx
// components/ConflictResolver.tsx
export function ConflictResolver({ localData, serverData, onResolve }) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>변경 사항 충돌</DialogTitle>
          <DialogDescription>
            다른 사용자가 동시에 수정했습니다. 어떤 버전을 사용하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h4 className="font-semibold mb-2">내 변경사항</h4>
            <pre className="text-sm">{JSON.stringify(localData, null, 2)}</pre>
          </div>
          
          <div className="p-4 border rounded">
            <h4 className="font-semibold mb-2">서버 변경사항</h4>
            <pre className="text-sm">{JSON.stringify(serverData, null, 2)}</pre>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onResolve('server')}>
            서버 버전 사용
          </Button>
          <Button onClick={() => onResolve('local')}>
            내 버전 사용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 연결 상태 표시
```tsx
// components/ConnectionStatus.tsx
export function ConnectionStatus() {
  const { isConnected, reconnecting, lastSync } = useRealtimeConnection();
  
  return (
    <div className={cn(
      "fixed top-16 right-4 px-3 py-1 rounded-full text-sm flex items-center space-x-2",
      isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500",
        reconnecting && "animate-pulse"
      )} />
      <span>
        {isConnected 
          ? '실시간 연결됨' 
          : reconnecting 
            ? '재연결 중...' 
            : '연결 끊김'}
      </span>
      {lastSync && (
        <span className="text-xs opacity-70">
          ({formatDistanceToNow(lastSync, { locale: ko })} 전)
        </span>
      )}
    </div>
  );
}
```

### 5. 성능 최적화 전략

#### 디바운싱 및 스로틀링
```typescript
// 실시간 업데이트 디바운싱
const debouncedUpdate = useMemo(
  () => debounce((updates: Update[]) => {
    applyBatchUpdates(updates);
  }, 500),
  []
);

// 스크롤 이벤트 스로틀링
const throttledScroll = useMemo(
  () => throttle(() => {
    checkVisibleItems();
  }, 100),
  []
);
```

#### 선택적 구독
```typescript
// 보이는 영역만 구독
export function useVisibleSubscription(items: string[]) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(entry.target.id));
          } else {
            setVisibleItems((prev) => {
              const next = new Set(prev);
              next.delete(entry.target.id);
              return next;
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // 보이는 아이템만 실시간 구독
    const channels = Array.from(visibleItems).map(id => 
      subscribeToItem(id)
    );
    
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [visibleItems]);
}
```

## 요약

이 프론트엔드 명세서는 게임플라자 예약 시스템의 모든 UI/UX 관련 사항을 다룹니다:

1. **접근성**: WCAG 2.1 AA 기준을 완벽히 준수하여 모든 사용자가 편리하게 이용
2. **PWA**: 오프라인 지원, 푸시 알림, 홈 화면 추가로 네이티브 앱 수준의 경험 제공
3. **실시간성**: Supabase Realtime을 활용한 즉각적인 상태 동기화

모든 구현은 모바일 퍼스트 원칙을 따르며, 3G 환경에서도 빠른 성능을 보장합니다.