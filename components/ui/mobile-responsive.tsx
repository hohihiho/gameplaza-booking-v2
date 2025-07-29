'use client';

import { useEffect, useState } from 'react';

/**
 * 모바일 디바이스 감지 훅
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * 모바일 터치 디바이스 감지 훅
 */
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchDevice;
}

/**
 * 모바일 전용 컴포넌트
 */
export function MobileOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  return <>{children}</>;
}

/**
 * 데스크탑 전용 컴포넌트
 */
export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  if (isMobile) return null;
  
  return <>{children}</>;
}

/**
 * 반응형 그리드 컨테이너
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = ''
}: ResponsiveGridProps) {
  return (
    <div className={`
      grid gap-${gap}
      grid-cols-${cols.mobile || 1}
      md:grid-cols-${cols.tablet || 2}
      lg:grid-cols-${cols.desktop || 3}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * 모바일 최적화 버튼
 */
interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function MobileButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  type = 'button'
}: MobileButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 touch-manipulation active:scale-95';
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 active:border-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * 모바일 최적화 카드
 */
interface MobileCardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function MobileCard({
  children,
  padding = 'md',
  className = '',
  onClick
}: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 
        rounded-lg shadow-sm 
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * 모바일 최적화 모달
 */
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  fullScreen = false
}: MobileModalProps) {
  const isMobile = useIsMobile();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 모달 콘텐츠 */}
      <div className={`
        relative bg-white dark:bg-gray-800 
        ${fullScreen || isMobile ? 'w-full h-full md:h-auto md:max-h-[90vh]' : 'max-w-lg mx-4'}
        ${isMobile && !fullScreen ? 'rounded-t-2xl' : 'md:rounded-lg'}
        overflow-hidden
      `}>
        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* 컨텐츠 */}
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}