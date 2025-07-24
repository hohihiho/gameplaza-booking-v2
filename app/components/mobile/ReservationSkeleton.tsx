// 예약 관련 스켈레톤 로더 컴포넌트 모음
'use client';

import { motion } from 'framer-motion';

// 예약 목록 아이템 스켈레톤
export function ReservationItemSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-20 animate-pulse" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-24 animate-pulse" />
      </div>
    </motion.div>
  );
}

// 예약 목록 스켈레톤
export function ReservationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ReservationItemSkeleton key={index} />
      ))}
    </div>
  );
}

// 예약 상세 스켈레톤
export function ReservationDetailSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse" />
        </div>
      </div>

      {/* 정보 카드들 */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
    </motion.div>
  );
}

// 시간 슬롯 스켈레톤
export function TimeSlotSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

// 시간 슬롯 목록 스켈레톤
export function TimeSlotListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TimeSlotSkeleton key={index} />
      ))}
    </div>
  );
}

// 기기 선택 스켈레톤
export function DeviceSelectorSkeleton() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}