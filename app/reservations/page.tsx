// 예약 목록 페이지
// 비전공자 설명: 사용자의 예약 내역을 확인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, CreditCard, ChevronLeft, ChevronRight, Loader2, Gamepad2, Clock, Sparkles, AlertCircle, CheckCircle2, XCircle, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyReservations, cancelReservation } from '@/lib/api/reservations';
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';

// 시간대 구분 함수
const getShiftType = (startTime: string) => {
  if (!startTime) return null;
  const [hour] = startTime.split(':');
  const h = parseInt(hour);
  
  if (h >= 6 && h <= 23) {
    return 'early'; // 조기영업 (06:00-23:59)
  } else if (h >= 0 && h <= 5) {
    return 'night'; // 밤샘영업 (00:00-05:59)
  }
  return null;
};

// 시간대 뱃지 스타일
const getShiftBadgeStyle = (shiftType: string | null) => {
  switch (shiftType) {
    case 'early':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        label: '조기'
      };
    case 'night':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-300',
        label: '밤샘'
      };
    default:
      return null;
  }
};

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [activeTab, setActiveTab] = useState('all');
  const [reservations, setReservations] = useState<any[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 영업일 기준 날짜 변환 함수
  const getBusinessDate = (date: string, startTime: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour] = startTime.split(':').map(Number);
    
    // 0~5시는 전날 영업일로 간주
    if (hour >= 0 && hour <= 5) {
      const businessDate = new Date(year, month - 1, day - 1);
      return businessDate;
    } else {
      const businessDate = new Date(year, month - 1, day);
      return businessDate;
    }
  };

  // 데이터 정렬 함수 (기획서 기준: 대기중 → 승인 → 체크인 → 완료/취소)
  const sortReservationsData = (data: any[]) => {
    return [...data].sort((a, b) => {
      // 1. 상태별 우선순위
      const statusPriority: Record<string, number> = {
        'pending': 1,    // 대기중
        'approved': 2,   // 승인됨
        'checked_in': 3, // 체크인
        'completed': 4,  // 완료
        'cancelled': 4,  // 취소 (완료와 동일 순위)
        'rejected': 4,   // 거절 (완료와 동일 순위)
        'no_show': 5     // 노쇼
      };

      const aPriority = statusPriority[a.status] || 999;
      const bPriority = statusPriority[b.status] || 999;

      // 상태가 다르면 우선순위로 정렬
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 같은 상태 내에서 정렬
      if (a.status === 'pending' || a.status === 'approved' || a.status === 'checked_in') {
        // 대기중/승인됨/체크인: 대여일이 가까운 순
        
        // 날짜가 없는 경우 기본값 처리
        if (!a.date || !b.date) {
          return a.date ? -1 : (b.date ? 1 : 0);
        }
        
        // 영업일 기준으로 날짜 계산
        const aBusinessDate = getBusinessDate(a.date, a.start_time || '00:00:00');
        const bBusinessDate = getBusinessDate(b.date, b.start_time || '00:00:00');
        
        // 시간 파싱
        let aHour = 0, aMinute = 0, bHour = 0, bMinute = 0;
        if (a.start_time) {
          const timeParts = a.start_time.split(':');
          aHour = parseInt(timeParts[0] || '0');
          aMinute = parseInt(timeParts[1] || '0');
        }
        if (b.start_time) {
          const timeParts = b.start_time.split(':');
          bHour = parseInt(timeParts[0] || '0');
          bMinute = parseInt(timeParts[1] || '0');
        }
        
        // 먼저 영업일 비교
        const businessDateDiff = aBusinessDate.getTime() - bBusinessDate.getTime();
        if (businessDateDiff !== 0) {
          return businessDateDiff;
        }
        
        // 같은 영업일이면 시간대별로 구분
        // 조기영업(06:00-23:59)과 밤샘영업(00:00-05:59) 구분
        const aIsNightShift = aHour >= 0 && aHour <= 5;
        const bIsNightShift = bHour >= 0 && bHour <= 5;
        
        // 같은 영업일에서 조기영업이 먼저, 밤샘영업이 뒤로
        if (aIsNightShift !== bIsNightShift) {
          return aIsNightShift ? 1 : -1; // 조기영업(false)이 먼저, 밤샘영업(true)이 뒤로
        }
        
        // 같은 시간대 내에서는 실제 시간 순서로
        const aActualMinutes = aHour * 60 + aMinute;
        const bActualMinutes = bHour * 60 + bMinute;
        
        return aActualMinutes - bActualMinutes;
      } else {
        // 완료/취소/거절/노쇼: 최신순 (생성일 기준)
        const aCreated = new Date(a.created_at || a.updated_at);
        const bCreated = new Date(b.created_at || b.updated_at);
        return bCreated.getTime() - aCreated.getTime();
      }
    });
  };

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
    if (status !== 'loading') {
      loadAllReservations();
    }
  }, [status, session]);

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
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const { reservations: data } = await getMyReservations();
      
      // 만료된 예약 상태 업데이트
      const updatedData = await updateExpiredReservations(data || []);
      
      // 정렬 적용
      const sortedData = sortReservationsData(updatedData);
      setAllReservations(sortedData);
      
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
    let filtered;
    if (activeTab === 'all') {
      filtered = allReservations;
    } else if (activeTab === 'cancelled') {
      filtered = allReservations.filter(r => r.status === 'cancelled' || r.status === 'rejected');
    } else {
      filtered = allReservations.filter(r => r.status === activeTab);
    }
    
    // 필터링 후 정렬 적용
    const sortedFiltered = sortReservationsData(filtered);
    setReservations(sortedFiltered);
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

  const handleCancel = (reservationId: string) => {
    if (!session) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return;
    }
    
    setCancelTargetId(reservationId);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelTargetId) return;
    
    setIsCancelling(true);
    try {
      await cancelReservation(cancelTargetId);
      loadAllReservations();
      setShowCancelModal(false);
      setCancelTargetId(null);
      showToastMessage('예약이 성공적으로 취소되었습니다');
    } catch (error: any) {
      console.error('예약 취소 오류:', error);
      showToastMessage(error.message || '예약 취소에 실패했습니다');
    } finally {
      setIsCancelling(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelTargetId(null);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    
    // 3초 후 토스트 자동 닫기
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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


  // 현재 페이지의 예약 목록
  const currentReservations = reservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(reservations.length / itemsPerPage);

  // 인증 상태 확인
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">로그인이 필요합니다</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 - 예약 조회 버튼 추가 */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">내 예약</h1>
        <button
          onClick={() => router.push('/reservations/search')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Search className="w-4 h-4" />
          예약번호 조회
        </button>
      </div>

      {/* 상태별 탭 네비게이션 */}
      <div className="mb-6">
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

      {/* 페이지네이션 */}
      {reservations.length > 0 && (
        <div className="mb-6 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
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

      {/* 컨텐츠 영역 */}
      <div>
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
                          {(() => {
                            const shiftType = getShiftType(reservation.start_time);
                            const badgeStyle = getShiftBadgeStyle(shiftType);
                            
                            if (badgeStyle) {
                              return (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                                  {badgeStyle.label}
                                </span>
                              );
                            }
                            return null;
                          })()}
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
      
      {/* 예약 취소 확인 모달 */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeCancelModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="relative bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">예약 취소</h2>
                  </div>
                  <button
                    onClick={closeCancelModal}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      정말 예약을 취소하시겠습니까?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      한번 취소된 예약은 되돌릴 수 없습니다.
                    </p>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={closeCancelModal}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    disabled={isCancelling}
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={confirmCancel}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        취소 중...
                      </>
                    ) : (
                      '예약 취소'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 토스트 알림 */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {toastMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowToast(false)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 진행 바 */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}