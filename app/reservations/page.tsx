// 예약 목록 페이지
// 비전공자 설명: 사용자의 예약 내역을 확인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CreditCard, ChevronRight, Loader2, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMyReservations, cancelReservation } from '@/lib/api/reservations';

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '대기중' },
    { id: 'approved', label: '승인됨' },
    { id: 'completed', label: '완료' },
    { id: 'cancelled', label: '취소' },
  ];

  // 예약 목록 불러오기
  useEffect(() => {
    loadReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { reservations: data } = await getMyReservations(activeTab === 'all' ? undefined : activeTab);
      setReservations(data || []);
    } catch (error) {
      console.error('Failed to load reservations:', error);
      setError('예약 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('정말 예약을 취소하시겠습니까?')) return;

    try {
      await cancelReservation(reservationId);
      alert('예약이 취소되었습니다');
      loadReservations();
    } catch (error: any) {
      alert(error.message || '예약 취소에 실패했습니다');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'approved':
        return 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'completed':
        return 'bg-gray-50 dark:bg-gray-900/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      case 'cancelled':
        return 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'rejected':
        return 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      case 'rejected': return '거절';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour] = startTime.split(':').map(Number);
    let [endHour] = endTime.split(':').map(Number);
    if (endHour < startHour) endHour += 24;
    return endHour - startHour;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-5 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold dark:text-white">내 예약</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">예약 현황을 확인하고 관리하세요</p>
        </div>

        {/* 예약 상태 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap relative transition-all ${
                activeTab === tab.id
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs">
                {reservations.filter(r => tab.id === 'all' || r.status === tab.id).length}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* 예약 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button 
              onClick={loadReservations}
              className="mt-4 text-gray-900 dark:text-white hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">예약 내역이 없습니다</p>
            <a 
              href="/reservations/new" 
              className="inline-flex items-center gap-1 text-gray-900 dark:text-white font-medium hover:underline"
            >
              새로운 예약하기
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg dark:text-white">
                      {reservation.device_time_slots?.device_types?.name} {reservation.device_number}번기
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {formatDate(reservation.device_time_slots?.date)} {formatTime(reservation.device_time_slots?.start_time, reservation.device_time_slots?.end_time)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    {reservation.total_price.toLocaleString()}원
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {calculateDuration(reservation.device_time_slots?.start_time, reservation.device_time_slots?.end_time)}시간
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(reservation.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button 
                    onClick={() => router.push(`/reservations/${reservation.id}`)}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    상세보기
                  </button>
                  {(reservation.status === 'pending' || reservation.status === 'approved') && (
                    <button 
                      onClick={() => handleCancel(reservation.id)}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      취소하기
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}