'use client';

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ErrorMessageProps {
  type?: 'error' | 'warning' | 'info' | 'validation';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorMessage({
  type = 'error',
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  className = ''
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'validation':
        return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      case 'validation':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`border rounded-xl p-4 ${getColorClasses()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm leading-relaxed">
            {message}
          </p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 inline-flex items-center text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded transition-colors ${
                type === 'error' ? 'focus:ring-red-500' :
                type === 'warning' ? 'focus:ring-amber-500' :
                type === 'info' ? 'focus:ring-blue-500' :
                'focus:ring-orange-500'
              }`}
            >
              {action.label}
            </button>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-500"
            aria-label="닫기"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// 특수 에러 케이스를 위한 프리셋 컴포넌트들
export const NetworkError = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorMessage
    type="error"
    title="네트워크 오류"
    message="인터넷 연결을 확인하고 다시 시도해주세요."
    action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
  />
);

export const ValidationError = ({ message }: { message: string }) => (
  <ErrorMessage
    type="validation"
    title="입력 오류"
    message={message}
  />
);

export const ServerError = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorMessage
    type="error"
    title="서버 오류"
    message="일시적인 서버 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
    action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
  />
);