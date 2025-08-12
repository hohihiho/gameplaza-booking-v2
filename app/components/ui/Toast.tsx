'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const bgColorMap = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const textColorMap = {
  success: 'text-green-900 dark:text-green-100',
  error: 'text-red-900 dark:text-red-100',
  warning: 'text-yellow-900 dark:text-yellow-100',
  info: 'text-blue-900 dark:text-blue-100',
};

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = iconMap[toast.type];
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`
        relative flex items-start gap-3 w-full max-w-md p-4 
        border rounded-xl shadow-lg backdrop-blur-sm
        ${bgColorMap[toast.type]}
      `}
    >
      {/* 프로그레스 바 */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 rounded-b-xl ${colorMap[toast.type]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
      
      {/* 아이콘 */}
      <div className={`flex-shrink-0 ${textColorMap[toast.type]}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* 콘텐츠 */}
      <div className="flex-1 pt-0.5">
        {toast.title && (
          <h4 className={`font-semibold mb-1 ${textColorMap[toast.type]}`}>
            {toast.title}
          </h4>
        )}
        <p className={`text-sm ${textColorMap[toast.type]} opacity-90`}>
          {toast.message}
        </p>
      </div>
      
      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 p-1 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors ${textColorMap[toast.type]}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence mode="sync">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={onClose} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}