'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { touchTargets, spacing, typography } from '@/lib/design/mobile-first-patterns';

interface MobileFirstCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  expandable?: boolean;
}

/**
 * 모바일 우선 카드 컴포넌트
 */
export function MobileFirstCard({
  title,
  subtitle,
  children,
  actions,
  className = '',
  expandable = false,
}: MobileFirstCardProps) {
  const [isExpanded, setIsExpanded] = useState(!expandable);

  return (
    <article
      className={`
        bg-white dark:bg-gray-800
        rounded-lg shadow-sm
        p-4 md:p-6
        transition-all duration-300
        ${className}
      `}
    >
      {(title || subtitle) && (
        <header
          className={`
            mb-4
            ${expandable ? 'cursor-pointer select-none' : ''}
          `}
          onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
        >
          {title && (
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
              {expandable && (
                <span className="float-right text-gray-500">
                  {isExpanded ? '−' : '+'}
                </span>
              )}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </header>
      )}

      {isExpanded && (
        <>
          <div className="text-sm md:text-base">
            {children}
          </div>

          {actions && (
            <footer className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                {actions}
              </div>
            </footer>
          )}
        </>
      )}
    </article>
  );
}

interface MobileFirstButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 모바일 우선 버튼 컴포넌트
 */
export function MobileFirstButton({
  onClick,
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
}: MobileFirstButtonProps) {
  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-6 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        font-medium rounded-lg
        transition-all duration-200
        touch-manipulation select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        min-h-[${touchTargets.minimum}px]
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>
        {children}
      </span>
    </button>
  );
}

interface MobileFirstNavProps {
  items: Array<{
    icon: ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
  }>;
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * 모바일 우선 네비게이션 바
 */
export function MobileFirstNav({
  items,
  position = 'bottom',
  className = '',
}: MobileFirstNavProps) {
  const positionClasses = position === 'bottom'
    ? 'fixed bottom-0 left-0 right-0 border-t'
    : 'fixed top-0 left-0 right-0 border-b';

  return (
    <nav
      className={`
        ${positionClasses}
        bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        z-50
        ${className}
      `}
      style={{
        paddingBottom: position === 'bottom' ? 'env(safe-area-inset-bottom)' : 0,
        paddingTop: position === 'top' ? 'env(safe-area-inset-top)' : 0,
      }}
    >
      <div className="flex justify-around items-center h-16">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`
              flex flex-col items-center justify-center
              flex-1 h-full
              text-xs
              transition-colors duration-200
              ${item.active
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
              }
              hover:text-blue-600 dark:hover:text-blue-400
            `}
            style={{ minWidth: `${touchTargets.minimum}px` }}
          >
            <div className="text-xl mb-1">{item.icon}</div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

interface MobileFirstListProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    onClick?: () => void;
    actions?: ReactNode;
  }>;
  loading?: boolean;
  className?: string;
}

/**
 * 모바일 우선 리스트 컴포넌트
 */
export function MobileFirstList({
  items,
  loading = false,
  className = '',
}: MobileFirstListProps) {
  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={item.onClick}
            className={`
              w-full text-left
              bg-white dark:bg-gray-800
              rounded-lg p-4
              flex items-center gap-4
              transition-all duration-200
              hover:bg-gray-50 dark:hover:bg-gray-700
              active:scale-98
              ${item.onClick ? 'cursor-pointer' : 'cursor-default'}
            `}
            style={{
              minHeight: `${touchTargets.comfortable}px`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {item.icon && (
              <div className="flex-shrink-0 text-2xl">
                {item.icon}
              </div>
            )}

            <div className="flex-grow min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {item.title}
              </div>
              {item.subtitle && (
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.subtitle}
                </div>
              )}
            </div>

            {item.actions && (
              <div className="flex-shrink-0">
                {item.actions}
              </div>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface MobileFirstModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  fullScreen?: boolean;
  className?: string;
}

/**
 * 모바일 우선 모달/바텀시트
 */
export function MobileFirstModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  fullScreen = false,
  className = '',
}: MobileFirstModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div
        className={`
          fixed z-50
          ${fullScreen
            ? 'inset-0'
            : 'bottom-0 left-0 right-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full'
          }
          bg-white dark:bg-gray-800
          ${fullScreen ? '' : 'rounded-t-2xl md:rounded-lg'}
          ${className}
        `}
        style={{
          maxHeight: fullScreen ? '100vh' : '90vh',
          paddingBottom: fullScreen ? 'env(safe-area-inset-bottom)' : 0,
        }}
      >
        {/* 헤더 */}
        {title && (
          <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              style={{ minWidth: `${touchTargets.minimum}px`, minHeight: `${touchTargets.minimum}px` }}
            >
              ✕
            </button>
          </header>
        )}

        {/* 바디 */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </footer>
        )}
      </div>
    </>
  );
}