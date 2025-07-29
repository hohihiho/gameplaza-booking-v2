'use client';

import { ButtonHTMLAttributes, ReactNode, memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TouchRipple from './TouchRipple';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
  haptic?: 'light' | 'medium' | 'heavy';
}

const LoadingButton = memo(function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  haptic = 'medium',
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:text-indigo-100',
    secondary: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400 disabled:text-red-100',
    ghost: 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 disabled:text-gray-400 dark:disabled:text-gray-600'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };
  
  const isDisabled = disabled || isLoading;
  
  return (
    <TouchRipple disabled={isDisabled}>
      <motion.button
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${haptic ? `haptic-${haptic}` : ''}
          ${className}
        `}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...(props as any)}
      >
        <motion.div
          className="flex items-center gap-2"
          animate={isLoading ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </motion.div>
        
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2 className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            {loadingText && (
              <span className="ml-2">{loadingText}</span>
            )}
          </motion.div>
        )}
      </motion.button>
    </TouchRipple>
  );
});

export default LoadingButton;