'use client';

import { useState, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  action: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  className?: string;
}

export default function SwipeableCard({
  children,
  leftAction,
  rightAction,
  threshold = 100,
  className = ''
}: SwipeableCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const x = useMotionValue(0);
  
  // 스와이프 진행도
  const leftProgress = useTransform(x, [0, threshold], [0, 1]);
  const rightProgress = useTransform(x, [-threshold, 0], [1, 0]);
  
  // 배경 색상 불투명도
  const leftOpacity = useTransform(leftProgress, [0, 0.5, 1], [0, 0.5, 1]);
  const rightOpacity = useTransform(rightProgress, [0, 0.5, 1], [0, 0.5, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldTriggerLeft = info.offset.x >= threshold && leftAction;
    const shouldTriggerRight = info.offset.x <= -threshold && rightAction;

    if (shouldTriggerLeft || shouldTriggerRight) {
      setIsAnimating(true);
      
      // 스와이프 완료 애니메이션
      const targetX = shouldTriggerLeft ? 300 : -300;
      x.set(targetX);
      
      setTimeout(() => {
        if (shouldTriggerLeft) {
          leftAction?.action();
        } else {
          rightAction?.action();
        }
        x.set(0);
        setIsAnimating(false);
      }, 200);
    } else {
      // 원위치로 복귀
      x.set(0);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 왼쪽 액션 배경 */}
      {leftAction && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={`absolute inset-0 flex items-center justify-start px-6 ${leftAction.color}`}
        >
          <div className="flex items-center gap-3">
            {leftAction.icon}
            <span className="text-white font-medium">{leftAction.label}</span>
          </div>
        </motion.div>
      )}

      {/* 오른쪽 액션 배경 */}
      {rightAction && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={`absolute inset-0 flex items-center justify-end px-6 ${rightAction.color}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </motion.div>
      )}

      {/* 카드 콘텐츠 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: rightAction ? -threshold * 1.2 : 0, right: leftAction ? threshold * 1.2 : 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: isAnimating ? x.get() : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-white dark:bg-gray-900"
      >
        {children}
      </motion.div>
    </div>
  );
}