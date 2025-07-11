'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, useAnimation, useMotionValue, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[]; // 스냅 포인트 (0-1 사이 값, 1이 완전히 열린 상태)
  defaultSnapPoint?: number;
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
  maxHeight?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 1],
  defaultSnapPoint = 0,
  showHandle = true,
  closeOnOverlayClick = true,
  maxHeight = '90vh'
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const y = useMotionValue(0);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [sheetHeight, setSheetHeight] = useState(0);

  // 시트 높이 계산
  useEffect(() => {
    if (sheetRef.current && isOpen) {
      const height = sheetRef.current.scrollHeight;
      setSheetHeight(height);
    }
  }, [isOpen, children]);

  // 열기/닫기 애니메이션
  useEffect(() => {
    if (isOpen) {
      const snapHeight = sheetHeight * (snapPoints[currentSnapIndex] || 0.8);
      controls.start({ y: -snapHeight });
    } else {
      controls.start({ y: 0 });
    }
  }, [isOpen, currentSnapIndex, sheetHeight, snapPoints, controls]);

  // 드래그 종료 시 스냅 포인트 찾기
  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldClose = info.velocity.y > 20 || (info.velocity.y >= 0 && info.offset.y > 100);
    
    if (shouldClose) {
      onClose();
    } else {
      // 가장 가까운 스냅 포인트 찾기
      const currentY = Math.abs(y.get());
      const snapHeights = snapPoints.map(point => sheetHeight * point);
      
      let closestIndex = 0;
      let closestDistance = Math.abs(currentY - (snapHeights[0] || 0));
      
      snapHeights.forEach((height, index) => {
        const distance = Math.abs(currentY - height);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      setCurrentSnapIndex(closestIndex);
      controls.start({ y: -(snapHeights[closestIndex] || 0) });
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        onClick={closeOnOverlayClick ? onClose : undefined}
        className={`fixed inset-0 bg-black/50 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      />

      {/* 바텀시트 */}
      <motion.div
        ref={sheetRef}
        style={{ y, maxHeight }}
        initial={{ y: '100%' }}
        animate={controls}
        exit={{ y: '100%' }}
        drag="y"
        dragConstraints={{ top: -sheetHeight, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 rounded-t-3xl shadow-2xl z-50 overflow-hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottomsheet-title' : undefined}
      >
        {/* 드래그 핸들 */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
            <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
          </div>
        )}

        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 id="bottomsheet-title" className="text-lg font-semibold dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="overflow-y-auto overscroll-contain">
          {children}
        </div>
      </motion.div>
    </>
  );
}