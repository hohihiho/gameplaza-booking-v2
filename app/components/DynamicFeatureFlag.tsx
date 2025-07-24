// Feature Flag 동적 로드 컴포넌트
'use client';

import dynamic from 'next/dynamic';

// 동적 임포트로 번들 사이즈 최적화
const FeatureFlagToggle = dynamic(
  () => import('./FeatureFlagToggle'),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function DynamicFeatureFlag() {
  // 개발 환경에서만 렌더링
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return <FeatureFlagToggle />;
}