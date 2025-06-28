// 체크인 관리 페이지
// 비전공자 설명: 승인된 예약 고객이 방문했을 때 체크인 처리하는 페이지입니다
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { 
  CheckCircle,
  Clock,
  User,
  Gamepad2,
  CreditCard,
  AlertCircle,
  Search,
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
  Send,
  Eye,
  Edit2,
  Save,
  Info,
  Calendar,
  AlertTriangle
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
  actual_start_time?: string;
  actual_end_time?: string;
  adjusted_amount?: number;
  notes?: string;
  rental_time_slot_id?: string;
};

type AvailableDevice = {
  device_number: number;
  status: 'available' | 'rental' | 'maintenance';
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
  const [supabase] = useState(() => createClient());
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);
  const [adjustingReservation, setAdjustingReservation] = useState<CheckInReservation | null>(null);
  const [adjustedStartTime, setAdjustedStartTime] = useState('');
  const [adjustedEndTime, setAdjustedEndTime] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase에서 오늘의 예약 데이터 가져오기
  const fetchTodayReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
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
            id,
            date,
            start_time,
            end_time,
            device_type_id,
            price
          ),
          device_types (
            id,
            name,
            company,
            play_modes
          )
        `)
        .in('status', ['approved', 'checked_in', 'completed'])
        .eq('rental_time_slots.date', today)
        .order('rental_time_slots.start_time', { ascending: true });

      if (error) throw error;

      // 데이터 포맷팅
      const formattedReservations: CheckInReservation[] = (reservationsData || []).map(res => ({
        id: res.id,
        user: {
          id: res.users.id,
          name: res.users.name,
          phone: res.users.phone,
          email: res.users.email
        },
        device_type: {
          id: res.device_types?.id || '',
          name: res.device_types?.name || '알 수 없음',
          play_modes: res.device_types?.play_modes || []
        },
        date: res.rental_time_slots?.date || today,
        time_slot: res.rental_time_slots ? 
          `${res.rental_time_slots.start_time.slice(0, 5)}-${res.rental_time_slots.end_time.slice(0, 5)}` : '',
        player_count: res.player_count || 1,
        credit_option: res.notes?.includes('무한크레딧') ? '무한크레딧' : 
                       res.notes?.includes('프리플레이') ? '프리플레이' : '고정크레딧',
        total_price: res.total_price,
        status: res.status,
        payment_status: res.payment_confirmed_at ? 'confirmed' : 'pending',
        payment_method: res.payment_method,
        assigned_device_number: res.device_number,
        check_in_time: res.check_in_at,
        actual_start_time: res.actual_start_time,
        actual_end_time: res.actual_end_time,
        adjusted_amount: res.adjusted_amount,
        notes: res.notes,
        rental_time_slot_id: res.rental_time_slots?.id
      }));

      setTodayReservations(formattedReservations);
    } catch (error) {
      console.error('예약 데이터 불러오기 실패:', error);
      setTodayReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTodayReservations();
  }, [fetchTodayReservations]);

  useEffect(() => {
    // 실시간 업데이트 구독
    const channel = supabase
      .channel('checkin-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => {
          fetchTodayReservations();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, fetchTodayReservations]);

  // 기기 선택 시 가용 기기 목록 로드
  const loadAvailableDevices = async (deviceTypeId: string) => {
    try {
      // Supabase에서 해당 기기 타입의 모든 기기 가져오기
      const { data: devicesData, error } = await supabase
        .from('devices')
        .select('*')
        .eq('device_type_id', deviceTypeId)
        .eq('is_active', true)
        .order('device_number', { ascending: true });

      if (error) throw error;

      // 현재 시간대에 대여 중인 기기 확인
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const { data: activeReservations } = await supabase
        .from('reservations')
        .select('device_number')
        .eq('status', 'checked_in')
        .eq('rental_time_slots.device_type_id', deviceTypeId)
        .lte('rental_time_slots.start_time', currentTime)
        .gte('rental_time_slots.end_time', currentTime);

      const inUseDevices = new Set((activeReservations || []).map(r => r.device_number));

      // 기기 상태 포맷팅
      const formattedDevices: AvailableDevice[] = (devicesData || []).map(device => ({
        device_number: device.device_number,
        status: device.status === 'maintenance' ? 'maintenance' : 
                inUseDevices.has(device.device_number) ? 'rental' : 'available',
        last_used: device.updated_at
      }));

      setAvailableDevices(formattedDevices);
    } catch (error) {
      console.error('기기 목록 불러오기 실패:', error);
      setAvailableDevices([]);
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

    try {
      setIsLoading(true);
      
      const updateData: {
        status: string;
        device_number: number;
        check_in_at: string;
        actual_start_time: string;
        payment_method: 'cash' | 'transfer';
        payment_confirmed_at?: string;
        notes?: string;
      } = {
        status: 'checked_in',
        device_number: selectedDeviceNumber,
        check_in_at: new Date().toISOString(),
        actual_start_time: new Date().toISOString(), // 체크인 시 실제 시작시간 자동 설정
        payment_method: paymentMethod
      };
      
      // 현금 결제시 바로 확인 처리
      if (paymentMethod === 'cash') {
        updateData.payment_confirmed_at = new Date().toISOString();
      }
      
      // 추가 메모가 있으면 기존 메모에 추가
      if (additionalNotes) {
        updateData.notes = `${selectedReservation.notes || ''}\n체크인 메모: ${additionalNotes}`;
      }
      
      const { error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', selectedReservation.id);

      if (error) throw error;

      // 기기 상태를 rental로 변경
      const { error: deviceError } = await supabase
        .from('devices')
        .update({ status: 'rental' })
        .eq('device_number', selectedDeviceNumber)
        .eq('device_type_id', selectedReservation.device_type.id);

      if (deviceError) {
        console.error('기기 상태 업데이트 실패:', deviceError);
      }

      // 로컬 상태 업데이트
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
      
      setSelectedReservation(null);
      setSelectedDeviceNumber(null);
      setPaymentMethod('cash');
      setAdditionalNotes('');
      
      alert('체크인이 완료되었습니다!');
    } catch (error) {
      console.error('체크인 처리 실패:', error);
      alert('체크인 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 결제 확인 처리
  const handlePaymentConfirm = async (reservationId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('reservations')
        .update({
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setTodayReservations(todayReservations.map(r => 
        r.id === reservationId 
          ? { ...r, payment_status: 'confirmed' }
          : r
      ));
      
      setShowPaymentModal(false);
      alert('결제가 확인되었습니다.');
    } catch (error) {
      console.error('결제 확인 실패:', error);
      alert('결제 확인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-gray-600 dark:text-gray-400">
                              체크인: {reservation.check_in_time && new Date(reservation.check_in_time).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <div className="flex items-center gap-2">
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAdjustingReservation(reservation);
                                  setShowTimeAdjustModal(true);
                                  // 현재 시간 설정
                                  const [originalStart, originalEnd] = reservation.time_slot.split('-');
                                  setAdjustedStartTime(
                                    reservation.actual_start_time 
                                      ? new Date(reservation.actual_start_time).toTimeString().slice(0, 5)
                                      : originalStart
                                  );
                                  setAdjustedEndTime(
                                    reservation.actual_end_time 
                                      ? new Date(reservation.actual_end_time).toTimeString().slice(0, 5)
                                      : originalEnd
                                  );
                                  setAdjustmentReason('');
                                  setSelectedReason('');
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                title="시간 조정"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          </div>
                          
                          {/* 실제 이용시간 표시 */}
                          {(reservation.actual_start_time || reservation.actual_end_time) && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>예약: {reservation.time_slot}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  실제: {reservation.actual_start_time ? new Date(reservation.actual_start_time).toTimeString().slice(0, 5) : '미설정'} - {reservation.actual_end_time ? new Date(reservation.actual_end_time).toTimeString().slice(0, 5) : '미설정'}
                                </span>
                              </div>
                              {reservation.adjusted_amount && reservation.adjusted_amount !== reservation.total_price && (
                                <div className="flex items-center gap-2 text-xs">
                                  <CreditCard className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                                    조정 금액: ₩{reservation.adjusted_amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                            </div>
                          )}
                          
                          {/* 시간 조정 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdjustingReservation(reservation);
                              setShowTimeAdjustModal(true);
                              // 초기값 설정
                              const [startTime, endTime] = reservation.time_slot.split('-');
                              setAdjustedStartTime(reservation.actual_start_time ? 
                                new Date(reservation.actual_start_time).toTimeString().slice(0, 5) : 
                                startTime
                              );
                              setAdjustedEndTime(reservation.actual_end_time ? 
                                new Date(reservation.actual_end_time).toTimeString().slice(0, 5) : 
                                endTime
                              );
                              setAdjustmentReason('');
                              setSelectedReason('');
                            }}
                            className="w-full mt-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            시간 조정
                          </button>
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
                          : device.status === 'rental'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {device.status === 'available' && '사용 가능'}
                        {device.status === 'rental' && '대여중'}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        고객이 계좌이체로 결제를 진행합니다. 
                        입금 확인은 체크인 후 '입금 확인' 버튼을 통해 처리해주세요.
                      </p>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        • 결제 금액: <span className="font-semibold text-gray-900 dark:text-white">₩{selectedReservation.total_price.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => setShowAccountModal(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        계좌번호 보기
                      </button>
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

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                고객의 계좌이체가 확인되었나요?
              </p>

              <div className="mb-6">
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  계좌번호 확인하기
                </button>
              </div>

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

      {/* 계좌번호 확인 모달 */}
      <AnimatePresence>
        {showAccountModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">입금 계좌정보</h2>
                </div>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">은행명</p>
                  <p className="font-semibold text-lg dark:text-white">국민은행</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">계좌번호</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-lg dark:text-white">123-456-789012</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('123-456-789012');
                        alert('계좌번호가 복사되었습니다.');
                      }}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="복사"
                    >
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">예금주</p>
                  <p className="font-semibold text-lg dark:text-white">광주게임플라자</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  💡 고객이 계좌번호를 이미 알고 있는 경우가 많으니, 필요한 경우에만 안내해주세요.
                </p>
              </div>

              <button
                onClick={() => setShowAccountModal(false)}
                className="w-full mt-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 시간 조정 모달 */}
      <AnimatePresence>
        {showTimeAdjustModal && adjustingReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">실제 이용시간 조정</h2>
                </div>
                <button
                  onClick={() => {
                    setShowTimeAdjustModal(false);
                    setAdjustingReservation(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* 예약 정보 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">고객명</p>
                    <p className="font-semibold dark:text-white">{adjustingReservation.user.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">기기</p>
                    <p className="font-semibold dark:text-white">
                      {adjustingReservation.device_type.name} #{adjustingReservation.assigned_device_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">예약 시간</p>
                    <p className="font-semibold dark:text-white">{adjustingReservation.time_slot}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">기본 요금</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      ₩{adjustingReservation.total_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 시간 조정 입력 */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={adjustedStartTime}
                    onChange={(e) => setAdjustedStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={adjustedEndTime}
                    onChange={(e) => setAdjustedEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 조정 사유 선택 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  조정 사유 (필수)
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'admin_late', label: '관리자 지각' },
                    { value: 'system_error', label: '시스템 오류' },
                    { value: 'customer_extend', label: '고객 요청 연장' },
                    { value: 'early_finish', label: '조기 종료' },
                    { value: 'other', label: '기타' }
                  ].map((reason) => (
                    <label
                      key={reason.value}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => {
                          setSelectedReason(e.target.value);
                          if (e.target.value !== 'other') {
                            setAdjustmentReason(reason.label);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium dark:text-white">{reason.label}</span>
                    </label>
                  ))}
                </div>

                {selectedReason === 'other' && (
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="상세 사유를 입력해주세요"
                    className="mt-3 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                )}
              </div>

              {/* 예상 요금 변동 */}
              {adjustedStartTime && adjustedEndTime && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        예상 요금 변동
                      </h4>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <div>
                          실제 이용시간: {(() => {
                            const start = new Date(`2024-01-01T${adjustedStartTime}`);
                            const end = new Date(`2024-01-01T${adjustedEndTime}`);
                            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                            const hours = Math.floor(diff / 60);
                            const minutes = diff % 60;
                            return `${hours}시간 ${minutes}분`;
                          })()}
                        </div>
                        <div className="font-semibold">
                          조정된 금액: ₩{(() => {
                            const start = new Date(`2024-01-01T${adjustedStartTime}`);
                            const end = new Date(`2024-01-01T${adjustedEndTime}`);
                            const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                            const hourlyRate = adjustingReservation.total_price / 2; // 기본 2시간 기준
                            return (hourlyRate * hours).toLocaleString();
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTimeAdjustModal(false);
                    setAdjustingReservation(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (!adjustmentReason || !adjustedStartTime || !adjustedEndTime) {
                      alert('모든 필드를 입력해주세요.');
                      return;
                    }

                    try {
                      setIsLoading(true);
                      
                      // 날짜 객체 생성
                      const today = adjustingReservation.date;
                      const actualStartTime = new Date(`${today}T${adjustedStartTime}:00`);
                      const actualEndTime = new Date(`${today}T${adjustedEndTime}:00`);
                      
                      // 조정된 금액 계산
                      const hours = Math.ceil((actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60 * 60));
                      const hourlyRate = adjustingReservation.total_price / 2; // 기본 2시간 기준
                      const adjustedAmount = hourlyRate * hours;
                      
                      // 데이터베이스 업데이트
                      const { error } = await supabase
                        .from('reservations')
                        .update({
                          actual_start_time: actualStartTime.toISOString(),
                          actual_end_time: actualEndTime.toISOString(),
                          time_adjustment_reason: adjustmentReason,
                          adjusted_amount: adjustedAmount
                        })
                        .eq('id', adjustingReservation.id);

                      if (error) throw error;

                      // 로컬 상태 업데이트
                      await fetchTodayReservations();
                      
                      setShowTimeAdjustModal(false);
                      setAdjustingReservation(null);
                      alert('시간 조정이 완료되었습니다.');
                    } catch (error) {
                      console.error('시간 조정 실패:', error);
                      alert('시간 조정에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !adjustmentReason || !adjustedStartTime || !adjustedEndTime}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      변경 사항 저장
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 시간 조정 모달 */}
      <AnimatePresence>
        {showTimeAdjustModal && adjustingReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">실제 이용시간 조정</h2>
                </div>
                <button
                  onClick={() => {
                    setShowTimeAdjustModal(false);
                    setAdjustingReservation(null);
                    setAdjustedStartTime('');
                    setAdjustedEndTime('');
                    setAdjustmentReason('');
                    setSelectedReason('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* 예약 정보 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">고객명</p>
                    <p className="font-semibold dark:text-white">
                      {adjustingReservation.user.name} ({adjustingReservation.user.phone})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">기기</p>
                    <p className="font-semibold dark:text-white">
                      {adjustingReservation.device_type.name} #{adjustingReservation.assigned_device_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">예약 시간</p>
                    <p className="font-semibold dark:text-white">{adjustingReservation.time_slot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">예약 금액</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      ₩{adjustingReservation.total_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 시간 조정 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">시간 조정</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      시작 시간
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={adjustedStartTime}
                          onChange={(e) => setAdjustedStartTime(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">→</span>
                        <input
                          type="time"
                          value={adjustedStartTime}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        예약: {adjustingReservation.time_slot.split('-')[0]}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      종료 시간
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={adjustedEndTime}
                          onChange={(e) => setAdjustedEndTime(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">→</span>
                        <input
                          type="time"
                          value={adjustedEndTime}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        예약: {adjustingReservation.time_slot.split('-')[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 조정 사유 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  조정 사유 <span className="text-red-500">*</span>
                </h3>
                <div className="space-y-2 mb-3">
                  {[
                    { value: 'admin_late', label: '관리자 지각' },
                    { value: 'system_error', label: '시스템 오류' },
                    { value: 'customer_extend', label: '고객 요청 연장' },
                    { value: 'early_finish', label: '조기 종료' },
                    { value: 'other', label: '기타' }
                  ].map(reason => (
                    <label
                      key={reason.value}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="adjustment-reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => {
                          setSelectedReason(e.target.value);
                          if (e.target.value !== 'other') {
                            setAdjustmentReason(reason.label);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <span className="text-sm dark:text-white">{reason.label}</span>
                    </label>
                  ))}
                </div>
                {selectedReason === 'other' && (
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="상세 사유를 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    required
                  />
                )}
              </div>

              {/* 요금 변동 예상 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      요금 변동 안내
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      실제 이용시간에 따라 요금이 재계산됩니다.
                      시간 조정 후 고객에게 추가 요금이나 환불에 대해 안내해주세요.
                    </p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTimeAdjustModal(false);
                    setAdjustingReservation(null);
                    setAdjustedStartTime('');
                    setAdjustedEndTime('');
                    setAdjustmentReason('');
                    setSelectedReason('');
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (!adjustmentReason) {
                      alert('조정 사유를 입력해주세요.');
                      return;
                    }

                    try {
                      setIsLoading(true);
                      
                      // 실제 시간을 ISO 형식으로 변환
                      const today = new Date().toISOString().split('T')[0];
                      const actualStartISO = adjustedStartTime ? `${today}T${adjustedStartTime}:00` : null;
                      const actualEndISO = adjustedEndTime ? `${today}T${adjustedEndTime}:00` : null;

                      // API 호출
                      const response = await fetch(`/api/admin/reservations/${adjustingReservation.id}/adjust-time`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          actual_start_time: actualStartISO,
                          actual_end_time: actualEndISO,
                          reason: adjustmentReason,
                          adjustment_type: 'both'
                        })
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || '시간 조정 실패');
                      }

                      const result = await response.json();

                      // 로컬 상태 업데이트
                      await fetchTodayReservations();
                      
                      setShowTimeAdjustModal(false);
                      setAdjustingReservation(null);
                      setAdjustedStartTime('');
                      setAdjustedEndTime('');
                      setAdjustmentReason('');
                      setSelectedReason('');
                      
                      if (result.data.adjusted_amount !== result.data.original_amount) {
                        alert(`시간 조정이 완료되었습니다.\n원래 금액: ₩${result.data.original_amount.toLocaleString()}\n조정 금액: ₩${result.data.adjusted_amount.toLocaleString()}`);
                      } else {
                        alert('시간 조정이 완료되었습니다.');
                      }
                    } catch (error) {
                      console.error('시간 조정 실패:', error);
                      alert(error instanceof Error ? error.message : '시간 조정에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !adjustmentReason || !adjustedStartTime || !adjustedEndTime}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      변경 사항 저장
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}