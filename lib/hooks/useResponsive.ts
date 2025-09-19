/**
 * 반응형 디자인 훅
 * 디바이스별 최적화된 UI/UX 제공
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { throttle, debounce } from 'lodash';

// 브레이크포인트 정의
export const breakpoints = {
  xs: 320,    // 소형 모바일
  sm: 640,    // 모바일
  md: 768,    // 태블릿
  lg: 1024,   // 데스크탑
  xl: 1280,   // 대형 데스크탑
  '2xl': 1536 // 초대형 스크린
} as const;

// 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 화면 방향
export type Orientation = 'portrait' | 'landscape';

// 반응형 상태 인터페이스
export interface ResponsiveState {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isRetina: boolean;
  breakpoint: keyof typeof breakpoints;
  is: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    '2xl': boolean;
  };
  up: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    '2xl': boolean;
  };
  down: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    '2xl': boolean;
  };
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => boolean;
  rem: (px: number) => string;
  vw: (px: number, base?: number) => string;
  vh: (px: number, base?: number) => string;
}

/**
 * 반응형 디자인 메인 훅
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // 크기 변경 감지 (throttle 적용)
  useEffect(() => {
    const handleResize = throttle(() => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, []);

  // 디바이스 타입 결정
  const deviceType = useMemo((): DeviceType => {
    if (dimensions.width < breakpoints.md) return 'mobile';
    if (dimensions.width < breakpoints.lg) return 'tablet';
    return 'desktop';
  }, [dimensions.width]);

  // 화면 방향 결정
  const orientation = useMemo((): Orientation => {
    return dimensions.width > dimensions.height ? 'landscape' : 'portrait';
  }, [dimensions]);

  // 터치 디바이스 감지
  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           (navigator as any).msMaxTouchPoints > 0;
  }, []);

  // 레티나 디스플레이 감지
  const isRetina = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.devicePixelRatio > 1;
  }, []);

  // 현재 브레이크포인트 결정
  const breakpoint = useMemo((): keyof typeof breakpoints => {
    const width = dimensions.width;
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }, [dimensions.width]);

  // 브레이크포인트 체크 함수들
  const is = useMemo(() => ({
    xs: breakpoint === 'xs',
    sm: breakpoint === 'sm',
    md: breakpoint === 'md',
    lg: breakpoint === 'lg',
    xl: breakpoint === 'xl',
    '2xl': breakpoint === '2xl'
  }), [breakpoint]);

  const up = useMemo(() => ({
    xs: dimensions.width >= breakpoints.xs,
    sm: dimensions.width >= breakpoints.sm,
    md: dimensions.width >= breakpoints.md,
    lg: dimensions.width >= breakpoints.lg,
    xl: dimensions.width >= breakpoints.xl,
    '2xl': dimensions.width >= breakpoints['2xl']
  }), [dimensions.width]);

  const down = useMemo(() => ({
    xs: dimensions.width < breakpoints.xs,
    sm: dimensions.width < breakpoints.sm,
    md: dimensions.width < breakpoints.md,
    lg: dimensions.width < breakpoints.lg,
    xl: dimensions.width < breakpoints.xl,
    '2xl': dimensions.width < breakpoints['2xl']
  }), [dimensions.width]);

  // 범위 체크 함수
  const between = useCallback((min: keyof typeof breakpoints, max: keyof typeof breakpoints) => {
    return dimensions.width >= breakpoints[min] && dimensions.width < breakpoints[max];
  }, [dimensions.width]);

  // 단위 변환 함수들
  const rem = useCallback((px: number) => {
    return `${px / 16}rem`;
  }, []);

  const vw = useCallback((px: number, base = dimensions.width) => {
    return `${(px / base) * 100}vw`;
  }, [dimensions.width]);

  const vh = useCallback((px: number, base = dimensions.height) => {
    return `${(px / base) * 100}vh`;
  }, [dimensions.height]);

  return {
    width: dimensions.width,
    height: dimensions.height,
    deviceType,
    orientation,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouch,
    isRetina,
    breakpoint,
    is,
    up,
    down,
    between,
    rem,
    vw,
    vh
  };
}

/**
 * 미디어 쿼리 훅
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * 뷰포트 크기 훅
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    scrollX: typeof window !== 'undefined' ? window.scrollX : 0
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY,
        scrollX: window.scrollX
      });
    }, 150);

    const handleScroll = throttle(() => {
      setViewport(prev => ({
        ...prev,
        scrollY: window.scrollY,
        scrollX: window.scrollX
      }));
    }, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      handleResize.cancel();
      handleScroll.cancel();
    };
  }, []);

  return viewport;
}

/**
 * 화면 방향 변경 감지 훅
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * 디바이스 감지 훅
 */
export function useDevice() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isAndroid: false,
    isIOS: false,
    isWindows: false,
    isMac: false,
    isLinux: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    isSamsung: false,
    isKakao: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    setDevice({
      // 디바이스 타입
      isMobile: /android|iphone|ipod|windows phone/.test(userAgent),
      isTablet: /ipad|android(?!.*mobile)/.test(userAgent),
      isDesktop: !/android|iphone|ipad|ipod|windows phone/.test(userAgent),

      // OS
      isAndroid: /android/.test(userAgent),
      isIOS: /iphone|ipad|ipod/.test(userAgent),
      isWindows: /win/.test(platform),
      isMac: /mac/.test(platform),
      isLinux: /linux/.test(platform),

      // 브라우저
      isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
      isChrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
      isFirefox: /firefox/.test(userAgent),
      isEdge: /edge/.test(userAgent),
      isSamsung: /samsungbrowser/.test(userAgent),
      isKakao: /kakaotalk/.test(userAgent)
    });
  }, []);

  return device;
}

/**
 * 컨테이너 쿼리 훅 (Container Query)
 */
export function useContainerQuery<T extends HTMLElement = HTMLDivElement>() {
  const [containerRef, setContainerRef] = useState<T | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef);

    return () => {
      resizeObserver.unobserve(containerRef);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return {
    ref: setContainerRef,
    width: containerSize.width,
    height: containerSize.height,
    isSmall: containerSize.width < 400,
    isMedium: containerSize.width >= 400 && containerSize.width < 600,
    isLarge: containerSize.width >= 600
  };
}

/**
 * 안전 영역 (Safe Area) 훅 - iOS 노치/홈 인디케이터 대응
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computedStyle = getComputedStyle(document.documentElement);

    const updateSafeArea = () => {
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
      });
    };

    // CSS 환경 변수 설정
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');

    updateSafeArea();

    window.addEventListener('resize', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * 스크롤 잠금 훅 - 모달 등에서 배경 스크롤 방지
 */
export function useScrollLock(isLocked = false) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}

/**
 * 화면 크기별 값 선택 훅
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  base?: T;
}): T | undefined {
  const { breakpoint } = useResponsive();

  return useMemo(() => {
    // 현재 브레이크포인트부터 작은 순서로 검색
    const breakpointOrder: (keyof typeof breakpoints)[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }

    return values.base;
  }, [breakpoint, values]);
}

/**
 * 이미지 최적화 훅 - 반응형 이미지 소스 관리
 */
export function useResponsiveImage(sources: {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  base: string;
}) {
  const { breakpoint, isRetina } = useResponsive();

  return useMemo(() => {
    let src = sources[breakpoint] || sources.base;

    // 레티나 디스플레이용 이미지 처리
    if (isRetina && src.includes('.')) {
      const parts = src.split('.');
      const ext = parts.pop();
      src = `${parts.join('.')}@2x.${ext}`;
    }

    return src;
  }, [breakpoint, isRetina, sources]);
}