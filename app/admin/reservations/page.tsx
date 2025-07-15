// 예약 관리 페이지
// 비전공자 설명: 관리자가 예약을 승인, 거절, 관리하는 페이지입니다
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Search,
  // Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Gamepad2,
  Phone,
  MessageSquare,
  Eye,
  X
} from 'lucide-react';
import Link from 'next/link';

// 24시간 이상 시간 포맷팅
const formatTime = (time: string) => {
  if (!time) return '';
  const [hour, minute] = time.split(':');
  if (!hour) return '';
  const h = parseInt(hour);
  // 0~5시는 24~29시로 표시
  if (h >= 0 && h <= 5) {
    return `${h + 24}:${minute || '00'}`;
  }
  return `${hour}:${minute || '00'}`;
};

type Reservation = {
  id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  device: {
    type_name: string;
    device_number: number;
    model_name?: string;
    version_name?: string;
  };
  date: string;
  time_slot: string;
  player_count: number;
  credit_option: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in' | 'no_show';
  notes?: string;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export default function ReservationManagementPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // 전체 예약 데이터 저장
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({}); // 각 탭의 개수 저장
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReservationId, setRejectingReservationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [supabase] = useState(() => createClient());
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 한 페이지에 10개씩 표시

  // Supabase에서 예약 데이터 가져오기
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/reservations');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 데이터를 불러올 수 없습니다');
      }
      
      const { data: reservationsData } = await response.json();
      
      console.log('예약 데이터:', reservationsData);
      
      // 첫 번째 예약 데이터의 구조 확인
      if (reservationsData && reservationsData.length > 0) {
        console.log('첫 번째 예약 데이터 구조:', reservationsData[0]);
      }

      // 데이터 정렬 함수
      const sortReservations = (data: any[]) => {
        return data.sort((a, b) => {
          // 1. 상태별 우선순위
          const statusPriority: Record<string, number> = {
            'pending': 1,    // 대기중
            'approved': 2,   // 승인됨
            'checked_in': 3, // 체크인
            'completed': 4,  // 완료
            'cancelled': 5,  // 취소
            'rejected': 5,   // 거절
            'no_show': 6     // 노쇼
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
            // 날짜를 YYYY-MM-DD 형식으로 파싱
            const [aYear, aMonth, aDay] = a.date.split('-').map(Number);
            const [bYear, bMonth, bDay] = b.date.split('-').map(Number);
            
            // 시간이 있으면 시간도 고려
            let aHour = 0, aMinute = 0, bHour = 0, bMinute = 0;
            if (a.start_time) {
              [aHour, aMinute] = a.start_time.split(':').map(Number);
            }
            if (b.start_time) {
              [bHour, bMinute] = b.start_time.split(':').map(Number);
            }
            
            const aDate = new Date(aYear, aMonth - 1, aDay, aHour, aMinute);
            const bDate = new Date(bYear, bMonth - 1, bDay, bHour, bMinute);
            
            return aDate.getTime() - bDate.getTime();
          } else {
            // 취소/완료/거절/노쇼: 최신순 (생성일 기준)
            const aCreated = new Date(a.created_at || a.updated_at);
            const bCreated = new Date(b.created_at || b.updated_at);
            return bCreated.getTime() - aCreated.getTime();
          }
        });
      };

      // 정렬된 데이터
      const sortedData = sortReservations(reservationsData || []);

      // 데이터 포맷팅
      const formattedData: Reservation[] = sortedData.map((res: any) => ({
        id: res.id,
        user: {
          id: res.users?.id || res.user_id,
          name: res.users?.nickname || res.users?.name || '알 수 없음',
          phone: res.users?.phone || '',
          email: res.users?.email || ''
        },
        device: {
          type_name: res.devices?.device_types?.name || res.device_type_name || '알 수 없음',
          device_number: res.devices?.device_number || res.device_number || 0,
          model_name: res.devices?.device_types?.model_name,
          version_name: res.devices?.device_types?.version_name
        },
        date: res.date || '',
        time_slot: res.start_time && res.end_time ? 
          `${res.start_time}-${res.end_time}` : '',
        player_count: res.player_count || 1,
        credit_option: (() => {
          if (res.credit_type === 'fixed') return '고정크레딧';
          if (res.credit_type === 'freeplay') return '프리플레이';
          if (res.credit_type === 'unlimited') return '무한크레딧';
          return res.credit_type || '알 수 없음';
        })(),
        total_price: res.total_amount || 0,
        status: res.status,
        notes: res.user_notes,
        admin_notes: res.admin_notes,
        created_at: res.created_at,
        reviewed_at: res.approved_at || res.updated_at,
        reviewed_by: res.approved_by || (res.status !== 'pending' ? '관리자' : undefined)
      }));

      setAllReservations(formattedData);
      
      // 각 탭의 개수 계산
      const counts: Record<string, number> = {
        all: formattedData.length,
        pending: formattedData.filter(r => r.status === 'pending').length,
        approved: formattedData.filter(r => r.status === 'approved').length,
        cancelled: formattedData.filter(r => r.status === 'cancelled' || r.status === 'rejected').length,
        completed: formattedData.filter(r => r.status === 'completed').length,
        no_show: formattedData.filter(r => r.status === 'no_show').length
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('예약 데이터 불러오기 실패:', error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };


  // 초기 로드
  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터링 및 검색 처리
  useEffect(() => {
    if (allReservations.length > 0) {
      filterReservations();
    }
  }, [selectedStatus, searchQuery, selectedDate, allReservations]);

  // 필터링 함수
  const filterReservations = () => {
    let filtered = [...allReservations];
    
    // 상태 필터링
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'cancelled') {
        filtered = filtered.filter(r => r.status === 'cancelled' || r.status === 'rejected');
      } else {
        filtered = filtered.filter(r => r.status === selectedStatus);
      }
    }
    
    // 검색 필터링
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.phone.includes(searchQuery) ||
        r.device.type_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 날짜 필터링
    if (selectedDate) {
      filtered = filtered.filter(r => r.date === selectedDate);
    }
    
    setReservations(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  useEffect(() => {

    // 실시간 업데이트 구독
    const channel = supabase
      .channel('reservations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();


    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, fetchReservations]);


  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Timer className="w-4 h-4" />
            승인 대기
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            승인됨
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            취소됨
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
            <XCircle className="w-4 h-4" />
            취소됨
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <CheckCircle className="w-4 h-4" />
            완료됨
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
            <CheckCircle className="w-4 h-4" />
            체크인
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
            <AlertCircle className="w-4 h-4" />
            노쇼
          </span>
        );
      default:
        return null;
    }
  };

  const handleApprove = async (reservationId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reservationId,
          status: 'approved',
          reviewedBy: '관리자'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 승인에 실패했습니다');
      }

      // 로컬 상태 업데이트
      const updatedReservations = allReservations.map(r => 
        r.id === reservationId 
          ? { 
              ...r, 
              status: 'approved' as const, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자'
            }
          : r
      );
      setAllReservations(updatedReservations);
      
      // 탭 개수 업데이트
      const counts = { ...tabCounts };
      counts.pending = (counts.pending || 1) - 1;
      counts.approved = (counts.approved || 0) + 1;
      setTabCounts(counts);
    } catch (error) {
      console.error('예약 승인 실패:', error);
      alert('예약 승인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (reservationId: string) => {
    setRejectingReservationId(reservationId);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: rejectingReservationId,
          status: 'rejected',
          reviewedBy: '관리자',
          notes: `취소 사유: ${rejectReason}`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 거절에 실패했습니다');
      }

      // 로컬 상태 업데이트
      const updatedReservations = allReservations.map(r => 
        r.id === rejectingReservationId 
          ? { 
              ...r, 
              status: 'rejected' as const, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자',
              notes: `취소 사유: ${rejectReason}`
            }
          : r
      );
      setAllReservations(updatedReservations);
      
      // 탭 개수 업데이트
      const counts = { ...tabCounts };
      counts.pending = (counts.pending || 1) - 1;
      counts.cancelled = (counts.cancelled || 0) + 1;
      setTabCounts(counts);
      
      setShowRejectModal(false);
      setRejectingReservationId(null);
      setRejectReason('');
    } catch (error) {
      console.error('예약 취소 실패:', error);
      alert('예약 취소에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 상단 고정 헤더 */}
      <div className="sticky top-0 z-40 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="w-full px-3 sm:px-6">
          {/* 페이지 타이틀 */}
          <div className="pt-4 pb-3">
            <h1 className="text-xl sm:text-2xl font-bold dark:text-white mb-1">예약 관리</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              예약 요청을 검토하고 승인/취소합니다
            </p>
          </div>

          {/* 상태 필터 탭 - 모바일 최적화 */}
          <div className="w-full overflow-x-auto">
            <div className="flex gap-1 pb-2 min-w-max">
              {Object.entries(tabCounts).map(([status, count]) => {
                // rejected 상태와 동일한 경우 cancelled로 처리
                const isActive = selectedStatus === status || 
                                (selectedStatus === 'rejected' && status === 'cancelled');
                
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap relative rounded-lg transition-all ${
                      isActive
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status === 'all' && '전체'}
                    {status === 'pending' && '대기'}
                    {status === 'approved' && '승인'}
                    {status === 'cancelled' && '취소'}
                    {status === 'completed' && '완료'}
                    {status === 'no_show' && '노쇼'}
                    <span className="ml-1 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="py-2 sm:py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름, 전화번호 검색"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 페이지네이션 (상단) */}
          {reservations.length > itemsPerPage && (
            <div className="py-3 flex items-center justify-center border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {currentPage} / {Math.ceil(reservations.length / itemsPerPage)} 페이지
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(reservations.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(reservations.length / itemsPerPage)}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="w-full px-3 py-3 sm:px-6 sm:py-4 min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* 예약 목록 */}
        {reservations.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 md:gap-6">
            {reservations
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* 모바일: 카드 레이아웃 */}
                <div className="md:hidden">
                  <div className="p-3">
                    {/* 상단: 상태와 액션 버튼 */}
                    <div className="flex items-center justify-between mb-3">
                      {getStatusBadge(reservation.status)}
                      <div className="flex items-center gap-2">
                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(reservation.id)}
                              disabled={isLoading}
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                              title="승인"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(reservation.id)}
                              disabled={isLoading}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                              title="거절"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>

                    {/* 예약자 정보 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{reservation.user.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{reservation.user.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* 예약 정보 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Gamepad2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">기기:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reservation.device.type_name} #{reservation.device.device_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">날짜:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(reservation.date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">시간:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(() => {
                            const parts = reservation.time_slot.split('-');
                            const start = parts[0] || '';
                            const end = parts[1] || '';
                            return `${formatTime(start)} - ${formatTime(end)}`;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* 하단: 금액 */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">결제 금액</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₩{reservation.total_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* 메모 */}
                    {reservation.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {reservation.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 데스크톱: 테이블 형태 레이아웃 */}
                <div className="hidden md:block">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      {/* 예약자 정보 */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{reservation.user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{reservation.user.phone}</p>
                        </div>
                      </div>

                      {/* 기기 정보 */}
                      <div className="min-w-[150px]">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reservation.device.type_name} #{reservation.device.device_number}
                        </p>
                        {reservation.device.model_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {reservation.device.model_name}
                          </p>
                        )}
                      </div>

                      {/* 날짜/시간 */}
                      <div className="min-w-[180px]">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(reservation.date).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(() => {
                            const parts = reservation.time_slot.split('-');
                            const start = parts[0] || '';
                            const end = parts[1] || '';
                            return `${formatTime(start)} - ${formatTime(end)}`;
                          })()}
                        </p>
                      </div>

                      {/* 상태 */}
                      <div className="min-w-[100px]">
                        {getStatusBadge(reservation.status)}
                      </div>

                      {/* 금액 */}
                      <div className="min-w-[100px] text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ₩{reservation.total_price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 ml-4">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            disabled={isLoading}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                            title="승인"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(reservation.id)}
                            disabled={isLoading}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                            title="거절"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="상세보기"
                      >
                        <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* 메모가 있는 경우 */}
                  {reservation.notes && (
                    <div className="px-4 pb-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          {reservation.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              해당하는 예약이 없습니다
            </p>
          </div>
        )}


        {/* 안내 메시지 */}
        {(tabCounts.pending || 0) > 0 && (
        <div className="mt-4 sm:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm sm:text-base font-medium text-yellow-800 dark:text-yellow-200 mb-0.5 sm:mb-1">
                승인 대기중인 예약이 {tabCounts.pending}건 있습니다
              </h4>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                가능한 빨리 검토하여 고객에게 알림을 보내주세요.
              </p>
            </div>
          </div>
        </div>
        )}

      {/* 예약 상세 모달 - 모바일 최적화 */}
      <AnimatePresence>
        {selectedReservation && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReservation(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold dark:text-white">예약 상세</h2>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* 컨텐츠 영역 */}
              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                {/* 상태 및 예약자 정보 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    {getStatusBadge(selectedReservation.status)}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(selectedReservation.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{selectedReservation.user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReservation.user.phone}</p>
                    </div>
                  </div>
                </div>

                {/* 예약 정보 카드 */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">예약 정보</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">기기</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReservation.device.type_name} #{selectedReservation.device.device_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">날짜</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReservation.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">시간</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const parts = selectedReservation.time_slot.split('-');
                          const start = parts[0] || '';
                          const end = parts[1] || '';
                          return `${formatTime(start)} - ${formatTime(end)}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">인원</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReservation.player_count}명
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">크레디트</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReservation.credit_option}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">금액</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₩{selectedReservation.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {selectedReservation.notes && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">고객 메모</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedReservation.notes}
                    </p>
                  </div>
                )}
                
                {/* 관리자 메모 */}
                {selectedReservation.admin_notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">관리자 메모</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedReservation.admin_notes}
                    </p>
                  </div>
                )}

                {/* 처리 정보 */}
                {selectedReservation.reviewed_at && (
                  <div className="text-center py-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedReservation.reviewed_at).toLocaleString('ko-KR')} 처리됨
                    {selectedReservation.reviewed_by && ` (${selectedReservation.reviewed_by})`}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 취소 사유 입력 모달 */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowRejectModal(false);
              setRejectingReservationId(null);
              setRejectReason('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold dark:text-white">예약 취소</h2>
            </div>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              예약을 취소하는 사유를 선택해주세요.
            </p>

            <div className="mb-4 sm:mb-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                취소 사유
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="rejectReason"
                  value="대여 인원 부족"
                  checked={rejectReason === '대여 인원 부족'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">대여 인원 부족</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="rejectReason"
                  value="회원 요청"
                  checked={rejectReason === '회원 요청'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">회원 요청</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="rejectReason"
                  value="기타"
                  checked={rejectReason === '기타' || (!['대여 인원 부족', '회원 요청'].includes(rejectReason) && rejectReason !== '')}
                  onChange={() => setRejectReason('기타')}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">기타 (직접 입력)</span>
              </label>
              
              {(rejectReason === '기타' || (!['대여 인원 부족', '회원 요청', ''].includes(rejectReason))) && (
                <textarea
                  value={rejectReason === '기타' ? '' : rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="취소 사유를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  autoFocus
                />
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 sm:mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  취소 사유는 고객에게 알림으로 전송됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingReservationId(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmReject}
                disabled={isLoading || !rejectReason.trim()}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '예약 취소'}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}