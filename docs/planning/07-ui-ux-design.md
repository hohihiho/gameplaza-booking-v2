# 7. UI/UX 디자인

## 7.1 디자인 원칙

### 7.1.1 모바일 퍼스트
- **터치 최적화**:
  - 최소 터치 영역 44x44px
  - 버튼 간격 8px 이상
  - 스와이프 제스처 지원

- **한손 조작**:
  - 중요 기능 하단 배치
  - 엄지손가락 도달 범위 내 버튼
  - 팔로팅 액션 버튼

### 7.1.2 일관성
- **디자인 시스템**:
  - 통일된 색상 팔레트
  - 일관된 타이포그래피
  - 표준화된 컴포넌트

### 7.1.3 접근성
- **WCAG 2.1 AA 준수**:
  - 명도 대비 4.5:1 이상
  - 키보드 네비게이션
  - 스크린 리더 호환

## 7.2 색상 시스템

### 7.2.1 주요 색상
```css
:root {
  /* Primary Colors */
  --primary-500: #3B82F6;  /* 메인 블루 */
  --primary-600: #2563EB;  /* 호버/포커스 */
  --primary-400: #60A5FA;  /* 라이트 */
  
  /* Secondary Colors */
  --secondary-500: #8B5CF6;  /* 보라색 */
  --secondary-600: #7C3AED;
  
  /* Status Colors */
  --success: #10B981;     /* 성공/사용가능 */
  --warning: #F59E0B;     /* 경고/대기 */
  --error: #EF4444;       /* 오류/사용중 */
  --info: #3B82F6;        /* 정보 */
  
  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
}
```

### 7.2.2 다크모드
```css
[data-theme="dark"] {
  --bg-primary: #111827;
  --bg-secondary: #1F2937;
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
}
```

### 7.2.3 기기 상태 색상
- **사용 가능**: #10B981 (초록)
- **사용 중**: #EF4444 (빨강)
- **예약됨**: #F59E0B (노랑)
- **점검 중**: #6B7280 (회색)
- **청소 중**: #3B82F6 (파랑)

## 7.3 타이포그래피

### 7.3.1 폰트 시스템
```css
:root {
  /* Font Families */
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 7.3.2 텍스트 계층 구조
- **페이지 제목**: 2xl, bold
- **섹션 제목**: xl, semibold
- **카드 제목**: lg, medium
- **본문**: base, normal
- **캐픽션**: sm, normal
- **레이블**: xs, medium

## 7.4 컴포넌트 디자인

### 7.4.1 버튼
```tsx
// Primary Button
<button className="
  px-6 py-3 
  bg-primary-500 hover:bg-primary-600 
  text-white font-medium 
  rounded-xl 
  transition-all duration-200
  active:scale-95
  disabled:opacity-50 disabled:cursor-not-allowed
">
  예약하기
</button>

// Secondary Button
<button className="
  px-6 py-3 
  bg-gray-100 hover:bg-gray-200 
  text-gray-700 font-medium 
  rounded-xl 
  transition-all duration-200
">
  취소
</button>
```

### 7.4.2 카드
```tsx
// Device Card
<div className="
  bg-white 
  rounded-2xl 
  shadow-sm hover:shadow-lg 
  transition-shadow duration-300
  p-4
  border border-gray-100
">
  <div className="aspect-video bg-gray-100 rounded-lg mb-3" />
  <h3 className="font-semibold text-lg">PlayStation 5</h3>
  <p className="text-sm text-gray-500">사용 가능</p>
</div>
```

### 7.4.3 입력 필드
```tsx
// Text Input
<input 
  type="text"
  className="
    w-full px-4 py-3
    border border-gray-300
    rounded-xl
    focus:ring-2 focus:ring-primary-500 focus:border-transparent
    placeholder-gray-400
    transition-all duration-200
  "
  placeholder="예약자명"
/>
```

### 7.4.4 모달
```tsx
// Bottom Sheet Modal (Mobile)
<div className="
  fixed bottom-0 left-0 right-0
  bg-white
  rounded-t-3xl
  shadow-2xl
  p-6 pb-safe
  max-h-[90vh]
  overflow-y-auto
  animate-slide-up
