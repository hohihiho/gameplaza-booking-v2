'use client';

import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className = ''
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  // 당기기 진행도 (0-1)
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorRotation = useTransform(pullProgress, [0, 1], [0, 180]);

  const handleDragStart = () => {
    if (containerRef.current?.scrollTop === 0) {
      setIsPulling(true);
    }
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // 스크롤이 맨 위에 있을 때만 당기기 허용
    if (containerRef.current?.scrollTop !== 0) {
      y.set(0);
      setIsPulling(false);
      return;
    }

    // 아래로만 당기기 허용
    if (info.offset.y < 0) {
      y.set(0);
      return;
    }

    // 탄성 효과
    const resistance = 0.5;
    y.set(info.offset.y * resistance);
  };

  const handleDragEnd = async () => {
    setIsPulling(false);

    if (y.get() >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // 새로고침 위치에 고정
      y.set(60);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      y.set(0);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 새로고침 인디케이터 */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none"
      >
        <motion.div
          style={{ 
            scale: pullProgress,
            opacity: pullProgress
          }}
          className="bg-white dark:bg-gray-900 rounded-full shadow-lg dark:shadow-2xl p-3 mt-2 border border-gray-200 dark:border-gray-700"
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotation }}>
              <ArrowDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* 콘텐츠 컨테이너 */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}