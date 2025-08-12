// 체크인 관리 페이지
// 비전공자 설명: 승인된 예약 고객이 방문했을 때 체크인 처리하는 페이지입니다
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { ToastContainer, toast } from '@/app/components/Toast';
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
  // Send,
  Eye,
  Edit2,
  Save,
  Info,
  Calendar,
  AlertTriangle,
  UserX
} from 'lucide-react';
import Link from 'next/link';
import { formatTimeKST } from '@/lib/utils/kst-date';

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
  device?: {
    device_types?: {
      model_name?: string;
      version_name?: string;
    };
  };
  device_id?: string;
  date: string;
  time_slot: string;
  player_count: number;
  credit_option: string;
  total_price: number;
  total_amount?: number; // DB에서는 total_amount 사용
  status: 'approved' | 'checked_in' | 'completed';
  payment_status: 'pending' | 'paid';
  payment_method?: 'cash' | 'transfer';
  assigned_device_number?: number;
  check_in_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  adjusted_amount?: number;
  notes?: string;
  admin_notes?: string;
  rental_time_slot_id?: string;
  payment_confirmed_at?: string;
  payment_confirmed_by?: string;
};


export default function CheckInPage() {
  const [todayReservations, setTodayReservations] = useState<CheckInReservation[]>([]);
  const [pastReservations, setPastReservations] = useState<CheckInReservation[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'past'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<CheckInReservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInAmount, setCheckInAmount] = useState('');
  const [supabase] = useState(() => createClient());
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);
  const [adjustingReservation, setAdjustingReservation] = useState<CheckInReservation | null>(null);
  const [adjustedEndTime, setAdjustedEndTime] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [bankAccount, setBankAccount] = useState<{ bank: string; account: string; holder: string } | null>(null);
  const [showAmountAdjustModal, setShowAmountAdjustModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [amountAdjustReason, setAmountAdjustReason] = useState('');
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [noShowReservation, setNoShowReservation] = useState<CheckInReservation | null>(null);

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // API를 통해 오늘의 예약 데이터 가져오기
  const fetchTodayReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/checkin');
      if (!response.ok) throw new Error('Failed to fetch reservations');
      
      const { data: reservationsData, today } = await response.json();
      
      console.log('체크인 API 응답:', reservationsData);
      if (reservationsData && reservationsData.length > 0) {
        console.log('첫 번째 예약 상세:', JSON.stringify(reservationsData[0], null, 2));
        // payment_status 확인
        reservationsData.forEach((res: any, index: number) => {
          if (res.payment_status || res.payment_method) {
            console.log(`예약 ${index}: payment_status=${res.payment_status}, payment_method=${res.payment_method}`);
          }
        });
      }

      // 데이터 포맷팅
      const formattedReservations: CheckInReservation[] = (reservationsData || []).map((res: any) => {
        // 기기 타입 정보 추출 - 다양한 경로에서 시도
        let deviceTypeName = '알 수 없음';
        let deviceTypeId = '';
        
        // 1. devices.device_types 경로 시도
        if (res.devices?.device_types) {
          deviceTypeName = res.devices.device_types.name || deviceTypeName;
          deviceTypeId = res.devices.device_types.id || '';
        }
        // 2. rental_machines 경로 시도
        else if (res.rental_machines) {
          deviceTypeName = res.rental_machines.display_name || res.rental_machines.name || deviceTypeName;
          deviceTypeId = res.rental_machine_id || '';
        }
        // 3. 직접 device_type_name 필드 시도
        else if (res.device_type_name) {
          deviceTypeName = res.device_type_name;
          deviceTypeId = res.device_type_id || '';
        }
        
        return {
          id: res.id,
          user: {
            id: res.users?.id || '',
            name: res.users?.nickname || res.users?.name || '알 수 없음',
            phone: res.users?.phone || '',
            email: res.users?.email || ''
          },
          device_type: {
            id: deviceTypeId,
            name: deviceTypeName,
            play_modes: []
          },
          device: res.devices ? {
            id: res.devices.id,
            device_number: res.devices.device_number,
            device_types: res.devices.device_types
          } : undefined,
          date: res.date || today,
          time_slot: res.start_time && res.end_time ? 
            `${res.start_time.slice(0, 5)}-${res.end_time.slice(0, 5)}` : '',
          player_count: res.player_count || 1,
          credit_option: res.credit_type === 'unlimited' ? '무한크레딧' : 
                         res.credit_type === 'freeplay' ? '프리플레이' : 
                         res.credit_type === 'fixed' ? '고정크레딧' : '알 수 없음',
          total_price: res.total_amount || 0,
          status: res.status,
          payment_status: res.payment_status || 'pending',
          payment_method: res.payment_method,
          assigned_device_number: res.assigned_device_number || res.devices?.device_number || null,
          check_in_time: res.check_in_at,
          actual_start_time: res.actual_start_time,
          actual_end_time: res.actual_end_time,
          adjusted_amount: res.adjusted_amount,
          notes: res.user_notes,
          admin_notes: res.admin_notes,
          rental_time_slot_id: res.rental_time_slot_id || res.id,
          payment_confirmed_at: res.payment_confirmed_at,
          payment_confirmed_by: res.payment_confirmed_by
        };
      });

      // 클라이언트 사이드에서 시간순 정렬
      const sortedReservations = formattedReservations.sort((a, b) => {
        const timeA = a.time_slot.split('-')[0] || '';
        const timeB = b.time_slot.split('-')[0] || '';
        return timeA.localeCompare(timeB);
      });

      setTodayReservations(sortedReservations);
    } catch (error) {
      console.error('예약 데이터 불러오기 실패:', error);
      // 에러 메시지 표시를 위해 사용자에게 알림
      toast.error('예약 데이터 로드 실패', '새로고침 후 다시 시도해주세요.');
      setTodayReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 과거 예약 데이터 가져오기
  const fetchPastReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/checkin?mode=past');
      if (!response.ok) throw new Error('Failed to fetch past reservations');
      
      const { data: reservationsData } = await response.json();
      
      // 데이터 포맷팅 (fetchTodayReservations와 동일한 로직)
      const formattedReservations: CheckInReservation[] = (reservationsData || []).map((res: any) => {
        let deviceTypeName = '알 수 없음';
        let deviceTypeId = '';
        
        if (res.devices?.device_types) {
          deviceTypeName = res.devices.device_types.name || deviceTypeName;
          deviceTypeId = res.devices.device_types.id || '';
        }
        else if (res.rental_machines) {
          deviceTypeName = res.rental_machines.display_name || res.rental_machines.name || deviceTypeName;
          deviceTypeId = res.rental_machine_id || '';
        }
        else if (res.device_type_name) {
          deviceTypeName = res.device_type_name;
          deviceTypeId = res.device_type_id || '';
        }
        
        return {
          id: res.id,
          user: {
            id: res.users?.id || '',
            name: res.users?.nickname || res.users?.name || '알 수 없음',
            phone: res.users?.phone || '',
            email: res.users?.email || ''
          },
          device_type: {
            id: deviceTypeId,
            name: deviceTypeName,
            play_modes: []
          },
          device: res.devices ? {
            id: res.devices.id,
            device_number: res.devices.device_number,
            device_types: res.devices.device_types
          } : undefined,
          date: res.date,
          time_slot: res.start_time && res.end_time ? 
            `${res.start_time.slice(0, 5)}-${res.end_time.slice(0, 5)}` : '',
          player_count: res.player_count || 1,
          credit_option: res.credit_type === 'unlimited' ? '무한크레딧' : 
                         res.credit_type === 'freeplay' ? '프리플레이' : 
                         res.credit_type === 'fixed' ? '고정크레딧' : '알 수 없음',
          total_price: res.total_amount || 0,
          status: res.status,
          payment_status: res.payment_status || 'pending',
          payment_method: res.payment_method,
          assigned_device_number: res.assigned_device_number || res.devices?.device_number || null,
          check_in_time: res.check_in_at,
          actual_start_time: res.actual_start_time,
          actual_end_time: res.actual_end_time,
          adjusted_amount: res.adjusted_amount,
          notes: res.user_notes,
          admin_notes: res.admin_notes,
          rental_time_slot_id: res.rental_time_slot_id || res.id,
          payment_confirmed_at: res.payment_confirmed_at,
          payment_confirmed_by: res.payment_confirmed_by
        };
      });

      setPastReservations(formattedReservations);
    } catch (error) {
      console.error('과거 예약 데이터 불러오기 실패:', error);
      toast.error('과거 예약 데이터 로드 실패', '새로고침 후 다시 시도해주세요.');
      setPastReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayReservations();
    loadBankAccount(); // 계좌 정보 불러오기
    
    // 실시간 구독 설정
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(Date.now() + kstOffset);
    const today = kstNow.toISOString().split('T')[0];
    
    // 실시간 구독은 3초 디바운스로 설정
    let debounceTimer: NodeJS.Timeout;
    const subscription = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `date=eq.${today}`
        },
        () => {
          // 디바운스로 너무 자주 업데이트되는 것을 방지
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchTodayReservations();
          }, 3000);
        }
      )
      .subscribe();
    
    return () => {
      clearTimeout(debounceTimer);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchTodayReservations, supabase]);

  // 모달이 열릴 때 body 스크롤 및 선택 차단
  useEffect(() => {
    if (selectedReservation || showPaymentModal || showAccountModal || showTimeAdjustModal || showNoShowModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [selectedReservation, showPaymentModal, showAccountModal, showTimeAdjustModal, showNoShowModal]);

  // 계좌 정보 불러오기
  const loadBankAccount = async () => {
    try {
      const response = await fetch('/api/admin/settings/bank-account');
      if (response.ok) {
        const data = await response.json();
        setBankAccount(data.bankAccount);
      }
    } catch (error) {
      console.error('Failed to load bank account:', error);
    }
  };



  // 필터링된 예약 목록
  const currentReservations = activeTab === 'today' ? todayReservations : pastReservations;
  const filteredReservations = currentReservations.filter(reservation => {
    const matchesSearch = 
      reservation.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.user.phone.includes(searchQuery);
    return matchesSearch;
  });

  // 시간대별 또는 날짜별 그룹화
  const groupedReservations = filteredReservations.reduce((acc, reservation) => {
    const groupKey = activeTab === 'today' ? reservation.time_slot : reservation.date;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(reservation);
    return acc;
  }, {} as Record<string, CheckInReservation[]>);

  // 상태별 개수
  const statusCounts = {
    approved: todayReservations.filter(r => r.status === 'approved').length,
    approvedEarly: todayReservations.filter(r => {
      if (r.status !== 'approved') return false;
      const startHour = parseInt(r.time_slot?.split('-')[0]?.split(':')[0] || '0');
      return startHour >= 7 && startHour < 12;
    }).length,
    approvedNight: todayReservations.filter(r => {
      if (r.status !== 'approved') return false;
      const startHour = parseInt(r.time_slot?.split('-')[0]?.split(':')[0] || '0');
      return (startHour >= 12 && startHour <= 23) || (startHour >= 0 && startHour <= 5);
    }).length,
    checked_in: todayReservations.filter(r => r.status === 'checked_in' && r.payment_status !== 'paid').length,
    in_use: todayReservations.filter(r => r.status === 'checked_in' && r.payment_status === 'paid').length,
    completed: todayReservations.filter(r => r.status === 'completed').length
  };

  // 체크인 처리
  const handleCheckIn = async () => {
    if (!selectedReservation || !selectedReservation.assigned_device_number) {
      toast.warning('체크인 불가', '배정된 기기가 없습니다. 예약을 확인해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      
      // API를 통해 체크인 처리
      const response = await fetch('/api/admin/checkin/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          additionalNotes,
          paymentAmount: Number(checkInAmount || selectedReservation.total_price)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '체크인 처리 실패');
      }

      console.log('체크인 처리 성공:', result.data);

      // 로컬 상태 업데이트 - 오늘 예약
      setTodayReservations(todayReservations.map(r => 
        r.id === selectedReservation.id 
          ? {
              ...r,
              status: 'checked_in',
              payment_status: 'pending', // 모든 결제는 수동 확인 필요
              assigned_device_number: selectedReservation.assigned_device_number,
              check_in_time: new Date().toISOString(),
              notes: additionalNotes ? `${r.notes || ''}\n체크인 메모: ${additionalNotes}` : r.notes,
              user_notes: additionalNotes ? `${r.notes || ''}\n체크인 메모: ${additionalNotes}` : r.notes
            }
          : r
      ));
      
      // 과거 예약 리스트에서도 상태 업데이트 (결제 완료 전까지는 유지)
      setPastReservations(pastReservations.map(r => 
        r.id === selectedReservation.id 
          ? {
              ...r,
              status: 'checked_in',
              payment_status: 'pending',
              assigned_device_number: selectedReservation.assigned_device_number,
              check_in_time: new Date().toISOString(),
              notes: additionalNotes ? `${r.notes || ''}\n체크인 메모: ${additionalNotes}` : r.notes
            }
          : r
      ));
      
      setSelectedReservation(null);
      setAdditionalNotes('');
      setCheckInAmount('');
      
      toast.success('체크인 완료', '체크인이 성공적으로 처리되었습니다.');
      
      // 데이터 새로고침
      if (activeTab === 'today') {
        await fetchTodayReservations();
      } else {
        await fetchPastReservations();
      }
    } catch (error: any) {
      console.error('체크인 처리 실패:', error);
      const errorMessage = error?.message || error?.error || '알 수 없는 오류가 발생했습니다.';
      toast.error('체크인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 결제 확인 처리
  const handlePaymentConfirm = async (reservationId: string) => {
    try {
      setIsLoading(true);
      
      // API를 통해 결제 확인 처리
      const response = await fetch('/api/admin/checkin/payment-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId,
          paymentMethod
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('결제 확인 API 에러:', result);
        throw new Error(result.error || '결제 확인 실패');
      }

      console.log('결제 확인 성공:', result.data);

      // 로컬 상태 즉시 업데이트 - 오늘 예약
      setTodayReservations(prev => prev.map(r => 
        r.id === reservationId 
          ? { 
              ...r, 
              payment_status: 'paid', 
              payment_method: paymentMethod,
              payment_confirmed_at: new Date().toISOString()
            }
          : r
      ));
      
      // 과거 미체크인 리스트에서 결제 완료된 예약 제거
      setPastReservations(prev => prev.filter(r => r.id !== reservationId));
      
      setShowPaymentModal(false);
      setSelectedReservation(null);
      setPaymentMethod('cash');
      toast.success('결제 확인 완료', '결제가 성공적으로 확인되었습니다.');
      
      // 잠시 후 전체 데이터 새로고침
      setTimeout(() => {
        if (activeTab === 'today') {
          fetchTodayReservations();
        } else {
          fetchPastReservations();
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('결제 확인 실패:', error);
      const errorMessage = error?.message || error?.error || '알 수 없는 오류가 발생했습니다.';
      toast.error('결제 확인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 체크인 취소 처리
  const handleCheckInCancel = async (reservationId: string) => {
    try {
      setIsLoading(true);
      
      // 먼저 현재 예약 정보 가져오기
      const reservation = todayReservations.find(r => r.id === reservationId);
      if (!reservation) {
        toast.error('예약 정보를 찾을 수 없습니다');
        return;
      }
      
      // 예약 상태 업데이트
      const supabase = createClient();
  const { error } = await supabase.from('reservations')
        .update({
          status: 'approved',
          check_in_at: null,
          check_in_by: null,
          actual_start_time: null,
          payment_status: 'pending',
          payment_confirmed_at: null,
          payment_confirmed_by: null,
          payment_method: null
        })
        .eq('id', reservationId);

      if (error) throw error;

      // 기기 상태를 사용 가능으로 변경
      if (reservation.device_id) {
        const supabase = createClient();
  const { error: deviceError } = await supabase.from('devices')
          .update({ status: 'available' })
          .eq('id', reservation.device_id);
          
        if (deviceError) {
          console.error('기기 상태 업데이트 실패:', deviceError);
        }
      }

      // 로컬 상태 업데이트
      setTodayReservations(todayReservations.map(r => 
        r.id === reservationId 
          ? { 
              ...r, 
              status: 'approved', 
              payment_status: 'pending',
              check_in_time: undefined,
              payment_method: undefined,
              payment_confirmed_at: undefined
            }
          : r
      ));
      
      toast.success('체크인 취소', '체크인이 취소되었습니다.');
    } catch (error) {
      console.error('체크인 취소 실패:', error);
      toast.error('체크인 취소 실패', '체크인 취소에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 시간대 상태 확인
  const getTimeSlotStatus = (timeSlot: string) => {
    const parts = timeSlot.split('-');
    const start = parts[0];
    const end = parts[1];
    if (!start || !end) {
      return { status: 'unknown', message: '알 수 없음' };
    }
    
    const now = currentTime;
    const startTime = new Date(now);
    const endTime = new Date(now);
    
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
    
    const startHour = startParts[0] ?? 0;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 0;
    const endMin = endParts[1] ?? 0;
    
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return { status: 'unknown', message: '알 수 없음' };
    }
    
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
    <>
      <ToastContainer />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">체크인 관리</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-11">
          오늘의 영업시간 예약 고객 체크인 관리
        </p>
      </div>

      {/* 탭 */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setActiveTab('today');
              if (todayReservations.length === 0) fetchTodayReservations();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            오늘 예약
          </button>
          <button
            onClick={() => {
              setActiveTab('past');
              if (pastReservations.length === 0) fetchPastReservations();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            과거 미체크인
            {activeTab === 'today' && pastReservations.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">!</span>
            )}
          </button>
        </div>
      </div>

      {/* 현재 시간 및 통계 */}
      <div className="mb-6">
        {/* 현재 시간 - 모바일에서 전체 너비 (오늘 탭에서만 표시) */}
        {activeTab === 'today' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
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
        )}

        {/* 상태 통계 - 모바일에서 2열, 데스크탑에서 4열 (오늘 탭에서만 표시) */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Timer className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">승인됨</span>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {statusCounts.approved}
              </p>
              <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>조기 {statusCounts.approvedEarly}</span>
                <span className="text-gray-400">|</span>
                <span>밤샘 {statusCounts.approvedNight}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">체크인 대기</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">체크인</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statusCounts.checked_in}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">결제 대기</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">대여중</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statusCounts.in_use}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">결제 완료</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">완료</span>
            </div>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {statusCounts.completed}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">이용 완료</p>
          </div>
        </div>
        )}
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
      {activeTab === 'past' && filteredReservations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">과거 날짜에 체크인되지 않은 예약이 없습니다.</p>
        </div>
      )}
      
      <div className="space-y-6">
        {Object.entries(groupedReservations)
          .sort(([a], [b]) => {
            if (activeTab === 'past') {
              // 과거 예약은 날짜 내림차순 (최근 날짜 먼저)
              return b.localeCompare(a);
            }
            // 오늘 예약은 시간 오름차순
            return a.localeCompare(b);
          })
          .map(([groupKey, reservations]) => {
            const slotStatus = activeTab === 'today' ? getTimeSlotStatus(groupKey) : null;
            
            return (
              <div key={groupKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold dark:text-white">
                    {activeTab === 'today' ? (() => {
                      const parts = groupKey.split('-');
                      const start = parts[0] || '';
                      const end = parts[1] || '';
                      return `${formatTimeKST(start)} - ${formatTimeKST(end)}`;
                    })() : (() => {
                      const date = new Date(groupKey);
                      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
                    })()}
                  </h3>
                  {activeTab === 'today' && slotStatus && (
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
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reservations.map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      whileHover={{ scale: 1.02 }}
                      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        reservation.status === 'checked_in' && reservation.payment_status === 'paid'
                          ? 'border-blue-500 dark:border-blue-600'
                          : reservation.status === 'checked_in'
                          ? 'border-green-500 dark:border-green-600'
                          : reservation.status === 'approved'
                          ? 'border-yellow-500 dark:border-yellow-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600'
                      }`}
                      onClick={() => {
                        if (reservation.status === 'approved') {
                          setSelectedReservation(reservation);
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
                        {reservation.status === 'checked_in' && reservation.payment_status === 'paid' ? (
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : reservation.status === 'checked_in' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : reservation.status === 'approved' ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* 상태 배지 */}
                      <div className="mb-3">
                        {reservation.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <Clock className="w-3 h-3" />
                            승인됨
                          </span>
                        )}
                        {reservation.status === 'checked_in' && reservation.payment_status !== 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            체크인 (결제 대기)
                          </span>
                        )}
                        {reservation.status === 'checked_in' && reservation.payment_status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            <Gamepad2 className="w-3 h-3" />
                            대여중
                          </span>
                        )}
                        {reservation.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                            <CheckCircle className="w-3 h-3" />
                            완료
                          </span>
                        )}
                      </div>

                      {/* 예약 정보 */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Gamepad2 className="w-4 h-4" />
                          <span>
                            {reservation.device_type.name}
                            {reservation.device?.device_types?.model_name && ` ${reservation.device.device_types.model_name}`}
                          </span>
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

                      {/* 노쇼 처리 버튼 (승인된 예약) */}
                      {reservation.status === 'approved' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoShowReservation(reservation);
                              setShowNoShowModal(true);
                            }}
                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <UserX className="w-4 h-4" />
                            노쇼 처리
                          </button>
                        </div>
                      )}

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
                              {reservation.payment_status !== 'paid' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReservation(reservation);
                                    setPaymentMethod(reservation.payment_method || 'cash');
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors"
                                >
                                  결제 확인
                                </button>
                              )}
                              {reservation.payment_status === 'paid' && reservation.payment_method && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  {reservation.payment_method === 'cash' ? 
                                    <Banknote className="w-3 h-3 text-gray-600 dark:text-gray-400" /> : 
                                    <CreditCard className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                  }
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {reservation.payment_method === 'cash' ? '현금' : '계좌이체'}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReservation(reservation);
                                      setPaymentMethod(reservation.payment_method || 'cash');
                                      setShowPaymentModal(true);
                                    }}
                                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAdjustingReservation(reservation);
                                  setShowTimeAdjustModal(true);
                                  // 현재 시간 설정
                                  const parts = reservation.time_slot.split('-');
                                  const originalEnd = parts[1] || '';
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
                                <span>예약: {(() => {
                                  const parts = reservation.time_slot.split('-');
                                  const start = parts[0] || '';
                                  const end = parts[1] || '';
                                  return `${formatTimeKST(start)} - ${formatTimeKST(end)}`;
                                })()}</span>
                              </div>
                              {reservation.actual_end_time && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    종료 시간 조정: {(() => {
                                      const date = new Date(reservation.actual_end_time);
                                      const hours = date.getHours();
                                      const minutes = date.getMinutes();
                                      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                      return timeStr;
                                    })()}
                                  </span>
                                </div>
                              )}
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
                          
                          {/* 시간 조정, 금액 조정, 체크인 취소 버튼 */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustingReservation(reservation);
                                setShowTimeAdjustModal(true);
                                // 초기값 설정
                                const parts = reservation.time_slot.split('-');
                                const endTime = parts[1] || '';
                                setAdjustedEndTime(reservation.actual_end_time ? 
                                  new Date(reservation.actual_end_time).toTimeString().slice(0, 5) : 
                                  endTime
                                );
                                setAdjustmentReason('');
                                setSelectedReason('');
                              }}
                              className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              시간 조정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustingReservation(reservation);
                                setShowAmountAdjustModal(true);
                                // 초기값 설정
                                setRefundAmount('');
                                setAmountAdjustReason('');
                              }}
                              className="flex-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <Banknote className="w-3 h-3" />
                              금액 조정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('체크인을 취소하시겠습니까?')) {
                                  handleCheckInCancel(reservation.id);
                                }
                              }}
                              className="flex-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              체크인 취소
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 고객 메모 */}
                      {reservation.notes && (
                        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {reservation.notes}
                        </div>
                      )}
                      
                      {/* 관리자 메모 */}
                      {reservation.admin_notes && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                          <Info className="w-3 h-3 inline mr-1 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{reservation.admin_notes}</span>
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
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              // 배경 클릭 시 모달 닫기
              if (e.target === e.currentTarget) {
                setSelectedReservation(null);
                setAdditionalNotes('');
                setCheckInAmount('');
              }
            }}
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()} // 모달 내부 클릭은 전파 차단
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold dark:text-white">체크인</h2>
                <button
                  onClick={() => {
                    setSelectedReservation(null);
                    setAdditionalNotes('');
                    setCheckInAmount('');
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
                      {selectedReservation.user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedReservation.user.phone}
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

              {/* 배정된 기기 정보 표시 */}
              {selectedReservation.assigned_device_number && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    배정된 기기
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-semibold dark:text-white">
                          {selectedReservation.assigned_device_number}번기
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedReservation.device_type.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* 결제 금액 입력 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  실제 결제 금액
                </h3>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">₩</span>
                  <input
                    type="number"
                    value={checkInAmount || selectedReservation.total_price}
                    onChange={(e) => setCheckInAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="결제 금액을 입력하세요"
                  />
                </div>
                {checkInAmount && Number(checkInAmount) !== selectedReservation.total_price && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    예약 금액과 {Number(checkInAmount) > selectedReservation.total_price ? '더 많은' : '더 적은'} 금액입니다.
                  </p>
                )}
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



              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedReservation(null);
                    setAdditionalNotes('');
                    setCheckInAmount('');
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={isLoading}
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
                      체크인
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
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPaymentModal(false);
              }
            }}
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Banknote className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold dark:text-white">
                  {selectedReservation.payment_status === 'paid' ? '결제 방법 변경' : '결제 확인'}
                </h2>
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

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    결제 방법
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Banknote className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                      <p className="text-sm font-medium dark:text-white">현금</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                      <p className="text-sm font-medium dark:text-white">계좌이체</p>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'transfer' && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      고객의 계좌이체가 확인되었나요?
                    </p>
                    <button
                      onClick={() => setShowAccountModal(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      계좌번호 확인하기
                    </button>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    현금을 수령하셨나요?
                  </p>
                )}
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
                  {isLoading ? '처리 중...' : selectedReservation.payment_status === 'paid' ? '변경 저장' : '결제 확인'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 계좌번호 확인 모달 */}
      <AnimatePresence>
        {showAccountModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAccountModal(false);
              }
            }}
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
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

              {bankAccount ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">은행명</p>
                    <p className="font-semibold text-lg dark:text-white">{bankAccount.bank}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">계좌번호</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold text-lg dark:text-white">{bankAccount.account}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bankAccount.account);
                          toast.success('복사 완료', '계좌번호가 클립보드에 복사되었습니다.');
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
                    <p className="font-semibold text-lg dark:text-white">{bankAccount.holder}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  계좌 정보를 불러오는 중...
                </div>
              )}

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
                  <h2 className="text-xl font-semibold dark:text-white">종료 시간 조정</h2>
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
                    if (!adjustmentReason || !adjustedEndTime) {
                      toast.warning('입력 필요', '모든 필드를 입력해주세요.');
                      return;
                    }

                    try {
                      setIsLoading(true);
                      
                      // 날짜 객체 생성
                      const today = adjustingReservation.date;
                      // 기존 예약 시작 시간 사용
                      const actualStartTime = new Date(`${today}T${adjustingReservation.time_slot.split(' - ')[0]}:00`);
                      const actualEndTime = new Date(`${today}T${adjustedEndTime}:00`);
                      
                      // 조정된 금액 계산
                      const hours = Math.ceil((actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60 * 60));
                      const hourlyRate = adjustingReservation.total_price / 2; // 기본 2시간 기준
                      const adjustedAmount = hourlyRate * hours;
                      
                      // 데이터베이스 업데이트
                      const supabase = createClient();
  const { error } = await supabase.from('reservations')
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
                      toast.success('시간 조정 완료', '시간이 성공적으로 조정되었습니다.');
                    } catch (error) {
                      console.error('시간 조정 실패:', error);
                      toast.error('시간 조정 실패', '시간 조정에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !adjustmentReason || !adjustedEndTime}
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
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTimeAdjustModal(false);
                setAdjustingReservation(null);
                setAdjustedEndTime('');
                setAdjustmentReason('');
                setSelectedReason('');
              }
            }}
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">종료 시간 조정</h2>
                </div>
                <button
                  onClick={() => {
                    setShowTimeAdjustModal(false);
                    setAdjustingReservation(null);
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

              {/* 종료 시간 조정 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">종료 시간 조정</h3>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    실제 종료 시간
                  </label>
                  <div className="space-y-2">
                    <input
                      type="time"
                      value={adjustedEndTime}
                      onChange={(e) => setAdjustedEndTime(e.target.value)}
                      step="600"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      예약된 종료 시간: {adjustingReservation.time_slot.split('-')[1]}
                    </p>
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


              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTimeAdjustModal(false);
                    setAdjustingReservation(null);
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
                    if (!adjustmentReason || !adjustedEndTime) {
                      toast.warning('입력 필요', '종료 시간과 조정 사유를 입력해주세요.');
                      return;
                    }

                    try {
                      setIsLoading(true);
                      
                      // 예약 날짜와 조정된 시간을 KST 기준으로 처리
                      const reservationDate = adjustingReservation.date;
                      const [hours, minutes] = adjustedEndTime.split(':');
                      const endDate = new Date(
                        parseInt(reservationDate?.split('-')[0] || new Date().getFullYear().toString()), // 년
                        parseInt(reservationDate?.split('-')[1] || '1') - 1, // 월 (0-based)
                        parseInt(reservationDate?.split('-')[2] || '1'), // 일
                        parseInt(hours || '0'), // 시
                        parseInt(minutes || '0'), // 분
                        0 // 초
                      );
                      
                      // ISO 문자열로 변환 (KST 기준으로 생성된 Date 객체)
                      const actualEndISO = endDate.toISOString();

                      // API 호출
                      const response = await fetch(`/api/admin/reservations/${adjustingReservation.id}/adjust-time`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          actual_end_time: actualEndISO,
                          reason: adjustmentReason,
                          adjustment_type: 'end'
                        })
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || '시간 조정 실패');
                      }

                      // 로컬 상태 업데이트
                      await fetchTodayReservations();
                      
                      setShowTimeAdjustModal(false);
                      setAdjustingReservation(null);
                      setAdjustedEndTime('');
                      setAdjustmentReason('');
                      setSelectedReason('');
                      
                      toast.success('시간 조정 완료', '종료 시간이 성공적으로 조정되었습니다.');
                    } catch (error) {
                      console.error('시간 조정 실패:', error);
                      toast.error('시간 조정 실패', error instanceof Error ? error.message : '시간 조정에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !adjustmentReason || !adjustedEndTime}
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

      {/* 금액 조정 모달 */}
      <AnimatePresence>
        {showAmountAdjustModal && adjustingReservation && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAmountAdjustModal(false);
                setAdjustingReservation(null);
              }
            }}
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <Banknote className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">금액 조정</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAmountAdjustModal(false);
                    setAdjustingReservation(null);
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">원래 금액</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      ₩{adjustingReservation.total_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>


              {/* 조정 금액 입력 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  조정 후 총 금액 <span className="text-red-500">*</span>
                </h3>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="조정된 최종 금액을 입력하세요"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {refundAmount && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      원래 금액: ₩{adjustingReservation.total_price.toLocaleString()}
                    </p>
                    <p className="text-orange-600 dark:text-orange-400 font-medium">
                      차액: ₩{Math.abs(adjustingReservation.total_price - parseInt(refundAmount)).toLocaleString()} 
                      {parseInt(refundAmount) < adjustingReservation.total_price ? ' (환불)' : parseInt(refundAmount) > adjustingReservation.total_price ? ' (추가)' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* 조정 사유 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  조정 사유 <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={amountAdjustReason}
                  onChange={(e) => setAmountAdjustReason(e.target.value)}
                  placeholder="금액 조정 사유를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>


              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAmountAdjustModal(false);
                    setAdjustingReservation(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (!amountAdjustReason || !refundAmount) {
                      toast.warning('입력 필요', '조정 금액과 사유를 모두 입력해주세요.');
                      return;
                    }

                    try {
                      setIsLoading(true);
                      
                      const adjustedAmount = parseInt(refundAmount);

                      const response = await fetch(`/api/admin/reservations/${adjustingReservation.id}/adjust-amount`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          adjustedAmount: adjustedAmount,
                          reason: amountAdjustReason
                        })
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || '금액 조정 실패');
                      }

                      // 로컬 상태 업데이트
                      await fetchTodayReservations();
                      
                      setShowAmountAdjustModal(false);
                      setAdjustingReservation(null);
                      setRefundAmount('');
                      setAmountAdjustReason('');
                      
                      toast.success('금액 조정 완료', '금액이 성공적으로 조정되었습니다.');
                    } catch (error) {
                      console.error('금액 조정 실패:', error);
                      toast.error('금액 조정 실패', error instanceof Error ? error.message : '금액 조정에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !amountAdjustReason || !refundAmount}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      금액 조정
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 노쇼 처리 모달 */}
      <AnimatePresence>
        {showNoShowModal && noShowReservation && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowNoShowModal(false);
              setNoShowReservation(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                  <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                  노쇼 처리
                </h2>
                <button
                  onClick={() => {
                    setShowNoShowModal(false);
                    setNoShowReservation(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* 경고 메시지 */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                      노쇼 처리 시 예약이 취소됩니다
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      고객이 예약 시간에 방문하지 않은 경우에만 사용하세요.
                    </p>
                  </div>
                </div>
              </div>

              {/* 예약 정보 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">고객명</span>
                    <span className="font-medium dark:text-white">
                      {noShowReservation.user.name} ({noShowReservation.user.phone})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">예약 시간</span>
                    <span className="font-medium dark:text-white">{noShowReservation.time_slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">기기</span>
                    <span className="font-medium dark:text-white">{noShowReservation.device_type.name}</span>
                  </div>
                </div>
              </div>


              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNoShowModal(false);
                    setNoShowReservation(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (!noShowReservation) return;
                    
                    setIsLoading(true);
                    try {
                      const response = await fetch(`/api/admin/reservations/${noShowReservation.id}/no-show`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          reason: '고객 미방문 (노쇼)'
                        })
                      });

                      if (!response.ok) {
                        throw new Error('노쇼 처리 실패');
                      }

                      // 로컬 상태에서 즉시 제거
                      const reservationId = noShowReservation.id;
                      setTodayReservations(prev => prev.filter(r => r.id !== reservationId));
                      setPastReservations(prev => prev.filter(r => r.id !== reservationId));
                      
                      toast.success('노쇼 처리 완료', '예약이 노쇼 처리되었습니다.');
                      
                      // 모달 닫기
                      setShowNoShowModal(false);
                      setNoShowReservation(null);
                      
                      // 목록 새로고침 - 현재 탭에 따라 적절한 함수 호출
                      setTimeout(() => {
                        if (activeTab === 'today') {
                          fetchTodayReservations();
                        } else {
                          fetchPastReservations();
                        }
                      }, 500);
                    } catch (error) {
                      console.error('노쇼 처리 에러:', error);
                      toast.error('노쇼 처리 실패', '노쇼 처리 중 오류가 발생했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      노쇼 처리
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}