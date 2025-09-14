// 예약 신청 페이지
// 비전공자 설명: 새로운 게임기 예약을 신청하는 페이지입니다
'use client';
import { useSession } from '@/lib/hooks/useAuth'
// supabase 의존 제거

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Calendar, Clock, Gamepad2, Hash, Users, Check, ChevronLeft, Loader2, AlertCircle, Coins } from 'lucide-react';
// import removed - using Better Auth;
import { parseKSTDate, formatKSTDate, createKSTDateTime, isWithin24Hours, formatKoreanDate } from '@/lib/utils/kst-date';
import { useReservationStore } from '@/app/store/reservation-store';

type DeviceType = {
  id: string;
  name: string;
  category: string;
  description?: string;
  model_name?: string;
  version_name?: string;
  base_price: number;
  price_multiplier_2p: number;
  max_players: number;
  requires_approval: boolean;
  image_url?: string;
  devices: Device[];
  active_device_count: number;
  total_device_count: number;
  max_rental_units?: number;
  display_order: number;
  credit_types?: string[];
  fixed_credits?: number;
};

type Device = {
  id: string;
  device_number: number;
  location?: string;
  status: string;
  is_active: boolean;
};

type TimeSlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  device_type_id: string;
  max_devices: number;
  available_devices: number[];
  is_available: boolean;
  price?: number;
  slot_type?: 'early' | 'overnight' | 'regular';
  credit_options?: any[];
  enable_2p?: boolean;
  price_2p_extra?: number;
  device_reservation_status?: Array<{
    device_number: number;
    reservation_status: string | null;
  }>;
};

