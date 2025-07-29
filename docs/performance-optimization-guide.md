# 🚀 게임플라자 성능 최적화 가이드

> 이 가이드는 코드 분석 리포트에서 발견된 성능 이슈를 해결하기 위한 실무 가이드입니다.

## 📋 목차
- [개요](#개요)
- [번들 크기 최적화](#번들-크기-최적화)
- [코드 스플리팅](#코드-스플리팅)
- [React 성능 최적화](#react-성능-최적화)
- [이미지 최적화](#이미지-최적화)
- [실시간 구독 메모리 누수 해결](#실시간-구독-메모리-누수-해결)

## 개요

현재 게임플라자 프로젝트의 주요 성능 이슈:
- 초기 번들 크기 과다 (약 2MB)
- 모바일 환경에서 느린 초기 로딩
- 불필요한 리렌더링
- 메모리 누수 위험

목표: **초기 로딩 시간 40% 단축** (3초 → 1.8초)

## 번들 크기 최적화

### 1. 불필요한 라이브러리 제거

#### 현재 상황
```json
// package.json
{
  "dependencies": {
    "firebase": "11.10.0",        // 사용처 불명
    "firebase-admin": "13.4.0",   // 사용처 불명
    "@dnd-kit/core": "^6.1.0",    // 드래그앤드롭 미사용
    "@dnd-kit/sortable": "^8.0.0" // 드래그앤드롭 미사용
  }
}
```

#### 해결 방법
```bash
# 1. 사용처 확인
grep -r "firebase" --include="*.ts" --include="*.tsx" . | grep -v node_modules

# 2. 사용하지 않는다면 제거
npm uninstall firebase firebase-admin @dnd-kit/core @dnd-kit/sortable

# 3. 번들 크기 확인
npm run build
```

#### 예상 효과
- 번들 크기 약 500KB 감소
- 초기 로딩 시간 0.3초 단축

### 2. Tree Shaking 개선

#### 현재 상황
```typescript
// ❌ 전체 라이브러리 import
import * as Recharts from 'recharts';
import { motion } from 'framer-motion';
```

#### 해결 방법
```typescript
// ✅ 필요한 것만 import
import { LineChart, Line, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion/dist/framer-motion';
```

## 코드 스플리팅

### 1. 관리자 페이지 동적 로딩

#### 현재 상황
```typescript
// app/admin/layout.tsx
import AdminDashboard from './dashboard/page';
import AdminSettings from './settings/page';
```

#### 해결 방법
```typescript
// app/admin/layout.tsx
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('./dashboard/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false // 관리자 페이지는 SSR 불필요
});

const AdminSettings = dynamic(() => import('./settings/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### 2. 차트 컴포넌트 Lazy Loading

#### 현재 상황
```typescript
// app/components/charts/AnalyticsChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsChart({ data }) {
  return <LineChart data={data}>...</LineChart>;
}
```

#### 해결 방법
```typescript
// app/components/charts/AnalyticsChart.tsx
import dynamic from 'next/dynamic';

const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);

// 다른 Recharts 컴포넌트도 동일하게 처리
```

### 3. GoogleMap 컴포넌트 최적화

#### 현재 상황
```typescript
// app/components/GoogleMap.tsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
  document.body.appendChild(script);
}, []);
```

#### 해결 방법
```typescript
// app/components/GoogleMap.tsx
import { Wrapper } from '@googlemaps/react-wrapper';

const GoogleMapWrapper = dynamic(
  () => import('./GoogleMapContent'),
  { 
    loading: () => <div className="h-[400px] bg-gray-100 animate-pulse" />,
    ssr: false 
  }
);

export default function GoogleMap() {
  return (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}>
      <GoogleMapWrapper />
    </Wrapper>
  );
}
```

## React 성능 최적화

### 1. React.memo 적용

#### 현재 상황
```typescript
// app/components/DeviceCard.tsx
export default function DeviceCard({ device, onSelect }) {
  return <div onClick={() => onSelect(device)}>...</div>;
}
```

#### 해결 방법
```typescript
// app/components/DeviceCard.tsx
import { memo } from 'react';

const DeviceCard = memo(function DeviceCard({ device, onSelect }) {
  return <div onClick={() => onSelect(device)}>...</div>;
}, (prevProps, nextProps) => {
  // 커스텀 비교 로직
  return prevProps.device.id === nextProps.device.id &&
         prevProps.device.status === nextProps.device.status;
});

export default DeviceCard;
```

### 2. useMemo/useCallback 활용

#### 현재 상황
```typescript
// app/reservations/page.tsx
function ReservationsPage() {
  const filteredReservations = reservations.filter(r => 
    r.date === selectedDate && r.status === 'active'
  );
  
  const handleSelect = (id) => {
    setSelected(id);
  };
}
```

#### 해결 방법
```typescript
// app/reservations/page.tsx
import { useMemo, useCallback } from 'react';

function ReservationsPage() {
  const filteredReservations = useMemo(() => 
    reservations.filter(r => 
      r.date === selectedDate && r.status === 'active'
    ),
    [reservations, selectedDate]
  );
  
  const handleSelect = useCallback((id) => {
    setSelected(id);
  }, []);
}
```

## 이미지 최적화

### 1. Next.js Image 컴포넌트 활용

#### 현재 상황
```tsx
// app/components/DeviceImage.tsx
<img src="/devices/ps5.png" alt="PS5" className="w-full h-auto" />
```

#### 해결 방법
```tsx
// app/components/DeviceImage.tsx
import Image from 'next/image';

<Image
  src="/devices/ps5.png"
  alt="PS5"
  width={300}
  height={200}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  priority={isAboveFold} // 스크롤 없이 보이는 이미지만
/>
```

### 2. 이미지 포맷 최적화

```bash
# WebP 변환 스크립트
for file in public/images/*.{jpg,png}; do
  cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

## 실시간 구독 메모리 누수 해결

### 1. useRef 패턴 적용

#### 현재 상황
```typescript
// lib/hooks/useReservationRealtime.ts
useEffect(() => {
  const channel = supabase.channel('reservations')
    .on('INSERT', onInsert)
    .on('UPDATE', onUpdate)
    .on('DELETE', onDelete)
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [onInsert, onUpdate, onDelete]); // 콜백이 변경될 때마다 재구독
```

#### 해결 방법
```typescript
// lib/hooks/useReservationRealtime.ts
import { useRef, useEffect } from 'react';

const onInsertRef = useRef(onInsert);
const onUpdateRef = useRef(onUpdate);
const onDeleteRef = useRef(onDelete);

// Ref 업데이트
useEffect(() => {
  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;
});

// 구독은 한 번만
useEffect(() => {
  const channel = supabase.channel('reservations')
    .on('INSERT', (payload) => onInsertRef.current(payload))
    .on('UPDATE', (payload) => onUpdateRef.current(payload))
    .on('DELETE', (payload) => onDeleteRef.current(payload))
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []); // 의존성 배열 비움
```

### 2. 전역 구독 관리자

```typescript
// lib/realtime/RealtimeManager.ts
class RealtimeManager {
  private static instance: RealtimeManager;
  private subscriptions = new Map<string, RealtimeChannel>();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new RealtimeManager();
    }
    return this.instance;
  }
  
  subscribe(key: string, table: string, callbacks: RealtimeCallbacks) {
    // 이미 구독 중이면 기존 채널 반환
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }
    
    const channel = supabase.channel(key)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callbacks.onChange
      )
      .subscribe();
      
    this.subscriptions.set(key, channel);
    return channel;
  }
  
  unsubscribe(key: string) {
    const channel = this.subscriptions.get(key);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(key);
    }
  }
}

// 사용 예시
const manager = RealtimeManager.getInstance();
manager.subscribe('reservations', 'reservations', {
  onChange: (payload) => handleChange(payload)
});
```

## 📊 성능 측정 방법

### 1. Lighthouse 실행
```bash
# CI/CD에서 자동화
npm run build
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

### 2. 번들 분석
```bash
# Next.js Bundle Analyzer 설치
npm install --save-dev @next/bundle-analyzer

# next.config.js 수정
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // 기존 설정
});

# 분석 실행
ANALYZE=true npm run build
```

### 3. 성능 모니터링 코드
```typescript
// lib/performance/monitor.ts
export function measurePageLoad() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
      
      // 분석 서비스로 전송
      analytics.track('page_load_time', {
        duration: perfData.loadEventEnd - perfData.fetchStart,
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domComplete - perfData.domInteractive,
      });
    });
  }
}
```

## ✅ 체크리스트

### 즉시 적용 가능 (1일)
- [ ] 불필요한 라이브러리 제거
- [ ] 관리자 페이지 동적 로딩
- [ ] React.memo 주요 컴포넌트 적용

### 단기 개선 (1주)
- [ ] 차트 컴포넌트 lazy loading
- [ ] 이미지 최적화
- [ ] 실시간 구독 메모리 누수 수정

### 중기 개선 (2주)
- [ ] 전체 코드 스플리팅 적용
- [ ] framer-motion → CSS 애니메이션 전환
- [ ] 서버 컴포넌트 활용 확대

## 🎯 예상 결과

모든 최적화 적용 시:
- **초기 번들 크기**: 2MB → 1.4MB (30% 감소)
- **초기 로딩 시간**: 3초 → 1.8초 (40% 개선)
- **LCP (Largest Contentful Paint)**: 2.5초 → 1.5초
- **TTI (Time to Interactive)**: 3.5초 → 2.0초

---

💡 **팁**: 각 최적화를 적용한 후 Lighthouse를 실행하여 개선 효과를 측정하세요.

⚠️ **주의**: 코드 스플리팅 적용 시 반드시 로딩 상태를 제공하여 사용자 경험을 해치지 않도록 주의하세요.