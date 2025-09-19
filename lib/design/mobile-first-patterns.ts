/**
 * 모바일 우선 설계 패턴 라이브러리
 *
 * 원칙:
 * 1. 모바일이 기본, 데스크톱이 확장
 * 2. 터치 인터페이스 우선
 * 3. 성능 최적화 내장
 * 4. 접근성 기본 포함
 */

/**
 * 반응형 브레이크포인트 (Mobile-First)
 */
export const breakpoints = {
  // 모바일이 기본 (min-width 사용)
  sm: '640px',   // 작은 태블릿
  md: '768px',   // 태블릿
  lg: '1024px',  // 작은 데스크톱
  xl: '1280px',  // 데스크톱
  '2xl': '1536px', // 큰 데스크톱
} as const;

/**
 * 터치 타겟 크기 (WCAG 2.5.5 기준)
 */
export const touchTargets = {
  minimum: 44,    // 최소 44x44px
  comfortable: 48, // 편안한 크기
  large: 56,       // 큰 버튼
} as const;

/**
 * 간격 시스템 (모바일 최적화)
 */
export const spacing = {
  // 모바일 기본 간격 (작은 화면)
  mobile: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
  },
  // 태블릿/데스크톱 확장 간격
  desktop: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
} as const;

/**
 * 타이포그래피 스케일 (모바일 우선)
 */
export const typography = {
  // 모바일 폰트 크기
  mobile: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.75rem', // 28px
    '4xl': '2rem',   // 32px
  },
  // 데스크톱 폰트 크기
  desktop: {
    xs: '0.875rem',  // 14px
    sm: '1rem',      // 16px
    base: '1.125rem', // 18px
    lg: '1.25rem',   // 20px
    xl: '1.5rem',    // 24px
    '2xl': '1.875rem', // 30px
    '3xl': '2.25rem', // 36px
    '4xl': '3rem',   // 48px
  },
} as const;

/**
 * 레이아웃 패턴
 */
export const layoutPatterns = {
  // 모바일 스택 레이아웃
  mobileStack: `
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  `,

  // 반응형 그리드
  responsiveGrid: `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;

    @media (min-width: ${breakpoints.md}) {
      gap: 1.5rem;
    }
  `,

  // 카드 컨테이너
  cardContainer: `
    background: var(--card-bg);
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    @media (min-width: ${breakpoints.md}) {
      padding: 1.5rem;
    }
  `,

  // 바텀 시트 (모바일)
  bottomSheet: `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 1rem 1rem 0 0;
    padding: 1.5rem;
    box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(100%);
    transition: transform 0.3s ease-out;

    &.open {
      transform: translateY(0);
    }

    @media (min-width: ${breakpoints.md}) {
      position: relative;
      transform: none;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  `,
} as const;

/**
 * 인터랙션 패턴
 */
export const interactionPatterns = {
  // 터치 피드백
  touchFeedback: `
    transition: all 0.2s ease;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  `,

  // 스와이프 가능
  swipeable: `
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      scroll-snap-align: start;
      flex-shrink: 0;
    }
  `,

  // 드래그 가능
  draggable: `
    cursor: grab;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  `,
} as const;

/**
 * 성능 최적화 패턴
 */
export const performancePatterns = {
  // GPU 가속
  gpuAccelerated: `
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  `,

  // 이미지 최적화
  optimizedImage: `
    object-fit: cover;
    loading: lazy;
    decoding: async;
  `,

  // 가상 스크롤
  virtualScroll: `
    contain: layout style paint;
    content-visibility: auto;
  `,
} as const;

/**
 * 유틸리티 클래스 생성기
 */
export function generateUtilityClasses() {
  return {
    // 터치 타겟 크기
    '.touch-target-min': {
      minWidth: `${touchTargets.minimum}px`,
      minHeight: `${touchTargets.minimum}px`,
    },
    '.touch-target': {
      minWidth: `${touchTargets.comfortable}px`,
      minHeight: `${touchTargets.comfortable}px`,
    },
    '.touch-target-lg': {
      minWidth: `${touchTargets.large}px`,
      minHeight: `${touchTargets.large}px`,
    },

    // 모바일 숨김/표시
    '.mobile-only': {
      [`@media (min-width: ${breakpoints.md})`]: {
        display: 'none',
      },
    },
    '.desktop-only': {
      display: 'none',
      [`@media (min-width: ${breakpoints.md})`]: {
        display: 'block',
      },
    },

    // 안전 영역
    '.safe-area-inset': {
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    },
  };
}

/**
 * 반응형 값 헬퍼
 */
export function responsive<T>(mobile: T, tablet?: T, desktop?: T): string {
  let css = `${mobile}`;

  if (tablet) {
    css += `
      @media (min-width: ${breakpoints.md}) {
        ${tablet}
      }
    `;
  }

  if (desktop) {
    css += `
      @media (min-width: ${breakpoints.lg}) {
        ${desktop}
      }
    `;
  }

  return css;
}

/**
 * 클램프 헬퍼 (반응형 크기)
 */
export function clamp(min: string, preferred: string, max: string): string {
  return `clamp(${min}, ${preferred}, ${max})`;
}

/**
 * 컨테이너 쿼리 헬퍼
 */
export function containerQuery(name: string, minWidth: string, styles: string): string {
  return `
    @container ${name} (min-width: ${minWidth}) {
      ${styles}
    }
  `;
}

/**
 * 다크모드 헬퍼
 */
export function darkMode(styles: string): string {
  return `
    @media (prefers-color-scheme: dark) {
      ${styles}
    }

    [data-theme="dark"] & {
      ${styles}
    }
  `;
}

/**
 * 모션 감소 헬퍼
 */
export function reducedMotion(styles: string): string {
  return `
    @media (prefers-reduced-motion: reduce) {
      ${styles}
    }
  `;
}

/**
 * 고대비 모드 헬퍼
 */
export function highContrast(styles: string): string {
  return `
    @media (prefers-contrast: high) {
      ${styles}
    }

    [data-contrast="high"] & {
      ${styles}
    }
  `;
}