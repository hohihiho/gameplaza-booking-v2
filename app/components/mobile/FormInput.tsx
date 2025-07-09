'use client';

import { InputHTMLAttributes, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  label,
  error,
  success,
  hint,
  icon,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="relative">
      {label && (
        <motion.label
          className={`block text-sm font-medium mb-2 transition-colors ${
            isFocused 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-gray-800 dark:text-gray-200'
          }`}
          animate={{ 
            scale: isFocused ? 1.02 : 1,
            x: isFocused ? 2 : 0
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.div
          className="relative"
          animate={{
            scale: isFocused ? 1.01 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-3 border rounded-xl transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${isPassword && showPasswordToggle ? 'pr-12' : 'pr-10'}
              ${error 
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500' 
                : success 
                  ? 'border-green-500 dark:border-green-400 focus:ring-green-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400'
              }
              bg-white dark:bg-gray-900 
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
              ${className}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* 상태 아이콘 */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-red-500" />
              </motion.div>
            )}
            {success && !error && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 500 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Check className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 비밀번호 토글 */}
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          )}
        </motion.div>
        
        {/* 포커스 라인 */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
          initial={{ width: '0%' }}
          animate={{ width: isFocused ? '100%' : '0%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      
      {/* 에러/힌트 메시지 */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            key="hint-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;