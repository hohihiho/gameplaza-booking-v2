'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const icons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info
};

const iconColors = {
  success: 'text-green-700 dark:text-green-300',
  error: 'text-red-700 dark:text-red-300',
  warning: 'text-yellow-700 dark:text-yellow-300',
  info: 'text-blue-700 dark:text-blue-300'
};

const bgColors = {
  success: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-700',
  error: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-700',
  warning: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-700',
  info: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-700'
};

export function Toast({ message, onClose }: ToastProps) {
  const Icon = icons[message.type];

  useEffect(() => {
    if (message.duration) {
      const timer = setTimeout(() => {
        onClose(message.id);
      }, message.duration);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${bgColors[message.type]} border rounded-2xl shadow-lg dark:shadow-2xl p-4 mb-3 mx-4 max-w-sm`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-white dark:bg-gray-900 ${iconColors[message.type]}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {message.title}
          </h4>
          {message.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {message.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(message.id)}
          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors touch-target"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </motion.div>
  );
}

// Toast 컨테이너
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id, duration: toast.duration || 3000 }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 전역 toast 함수로 노출
  useEffect(() => {
    (window as any).toast = {
      success: (title: string, description?: string) => 
        addToast({ type: 'success', title, description }),
      error: (title: string, description?: string) => 
        addToast({ type: 'error', title, description }),
      warning: (title: string, description?: string) => 
        addToast({ type: 'warning', title, description }),
      info: (title: string, description?: string) => 
        addToast({ type: 'info', title, description })
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast message={toast} onClose={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}