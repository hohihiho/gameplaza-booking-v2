// 예약 목록 페이지
// 비전공자 설명: 사용자의 예약 내역을 확인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, CreditCard, ChevronLeft, ChevronRight, Loader2, Gamepad2, Clock, Sparkles, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyReservations, cancelReservation } from '@/lib/api/reservations';
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('all');
  const [reservations, setReservations] = useState<any[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '대기중' },
    { id: 'approved', label: '승인됨' },
    { id: 'completed', label: '완료' },
    { id: 'cancelled', label: '취소' },
  ];

  // URL 파라미터에서 페이지 정보 복원
  useEffect(() => {
    const page = searchParams.get('page');
    const perPage = searchParams.get('perPage');
    const tab = searchParams.get('tab');
    
    if (page) setCurrentPage(parseInt(page));
    if (perPage) setItemsPerPage(parseInt(perPage));
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  
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

  // 만료된 예약 상태 자동 업데이트
  const updateExpiredReservations = async (reservations: any[]) => {
    // KST 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9
    const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() + kstOffset) * 60 * 1000);
    const today = new Date(kstNow);
    today.setHours(0, 0, 0, 0);
    
    const updatedReservations = [];
    
    for (const reservation of reservations) {
      // 예약 날짜를 KST 기준으로 파싱
      const [year, month, day] = reservation.date.split('-').map(Number);
      const reservationDate = new Date(year, month - 1, day);
      reservationDate.setHours(0, 0, 0, 0);
      
      // 대여일이 하루 이상 지난 경우
      if (reservationDate < today) {
        const daysDiff = Math.floor((today.getTime() - reservationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 1) {
          // 승인된 예약은 완료로
          if (reservation.status === 'approved') {
            try {
              const response = await fetch(`/api/reservations/${reservation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
              });
              
              if (response.ok) {
                updatedReservations.push({ ...reservation, status: 'completed' });
                console.log(`예약 ${reservation.id} 자동 완료 처리`);
              } else {
                updatedReservations.push(reservation);
              }
            } catch (error) {
              console.error('예약 완료 처리 실패:', error);
              updatedReservations.push(reservation);
            }
          }
          // 대기중인 예약은 취소로
          else if (reservation.status === 'pending') {
            try {
              const response = await fetch(`/api/reservations/${reservation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  status: 'cancelled',
                  rejection_reason: '예약일이 지나 자동 취소되었습니다.'
                })
              });
              
              if (response.ok) {
                updatedReservations.push({ 
                  ...reservation, 
                  status: 'cancelled',
                  rejection_reason: '예약일이 지나 자동 취소되었습니다.'
                });
                console.log(`예약 ${reservation.id} 자동 취소 처리`);
              } else {
                updatedReservations.push(reservation);
              }
            } catch (error) {
              console.error('예약 취소 처리 실패:', error);
              updatedReservations.push(reservation);
            }
          } else {
            updatedReservations.push(reservation);
          }
        } else {
          updatedReservations.push(reservation);
        }
      } else {
        updatedReservations.push(reservation);
      }
    }
    
    return updatedReservations;
  };

  const loadAllReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { reservations: data } = await getMyReservations();
      
      // 만료된 예약 상태 업데이트
      const updatedData = await updateExpiredReservations(data || []);
      setAllReservations(updatedData);
      
      // 각 탭의 개수 계산
      const counts: Record<string, number> = {
        all: updatedData?.length || 0,
        pending: updatedData?.filter((r: any) => r.status === 'pending').length || 0,
        approved: updatedData?.filter((r: any) => r.status === 'approved').length || 0,
        completed: updatedData?.filter((r: any) => r.status === 'completed').length || 0,
        cancelled: updatedData?.filter((r: any) => r.status === 'cancelled' || r.status === 'rejected').length || 0,
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
    } else if (activeTab === 'cancelled') {
      setReservations(allReservations.filter(r => r.status === 'cancelled' || r.status === 'rejected'));
    } else {
      setReservations(allReservations.filter(r => r.status === activeTab));
    }
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };
  
  // 페이지 변경 시 URL 업데이트
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('tab', activeTab);
    params.set('perPage', itemsPerPage.toString());
    router.push(`/reservations?${params.toString()}`);
  };
  
  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.set('tab', activeTab);
    params.set('perPage', perPage.toString());
    router.push(`/reservations?${params.toString()}`);
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('정말 예약을 취소하시겠습니까?')) return;

    try {
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
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20',
          border: 'border-amber-200/50 dark:border-amber-700/50',
          text: 'text-amber-700 dark:text-amber-400',
          icon: AlertCircle,
          gradient: 'from-amber-500 to-yellow-500'
        };
      case 'approved':
        return {
          bg: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
          border: 'border-emerald-200/50 dark:border-emerald-700/50',
          text: 'text-emerald-700 dark:text-emerald-400',
          icon: CheckCircle2,
          gradient: 'from-emerald-500 to-green-500'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20',
          border: 'border-gray-200/50 dark:border-gray-700/50',
          text: 'text-gray-700 dark:text-gray-400',
          icon: CheckCircle2,
          gradient: 'from-gray-500 to-slate-500'
        };
      case 'cancelled':
      case 'rejected':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20',
          border: 'border-red-200/50 dark:border-red-700/50',
          text: 'text-red-700 dark:text-red-400',
          icon: XCircle,
          gradient: 'from-red-500 to-rose-500'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200/50 dark:border-gray-700/50',
          text: 'text-gray-700 dark:text-gray-400',
          icon: AlertCircle,
          gradient: 'from-gray-500 to-gray-500'
        };
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

  // 현재 페이지의 예약 목록
  const currentReservations = reservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(reservations.length / itemsPerPage);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* 페이지 타이틀 - 공간 확대 */}
          <div className="px-5 py-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">내 예약</h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-1">예약 현황을 확인하고 관리하세요</p>
              </div>
            </motion.div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="px-5 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', '1');
                    params.set('tab', tab.id);
                    params.set('perPage', itemsPerPage.toString());
                    router.push(`/reservations?${params.toString()}`);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg"
                      transition={{ type: "spring", bounce: 0.2 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.label}
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs rounded-full ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tabCounts[tab.id] || 0}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 페이지네이션 (상단 고정) */}
          {reservations.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {reservations.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, reservations.length)}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 text-sm font-medium rounded-lg transition-all ${
                            pageNum === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="ml-2 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="5">5개</option>
                    <option value="10">10개</option>
                    <option value="20">20개</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 컨텐츠 영역 */}
      <div className="max-w-4xl mx-auto px-5 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">오류가 발생했습니다</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={loadAllReservations} className="text-indigo-600 hover:underline">
              다시 시도
            </button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">예약 내역이 없습니다</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">새로운 예약을 만들어보세요!</p>
            <a href="/reservations/new" className="text-indigo-600 hover:underline">
              예약하러 가기
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {currentReservations.map((reservation, index) => {
              const statusStyle = getStatusStyle(reservation.status);
              const StatusIcon = statusStyle.icon;
              
              return (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <div className={`relative bg-white dark:bg-gray-900 rounded-2xl border ${statusStyle.border} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusStyle.gradient}`} />
                    
                    <div className="p-6">
                      {/* 헤더 */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                            {reservation.devices?.device_types?.name}
                            {reservation.devices?.device_types?.model_name && (
                              <>
                                <br className="md:hidden" />
                                <span className="font-medium text-gray-600 dark:text-gray-400 md:ml-1">
                                  {reservation.devices.device_types.model_name}
                                </span>
                              </>
                            )}
                          </h3>
                          {reservation.devices?.device_number && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reservation.devices.device_number}번 기기
                            </p>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.border} border`}>
                          <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
                          <span className={`text-sm font-medium ${statusStyle.text}`}>
                            {getStatusText(reservation.status)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 예약 정보 */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(reservation.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatTime(reservation.start_time, reservation.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{reservation.total_amount?.toLocaleString()}원</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Sparkles className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {reservation.credit_type === 'fixed' ? '고정크레딧' : 
                             reservation.credit_type === 'freeplay' ? '프리플레이' : 
                             reservation.credit_type === 'unlimited' ? '무한크레딧' : 
                             reservation.credit_type}
                          </span>
                        </div>
                      </div>
                      
                      {/* 추가 정보 */}
                      {(reservation.user_notes || reservation.admin_notes || reservation.rejection_reason) && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
                          {reservation.user_notes && (
                            <p className="text-gray-700 dark:text-gray-300 mb-1">💬 {reservation.user_notes}</p>
                          )}
                          {reservation.admin_notes && (
                            <p className="text-gray-700 dark:text-gray-300 mb-1">📝 관리자: {reservation.admin_notes}</p>
                          )}
                          {reservation.rejection_reason && (
                            <p className="text-red-600 dark:text-red-400">❌ 취소 사유: {reservation.rejection_reason}</p>
                          )}
                        </div>
                      )}
                      
                      {/* 액션 버튼 */}
                      {(reservation.status === 'pending' || reservation.status === 'approved') && (
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            예약번호: {reservation.reservation_number}
                          </span>
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            예약 취소
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}