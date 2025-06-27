// 예약 관리 페이지
// 비전공자 설명: 관리자가 예약을 승인, 거절, 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Eye
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

  // Mock 데이터
  useEffect(() => {
    setReservations([
      {
        id: '1',
        user: {
          id: '1',
          name: '김철수',
          phone: '010-1234-5678',
          email: 'kim@example.com'
        },
        device: {
          type_name: '마이마이 DX',
          device_number: 1
        },
        date: '2024-01-26',
        time_slot: '14:00-16:00',
        player_count: 2,
        credit_option: '프리플레이',
        total_price: 75000,
        status: 'pending',
        notes: '친구와 함께 이용합니다',
        created_at: '2024-01-25T10:30:00'
      },
      {
        id: '2',
        user: {
          id: '2',
          name: '이영희',
          phone: '010-2345-6789',
          email: 'lee@example.com'
        },
        device: {
          type_name: '사운드 볼텍스',
          device_number: 2
        },
        date: '2024-01-26',
        time_slot: '16:00-18:00',
        player_count: 1,
        credit_option: '고정 10크레딧',
        total_price: 40000,
        status: 'approved',
        created_at: '2024-01-25T09:15:00',
        reviewed_at: '2024-01-25T11:00:00',
        reviewed_by: '관리자'
      },
      {
        id: '3',
        user: {
          id: '3',
          name: '박민수',
          phone: '010-3456-7890',
          email: 'park@example.com'
        },
        device: {
          type_name: '춘리즘',
          device_number: 1
        },
        date: '2024-01-27',
        time_slot: '10:00-12:00',
        player_count: 1,
        credit_option: '무한크레딧',
        total_price: 60000,
        status: 'pending',
        created_at: '2024-01-25T15:45:00'
      }
    ]);
  }, []);

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
    setIsLoading(true);
    // API 호출 시뮬레이션
    setTimeout(() => {
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
      setIsLoading(false);
    }, 1000);
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

    setIsLoading(true);
    // API 호출 시뮬레이션
    setTimeout(() => {
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
      setIsLoading(false);
      setShowRejectModal(false);
      setRejectingReservationId(null);
      setRejectReason('');
    }, 1000);
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