// 체크인 관리 페이지
// 비전공자 설명: 승인된 예약 고객이 방문했을 때 체크인 처리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle,
  Clock,
  Calendar,
  User,
  Phone,
  Gamepad2,
  CreditCard,
  AlertCircle,
  Search,
  QrCode,
  Hash,
  ChevronLeft,
  RefreshCw,
  Banknote,
  CheckSquare,
  X,
  MessageSquare,
  Timer,
  Users,
  Copy,
  Send
} from 'lucide-react';
import Link from 'next/link';

type CheckInReservation = {
  id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  device_type: {
    id: string;
    name: string;
    play_modes?: {
      name: string;
      price: number;
    }[];
  };
  date: string;
  time_slot: string;
  player_count: number;
  credit_option: string;
  total_price: number;
  status: 'approved' | 'checked_in' | 'completed';
  payment_status: 'pending' | 'confirmed';
  payment_method?: 'cash' | 'transfer';
  assigned_device_number?: number;
  check_in_time?: string;
  notes?: string;
};

type AvailableDevice = {
  device_number: number;
  status: 'available' | 'in_use' | 'maintenance';
  last_used?: string;
};

export default function CheckInPage() {
  const [todayReservations, setTodayReservations] = useState<CheckInReservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<CheckInReservation | null>(null);
  const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([]);
  const [selectedDeviceNumber, setSelectedDeviceNumber] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock 데이터 로드
  useEffect(() => {
    // 오늘 날짜의 승인된 예약들
    setTodayReservations([
      {
        id: '1',
        user: {
          id: '1',
          name: '김철수',
          phone: '010-1234-5678',
          email: 'kim@example.com'
        },
        device_type: {
          id: '1',
          name: '마이마이 DX',
          play_modes: [
            { name: '스탠다드', price: 1000 },
            { name: '프리미엄', price: 1500 }
          ]
        },
        date: '2024-01-26',
        time_slot: '14:00-16:00',
        player_count: 2,
        credit_option: '프리플레이',
        total_price: 75000,
        status: 'approved',
        payment_status: 'pending',
        notes: '친구와 함께 이용합니다'
      },
      {
        id: '2',
        user: {
          id: '2',
          name: '이영희',
          phone: '010-2345-6789',
          email: 'lee@example.com'
        },
        device_type: {
          id: '2',
          name: '사운드 볼텍스',
          play_modes: [
            { name: '라이트', price: 500 },
            { name: '스탠다드', price: 1000 }
          ]
        },
        date: '2024-01-26',
        time_slot: '16:00-18:00',
        player_count: 1,
        credit_option: '고정 10크레딧',
        total_price: 40000,
        status: 'approved',
        payment_status: 'pending'
      },
      {
        id: '3',
        user: {
          id: '3',
          name: '박민수',
          phone: '010-3456-7890',
          email: 'park@example.com'
        },
        device_type: {
          id: '1',
          name: '마이마이 DX',
          play_modes: [
            { name: '스탠다드', price: 1000 },
            { name: '프리미엄', price: 1500 }
          ]
        },
        date: '2024-01-26',
        time_slot: '10:00-12:00',
        player_count: 1,
        credit_option: '무한크레딧',
        total_price: 60000,
        status: 'checked_in',
        payment_status: 'confirmed',
        payment_method: 'transfer',
        assigned_device_number: 2,
        check_in_time: '2024-01-26T09:55:00'
      }
    ]);
  }, []);

  // 기기 선택 시 가용 기기 목록 로드
  const loadAvailableDevices = (deviceTypeId: string) => {
    // Mock 데이터
    if (deviceTypeId === '1') { // 마이마이
      setAvailableDevices([
        { device_number: 1, status: 'available' },
        { device_number: 2, status: 'in_use', last_used: '2024-01-26T09:55:00' },
        { device_number: 3, status: 'available' },
        { device_number: 4, status: 'maintenance' }
      ]);
    } else { // 다른 기기들
      setAvailableDevices([
        { device_number: 1, status: 'available' },
        { device_number: 2, status: 'available' }
      ]);
    }
  };

  // 필터링된 예약 목록
  const filteredReservations = todayReservations.filter(reservation => {
    const matchesSearch = 
      reservation.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.user.phone.includes(searchQuery);
    return matchesSearch;
  });

  // 시간대별 그룹화
  const groupedByTimeSlot = filteredReservations.reduce((acc, reservation) => {
    const timeSlot = reservation.time_slot;
    if (!acc[timeSlot]) {
      acc[timeSlot] = [];
    }
    acc[timeSlot].push(reservation);
    return acc;
  }, {} as Record<string, CheckInReservation[]>);

  // 상태별 개수
  const statusCounts = {
    pending: todayReservations.filter(r => r.status === 'approved' && r.payment_status === 'pending').length,
    waiting_payment: todayReservations.filter(r => r.status === 'approved' && r.payment_status === 'pending').length,
    checked_in: todayReservations.filter(r => r.status === 'checked_in').length,
    completed: todayReservations.filter(r => r.status === 'completed').length
  };

  // 체크인 처리
  const handleCheckIn = async () => {
    if (!selectedReservation || !selectedDeviceNumber) {
      alert('기기를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    
    // API 호출 시뮬레이션
    setTimeout(() => {
      setTodayReservations(todayReservations.map(r => 
        r.id === selectedReservation.id 
          ? {
              ...r,
              status: 'checked_in',
              payment_status: paymentMethod === 'cash' ? 'confirmed' : 'pending',
              payment_method: paymentMethod,
              assigned_device_number: selectedDeviceNumber,
              check_in_time: new Date().toISOString(),
              notes: additionalNotes ? `${r.notes || ''}\n체크인 메모: ${additionalNotes}` : r.notes
            }
          : r
      ));
      
      setIsLoading(false);
      setSelectedReservation(null);
      setSelectedDeviceNumber(null);
      setPaymentMethod('cash');
      setAdditionalNotes('');
      
      // 성공 알림
      alert('체크인이 완료되었습니다!');
    }, 1000);
  };

  // 결제 확인 처리
  const handlePaymentConfirm = async (reservationId: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setTodayReservations(todayReservations.map(r => 
        r.id === reservationId 
          ? { ...r, payment_status: 'confirmed' }
          : r
      ));
      setIsLoading(false);
      setShowPaymentModal(false);
    }, 500);
  };

  // 시간대 상태 확인
  const getTimeSlotStatus = (timeSlot: string) => {
    const [start, end] = timeSlot.split('-');
    const now = currentTime;
    const startTime = new Date(now);
    const endTime = new Date(now);
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    startTime.setHours(startHour, startMin, 0, 0);
    endTime.setHours(endHour, endMin, 0, 0);
    
    if (now < startTime) {
      const diff = startTime.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes <= 30) {
        return { status: 'soon', message: `${minutes}분 후 시작` };
      }
      return { status: 'upcoming', message: '예정' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'current', message: '진행 중' };
    } else {
      return { status: 'past', message: '종료' };
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
          <h1 className="text-2xl font-bold dark:text-white">체크인 관리</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          오늘의 예약 고객 체크인 및 기기 배정
        </p>
      </div>

      {/* 현재 시간 및 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">현재 시간</span>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentTime.toLocaleDateString('ko-KR', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Timer className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">대기 중</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {statusCounts.pending}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">체크인 대기</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">진행 중</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {statusCounts.checked_in}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">이용 중</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Banknote className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">결제 대기</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {statusCounts.waiting_payment}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">입금 확인 필요</p>
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름 또는 전화번호로 검색"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 시간대별 예약 목록 */}
      <div className="space-y-6">
        {Object.entries(groupedByTimeSlot)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([timeSlot, reservations]) => {
            const slotStatus = getTimeSlotStatus(timeSlot);
            
            return (
              <div key={timeSlot} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold dark:text-white">{timeSlot}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    slotStatus.status === 'current' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : slotStatus.status === 'soon'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : slotStatus.status === 'upcoming'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {slotStatus.message}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reservations.map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      whileHover={{ scale: 1.02 }}
                      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        reservation.status === 'checked_in'
                          ? 'border-green-500 dark:border-green-600'
                          : reservation.payment_status === 'pending' && reservation.status === 'approved'
                          ? 'border-orange-500 dark:border-orange-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600'
                      }`}
                      onClick={() => {
                        if (reservation.status === 'approved') {
                          setSelectedReservation(reservation);
                          loadAvailableDevices(reservation.device_type.id);
                        }
                      }}
                    >
                      {/* 사용자 정보 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold dark:text-white">{reservation.user.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{reservation.user.phone}</p>
                          </div>
                        </div>
                        {reservation.status === 'checked_in' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : reservation.payment_status === 'pending' ? (
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* 예약 정보 */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Gamepad2 className="w-4 h-4" />
                          <span>{reservation.device_type.name}</span>
                          {reservation.assigned_device_number && (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              #{reservation.assigned_device_number}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{reservation.player_count}명 / {reservation.credit_option}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <CreditCard className="w-4 h-4" />
                          <span className="font-medium">₩{reservation.total_price.toLocaleString()}</span>
                          {reservation.payment_method && (
                            <span className="text-xs">
                              ({reservation.payment_method === 'cash' ? '현금' : '계좌이체'})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 상태 표시 */}
                      {reservation.status === 'checked_in' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              체크인: {new Date(reservation.check_in_time!).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {reservation.payment_status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReservation(reservation);
                                  setShowPaymentModal(true);
                                }}
                                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors"
                              >
                                입금 확인
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 메모 */}
                      {reservation.notes && (
                        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {reservation.notes}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* 체크인 모달 */}
      <AnimatePresence>
        {selectedReservation && selectedReservation.status === 'approved' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold dark:text-white">체크인 처리</h2>
                <button
                  onClick={() => {
                    setSelectedReservation(null);
                    setSelectedDeviceNumber(null);
                    setPaymentMethod('cash');
                    setAdditionalNotes('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* 예약 정보 요약 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">고객명</p>
                    <p className="font-semibold dark:text-white">
                      {selectedReservation.user.name} ({selectedReservation.user.phone})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">기기/시간</p>
                    <p className="font-semibold dark:text-white">
                      {selectedReservation.device_type.name} / {selectedReservation.time_slot}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">이용 옵션</p>
                    <p className="font-semibold dark:text-white">
                      {selectedReservation.player_count}명 / {selectedReservation.credit_option}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">이용 금액</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      ₩{selectedReservation.total_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 기기 선택 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  기기 배정
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableDevices.map((device) => (
                    <button
                      key={device.device_number}
                      onClick={() => setSelectedDeviceNumber(device.device_number)}
                      disabled={device.status !== 'available'}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedDeviceNumber === device.device_number
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : device.status === 'available'
                          ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Hash className="w-6 h-6 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                      <p className="font-semibold dark:text-white">{device.device_number}번기</p>
                      <p className={`text-xs mt-1 ${
                        device.status === 'available' 
                          ? 'text-green-600 dark:text-green-400' 
                          : device.status === 'in_use'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {device.status === 'available' && '사용 가능'}
                        {device.status === 'in_use' && '사용 중'}
                        {device.status === 'maintenance' && '점검 중'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 결제 방법 선택 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  결제 방법
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Banknote className="w-6 h-6 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                    <p className="font-semibold dark:text-white">현금</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">즉시 결제 완료</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                    <p className="font-semibold dark:text-white">계좌이체</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">입금 확인 필요</p>
                  </button>
                </div>
              </div>

              {/* 추가 메모 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  추가 메모 (선택)
                </h3>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="특이사항이나 요청사항을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* 계좌이체 안내 */}
              {paymentMethod === 'transfer' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                        계좌이체 안내
                      </h4>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">입금 계좌</p>
                        <div className="flex items-center justify-between">
                          <p className="font-mono font-semibold text-gray-900 dark:text-white">
                            광주은행 062-1234-5678-90
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('광주은행 062-1234-5678-90');
                              alert('계좌번호가 복사되었습니다.');
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="계좌번호 복사"
                          >
                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          예금주: 게임플라자
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const message = `금액: ${selectedReservation.total_price.toLocaleString()}원\n광주은행 062-1234-5678-90\n예금주: 게임플라자`;
                            
                            // 클립보드에 복사
                            navigator.clipboard.writeText(message);
                            alert('메시지가 클립보드에 복사되었습니다. 고객에게 전송해주세요.');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          메시지 복사
                        </button>
                        <button
                          onClick={() => {
                            // 실제 구현 시 SMS API 연동 필요
                            alert('SMS 전송 기능은 준비 중입니다.');
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          SMS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedReservation(null);
                    setSelectedDeviceNumber(null);
                    setPaymentMethod('cash');
                    setAdditionalNotes('');
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={isLoading || !selectedDeviceNumber}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      체크인 완료
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 결제 확인 모달 */}
      <AnimatePresence>
        {showPaymentModal && selectedReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Banknote className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold dark:text-white">입금 확인</h2>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">고객명</span>
                    <span className="font-medium dark:text-white">{selectedReservation.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">결제 금액</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      ₩{selectedReservation.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                고객의 계좌이체가 확인되었나요?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedReservation(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => handlePaymentConfirm(selectedReservation.id)}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isLoading ? '처리 중...' : '입금 확인'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}