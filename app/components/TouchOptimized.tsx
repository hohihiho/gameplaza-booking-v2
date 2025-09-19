'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useSwipeable, usePullToRefresh } from '@/lib/hooks/useTouch';

interface TouchOptimizedButtonProps {
  onClick: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  className?: string;
  haptic?: boolean;
  ripple?: boolean;
}

/**
 * 터치 최적화된 버튼 컴포넌트
 */
export function TouchOptimizedButton({
  onClick,
  onLongPress,
  children,
  className = '',
  haptic = true,
  ripple = true,
}: TouchOptimizedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);

    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      setRipplePosition({ x, y });
      setShowRipple(true);
    }

    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    setTimeout(() => setShowRipple(false), 300);
  };

  return (
    <button
      className={`
        relative overflow-hidden touch-manipulation
        transition-all duration-150 select-none
        ${isPressed ? 'scale-95 opacity-90' : 'scale-100 opacity-100'}
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {children}
      {ripple && showRipple && (
        <span
          className="absolute pointer-events-none animate-ripple"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            width: '2px',
            height: '2px',
            backgroundColor: 'currentColor',
            opacity: 0.3,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out',
          }}
        />
      )}
    </button>
  );
}

interface SwipeableCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

/**
 * 스와이프 가능한 카드 컴포넌트
 */
export function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  children,
  className = '',
  threshold = 100,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeRef = useSwipeable(
    () => {
      setOffset(0);
      onSwipeLeft?.();
    },
    () => {
      setOffset(0);
      onSwipeRight?.();
    },
    { swipeThreshold: threshold }
  );

  return (
    <div
      ref={swipeRef as any}
      className={`
        transition-transform duration-300
        ${isDragging ? '' : 'ease-out'}
        ${className}
      `}
      style={{
        transform: `translateX(${offset}px)`,
        touchAction: 'pan-y',
      }}
      onTouchStart={() => setIsDragging(true)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        const startX = touch.clientX;
        const moveHandler = (e: TouchEvent) => {
          const currentX = e.touches[0].clientX;
          setOffset(currentX - startX);
        };
        document.addEventListener('touchmove', moveHandler);
        document.addEventListener('touchend', () => {
          document.removeEventListener('touchmove', moveHandler);
          setIsDragging(false);
          setOffset(0);
        }, { once: true });
      }}
    >
      {children}
    </div>
  );
}

interface PullToRefreshContainerProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

/**
 * Pull-to-Refresh 컨테이너
 */
export function PullToRefreshContainer({
  onRefresh,
  children,
  className = '',
}: PullToRefreshContainerProps) {
  const { isPulling, isRefreshing } = usePullToRefresh(onRefresh);

  return (
    <div className={`relative ${className}`}>
      {(isPulling || isRefreshing) && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-4 z-50">
          <div className={`
            w-8 h-8 border-3 border-primary border-t-transparent
            rounded-full animate-spin
            ${isRefreshing ? 'opacity-100' : 'opacity-50'}
          `} />
        </div>
      )}
      <div className={isPulling ? 'opacity-75' : ''}>
        {children}
      </div>
    </div>
  );
}

interface TouchScrollContainerProps {
  children: ReactNode;
  className?: string;
  horizontal?: boolean;
  snapToGrid?: boolean;
  momentum?: boolean;
}

/**
 * 터치 스크롤 최적화 컨테이너
 */
export function TouchScrollContainer({
  children,
  className = '',
  horizontal = false,
  snapToGrid = false,
  momentum = true,
}: TouchScrollContainerProps) {
  return (
    <div
      className={`
        ${horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'}
        ${momentum ? 'overflow-scrolling-touch' : ''}
        ${className}
      `}
      style={{
        WebkitOverflowScrolling: momentum ? 'touch' : 'auto',
        scrollSnapType: snapToGrid ? (horizontal ? 'x mandatory' : 'y mandatory') : 'none',
        scrollBehavior: 'smooth',
      }}
    >
      <div className={horizontal ? 'flex' : ''}>
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            style={{
              scrollSnapAlign: snapToGrid ? 'start' : 'none',
              flexShrink: horizontal ? 0 : undefined,
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

// 애니메이션 스타일 추가
const styles = `
@keyframes ripple {
  from {
    width: 2px;
    height: 2px;
    opacity: 0.3;
  }
  to {
    width: 400px;
    height: 400px;
    opacity: 0;
  }
}

.overflow-scrolling-touch {
  -webkit-overflow-scrolling: touch;
}

.touch-manipulation {
  touch-action: manipulation;
}
`;

// 스타일 주입
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}