">
  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
  {/* Modal Content */}
</div>
```

## 7.5 레이아웃

### 7.5.1 모바일 레이아웃
```tsx
// Mobile Layout Structure
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <header className="fixed top-0 w-full bg-white shadow-sm z-50">
    {/* ... */}
  </header>
  
  {/* Main Content */}
  <main className="pt-16 pb-20">
    {/* ... */}
  </main>
  
  {/* Bottom Navigation */}
  <nav className="fixed bottom-0 w-full bg-white border-t">
    {/* ... */}
  </nav>
</div>
```

### 7.5.2 그리드 시스템
```css
/* 4-Point Grid System */
.container {
  padding: 16px;  /* 4 * 4 */
  gap: 12px;      /* 4 * 3 */
}

/* Responsive Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
```

### 7.5.3 스페이싱
```css
:root {
  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

## 7.6 애니메이션

### 7.6.1 트랜지션
```css
/* Smooth Transitions */
.transition-default {
  transition: all 200ms ease-in-out;
}

.transition-fast {
  transition: all 150ms ease-in-out;
}

.transition-slow {
  transition: all 300ms ease-in-out;
}
```

### 7.6.2 마이크로 인터랙션
```css
/* Button Press */
.btn:active {
  transform: scale(0.95);
}

/* Card Hover */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

/* Skeleton Loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 7.6.3 페이지 트랜지션
```css
/* Slide Animations */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 300ms ease-out;
}

.animate-fade-in {
  animation: fadeIn 200ms ease-in;
}
```

## 7.7 아이콘 시스템

### 7.7.1 아이콘 세트
- **Heroicons**: 기본 UI 아이콘
- **Custom Icons**: 기기 전용 아이콘
- **Size Scale**: 16px, 20px, 24px, 32px

### 7.7.2 기기 아이콘
- PlayStation: SVG 커스텀 아이콘
- Nintendo Switch: SVG 커스텀 아이콘
- Racing Simulator: SVG 커스텀 아이콘
- VR: SVG 커스텀 아이콘

## 7.8 반응형 디자인

### 7.8.1 브레이크포인트
```css
/* Breakpoints */
@media (min-width: 640px) {  /* sm */
  .container { max-width: 640px; }
}

@media (min-width: 768px) {  /* md */
  .container { max-width: 768px; }
}

@media (min-width: 1024px) { /* lg */
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) { /* xl */
  .container { max-width: 1280px; }
}
```

### 7.8.2 모바일 우선 설계
```css
/* Mobile First Approach */
.component {
  /* Mobile styles (default) */
  padding: 16px;
  font-size: 14px;
}

@media (min-width: 768px) {
  .component {
    /* Tablet and up */
    padding: 24px;
    font-size: 16px;
  }
}
```

## 7.9 성능 최적화

### 7.9.1 이미지 최적화
- **포맷**: WebP, AVIF 우선
- **Lazy Loading**: Intersection Observer
- **반응형 이미지**: srcset 활용
- **플레이스홀더**: 블러 처리

### 7.9.2 CSS 최적화
- **Critical CSS**: 인라인 처리
- **CSS Modules**: 컴포넌트 단위
- **Tailwind CSS**: Utility-first
- **PurgeCSS**: 미사용 CSS 제거

### 7.9.3 자바스크립트 최적화
- **Code Splitting**: 라우트 기반
- **Tree Shaking**: 미사용 코드 제거
- **번들 최적화**: Webpack/Vite
- **비동기 로딩**: Dynamic import

## 7.10 접근성 체크리스트

### 7.10.1 시각적 접근성
- [ ] 색상 대비 4.5:1 이상
- [ ] 포커스 인디케이터 명확
- [ ] 에러 메시지 색상 구분
- [ ] 다크모드 지원

### 7.10.2 키보드 접근성
- [ ] Tab 네비게이션
- [ ] Enter/Space 키 동작
- [ ] Escape 키 닫기
- [ ] 단축키 지원

### 7.10.3 스크린 리더
- [ ] ARIA 레이블
- [ ] ARIA 역할
- [ ] 대체 텍스트
- [ ] 의미 있는 HTML 태그