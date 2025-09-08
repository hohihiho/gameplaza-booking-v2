'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// import { useSession } from "@/lib/auth-compat"; // D1 마이그레이션 중 임시 제거
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Hash,
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, XCircle,
  X, Copy, Check, CreditCard, QrCode, Smartphone
} from 'lucide-react';
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';

// v2 API 응답 타입
interface ReservationDetailV2 {
  reservation: {
    id: string;
    userId: string;
    deviceId: string;
    date: string;
    timeSlot: {
      startHour: number;
      endHour: number;
    };
    status: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
  };
  device?: {
    id: string;
    deviceNumber: string;
    name: string;
    type: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// v1 API 응답 타입 (예약 목록 페이지의 타입 참고)
interface ReservationDetailV1 {
  id: string;
  reservation_number?: string;
  user_id: string;
  device_id: string;
  device_name?: string;
  device_type?: string;
  device_number?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  start_hour?: number;
  end_hour?: number;
  credit_type: string;
  player_count: number;
  total_amount: number;
  status: string;
  user_notes?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  devices?: {
    device_number: string;
    device_types: {
      name: string;
      model_name: string;
    };
  };
}


// v1 응답을 v2 형식으로 정규화
function normalizeReservation(data: any): ReservationDetailV2 {
  // v2 형식인 경우 그대로 반환
  if (data.reservation) {
    return data as ReservationDetailV2;
  }
  
  // v1 형식인 경우 변환
  const v1Data = data as ReservationDetailV1;
  return {
    reservation: {
      id: v1Data.id,
      userId: v1Data.user_id,
      deviceId: v1Data.device_id,
      date: v1Data.date,
      timeSlot: {
        startHour: v1Data.start_hour || parseInt(v1Data.start_time?.split(':')[0] || '0'),
        endHour: v1Data.end_hour || parseInt(v1Data.end_time?.split(':')[0] || '0')
      },
      status: v1Data.status,
      note: v1Data.user_notes,
      createdAt: v1Data.created_at,
      updatedAt: v1Data.updated_at
    },
    device: v1Data.devices ? {
      id: v1Data.device_id,
      deviceNumber: v1Data.device_number || v1Data.devices.device_number,
      name: v1Data.device_name || v1Data.devices.device_types.name,
      type: v1Data.device_type || v1Data.devices.device_types.model_name
    } : undefined
  };
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  // const { data: session, status } = useSession(); // D1 마이그레이션 중 임시 제거
  const status = 'authenticated'; // 임시 상태
  const session = { user: { role: 'user' } }; // 임시 세션 데이터
  
  const [reservation, setReservation] = useState<ReservationDetailV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 취소 관련 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // 예약번호 복사 상태
  const [isCopied, setIsCopied] = useState(false);
  
  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 예약 정보 로드
  useEffect(() => {
    if (status !== 'loading' && params.id) {
      loadReservation();
    }
  }, [status, params.id]);

  const loadReservation = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // v2 API 사용 여부 확인
      const isV2Enabled = localStorage.getItem('use_v2_api') === 'true';
      const apiUrl = isV2Enabled
        ? `/api/v2/reservations/${params.id}`
        : `/api/reservations/${params.id}`;
      
      const headers: HeadersInit = {};
      if (isV2Enabled && (session as any).accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('예약을 찾을 수 없습니다');
        } else if (response.status === 403) {
          setError('이 예약을 볼 권한이 없습니다');
        } else {
          setError('예약 정보를 불러올 수 없습니다');
        }
        return;
      }
      
      const data = await response.json();
      const normalizedData = normalizeReservation(data);
      setReservation(normalizedData);
    } catch (error) {
      console.error('Failed to load reservation:', error);
      setError('예약 정보를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 예약 취소 가능 여부 확인 (24시간 전까지만 가능)
  const canCancel = () => {
    if (!reservation) return false;
    if (reservation.reservation.status !== 'pending' && reservation.reservation.status !== 'approved') {
      return false;
    }
    
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9
    const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() + kstOffset) * 60 * 1000);
    
    const [year, month, day] = reservation.reservation.date.split('-').map(Number);
    const startHour = reservation.reservation.timeSlot.startHour;
    
    // month와 day가 undefined인 경우 처리
    if (!month || !day) {
      return false;
    }
    
    // 예약 시작 시간 계산
    const reservationStart = new Date(year, month - 1, day, startHour % 24, 0, 0);
    
    // 24시간 이상인 경우 다음날로 처리
    if (startHour >= 24) {
      reservationStart.setDate(reservationStart.getDate() + 1);
    }
    
    // 24시간 전인지 확인
    const hoursUntilStart = (reservationStart.getTime() - kstNow.getTime()) / (1000 * 60 * 60);
    return hoursUntilStart >= 24;
  };

