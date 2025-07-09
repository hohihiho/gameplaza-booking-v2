'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarPlus, FileText } from 'lucide-react';

interface ReservationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationBottomSheet({ isOpen, onClose }: ReservationBottomSheetProps) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 심플한 팝오버 - 예약 버튼 위에 표시 */}
          <motion.div
            ref={sheetRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-[72px] left-0 right-0 flex justify-center z-[55] md:hidden"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex divide-x divide-gray-200 dark:divide-gray-800">
              <button
                onClick={() => handleNavigation('/reservations')}
                className="flex items-center gap-2 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-base font-medium text-gray-900 dark:text-white whitespace-nowrap">내 예약</span>
              </button>
              <button
                onClick={() => handleNavigation('/reservations/new')}
                className="flex items-center gap-2 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <CalendarPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-base font-medium text-gray-900 dark:text-white whitespace-nowrap">예약하기</span>
              </button>
            </div>
          </motion.div>

          {/* 투명한 배경 - 클릭하면 닫기 */}
          <div 
            className="fixed inset-0 z-[54] md:hidden" 
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  );
}