export default function NewReservationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const setLastReservationId = useReservationStore((state) => state.setLastReservationId);
  
  // 예약 확인사항
  const [reservationRules, setReservationRules] = useState<any[]>([]);
  
  // 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/login');
    }
  }, [status, session, router]);
  
  // 예약 확인사항 불러오기 (테이블이 없으면 건너뛰기)
  useEffect(() => {
    const loadReservationRules = async () => {
      try {
        const { data, error } = await supabase.from('reservation_rules')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
          
        if (error) {
          // 테이블이 없는 경우는 무시
          if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            setReservationRules([]);
            return;
          }
          console.error('예약 확인사항 로드 실패:', error.message || error);
          return;
        }
        
        setReservationRules(data || []);
      } catch (error: any) {
        console.error('예약 확인사항 로드 에러:', error.message || error);
      }
    };
    
    loadReservationRules();
  }, [supabase]);
  
  // 각 단계별 선택 상태 관리
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedDeviceNumber, setSelectedDeviceNumber] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [creditOption, setCreditOption] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  // 현재 단계 관리 (1-7)
  const [currentStep, setCurrentStep] = useState(1);
  
  // 로딩 및 에러 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API 데이터
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // 기기 타입 목록 불러오기
  useEffect(() => {
    const loadDeviceTypes = async () => {
      try {
        setIsLoadingDevices(true);
        
        // Supabase에서 대여 가능한 기기 타입만 가져오기
        const { data: deviceTypesData, error: typesError } = await supabase.from('device_types')
          .select(`
            *,
            device_categories (
              id,
              name
            ),
            devices (
              id,
              device_number,
              status
            )
          `)
          .eq('is_rentable', true);

        if (typesError) throw typesError;

        console.log('Loaded device types:', deviceTypesData);

        // API 형식으로 데이터 변환
        const formattedData: DeviceType[] = (deviceTypesData || []).map(type => {
          // 예약 시스템에서는 'maintenance'나 'broken' 상태가 아닌 모든 기기를 활성화된 것으로 간주
          // broken은 사용불가 상태 (이벤트 등으로 사용 제한)
          const activeDevices = (type.devices || []).filter((d: any) => 
            d.status !== 'maintenance' && d.status !== 'broken'
          );
          
          // rental_settings JSONB 컬럼에서 설정 값 가져오기
          const rentalSettings = type.rental_settings || {};
          
          return {
            id: type.id,
            name: type.name,
            category: type.device_categories?.name || 'Unknown',
            description: type.description || '',
            model_name: type.model_name,
            version_name: type.version_name,
            base_price: rentalSettings.base_price || 50000,
            price_multiplier_2p: rentalSettings.price_multiplier_2p || 1,
            max_players: rentalSettings.max_players || 1,
            requires_approval: type.requires_approval ?? true,
            image_url: type.image_url,
            devices: type.devices || [],
            active_device_count: activeDevices.length,
            total_device_count: (type.devices || []).length,
            max_rental_units: rentalSettings.max_rental_units,
            display_order: rentalSettings.display_order ?? 999,
            credit_types: rentalSettings.credit_types || [],
            fixed_credits: rentalSettings.fixed_credits
          };
        })
        .sort((a, b) => a.display_order - b.display_order);
        
        console.log('Formatted device types:', formattedData);
        setDeviceTypes(formattedData);
      } catch (error) {
        console.error('Failed to load device types:', error);
        setError('기기 정보를 불러올 수 없습니다');
      } finally {
        setIsLoadingDevices(false);
      }
    };
    
    loadDeviceTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // loadTimeSlots 함수를 컴포넌트 레벨에서 정의
  const loadTimeSlots = async () => {
    if (!selectedDevice || !selectedDate || !deviceTypes.length) return;
      
      try {
        setIsLoadingSlots(true);
        setError(null);
        
        // Supabase에서 해당 기기의 고정 시간대 가져오기
        const { data: slotsData, error: slotsError } = await supabase.from('rental_time_slots')
          .select('*')
          .eq('device_type_id', selectedDevice)
          .order('slot_type', { ascending: true })
          .order('start_time', { ascending: true });

        if (slotsError) throw slotsError;

        console.log('Loaded time slots for device:', selectedDevice, 'data:', slotsData);

        // 해당 날짜의 예약 현황 조회 (API 사용)
        const response = await fetch(`/api/reservations/check-availability?date=${selectedDate}&deviceTypeId=${selectedDevice}`);
        const { reservations, error: apiError } = await response.json();
        
        if (apiError) {
          console.error('예약 조회 오류:', apiError);
        }
        
        // 선택한 기기 타입의 예약만 필터링
        const filteredReservations = (reservations || []).filter(
          (r: any) => r.devices?.device_type_id === selectedDevice
        );
        
        console.log('모든 예약:', reservations);
        console.log('필터링된 예약 현황:', filteredReservations);
        console.log('선택한 날짜:', selectedDate, '선택한 기기 타입:', selectedDevice);
        console.log('예약 데이터 상세:', filteredReservations?.map((r: any) => ({
          device_number: r.devices?.device_number,
          start_time: r.start_time,
          end_time: r.end_time,
          status: r.status
        })));

        // 시간대 데이터 포맷팅
        const formattedSlots: TimeSlot[] = await Promise.all((slotsData || []).map(async slot => {
          // 선택한 기기의 모든 기기 번호 가져오기 (상태 관계없이)
          const selectedDeviceInfo = deviceTypes.find(d => d.id === selectedDevice);
          const allDevices = selectedDeviceInfo?.devices
            .map(d => d.device_number) || [];
          
          // 해당 시간대에 예약된 기기 정보 찾기
          const reservedDevices = (filteredReservations || [])
            .filter((res: any) => {
              // 시간 겹침 확인
              const isOverlapping = res.start_time < slot.end_time && res.end_time > slot.start_time;
              if (isOverlapping) {
                console.log(`시간 겹침 확인 - 슬롯: ${slot.start_time}-${slot.end_time}, 예약: ${res.start_time}-${res.end_time}`);
              }
              return isOverlapping;
            })
            .map((res: any) => ({
              device_number: res.devices?.device_number,
              status: res.status
            }))
            .filter((item: any) => item.device_number !== undefined);
          
          const reservedDeviceNumbers = reservedDevices.map((d: any) => d.device_number);
          
          console.log(`슬롯 ${slot.start_time}-${slot.end_time}: 예약된 기기:`, reservedDevices, '예약된 번호들:', reservedDeviceNumbers);
          
          // 사용 가능한 기기 번호 = 전체 기기 - 예약된 기기
          const availableDevices = allDevices.filter(num => !reservedDeviceNumbers.includes(num));
          
          // 최대 대여 대수 체크
          const maxRentalUnits = selectedDeviceInfo?.max_rental_units || selectedDeviceInfo?.active_device_count || 4;
          const reservedCount = reservedDeviceNumbers.length;
          
          console.log(`슬롯 ${slot.start_time}-${slot.end_time} 최대 대여 대수 체크:`, {
            maxRentalUnits,
            reservedCount,
            allDevices: allDevices.length,
            availableDevices: availableDevices.length,
            isMaxReached: reservedCount >= maxRentalUnits
          });
          
          // 최대 대여 대수에 도달했으면 사용 가능한 기기를 빈 배열로 설정
          const actualAvailableDevices = reservedCount >= maxRentalUnits ? [] : availableDevices;
          
          // 예약 상태 정보를 슬롯에 추가
          const deviceReservationStatus = allDevices.map(num => {
            const reservation = reservedDevices.find((d: any) => d.device_number === num);
            return {
              device_number: num,
              reservation_status: reservation?.status || null
            };
          });
          
          // 크레딧 옵션에서 프리플레이 가격 가져오기
          let price = 50000; // 기본값
          if (slot.credit_options && Array.isArray(slot.credit_options)) {
            const freeplayOption = slot.credit_options.find((opt: any) => opt.type === 'freeplay');
            if (freeplayOption?.price) {
              price = freeplayOption.price;
            }
          }
          
          return {
            id: slot.id,
            date: selectedDate, // 선택한 날짜 사용
            start_time: slot.start_time,
            end_time: slot.end_time,
            device_type_id: slot.device_type_id,
            max_devices: actualAvailableDevices.length,
            available_devices: actualAvailableDevices,
            is_available: actualAvailableDevices.length > 0,
            price: price,
            slot_type: slot.slot_type,
            credit_options: slot.credit_options,
            enable_2p: slot.enable_2p,
            price_2p_extra: slot.price_2p_extra,
            device_reservation_status: deviceReservationStatus
          };
        }));
        
        setTimeSlots(formattedSlots);
      } catch (error) {
        console.error('Failed to load time slots:', error);
        setError('시간대 정보를 불러올 수 없습니다');
      } finally {
        setIsLoadingSlots(false);
      }
    };
    
  // 기기 선택시 고정 시간대 불러오기
  useEffect(() => {
    if (!selectedDevice || !selectedDate || !deviceTypes.length) {
      setTimeSlots([]);
      return;
    }
    
    loadTimeSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice, selectedDate, deviceTypes]);
  
  // Realtime 구독으로 예약 상태 변경 감지
  useEffect(() => {
    if (!selectedDevice || !selectedDate) return;

    const channel = supabase
      .channel('reservation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `date=eq.${selectedDate}`
        },
        (payload) => {
          console.log('예약 상태 변경 감지:', payload);
          // 시간대 슬롯 다시 로드
          if (selectedDevice && selectedDate && deviceTypes.length) {
            loadTimeSlots();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice, selectedDate, supabase]);
  
  // 선택한 정보 가져오기
  const selectedDeviceInfo = deviceTypes.find(d => d.id === selectedDevice);
  const selectedTimeSlotInfo = timeSlots.find(s => s.id === selectedTimeSlot);
  
  // 가격 계산
  const calculatePrice = () => {
    if (!selectedTimeSlotInfo || !creditOption) return 0;
    
    // 선택한 크레디트 옵션의 가격 찾기
    const selectedCreditOption = selectedTimeSlotInfo.credit_options?.find(
      (opt: any) => opt.type === creditOption
    );
    
    if (!selectedCreditOption) return 0;
    
    let basePrice = selectedCreditOption.price;
    
    // 2인 플레이 추가 요금
    if (playerCount === 2 && selectedTimeSlotInfo.enable_2p && selectedTimeSlotInfo.price_2p_extra) {
      basePrice += selectedTimeSlotInfo.price_2p_extra;
    }
    
    return basePrice;
  };
  
  const totalPrice = calculatePrice();
  
  // 예약 제출
  const handleSubmit = async () => {
    if (!session?.user) {
      setError('로그인이 필요합니다');
      router.push('/login');
      return;
    }
    
    if (!selectedDeviceInfo || !selectedTimeSlotInfo || selectedDeviceNumber === null) {
      setError('모든 정보를 선택해주세요');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // 선택한 기기 번호와 타입 확인
      const { data: availableDevice, error: deviceError } = // @ts-ignore
    await Promise.resolve({ data: [], error: null })
        .select('*')
        .eq('device_type_id', selectedDevice)
        .eq('device_number', selectedDeviceNumber)
        .single();

      console.log('기기 확인:', { availableDevice, deviceError, selectedDevice, selectedDeviceNumber });

      if (deviceError || !availableDevice) {
        console.error('기기 조회 오류:', deviceError);
        throw new Error('선택한 기기를 찾을 수 없습니다');
      }

      // status 체크 - 'available' 또는 'in_use' 허용 (대여기는 예약 가능)
      if (availableDevice.status !== 'available' && availableDevice.status !== 'in_use') {
        console.error('기기 상태 문제:', availableDevice.status);
        throw new Error(`선택한 기기를 사용할 수 없습니다 (상태: ${availableDevice.status})`);
      }

      // 사용자 정보 가져오기 - NextAuth 세션 사용
      if (!session?.user?.email) {
        throw new Error('로그인이 필요합니다');
      }

      // users 테이블에서 사용자 ID 찾기
      const { data: userData, error: userError } = await supabase.from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      console.log('사용자 확인:', { userData, userError, email: session.user.email });

      if (userError || !userData) {
        console.error('사용자 조회 오류:', userError);
        throw new Error('사용자 정보를 찾을 수 없습니다. 회원가입을 완료해주세요.');
      }

      // 새로운 스키마에 맞게 예약 생성
      const reservationData = {
        user_id: userData.id,
        rental_time_slot_id: selectedTimeSlot, // 선택한 시간대 슬롯 ID
        device_type_id: selectedDevice,
        device_number: selectedDeviceNumber,
        player_count: playerCount,
        credit_option: creditOption,
        total_price: totalPrice,
        status: 'pending',
        notes: ''
      };
      
      console.log('예약 생성 데이터:', reservationData);
      
      const { data: newReservation, error: reservationError } = await supabase.from('reservations')
        .insert(reservationData)
        .select()
        .single();

      if (reservationError) {
        console.error('예약 생성 오류:', reservationError);
        throw new Error(reservationError.message || '예약 생성에 실패했습니다');
      }
      
      console.log('예약 생성 성공:', newReservation);

      console.log('예약 생성 성공:', newReservation);
      
      setIsSubmitting(false);
      
      // 예약 완료 페이지로 이동
      if (newReservation?.id) {
        console.log('예약 완료 페이지로 이동 - ID를 store에 저장');
        setLastReservationId(newReservation.id);
        router.push('/reservations/complete');
      } else {
        console.error('예약 ID가 없습니다. reservation:', newReservation);
        router.push('/reservations');
      }
    } catch (error: any) {
      console.error('예약 처리 중 오류:', error);
      setError(error.message || '예약 신청에 실패했습니다');
      setIsSubmitting(false);
    }
  };
  
  // 날짜 형식 변환
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = parseKSTDate(dateString);
    return formatKoreanDate(date);
  };
  
  // 시간 형식 변환
  const formatTime = (time: string) => {
    const [hour] = time.split(':');
    if (!hour) return '';
    const h = parseInt(hour);
    // 0~5시는 24~29시로 표시
    if (h >= 0 && h <= 5) {
      return `${h + 24}시`;
    }
    return `${h}시`;
  };
  
  // 날짜 선택을 위한 달력 데이터 생성 (마지막 주 일요일까지)
  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    // 3주 후 찾기
    const threeWeeksLater = new Date(today);
    threeWeeksLater.setDate(today.getDate() + 21);
    
    // 해당 주의 일요일 찾기
    const daysUntilSunday = threeWeeksLater.getDay() === 0 ? 0 : 7 - threeWeeksLater.getDay();
    const lastSunday = new Date(threeWeeksLater);
    lastSunday.setDate(threeWeeksLater.getDate() + daysUntilSunday);
    
    // 오늘부터 마지막 일요일까지의 날짜 생성
    const totalDays = Math.ceil((lastSunday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // 단계 정보
  const steps = [
    { num: 1, label: '날짜', icon: Calendar },
    { num: 2, label: '기기', icon: Gamepad2 },
    { num: 3, label: '시간', icon: Clock },
    { num: 4, label: '번호', icon: Hash },
    { num: 5, label: '크레딧', icon: Coins },
    { num: 6, label: '인원', icon: Users },
    { num: 7, label: '확인', icon: Check }
  ];
  
  // 애니메이션 설정 - 모바일 앱처럼 자연스럽게
  const pageAnimation = {
    initial: { opacity: 1, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 1, x: -20 },
    transition: { 
      type: "spring" as const,
      stiffness: 500,
      damping: 35,
      mass: 0.8
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto px-5 py-6"
      >
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold dark:text-white">예약하기</h1>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}
        
        {/* 진행 단계 */}
        <div className="relative mb-8">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
          />
          
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.num}
                  onClick={() => {
                    if (step.num === 1) {
                      setCurrentStep(1);
                    } else if (step.num === 2 && selectedDate) {
                      setCurrentStep(2);
                    } else if (step.num === 3 && selectedDate && selectedDevice) {
                      setCurrentStep(3);
                    } else if (step.num === 4 && selectedDate && selectedDevice && selectedTimeSlot) {
                      setCurrentStep(4);
                    } else if (step.num === 5 && selectedDate && selectedDevice && selectedTimeSlot && selectedDeviceNumber !== null) {
                      setCurrentStep(5);
                    } else if (step.num === 6 && selectedDate && selectedDevice && selectedTimeSlot && selectedDeviceNumber !== null && playerCount > 0) {
                      setCurrentStep(6);
                    }
                  }}
                  className="flex flex-col items-center cursor-pointer"
                  disabled={step.num > currentStep && (
                    (step.num === 2 && !selectedDate) ||
                    (step.num === 3 && (!selectedDate || !selectedDevice)) ||
                    (step.num === 4 && (!selectedDate || !selectedDevice || !selectedTimeSlot)) ||
                    (step.num === 5 && (!selectedDate || !selectedDevice || !selectedTimeSlot || selectedDeviceNumber === null)) ||
                    (step.num === 6 && (!selectedDate || !selectedDevice || !selectedTimeSlot || selectedDeviceNumber === null || playerCount === 0))
                  )}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep >= step.num 
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {currentStep > step.num ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs transition-colors ${
                    currentStep >= step.num 
                      ? 'text-gray-900 dark:text-white font-medium' 
                      : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 단계별 컨텐츠 */}
        <LayoutGroup>
          <AnimatePresence mode="wait">
          {/* 1단계: 날짜 선택 */}
          {currentStep === 1 && (
            <motion.div {...pageAnimation} key="step1" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">날짜 선택</h2>
                
                {/* 요일 헤더 - 월요일부터 시작 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                    <div key={day} className={`text-center text-xs font-medium py-2 ${
                      index === 6 ? 'text-red-500' : index === 5 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                  {/* 첫 주 빈 칸 채우기 - 월요일 시작 기준 */}
                  {calendarDays[0] && Array.from({ length: calendarDays[0].getDay() === 0 ? 6 : calendarDays[0].getDay() - 1 }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {/* 날짜 버튼들 */}
                  {calendarDays.map((date) => {
                    // KST 기준 날짜 문자열 생성
                    const dateStr = formatKSTDate(date);
                    const isSelected = selectedDate === dateStr;
                    const now = new Date();
                    const isToday = now.toDateString() === date.toDateString();
                    const dayOfWeek = date.getDay();
                    
                    // 24시간 이내 날짜인지 확인
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    const isDisabled = date < tomorrow;
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          if (dateStr && !isDisabled) {
                            setSelectedDate(dateStr);
                            setSelectedTimeSlot('');
                            setSelectedDeviceNumber(null);
                            setCurrentStep(2); // 자동으로 다음 단계로
                          }
                        }}
                        disabled={isDisabled}
                        className={`aspect-square p-2 rounded-lg border transition-all ${
                          isDisabled
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : isToday
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          isDisabled
                            ? 'text-gray-400 dark:text-gray-600'
                            : isSelected 
                              ? 'text-white dark:text-gray-900' 
                              : dayOfWeek === 0 
                                ? 'text-red-500' 
                                : dayOfWeek === 6 
                                  ? 'text-blue-500' 
                                  : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {date.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* 다음 버튼 제거 - 날짜 선택 시 자동으로 다음 단계로 */}
              </div>
            </motion.div>
          )}
          
          {/* 2단계: 기기 선택 */}
          {currentStep === 2 && (
            <motion.div {...pageAnimation} key="step2" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold dark:text-white">기기 선택</h2>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                </div>
                
                {isLoadingDevices ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">기기 정보를 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deviceTypes.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => {
                          setSelectedDevice(device.id);
                          setSelectedTimeSlot('');
                          setSelectedDeviceNumber(null);
                          setPlayerCount(1);
                          setCreditOption('');
                          setCurrentStep(3); // 자동으로 다음 단계로
                        }}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedDevice === device.id
                            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium dark:text-white">{device.name}</h3>
                              {device.model_name && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  {device.model_name}
                                </span>
                              )}
                            </div>
                            {device.version_name && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  버전: {device.version_name}
                                </span>
                              </div>
                            )}
                            {device.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {device.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {device.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              동일 시간대 최대 대여: {device.max_rental_units || device.active_device_count}대
                            </p>
                            {device.active_device_count === 0 && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                현재 모든 기기가 점검 중이거나 예약됨
                              </p>
                            )}
                          </div>
                          {/* 모드별 가격 표시 */}
                          <div className="flex flex-wrap gap-2 justify-end">
                            {device.credit_types?.map((creditType: string) => {
                              let priceText = '';
                              let bgColor = '';
                              
                              switch(creditType) {
                                case 'fixed':
                                  if (device.fixed_credits) {
                                    priceText = `${device.fixed_credits}크레딧`;
                                    bgColor = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
                                  }
                                  break;
                                case 'freeplay':
                                  priceText = '프리플레이';
                                  bgColor = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                                  break;
                                case 'unlimited':
                                  priceText = '무제한';
                                  bgColor = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
                                  break;
                              }
                              
                              if (priceText) {
                                return (
                                  <span key={creditType} className={`text-xs px-2 py-1 rounded-full font-medium ${bgColor}`}>
                                    {priceText}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 하단 버튼 제거 - 기기 선택 시 자동으로 다음 단계로 */}
              </div>
            </motion.div>
          )}
          
          {/* 3단계: 시간대 선택 */}
          {currentStep === 3 && (
            <motion.div {...pageAnimation} key="step3" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold dark:text-white">시간대 선택</h2>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                </div>
                
                {isLoadingSlots ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">시간대를 확인하는 중...</p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">예약 가능한 시간대가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((slot) => {
                      // 24시간 이내 시간대인지 확인
                      const now = new Date();
                      
                      // 슬롯의 실제 시작 시간 계산 (KST 기준)
                      const slotDate = createKSTDateTime(selectedDate, slot.start_time);
                      
                      // 24시간 이내 여부 확인
                      const within24Hours = isWithin24Hours(slotDate);
                      const isAvailable = slot.is_available && !within24Hours;
                      
                      // 디버깅 로그
                      console.log(`시간대: ${formatTime(slot.start_time)}-${formatTime(slot.end_time)} (${slot.slot_type})`);
                      console.log(`선택 날짜: ${selectedDate}, 슬롯 시작: ${slotDate.toLocaleString('ko-KR')}`);
                      console.log(`현재 시간: ${now.toLocaleString('ko-KR')}`);
                      console.log(`24시간 이내: ${within24Hours}`);

                      // 최대 대여 대수 체크
                      const maxRentalUnits = selectedDeviceInfo?.max_rental_units || selectedDeviceInfo?.active_device_count || 4;
                      const availableCount = slot.available_devices.length;
                      
                      // 예약된 기기 수 = 전체 기기 수 - 사용 가능한 기기 수
                      const totalDevices = selectedDeviceInfo?.devices?.length || 4;
                      const reservedCount = totalDevices - availableCount;
                      
                      // 예약 가능 여부 = 예약된 수 < 최대 대여 대수
                      const hasAvailableSlot = reservedCount < maxRentalUnits;
                      const isFull = !hasAvailableSlot || availableCount === 0;
                      
                      // 실제 예약 가능한 대수
                      const actualAvailable = Math.min(availableCount, maxRentalUnits - reservedCount);
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            if (isAvailable && !isFull) {
                              setSelectedTimeSlot(slot.id);
                              setSelectedDeviceNumber(null);
                              setCurrentStep(4); // 자동으로 다음 단계로
                            }
                          }}
                          disabled={!isAvailable || isFull}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            !isAvailable || isFull
                              ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                              : selectedTimeSlot === slot.id
                                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                        <div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium dark:text-white">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </h3>
                              {slot.slot_type === 'early' && (
                                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                                  조기대여
                                </span>
                              )}
                              {slot.slot_type === 'overnight' && (
                                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                                  밤샘대여
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {within24Hours ? (
                                <span className="text-red-500">24시간 이내 예약 불가</span>
                              ) : isFull ? (
                                <span className="text-red-500">예약 신청 마감</span>
                              ) : (
                                `${actualAvailable}대 예약 가능`
                              )}
                            </p>
                            {slot.enable_2p && selectedDeviceInfo?.max_players && selectedDeviceInfo.max_players > 1 && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                2인 플레이 가능 (+₩{slot.price_2p_extra?.toLocaleString()})
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                    })}
                  </div>
                )}
                
                {/* 하단 버튼 제거 - 시간대 선택 시 자동으로 다음 단계로 */}
              </div>
            </motion.div>
          )}
          
          {/* 4단계: 기기 번호 선택 */}
          {currentStep === 4 && (
            <motion.div {...pageAnimation} key="step4" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold dark:text-white">기기 번호 선택</h2>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                </div>
                
                {selectedTimeSlotInfo && selectedDeviceInfo && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {/* 모든 기기 번호를 표시 (1번부터 전체 기기 수까지) */}
                      {Array.from({ length: selectedDeviceInfo.total_device_count }, (_, i) => i + 1).map((deviceNum) => {
                        // 현재 기기의 상태 확인
                        const device = selectedDeviceInfo.devices.find((d: any) => d.device_number === deviceNum);
                        const isAvailable = selectedTimeSlotInfo.available_devices.includes(deviceNum);
                        const isMaintenance = device?.status === 'maintenance';
                        const isBroken = device?.status === 'broken';
                        
                        // 예약 상태 확인
                        const reservationInfo = selectedTimeSlotInfo.device_reservation_status?.find(
                          (d: any) => d.device_number === deviceNum
                        );
                        const reservationStatus = reservationInfo?.reservation_status;
                        
                        // 디버깅
                        if (deviceNum === 3 || deviceNum === 4) {
                          console.log(`기기 ${deviceNum}번 상세:`, {
                            isAvailable,
                            reservationStatus,
                            canSelect: isAvailable && !isMaintenance && !isBroken,
                            device_reservation_status: selectedTimeSlotInfo.device_reservation_status,
                            available_devices: selectedTimeSlotInfo.available_devices
                          });
                        }
                        
                        const getStatusInfo = () => {
                          if (isBroken) return { color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700', text: '사용불가', textColor: 'text-red-600 dark:text-red-400' };
                          if (isMaintenance) return { color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700', text: '점검중', textColor: 'text-yellow-600 dark:text-yellow-400' };
                          if (reservationStatus === 'approved' || reservationStatus === 'checked_in') {
                            return { color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700', text: '예약확정', textColor: 'text-green-600 dark:text-green-400' };
                          }
                          if (reservationStatus === 'pending') {
                            return { color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700', text: '예약대기', textColor: 'text-blue-600 dark:text-blue-400' };
                          }
                          return null;
                        };
                        
                        const statusInfo = getStatusInfo();
                        const canSelect = isAvailable && !isMaintenance && !isBroken;
                        
                        return (
                          <button
                            key={deviceNum}
                            onClick={() => {
                              if (canSelect) {
                                setSelectedDeviceNumber(deviceNum);
                                setCurrentStep(5); // 자동으로 다음 단계로
                              }
                            }}
                            disabled={!canSelect}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              !canSelect
                                ? `cursor-not-allowed ${statusInfo?.color || 'opacity-50 border-gray-200 dark:border-gray-700'}`
                                : selectedDeviceNumber === deviceNum
                                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <h3 className="font-medium dark:text-white">{deviceNum}번기</h3>
                            {statusInfo && (
                              <p className={`text-xs mt-1 ${statusInfo.textColor}`}>
                                {statusInfo.text}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* 범례 */}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">예약확정</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">예약대기</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">점검중</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">사용불가</span>
                      </div>
                    </div>
                  </>
                )}
                
                {/* 하단 버튼 제거 - 기기 번호 선택 시 자동으로 다음 단계로 */}
              </div>
            </motion.div>
          )}
          
          {/* 5단계: 크레딧 옵션 선택 */}
          {currentStep === 5 && (
            <motion.div {...pageAnimation} key="step5" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold dark:text-white">크레딧 옵션</h2>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                </div>
                
                {selectedTimeSlotInfo && selectedTimeSlotInfo.credit_options && (
                  <div className="space-y-3 mb-6">
                    {selectedTimeSlotInfo.credit_options.map((option: any) => (
                      <button
                        key={option.type}
                        onClick={() => {
                          setCreditOption(option.type);
                          // 2인 옵션이 없는 경우 7단계로 바로 이동
                          if (!selectedTimeSlotInfo?.enable_2p || !selectedDeviceInfo || selectedDeviceInfo.max_players <= 1) {
                            setCurrentStep(7);
                          } else {
                            setCurrentStep(6);
                          }
                        }}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          creditOption === option.type
                            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <h3 className="font-medium dark:text-white">
                          {option.type === 'fixed' ? `고정크레딧 (${option.fixed_credits || 100}크레딧)` :
                           option.type === 'freeplay' ? '프리플레이' : 
                           '무한크레딧'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.type === 'fixed' ? `시간 내 ${option.fixed_credits || 100}크레디트 제공` :
                           option.type === 'freeplay' ? '시간 내 무제한 플레이' :
                           '크레딧 제한 없이 플레이'}
                        </p>
                        <p className="text-sm font-medium mt-2 dark:text-white">
                          ₩{option.price.toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 하단 버튼 제거 - 크레딧 옵션 선택 시 자동으로 다음 단계로 */}
              </div>
            </motion.div>
          )}
          
          {/* 6단계: 인원 선택 (마이마이만) */}
          {currentStep === 6 && (
            <motion.div {...pageAnimation} key="step6" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold dark:text-white">인원 선택</h2>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                </div>
                
                {selectedTimeSlotInfo?.enable_2p && selectedDeviceInfo?.max_players && selectedDeviceInfo.max_players > 1 ? (
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => {
                        setPlayerCount(1);
                        setCurrentStep(7); // 자동으로 다음 단계로
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        playerCount === 1
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <h3 className="font-medium dark:text-white">1인 플레이</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">기본 요금</p>
                    </button>
                    
                    <button
                      onClick={() => {
                        setPlayerCount(2);
                        setCurrentStep(7); // 자동으로 다음 단계로
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        playerCount === 2
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <h3 className="font-medium dark:text-white">2인 플레이</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        +₩{selectedTimeSlotInfo.price_2p_extra?.toLocaleString() || '0'} 추가 요금
                      </p>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                      <p className="text-gray-600 dark:text-gray-400">이 기기는 1인 플레이만 가능합니다</p>
                    </div>
                    {/* 1인만 가능한 경우 자동으로 7단계로 이동 */}
                    {(() => {
                      setTimeout(() => setCurrentStep(7), 1000);
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* 7단계: 최종 확인 */}
          {currentStep === 7 && (
            <motion.div {...pageAnimation} key="step7" layout layoutId="content">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">예약 확인</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">날짜</p>
                    <p className="font-medium dark:text-white">{formatDateDisplay(selectedDate)}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">기기</p>
                    <p className="font-medium dark:text-white">
                      {selectedDeviceInfo?.name} {selectedDeviceNumber}번기
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDeviceInfo?.model_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          모델: {selectedDeviceInfo.model_name}
                        </span>
                      )}
                      {selectedDeviceInfo?.version_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          버전: {selectedDeviceInfo.version_name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">시간</p>
                    <p className="font-medium dark:text-white">
                      {selectedTimeSlotInfo && (
                        `${formatTime(selectedTimeSlotInfo.start_time)} - ${formatTime(selectedTimeSlotInfo.end_time)}`
                      )}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">크레딧 옵션</p>
                    <p className="font-medium dark:text-white">
                      {(() => {
                        const selectedOption = selectedTimeSlotInfo?.credit_options?.find(
                          (opt: any) => opt.type === creditOption
                        );
                        if (creditOption === 'fixed') {
                          return `고정크레딧 (${selectedOption?.fixed_credits || 100}크레디트)`;
                        } else if (creditOption === 'freeplay') {
                          return '프리플레이';
                        } else if (creditOption === 'unlimited') {
                          return '무한크레디트';
                        }
                        return '';
                      })()}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">인원</p>
                    <p className="font-medium dark:text-white">{playerCount}인</p>
                  </div>
                  
                  <div className="p-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg">
                    <p className="text-sm opacity-80 mb-1">총 금액</p>
                    <p className="text-xl font-bold">{totalPrice.toLocaleString()}원</p>
                  </div>
                </div>
                
                {/* 이용 안내 */}
                {reservationRules.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">이용 안내</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <ul className="space-y-2">
                        {reservationRules.map((rule) => (
                          <li key={rule.id} className="flex items-start gap-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {rule.content}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      노쇼가 반복되거나 악의적인 서비스 이용 시 제한될 수 있음을 동의합니다
                    </span>
                  </label>
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={!agreed || isSubmitting}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        예약 중...
                      </>
                    ) : (
                      '예약하기'
                    )}
                  </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </main>
  );
}
