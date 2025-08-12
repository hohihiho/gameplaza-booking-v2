'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCloseButton?: boolean;
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  confirm: AlertTriangle,
};

const colorMap = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  confirm: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const buttonColorMap = {
  info: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
  success: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
  warning: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600',
  error: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  confirm: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
};

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = '확인',
  cancelText = '취소',
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const Icon = iconMap[type];
  const colorClass = colorMap[type];
  const buttonColorClass = buttonColorMap[type];

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 모달 외부 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* 백드롭 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* 모달 */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 pb-0">
                {title && (
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {showCloseButton && type !== 'confirm' && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
            )}
            
            {/* 바디 */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* 아이콘 */}
                <div className={`p-3 rounded-full ${colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                {/* 메시지 */}
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 푸터 */}
            <div className="px-6 pb-6">
              <div className="flex gap-3 justify-end">
                {type === 'confirm' && (
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onConfirm) {
                      onConfirm();
                    }
                    onClose();
                  }}
                  className={`px-5 py-2.5 text-white rounded-xl font-medium transition-colors ${buttonColorClass}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}