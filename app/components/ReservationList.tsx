// 예약 목록 컴포넌트 (v2 API 지원)
'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { V2Reservation } from '@/lib/api/client';
import { formatKoreanDate, parseKSTDate } from '@/lib/utils/kst-date';
import { ReservationListSkeleton } from './mobile/ReservationSkeleton';

interface ReservationListProps {
  reservations: V2Reservation[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  emptyMessage?: string;
}

interface ReservationItemProps {
  reservation: V2Reservation;
  index: number;
  formatTime: (time: string) => string;
  getCreditTypeLabel: (type: string) => string;
  getStatusStyle: (status: string) => {
    bg: string;
    text: string;
    label: string;
  };
}

// 개별 예약 아이템 컴포넌트 - memo로 최적화
const ReservationItem = memo(function ReservationItem({
  reservation,
  index,
  formatTime,
  getCreditTypeLabel,
  getStatusStyle
}: ReservationItemProps) {
  const router = useRouter();
  const status = getStatusStyle(reservation.status);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/reservations/${reservation.id}`)}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-all"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {reservation.device?.device_type.name || '기기 정보 없음'}
          </h3>
          {reservation.device?.device_type.model_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reservation.device.device_type.model_name}
            </p>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* 예약 정보 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {formatKoreanDate(parseKSTDate(reservation.date))}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
          </span>
          {reservation.slot_type === 'overnight' && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
              밤샘대여
            </span>
          )}
        </div>

        {reservation.device && (
          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {reservation.device.device_number}번 기기 • {reservation.player_count}인
            </span>
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            {getCreditTypeLabel(reservation.credit_type)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 dark:text-white">
            {(reservation.total_amount || reservation.total_price || 0).toLocaleString()}원
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );
});

const ReservationList = memo(function ReservationList({
  reservations,
  loading = false,
  error,
  onRefresh,
  emptyMessage = '예약 내역이 없습니다'
}: ReservationListProps) {
  // const router = useRouter();

  // 시간 포맷팅 (24시간 이후 표시)
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour || '0');
    
    if (hourNum >= 0 && hourNum <= 5) {
      return `${hourNum + 24}:${minute}`;
    }
    return `${hour}:${minute}`;
  };

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          text: 'text-yellow-700 dark:text-yellow-400',
          label: '승인 대기'
        };
      case 'approved':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          label: '승인됨'
        };
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-400',
          label: '완료'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          label: '취소됨'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          label: status
        };
    }
  };

  // 크레딧 타입 표시
  const getCreditTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed':
        return '고정크레딧';
      case 'freeplay':
        return '프리플레이';
      case 'unlimited':
        return '무한크레딧';
      default:
        return type;
    }
  };

  if (loading) {
    return <ReservationListSkeleton count={3} />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 text-center"
      >
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 dark:text-red-300 font-medium mb-3">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            다시 시도
          </button>
        )}
      </motion.div>
    );
  }

  if (reservations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-12 text-center"
      >
        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-4">
        {reservations.map((reservation, index) => (
          <ReservationItem
            key={reservation.id}
            reservation={reservation}
            index={index}
            formatTime={formatTime}
            getCreditTypeLabel={getCreditTypeLabel}
            getStatusStyle={getStatusStyle}
          />
        ))}
      </div>
    </AnimatePresence>
  );
});

export default ReservationList;