  // 예약 취소 처리
  const handleCancel = async () => {
    if (!reservation) return;
    
    setIsCancelling(true);
    try {
      // v2 API 사용 여부 확인
      const isV2Enabled = localStorage.getItem('use_v2_api') === 'true';
      const apiUrl = isV2Enabled
        ? `/api/v2/reservations/${reservation.reservation.id}`
        : `/api/reservations/${reservation.reservation.id}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (isV2Enabled && (session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
      }
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ reason: cancelReason }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '예약 취소에 실패했습니다');
      }
      
      showToastMessage('예약이 성공적으로 취소되었습니다', 'success');
      setTimeout(() => {
        router.push('/reservations');
      }, 1500);
    } catch (error: any) {
      console.error('Cancel reservation error:', error);
      showToastMessage(error.message || '예약 취소에 실패했습니다', 'error');
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  // 예약번호 복사
  const copyReservationNumber = () => {
    if (!reservation) return;
    
    // v1 API의 경우 예약번호가 없을 수 있으므로 ID를 사용
    const numberToCopy = reservation.reservation.id;
    navigator.clipboard.writeText(numberToCopy);
    setIsCopied(true);
    showToastMessage('예약번호가 복사되었습니다', 'success');
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // 토스트 메시지 표시
  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20',
          border: 'border-amber-200/50 dark:border-amber-700/50',
          text: 'text-amber-700 dark:text-amber-400',
          icon: AlertCircle,
          gradient: 'from-amber-500 to-yellow-500',
          label: '대기중'
        };
      case 'approved':
        return {
          bg: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
          border: 'border-emerald-200/50 dark:border-emerald-700/50',
          text: 'text-emerald-700 dark:text-emerald-400',
          icon: CheckCircle2,
          gradient: 'from-emerald-500 to-green-500',
          label: '승인됨'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20',
          border: 'border-gray-200/50 dark:border-gray-700/50',
          text: 'text-gray-700 dark:text-gray-400',
          icon: CheckCircle2,
          gradient: 'from-gray-500 to-slate-500',
          label: '완료'
        };
      case 'cancelled':
      case 'rejected':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20',
          border: 'border-red-200/50 dark:border-red-700/50',
          text: 'text-red-700 dark:text-red-400',
          icon: XCircle,
          gradient: 'from-red-500 to-rose-500',
          label: '취소'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200/50 dark:border-gray-700/50',
          text: 'text-gray-700 dark:text-gray-400',
          icon: AlertCircle,
          gradient: 'from-gray-500 to-gray-500',
          label: status
        };
    }
  };

  // 날짜 포맷
  const formatDate = (date: string) => {
    const d = parseKSTDate(date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  // 시간 포맷
  const formatTimeSlot = (timeSlot: { startHour: number; endHour: number }) => {
    return `${formatTimeKST(`${timeSlot.startHour}:00`)} - ${formatTimeKST(`${timeSlot.endHour}:00`)}`;
  };


  // 로딩 상태
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 인증 확인
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

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">오류가 발생했습니다</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/reservations')}
            className="text-indigo-600 hover:underline"
          >
            예약 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 예약 정보가 없는 경우
  if (!reservation) {
    return null;
  }

  const statusStyle = getStatusStyle(reservation.reservation.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/reservations')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>예약 목록으로</span>
        </button>
        
        <h1 className="text-3xl font-bold dark:text-white">예약 상세</h1>
      </div>

      {/* 예약 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-white dark:bg-gray-900 rounded-3xl border ${statusStyle.border} shadow-lg overflow-hidden`}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusStyle.gradient}`} />
        
        <div className="p-8">
          {/* 상태 뱃지 */}
          <div className="flex justify-between items-start mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusStyle.bg} ${statusStyle.border} border`}>
              <StatusIcon className={`w-5 h-5 ${statusStyle.text}`} />
              <span className={`font-medium ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            
            {canCancel() && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                예약 취소
              </button>
            )}
          </div>

          {/* 기기 정보 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {reservation.device?.name || '기기 정보 없음'}
            </h2>
            {reservation.device?.type && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {reservation.device.type}
              </p>
            )}
          </div>

          {/* 예약 정보 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 날짜 */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">예약 날짜</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(reservation.reservation.date)}
                </p>
              </div>
            </div>

            {/* 시간 */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">이용 시간</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatTimeSlot(reservation.reservation.timeSlot)}
                </p>
              </div>
            </div>

            {/* 기기 번호 */}
            {reservation.device?.deviceNumber && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Hash className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">기기 번호</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {reservation.device.deviceNumber}번
                  </p>
                </div>
              </div>
            )}

            {/* 예약자 */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">예약자</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {reservation.user?.name || reservation.user?.email || '정보 없음'}
                </p>
              </div>
            </div>
          </div>

          {/* 메모 */}
          {reservation.reservation.note && (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">메모</p>
              <p className="text-gray-900 dark:text-white">
                {reservation.reservation.note}
              </p>
            </div>
          )}

          {/* 예약번호 섹션 */}
          {(reservation.reservation.status === 'pending' || reservation.reservation.status === 'approved') && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                예약번호
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    예약번호를 직원에게 알려주세요
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                      {reservation.reservation.id}
                    </code>
                    <button
                      onClick={copyReservationNumber}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
                    매장 방문 시 이 번호를 직원에게 보여주세요
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 예약 취소 모달 */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCancelModal(false)}
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
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">예약 취소</h2>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                    정말 예약을 취소하시겠습니까?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    한번 취소된 예약은 되돌릴 수 없습니다.
                  </p>
                </div>

                {/* 취소 사유 입력 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    취소 사유 (선택)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="취소 사유를 입력해주세요"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {cancelReason.length}/500
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    disabled={isCancelling}
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={handleCancel}
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
                    <div className={`w-10 h-10 ${toastType === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-xl flex items-center justify-center`}>
                      {toastType === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
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
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${toastType === 'success' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'}`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}