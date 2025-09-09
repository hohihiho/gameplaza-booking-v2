'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'list' | 'detail';
  animation?: 'pulse' | 'wave' | 'shimmer';
}

// 기본 스켈레톤 컴포넌트
export function Skeleton({ 
  className,
  animation = 'shimmer'
}: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-[wave_1.5s_ease-in-out_infinite]',
    shimmer: 'animate-[shimmer_2s_ease-in-out_infinite]'
  }[animation];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
        animationClass,
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}

// 카드 스켈레톤
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* 헤더 부분 */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* 컨텐츠 부분 */}
      <Skeleton className="h-24 w-full" />
      
      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// 리스트 아이템 스켈레톤
export function ListItemSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
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

  return <Skeleton className={cn('w-full', aspectClasses[aspectRatio])} />;
}