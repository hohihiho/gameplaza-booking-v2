'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rectangular' | 'card';
  animation?: 'pulse' | 'wave' | 'shimmer' | 'smooth';
  width?: string | number;
  height?: string | number;
  count?: number;
}

// 기본 스켈레톤 컴포넌트 - framer-motion으로 업그레이드
export function Skeleton({ 
  className,
  animation = 'smooth',
  variant = 'default',
  width,
  height,
  count = 1
}: SkeletonProps) {
  // variant별 기본 스타일
  const variantStyles = {
    default: 'rounded-xl',
    text: 'rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl'
  };

  // CSS 애니메이션과 framer-motion 애니메이션 분기
  const getCSSAnimationClass = () => {
    if (animation === 'smooth') return '';
    return {
      pulse: 'animate-pulse',
      wave: 'animate-[wave_1.5s_ease-in-out_infinite]',
      shimmer: 'animate-[shimmer_2s_ease-in-out_infinite]'
    }[animation] || '';
  };

  // framer-motion 애니메이션 설정
  const getMotionProps = () => {
    if (animation !== 'smooth') return {};
    
    return {
      animate: {
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.005, 1]
      },
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    };
  };

  // 크기 스타일 생성
  const getSizeStyles = () => ({
    width: width || undefined,
    height: height || undefined
  });

  const baseClasses = cn(
    "relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
    variantStyles[variant],
    getCSSAnimationClass(),
    className
  );

  // 여러 개 렌더링하는 경우
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className={baseClasses}
            style={getSizeStyles()}
            role="status"
            aria-live="polite"
            aria-busy="true"
            {...getMotionProps()}
          >
            <span className="sr-only">로딩 중...</span>
          </motion.div>
        ))}
      </>
    );
  }

  // 단일 스켈레톤
  return (
    <motion.div
      className={baseClasses}
      style={getSizeStyles()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...getMotionProps()}
    >
      <span className="sr-only">로딩 중...</span>
    </motion.div>
  );
}

// 카드 스켈레톤 - 모바일 최적화
export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-4 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {/* 헤더 부분 */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* 컨텐츠 부분 */}
      <Skeleton variant="rectangular" className="h-24 w-full" />
      
      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Skeleton variant="rectangular" className="h-9 w-20 rounded-lg" />
        <Skeleton variant="rectangular" className="h-9 w-20 rounded-lg" />
      </div>
    </motion.div>
  );
}

// 리스트 아이템 스켈레톤 - 모바일 터치 친화적
export function ListItemSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width={128} height={16} />
            <Skeleton variant="text" width={96} height={12} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={64} height={24} className="rounded-full" />
      </div>
    </motion.div>
  );
}

// 상세 페이지 스켈레톤
export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      {/* 액션 버튼 */}
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}

// 테이블 스켈레톤
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      
      {/* 테이블 바디 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(columns)].map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 페이지 전체 스켈레톤
export function PageSkeleton({ title = true, content = 'list' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-start via-gradient-middle to-gradient-end dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 타이틀 영역 */}
        {title && (
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        )}

        {/* 컨텐츠 영역 */}
        {content === 'list' && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        )}

        {content === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {content === 'detail' && <DetailSkeleton />}
        {content === 'table' && <TableSkeleton />}
      </div>
    </div>
  );
}

// 버튼 스켈레톤
export function ButtonSkeleton({ size = 'default' }) {
  const sizeClasses = {
    sm: 'h-8 w-16',
    default: 'h-10 w-24',
    lg: 'h-12 w-32'
  };

  return <Skeleton className={cn('rounded-xl', sizeClasses[size])} />;
}

// 텍스트 스켈레톤
export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4" 
          style={{ width: `${100 - (i === lines - 1 ? 20 : 0)}%` }}
        />
      ))}
    </div>
  );
}

