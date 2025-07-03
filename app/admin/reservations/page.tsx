// 예약 관리 페이지
// 비전공자 설명: 관리자가 예약을 승인, 거절, 관리하는 페이지입니다
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Edit3,
  X,
  Save
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
  };
  date: string;
  time_slot: string;
  player_count: number;
  credit_option: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in';
  notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export default function ReservationManagementPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // 전체 예약 데이터 저장
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({}); // 각 탭의 개수 저장
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReservationId, setRejectingReservationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [supabase] = useState(() => createClient());
  const [showTimeAdjustment, setShowTimeAdjustment] = useState(false);
  const [adjustedStartTime, setAdjustedStartTime] = useState('');
  const [adjustedEndTime, setAdjustedEndTime] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentReasonType, setAdjustmentReasonType] = useState('');
  
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

      // 데이터 포맷팅
      const formattedData: Reservation[] = (reservationsData || []).map((res: any) => ({
        id: res.id,
        user: {
          id: res.users?.id || res.user_id,
          name: res.users?.name || '알 수 없음',
          phone: res.users?.phone || '',
          email: res.users?.email || ''
        },
        device: {
          type_name: res.devices?.device_types?.name || res.device_type_name || '알 수 없음',
          device_number: res.devices?.device_number || res.device_number || 0
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
        completed: formattedData.filter(r => r.status === 'completed').length
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('예약 데이터 불러오기 실패:', error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 조정 이력 가져오기
  // const fetchTimeAdjustments = async (reservationId: string) => {
  //   try {
  //     const response = await fetch(`/api/admin/reservations/time-adjustment?reservationId=${reservationId}`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setTimeAdjustments(data.adjustments || []);
  //     }
  //   } catch (error) {
  //     console.error('시간 조정 이력 조회 실패:', error);
  //   }
  // };

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 상단 고정 헤더 */}
      <div className="sticky top-16 z-30 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          {/* 페이지 타이틀 */}
          <div className="pt-6 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <h1 className="text-2xl font-bold dark:text-white">예약 관리</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
              예약 요청을 검토하고 승인/취소합니다
            </p>
          </div>

          {/* 상태 필터 탭 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
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
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap relative transition-all ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {status === 'all' && '전체'}
                  {status === 'pending' && '승인 대기'}
                  {status === 'approved' && '승인됨'}
                  {status === 'cancelled' && '취소됨'}
                  {status === 'completed' && '완료됨'}
                  <span className="ml-2 text-xs">({count})</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 전화번호, 기기명으로 검색"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 예약 목록 */}
        <div className="space-y-4">
          {reservations
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((reservation, index) => (
          <motion.div
            key={reservation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 상단 정보 */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white">{reservation.user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{reservation.user.phone}</p>
                    </div>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>

                {/* 예약 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {reservation.device.type_name} #{reservation.device.device_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(reservation.date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const parts = reservation.time_slot.split('-');
                        const start = parts[0] || '';
                        const end = parts[1] || '';
                        return `${formatTime(start)} - ${formatTime(end)}`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* 추가 정보 */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">인원: </span>
                    <span className="font-medium dark:text-white">{reservation.player_count}명</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">크레딧: </span>
                    <span className="font-medium dark:text-white">{reservation.credit_option}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">금액: </span>
                    <span className="font-medium dark:text-white">₩{reservation.total_price.toLocaleString()}</span>
                  </div>
                </div>

                {/* 메모 */}
                {reservation.notes && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      {reservation.notes}
                    </p>
                  </div>
                )}

                {/* 타임스탬프 */}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                  신청: {new Date(reservation.created_at).toLocaleString('ko-KR')}
                  {reservation.reviewed_at && (
                    <span className="ml-3">
                      처리: {new Date(reservation.reviewed_at).toLocaleString('ko-KR')} ({reservation.reviewed_by})
                    </span>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => setSelectedReservation(reservation)}
                  className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {reservation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(reservation.id)}
                      disabled={isLoading}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(reservation.id)}
                      disabled={isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
          ))}

          {reservations.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                해당하는 예약이 없습니다
              </p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {reservations.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(reservations.length / itemsPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  const totalPages = Math.ceil(reservations.length / itemsPerPage);
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 2) return true;
                  return false;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  return (
                    <React.Fragment key={page}>
                      {index > 0 && prevPage !== undefined && prevPage < page - 1 && (
                        <span className="px-2 py-1">...</span>
                      )}
                      <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                    </React.Fragment>
                  );
                })
              }
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(reservations.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(reservations.length / itemsPerPage)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 안내 메시지 */}
        {(tabCounts.pending || 0) > 0 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                승인 대기중인 예약이 {tabCounts.pending}건 있습니다
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                가능한 빨리 검토하여 고객에게 알림을 보내주세요.
              </p>
            </div>
          </div>
        </div>
        )}

      {/* 예약 상세 모달 */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold dark:text-white">예약 상세</h2>
              <button
                onClick={() => {
                  setSelectedReservation(null);
                  setShowTimeAdjustment(false);
                  setAdjustedStartTime('');
                  setAdjustedEndTime('');
                  setAdjustmentReason('');
                  setAdjustmentReasonType('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* 예약 정보 */}
            <div className="space-y-6">
              {/* 예약자 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">예약자 정보</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm dark:text-white">{selectedReservation.user.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm dark:text-white">{selectedReservation.user.phone}</span>
                  </div>
                </div>
              </div>

              {/* 예약 상세 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">예약 상세</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">기기</p>
                      <p className="text-sm font-medium dark:text-white">
                        {selectedReservation.device.type_name} #{selectedReservation.device.device_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">날짜</p>
                      <p className="text-sm font-medium dark:text-white">
                        {new Date(selectedReservation.date).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">시간</p>
                      <p className="text-sm font-medium dark:text-white">
                        {(() => {
                          const parts = selectedReservation.time_slot.split('-');
                          const start = parts[0] || '';
                          const end = parts[1] || '';
                          return `${formatTime(start)} - ${formatTime(end)}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">인원</p>
                      <p className="text-sm font-medium dark:text-white">
                        {selectedReservation.player_count}명
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">크레딧</p>
                      <p className="text-sm font-medium dark:text-white">
                        {selectedReservation.credit_option}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">금액</p>
                      <p className="text-sm font-medium dark:text-white">
                        ₩{selectedReservation.total_price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시간 조정 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">시간 조정</h3>
                  {!showTimeAdjustment && (
                    <button
                      onClick={() => {
                        setShowTimeAdjustment(true);
                        const [start, end] = selectedReservation.time_slot.split('-');
                        setAdjustedStartTime(start || '');
                        setAdjustedEndTime(end || '');
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit3 className="w-4 h-4" />
                      시간 변경
                    </button>
                  )}
                </div>

                {showTimeAdjustment ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          시작 시간
                        </label>
                        <input
                          type="time"
                          value={adjustedStartTime}
                          onChange={(e) => setAdjustedStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          종료 시간
                        </label>
                        <input
                          type="time"
                          value={adjustedEndTime}
                          onChange={(e) => setAdjustedEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        변경 사유
                      </label>
                      <div className="space-y-2 mb-3">
                        {[
                          { value: 'customer_request', label: '고객 요청' },
                          { value: 'schedule_conflict', label: '일정 충돌' },
                          { value: 'device_issue', label: '기기 문제' },
                          { value: 'staff_shortage', label: '직원 부족' },
                          { value: 'other', label: '기타 (직접 입력)' }
                        ].map((reason) => (
                          <label key={reason.value} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="adjustmentReason"
                              value={reason.value}
                              checked={adjustmentReasonType === reason.value}
                              onChange={(e) => {
                                setAdjustmentReasonType(e.target.value);
                                if (e.target.value !== 'other') {
                                  setAdjustmentReason(reason.label);
                                } else {
                                  setAdjustmentReason('');
                                }
                              }}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{reason.label}</span>
                          </label>
                        ))}
                      </div>
                      {adjustmentReasonType === 'other' && (
                        <textarea
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                          placeholder="변경 사유를 입력해주세요 (선택사항)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowTimeAdjustment(false);
                          setAdjustedStartTime('');
                          setAdjustedEndTime('');
                          setAdjustmentReason('');
                          setAdjustmentReasonType('');
                        }}
                        className="flex-1 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            const response = await fetch('/api/admin/reservations/time-adjustment', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                reservationId: selectedReservation.id,
                                startTime: adjustedStartTime,
                                endTime: adjustedEndTime,
                                reason: adjustmentReason || '관리자 수동 조정'
                              })
                            });

                            const data = await response.json();

                            if (response.ok) {
                              alert('시간이 성공적으로 조정되었습니다.');
                              setShowTimeAdjustment(false);
                              setSelectedReservation(null);
                              fetchReservations();
                            } else {
                              alert(`시간 조정 실패: ${data.error}`);
                            }
                          } catch (error) {
                            console.error('시간 조정 오류:', error);
                            alert('시간 조정 중 오류가 발생했습니다.');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? '처리 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      현재 예약 시간: {selectedReservation.time_slot}
                    </p>
                  </div>
                )}
              </div>

              {/* 메모 */}
              {selectedReservation.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">메모</h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedReservation.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* 시간 조정 이력 
              timeAdjustments && timeAdjustments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">시간 조정 이력</h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                    {timeAdjustments.map((adjustment: any, index: number) => (
                      <div key={adjustment.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm">
                            <p className="font-medium dark:text-white">
                              {new Date(adjustment.old_start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(adjustment.old_end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              <span className="mx-2 text-gray-400">→</span>
                              {new Date(adjustment.new_start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(adjustment.new_end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              사유: {adjustment.reason}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(adjustment.created_at).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          조정자: {adjustment.adjusted_by_user?.name || '관리자'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) */}

              {/* 상태 및 타임스탬프 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">상태 정보</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">현재 상태</span>
                    {getStatusBadge(selectedReservation.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">신청 시간</span>
                    <span className="text-sm dark:text-white">
                      {new Date(selectedReservation.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  {selectedReservation.reviewed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">처리 시간</span>
                      <span className="text-sm dark:text-white">
                        {new Date(selectedReservation.reviewed_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 취소 사유 입력 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold dark:text-white">예약 취소</h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              예약을 취소하는 사유를 선택해주세요.
            </p>

            <div className="mb-6 space-y-3">
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

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
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
                className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmReject}
                disabled={isLoading || !rejectReason.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '예약 취소'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </main>
  );
}