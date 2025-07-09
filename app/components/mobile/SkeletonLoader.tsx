'use client';

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export default function SkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  className = ''
}: SkeletonLoaderProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || '1rem',
          borderRadius: '0.25rem'
        };
      case 'circular':
        return {
          width: width || '3rem',
          height: height || '3rem',
          borderRadius: '50%'
        };
      case 'rectangular':
        return {
          width: width || '100%',
          height: height || '10rem',
          borderRadius: '0.5rem'
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || '15rem',
          borderRadius: '1rem'
        };
      default:
        return {};
    }
  };

  const styles = getVariantStyles();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 ${className}`}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="로딩 중"
          style={styles}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </>
  );
}

// 프리셋 스켈레톤 컴포넌트들
export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLoader
        key={i}
        variant="text"
        width={i === lines - 1 ? '80%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3">
      <SkeletonLoader variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
    <SkeletonLoader variant="rectangular" height={100} />
    <div className="flex gap-2">
      <SkeletonLoader variant="text" width={80} height={32} />
      <SkeletonLoader variant="text" width={80} height={32} />
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);