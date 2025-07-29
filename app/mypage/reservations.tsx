// 마이페이지 예약 목록 섹션 (v2 API 지원)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReservations } from '@/lib/hooks/useReservations';
import ReservationList from '@/app/components/ReservationList';
import PullToRefresh from '@/app/components/mobile/PullToRefresh';

export default function MyReservations() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { reservations, loading, error, refetch, setStatus } = useReservations();
  const [showFilters, setShowFilters] = useState(false);

  // 상태 필터 옵션
  const statusFilters = [
    { value: '', label: '전체', color: 'gray' },
    { value: 'pending', label: '승인 대기', color: 'yellow' },
    { value: 'approved', label: '승인됨', color: 'blue' },
    { value: 'completed', label: '완료', color: 'green' },
    { value: 'cancelled', label: '취소됨', color: 'red' },
  ];

  // 상태 변경 핸들러
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setStatus(newStatus || undefined);
    setShowFilters(false);
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            내 예약
          </h2>
          <div className="flex items-center gap-2">
            {/* 새로고침 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, rotate: 180 }}
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
            
            {/* 필터 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${
                showFilters 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Filter className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* 필터 옵션 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                {statusFilters.map((filter) => (
                  <motion.button
                    key={filter.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStatusChange(filter.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedStatus === filter.value
                        ? `bg-${filter.color}-100 dark:bg-${filter.color}-900/30 text-${filter.color}-700 dark:text-${filter.color}-400 border-2 border-${filter.color}-300 dark:border-${filter.color}-700`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 예약 목록 */}
        <ReservationList
          reservations={reservations}
          loading={loading}
          error={error}
          onRefresh={refetch}
          emptyMessage={
            selectedStatus 
              ? `${statusFilters.find(f => f.value === selectedStatus)?.label} 예약이 없습니다`
              : '예약 내역이 없습니다'
          }
        />

        {/* 더보기 버튼 */}
        {!loading && reservations.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/reservations')}
            className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            전체 예약 내역 보기
          </motion.button>
        )}
      </motion.section>
    </PullToRefresh>
  );
}