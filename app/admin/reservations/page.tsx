// 예약 관리 페이지
// 비전공자 설명: 관리자가 예약을 승인, 거절, 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Search,
  Filter,
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export default function ReservationManagementPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
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

  // Supabase에서 예약 데이터 가져오기
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const { data: reservationsData, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users (
            id,
            name,
            phone,
            email
          ),
          rental_time_slots (
            date,
            start_time,
            end_time,
            device_type_id,
            price
          ),
          device_types (
            name,
            company
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 데이터 포맷팅
      const formattedReservations: Reservation[] = (reservationsData || []).map(res => ({
        id: res.id,
        user: {
          id: res.users.id,
          name: res.users.name,
          phone: res.users.phone,
          email: res.users.email
        },
        device: {
          type_name: res.device_types?.name || '알 수 없음',
          device_number: res.device_number
        },
        date: res.rental_time_slots?.date || '',
        time_slot: res.rental_time_slots ? 
          `${res.rental_time_slots.start_time.slice(0, 5)}-${res.rental_time_slots.end_time.slice(0, 5)}` : '',
        player_count: res.player_count || 1,
        credit_option: res.notes?.includes('무한크레딧') ? '무한크레딧' : 
                       res.notes?.includes('프리플레이') ? '프리플레이' : '고정크레딧',
        total_price: res.total_price,
        status: res.status,
        notes: res.notes,
        created_at: res.created_at,
        reviewed_at: res.approved_at || res.updated_at,
        reviewed_by: res.approved_by || (res.status !== 'pending' ? '관리자' : undefined)
      }));

      setReservations(formattedReservations);
    } catch (error) {
      console.error('예약 데이터 불러오기 실패:', error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 조정 이력 가져오기
  const fetchTimeAdjustments = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/time-adjustment?reservationId=${reservationId}`);
      if (response.ok) {
        const data = await response.json();
        setTimeAdjustments(data.adjustments || []);
      }
    } catch (error) {
      console.error('시간 조정 이력 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // 필터링된 예약 목록
  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = selectedStatus === 'all' || reservation.status === selectedStatus;
    const matchesSearch = reservation.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.user.phone.includes(searchQuery) ||
                         reservation.device.type_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || reservation.date === selectedDate;
    return matchesStatus && matchesSearch && matchesDate;
  });

  // 상태별 개수
  const statusCounts = {
    all: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    rejected: reservations.filter(r => r.status === 'rejected').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    completed: reservations.filter(r => r.status === 'completed').length
  };

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
            거절됨
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
    }
  };

  const handleApprove = async (reservationId: string) => {
    try {
      setIsLoading(true);
      
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id || 'admin'
        })
        .eq('id', reservationId);

      if (error) throw error;

      // 로컬 상태 업데이트 (실시간 업데이트로 자동 갱신되지만 빠른 UI 반영을 위해)
      setReservations(reservations.map(r => 
        r.id === reservationId 
          ? { 
              ...r, 
              status: 'approved', 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자'
            }
          : r
      ));
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
      
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user?.id || 'admin',
          notes: `거절 사유: ${rejectReason}`
        })
        .eq('id', rejectingReservationId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setReservations(reservations.map(r => 
        r.id === rejectingReservationId 
          ? { 
              ...r, 
              status: 'rejected', 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자',
              notes: `거절 사유: ${rejectReason}`
            }
          : r
      ));
      
      setShowRejectModal(false);
      setRejectingReservationId(null);
      setRejectReason('');
    } catch (error) {
      console.error('예약 거절 실패:', error);
      alert('예약 거절에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
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
          예약 요청을 검토하고 승인/거절합니다
        </p>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'all' && '전체'}
            {status === 'pending' && '승인 대기'}
            {status === 'approved' && '승인됨'}
            {status === 'rejected' && '거절됨'}
            {status === 'cancelled' && '취소됨'}
            {status === 'completed' && '완료됨'}
            <span className="ml-2 text-xs">({count})</span>
          </button>
        ))}
      </div>

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
        {filteredReservations.map((reservation, index) => (
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
                      {reservation.time_slot}
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

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              해당하는 예약이 없습니다
            </p>
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      {statusCounts.pending > 0 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                승인 대기중인 예약이 {statusCounts.pending}건 있습니다
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
                        {selectedReservation.time_slot}
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
                        setAdjustedStartTime(start);
                        setAdjustedEndTime(end);
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
                        저장
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

      {/* 거절 사유 입력 모달 */}
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
              <h2 className="text-xl font-semibold dark:text-white">예약 거절</h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              예약을 거절하는 사유를 입력해주세요.
              고객에게 전달될 수 있으니 친절하게 작성해주세요.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                거절 사유
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="예: 해당 시간대에 이미 다른 예약이 확정되어 있습니다."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  거절 사유는 고객에게 알림으로 전송됩니다.
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
                {isLoading ? '처리 중...' : '거절하기'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}