// 아바타 스켈레톤
export function AvatarSkeleton({ size = 'default' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return <Skeleton className={cn('rounded-full', sizeClasses[size])} />;
}

// 이미지 스켈레톤
export function ImageSkeleton({ aspectRatio = 'square' }) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]'
  };

  return <Skeleton variant="rectangular" className={cn('w-full', aspectClasses[aspectRatio])} />;
}

// 게임플라자 특화 - 예약 카드 스켈레톤
export function ReservationCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton variant="text" width={128} height={20} />
          <Skeleton variant="text" width={96} height={16} />
        </div>
        <Skeleton variant="rectangular" width={64} height={24} className="rounded-full" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
          <Skeleton variant="text" width={160} height={16} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
          <Skeleton variant="text" width={192} height={16} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Skeleton variant="text" width={80} height={16} />
        <Skeleton variant="rectangular" width={96} height={32} className="rounded-xl" />
      </div>
    </motion.div>
  );
}

// 기기 선택 그리드 스켈레톤
export function DeviceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Skeleton variant="rectangular" className="aspect-square rounded-xl" />
        </motion.div>
      ))}
    </div>
  );
}

// 시간대 슬롯 스켈레톤
export function TimeSlotSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
            <Skeleton variant="text" width={128} height={24} />
          </div>
          <Skeleton variant="text" width={96} height={16} />
        </div>
      </div>
    </motion.div>
  );
}

// 통합된 편의 컴포넌트들
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        className="h-4" 
        width={i === lines - 1 ? '80%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' | 'xl' }) => {
  const sizes = { sm: 32, default: 40, lg: 48, xl: 64 };
  return <Skeleton variant="circular" width={sizes[size]} height={sizes[size]} />;
};

export const SkeletonButton = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const dimensions = {
    sm: { width: 64, height: 32 },
    default: { width: 96, height: 40 },
    lg: { width: 128, height: 48 }
  };
  return <Skeleton variant="rectangular" className="rounded-xl" {...dimensions[size]} />;
};

// 약관 페이지 전용 스켈레톤
export function TermsSkeleton() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 홈으로 버튼 - 상단 고정 */}
      <div className="fixed top-4 left-4 z-50">
        <Skeleton variant="rectangular" width={112} height={40} className="rounded-lg" />
      </div>

      {/* 내용 */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-slate max-w-none">
          {/* 제목 */}
          <div className="mb-8">
            <Skeleton variant="text" className="h-10 w-96 mb-2" />
            <Skeleton variant="text" className="h-6 w-64" />
          </div>
          
          {/* 버전 정보 */}
          <div className="mb-8">
            <Skeleton variant="text" className="h-4 w-32 mb-1" />
            <Skeleton variant="text" className="h-4 w-40" />
          </div>
          
          {/* 서론 */}
          <div className="mb-8">
            <Skeleton variant="text" className="h-4 w-full mb-2" />
            <Skeleton variant="text" className="h-4 w-5/6 mb-2" />
            <Skeleton variant="text" className="h-4 w-4/5" />
          </div>
          
          {/* 각 섹션들 */}
          {Array.from({ length: 6 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="mb-10">
              {/* 섹션 제목 */}
              <Skeleton variant="text" className="h-8 w-64 mb-6" />
              
              {/* 조항들 */}
              {Array.from({ length: 3 }).map((_, articleIndex) => (
                <div key={articleIndex} className="mb-6">
                  <Skeleton variant="text" className="h-6 w-48 mb-3" />
                  <div className="space-y-2">
                    <Skeleton variant="text" className="h-4 w-full" />
                    <Skeleton variant="text" className="h-4 w-5/6" />
                    <Skeleton variant="text" className="h-4 w-4/5" />
                  </div>
                  
                  {/* 하위 목록 (가끔 포함) */}
                  {articleIndex === 1 && (
                    <div className="mt-3 pl-4 space-y-1">
                      <Skeleton variant="text" className="h-4 w-3/4" />
                      <Skeleton variant="text" className="h-4 w-2/3" />
                      <Skeleton variant="text" className="h-4 w-4/5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}