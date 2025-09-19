import { useEffect, useRef, useState, useCallback } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  isSwipingHorizontal: boolean;
  isSwipingVertical: boolean;
  velocity: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface TouchHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchZoomIn?: () => void;
  onPinchZoomOut?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface TouchOptions {
  swipeThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  preventDefault?: boolean;
}

/**
 * 고급 터치 제스처 훅
 */
export function useTouch(
  handlers: TouchHandlers = {},
  options: TouchOptions = {}
) {
  const {
    swipeThreshold = 50,
    velocityThreshold = 0.3,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventDefault = true,
  } = options;

  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwipingHorizontal: false,
    isSwipingVertical: false,
    velocity: 0,
    direction: null,
  });

  const touchStartTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const pinchDistance = useRef<number>(0);
  const isMultiTouch = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();

    const touch = e.touches[0];
    const now = Date.now();

    // 멀티터치 감지
    if (e.touches.length > 1) {
      isMultiTouch.current = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      pinchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      return;
    }

    isMultiTouch.current = false;
    touchStartTime.current = now;

    // 더블탭 감지
    if (now - lastTapTime.current < doubleTapDelay) {
      handlers.onDoubleTap?.();
      lastTapTime.current = 0;
      return;
    }

    lastTapTime.current = now;

    // 롱프레스 타이머 시작
    longPressTimer.current = setTimeout(() => {
      handlers.onLongPress?.();
    }, longPressDelay);

    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isSwipingHorizontal: false,
      isSwipingVertical: false,
      velocity: 0,
      direction: null,
    });
  }, [handlers, preventDefault, doubleTapDelay, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();

    // 핀치 줌 처리
    if (e.touches.length > 1 && isMultiTouch.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (pinchDistance.current > 0) {
        if (currentDistance > pinchDistance.current) {
          handlers.onPinchZoomIn?.();
        } else {
          handlers.onPinchZoomOut?.();
        }
        pinchDistance.current = currentDistance;
      }
      return;
    }

    if (isMultiTouch.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 롱프레스 취소
    if (longPressTimer.current && (absX > 10 || absY > 10)) {
      clearTimeout(longPressTimer.current);
    }

    // 스와이프 방향 결정
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // 속도 계산
    const timeDiff = Date.now() - touchStartTime.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / timeDiff;

    setTouchState({
      startX: touchState.startX,
      startY: touchState.startY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      isSwipingHorizontal: absX > absY,
      isSwipingVertical: absY > absX,
      velocity,
      direction,
    });
  }, [touchState.startX, touchState.startY, handlers, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();

    // 롱프레스 타이머 정리
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // 멀티터치 종료
    if (isMultiTouch.current) {
      isMultiTouch.current = false;
      pinchDistance.current = 0;
      return;
    }

    const { deltaX, deltaY, velocity, direction } = touchState;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 스와이프 임계값 확인
    if (velocity > velocityThreshold) {
      if (absX > swipeThreshold && absX > absY) {
        if (direction === 'left') {
          handlers.onSwipeLeft?.();
        } else if (direction === 'right') {
          handlers.onSwipeRight?.();
        }
      } else if (absY > swipeThreshold && absY > absX) {
        if (direction === 'up') {
          handlers.onSwipeUp?.();
        } else if (direction === 'down') {
          handlers.onSwipeDown?.();
        }
      }
    }

    // 상태 초기화
    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      isSwipingHorizontal: false,
      isSwipingVertical: false,
      velocity: 0,
      direction: null,
    });
  }, [touchState, handlers, swipeThreshold, velocityThreshold, preventDefault]);

  return {
    touchState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * 스와이프 가능한 컨테이너 훅
 */
export function useSwipeable(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options?: Omit<TouchOptions, 'preventDefault'>
) {
  const elementRef = useRef<HTMLElement>(null);

  const { handlers } = useTouch(
    { onSwipeLeft, onSwipeRight },
    { ...options, preventDefault: false }
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handlers.onTouchStart, { passive: false });
    element.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
    element.addEventListener('touchend', handlers.onTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handlers.onTouchStart);
      element.removeEventListener('touchmove', handlers.onTouchMove);
      element.removeEventListener('touchend', handlers.onTouchEnd);
    };
  }, [handlers]);

  return elementRef;
}

/**
 * 풀 투 리프레시 훅
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistance = useRef(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      pullDistance.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (pullDistance.current === 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - pullDistance.current;

    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      setIsPulling(true);

      if (diff > threshold) {
        document.body.style.transform = `translateY(${Math.min(diff * 0.5, 150)}px)`;
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.current === 0) return;

    const element = document.body;
    const transform = element.style.transform;
    const translateY = transform ? parseFloat(transform.replace(/[^\d.]/g, '')) : 0;

    if (translateY > threshold) {
      setIsRefreshing(true);
      element.style.transform = `translateY(${threshold}px)`;

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    element.style.transform = '';
    setIsPulling(false);
    pullDistance.current = 0;
  }, [threshold, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isPulling, isRefreshing };
}