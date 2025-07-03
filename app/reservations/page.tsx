// 예약 목록 페이지
// 비전공자 설명: 사용자의 예약 내역을 확인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { Calendar, CreditCard, ChevronRight, ChevronLeft, Loader2, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMyReservations, cancelReservation } from '@/lib/api/reservations';
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [reservations, setReservations] = useState<any[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]); // 전체 예약 목록 저장
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({}); // 각 탭의 개수 저장
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 한 페이지에 10개씩 표시

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '대기중' },
    { id: 'approved', label: '승인됨' },
    { id: 'completed', label: '완료' },
    { id: 'cancelled', label: '취소' },
  ];

  // 초기 로드 시 전체 예약 목록 가져오기
  useEffect(() => {
    loadAllReservations();
  }, []);

  // 탭 변경 시 필터링
  useEffect(() => {
    if (allReservations.length > 0) {
      filterReservations();
    }
  }, [activeTab, allReservations]);

  const loadAllReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { reservations: data } = await getMyReservations(); // 전체 목록 가져오기
      setAllReservations(data || []);
      
      // 각 탭의 개수 계산
      const counts: Record<string, number> = {
        all: data?.length || 0,
        pending: data?.filter((r: any) => r.status === 'pending').length || 0,
        approved: data?.filter((r: any) => r.status === 'approved').length || 0,
        completed: data?.filter((r: any) => r.status === 'completed').length || 0,
        cancelled: data?.filter((r: any) => r.status === 'cancelled').length || 0,
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to load reservations:', error);
      setError('예약 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReservations = () => {
    if (activeTab === 'all') {
      setReservations(allReservations);
    } else {
      setReservations(allReservations.filter(r => r.status === activeTab));
    }
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('정말 예약을 취소하시겠습니까?')) return;

    try {
      console.log('취소할 예약 ID:', reservationId);
      
      // API를 통해 예약 취소 처리
      await cancelReservation(reservationId);

      alert('예약이 취소되었습니다');
      loadAllReservations();
    } catch (error: any) {
      console.error('예약 취소 오류:', error);
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
      case 'rejected': return '취소';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    const d = parseKSTDate(date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  const formatTime = (startTime: string, endTime: string) => {
    return `${formatTimeKST(startTime || '')} - ${formatTimeKST(endTime || '')}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startHour = startParts[0] || 0;
    let endHour = endParts[0] || 0;
    if (endHour < startHour) endHour += 24;
    return endHour - startHour;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 상단 고정 헤더 */}
      <div className="sticky top-16 z-30 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-5">
          {/* 페이지 타이틀 */}
          <div className="pt-6 pb-4">
            <h1 className="text-2xl font-bold dark:text-white">내 예약</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">예약 현황을 확인하고 관리하세요</p>
          </div>

          {/* 예약 상태 탭 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap relative transition-all ${
                  activeTab === tab.id
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs">
                  {tabCounts[tab.id] || 0}
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

          {/* 페이지네이션 (상단) */}
          {reservations.length > itemsPerPage && (
            <div className="py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPage} / {Math.ceil(reservations.length / itemsPerPage)} 페이지
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(reservations.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(reservations.length / itemsPerPage)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(reservations.length / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(reservations.length / itemsPerPage);
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 pb-6">

        {/* 예약 목록 */}
        <div className="mt-6">
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
            {reservations
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((reservation) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg dark:text-white">
                      {reservation.devices?.device_types?.name} {reservation.devices?.device_number}번기
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {formatDate(reservation.date)} {formatTime(reservation.start_time, reservation.end_time)} ({calculateDuration(reservation.start_time, reservation.end_time)}시간)
                    </p>
                    {reservation.reservation_number && (
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
                        예약번호: {reservation.reservation_number}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    {reservation.total_amount?.toLocaleString()}원
                  </span>
                  {reservation.credit_type && (
                    <span className="flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4" />
                      {reservation.credit_type === 'fixed' ? '고정크레딧' : 
                       reservation.credit_type === 'freeplay' ? '프리플레이' : 
                       reservation.credit_type === 'unlimited' ? '무한크레딧' : 
                       reservation.credit_type}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    신청: {parseKSTDate(reservation.created_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'Asia/Seoul'
                    })}
                  </span>
                </div>

                {/* 추가 정보가 있을 때만 표시 */}
                {(reservation.user_notes || reservation.admin_notes || reservation.rejection_reason) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {reservation.user_notes && <p>💬 {reservation.user_notes}</p>}
                      {reservation.admin_notes && <p className="mt-1">📝 관리자: {reservation.admin_notes}</p>}
                      {reservation.rejection_reason && (
                        <p className="mt-1 text-red-600 dark:text-red-400">❌ 취소 사유: {reservation.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                {(reservation.status === 'pending' || reservation.status === 'approved') && (
                  <div className="mt-4 flex items-center justify-end">
                    <button 
                      onClick={() => handleCancel(reservation.id)}
                      className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      취소하기
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </div>
    </main>
  );
}