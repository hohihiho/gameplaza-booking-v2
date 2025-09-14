'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gamepad2, ChevronLeft, Loader2, AlertCircle, CreditCard, Users, Sparkles, ChevronRight, Info, UserPlus } from 'lucide-react';
// import removed - using Better Auth;
import { parseKSTDate, createKSTDateTime, isWithin24Hours, formatKoreanDate } from '@/lib/utils/kst-date';
import { useReservationStore } from '@/app/store/reservation-store';
import { useCreateReservation } from '@/lib/hooks/useCreateReservation';
import { TimeSlotListSkeleton } from '@/app/components/mobile/ReservationSkeleton';
import { Calendar } from '@/components/ui/Calendar';
import { useSession } from '@/lib/hooks/useAuth';
// supabase 의존 제거: API fetch와 폴링으로 대체

type DeviceType = {
  id: string;
  name: string;
  category: string;
  description?: string;
  model_name?: string;
  version_name?: string;
  requires_approval: boolean;
  image_url?: string;
  devices: Device[];
  active_device_count: number;
  total_device_count: number;
  max_rental_units?: number;
  display_order: number;
  rental_display_order?: number;
  max_players?: number;
  price_multiplier_2p?: number;
  rental_settings?: any;
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
  userAlreadyReserved?: boolean; // 사용자가 이미 예약했는지 여부
  price?: number;
  slot_type?: 'early' | 'overnight' | 'regular';
  is_youth_time?: boolean;
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
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const setLastReservationId = useReservationStore((state) => state.setLastReservationId);
  
  // 대리 예약 모드 확인
  const onBehalfUserId = searchParams.get('onBehalf');
  const onBehalfUserName = searchParams.get('userName');
  const isOnBehalfMode = !!onBehalfUserId;
  const isAdmin = !!session?.user?.isAdmin;
  
  // 현재 단계
  const [currentStep, setCurrentStep] = useState(1);
  
  // 단계 변경 시 스크롤 초기화
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 선택된 정보
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(0);
  const [selectedCreditOption, setSelectedCreditOption] = useState('');
  const [playerCount, setPlayerCount] = useState(1);
  const [userNotes, setUserNotes] = useState('');
  
  // API 데이터
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // v2 API 훅 사용
  const { createReservation: createReservationV2, loading: creatingV2, error: errorV2 } = useCreateReservation();

  // 선택된 시간대 정보
  const selectedTimeSlotInfo = timeSlots.find(s => s.id === selectedTimeSlot);

  // 날짜 선택 후 기기 타입 불러오기
  useEffect(() => {
    if (selectedDate) fetchDeviceTypes();
  }, [selectedDate]);

  // 날짜 선택 시 타임슬롯 불러오기
  useEffect(() => {
    if (selectedDate && selectedDeviceInfo?.id) {
      fetchTimeSlots();
    }
  }, [selectedDate, selectedDeviceInfo]);

  // supabase realtime 제거: 간단한 폴링으로 대체
  useEffect(() => {
    if (!selectedDate || !selectedDeviceInfo?.id) return
    const id = setInterval(() => {
      fetchTimeSlots()
    }, 15000)
    return () => clearInterval(id)
  }, [selectedDate, selectedDeviceInfo])

  const fetchDeviceTypes = async () => {
    console.log('=== fetchDeviceTypes started ===');
    setIsLoadingDevices(true);
    try {
      if (!selectedDate) {
        setDeviceTypes([])
        return
      }
      // 기본 시간 범위(06~07시)로 가용 기기 타입 목록 조회
      const url = `/api/v3/devices/available?date=${encodeURIComponent(selectedDate)}&start_hour=6&end_hour=7`
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const types = Array.isArray(json.data) ? json.data : []
      // 정렬 유지
      const sorted = types.sort((a: any, b: any) => {
        const orderA = a.rental_display_order ?? a.display_order ?? 999
        const orderB = b.rental_display_order ?? b.display_order ?? 999
        return orderA - orderB
      })
      setDeviceTypes(sorted)
    } catch (error) {
      console.error('=== Error fetching device types:', error, '===');
      setError('기기 정보를 불러올 수 없습니다');
    } finally {
      console.log('=== fetchDeviceTypes finished ===');
      setIsLoadingDevices(false);
    }
  };

  const fetchTimeSlots = async () => {
    setIsLoadingSlots(true);
    setError(null);
    
    if (!selectedDeviceInfo?.id) {
      setIsLoadingSlots(false);
      return;
    }

    try {
      // V3 API 호출로 변경
      const response = await fetch(`/api/v3/devices/available?date=${selectedDate}&deviceId=${selectedDeviceInfo.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // API 응답을 기존 컴포넌트 형식에 맞게 변환
      const transformedSlots = result.data.map((slot: any) => ({
        id: slot.timeSlot.id,
        date: selectedDate,
        start_time: String(slot.timeSlot.startHour).padStart(2, '0') + ':00',
        end_time: String(slot.timeSlot.endHour).padStart(2, '0') + ':00',
        device_type_id: selectedDeviceInfo.typeId,
        max_devices: slot.remainingSlots + (slot.device_reservation_status?.length || 0), // 총 가능 대수
        available_devices: Array.from({length: slot.remainingSlots}, (_, i) => i + 1),
        is_available: slot.available && slot.remainingSlots > 0,
        userAlreadyReserved: slot.userAlreadyReserved || false, // 사용자가 이미 예약했는지 여부
        price: slot.creditOptions[0]?.prices?.[1] || slot.creditOptions[0]?.price || 0,
        slot_type: slot.timeSlot.type === 'overnight' ? 'overnight' : 'regular',
        is_youth_time: slot.isYouthTime,
        credit_options: slot.creditOptions.map((option: any) => ({
          type: option.type,
          price: option.price || Object.values(option.prices || {})[0] || 0,
          fixed_credits: option.fixedCredits,
          hours: option.hours
        })),
        enable_2p: slot.enable2P,
        price_2p_extra: slot.price2PExtra || 0,
        device_reservation_status: slot.device_reservation_status || [],
        displayTime: slot.timeSlot.displayTime
      }));

      setTimeSlots(transformedSlots);
      
      // 시간대가 없는 경우 사용자에게 알림
      if (transformedSlots.length === 0) {
        setError('선택한 기기에 대한 예약 가능한 시간대가 없습니다');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setError('시간대 정보를 불러올 수 없습니다');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDeviceInfo || !selectedTimeSlotInfo) return;

    setIsSubmitting(true);
    setError(null);

    let reservationData: any = null;

    try {
      // 기기 번호를 선택하지 않은 경우, 선택된 기기 타입의 첫 번째 사용 가능한 기기 사용
      let finalDeviceInfo = selectedDeviceInfo;
      
      if (selectedDevice === 0) {
        const selectedDeviceTypeObj = deviceTypes.find(dt => dt.id === selectedDeviceType);
        const firstAvailableDevice = selectedDeviceTypeObj?.devices?.find((d: any) => d.status === 'available');
        
        if (firstAvailableDevice) {
          finalDeviceInfo = {
            id: firstAvailableDevice.id,
            name: selectedDeviceTypeObj?.name ?? '',
            typeId: selectedDeviceTypeObj?.id ?? '',
            deviceNumber: firstAvailableDevice.device_number
          };
        }
      }
      
      const deviceId = finalDeviceInfo?.id;
      if (!deviceId) {
        throw new Error('선택한 기기를 찾을 수 없습니다');
      }

      // API v2 형식에 맞게 데이터 변환
      const startHour = Number((selectedTimeSlotInfo!.start_time ?? '0:00').split(':')[0])
      const endHour = Number((selectedTimeSlotInfo!.end_time ?? '0:00').split(':')[0])
      
      // 선택된 시간대의 크레딧 옵션 가져오기
      const creditOption = selectedTimeSlotInfo.credit_options?.[0];
      const creditType = creditOption?.type || 'freeplay'; // 기본값은 freeplay
      
      reservationData = {
        deviceId: deviceId,
        date: selectedDate,
        startHour: startHour,
        endHour: endHour,
        creditType: creditType,
        playerCount: 1, // 기본값 1명
        userNotes: userNotes || undefined,
        onBehalfUserId: onBehalfUserId || undefined // 대리 예약 대상 사용자
      };

      console.log('전송될 예약 데이터:', {
        ...reservationData,
        selectedTimeSlotInfo,
        selectedDeviceInfo,
        finalDeviceInfo
      });

      // v2 API 사용
      const reservation = await createReservationV2(reservationData);
      const result = { reservation };
      
      if (result.reservation?.id) {
        setLastReservationId(result.reservation.id);
        router.push('/reservations/complete');
      } else {
        throw new Error('예약 ID를 받지 못했습니다');
      }
    } catch (error: any) {
      console.error('Reservation error details:', {
        error,
        message: error?.message,
        stack: error?.stack,
        reservationData,
        selectedDeviceInfo,
        selectedTimeSlotInfo
      });
      
      // API 에러 메시지 처리
      let errorMessage = '예약 중 오류가 발생했습니다';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error === 'Bad Request' && error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedTimeSlotInfo || !selectedCreditOption) return 0;
    
    // 선택된 크레딧 옵션의 가격 찾기
    const creditOption = selectedTimeSlotInfo.credit_options?.find(
      opt => opt.type === selectedCreditOption
    );
    
    const basePrice = creditOption?.price || 0;
    
    // 2인 플레이 추가 요금
    if (playerCount === 2 && selectedTimeSlotInfo.enable_2p) {
      return basePrice + (selectedTimeSlotInfo.price_2p_extra || 0);
    }
    
    return basePrice;
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour || '0');
    
    if (hourNum >= 0 && hourNum <= 5) {
      return `${hourNum + 24}:${minute}`;
    }
    return `${hour}:${minute}`;
  };



  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* 페이지 타이틀 */}
          <div className="px-5 py-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">예약하기</h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-1">원하는 시간에 기기를 예약하세요</p>
              </div>
            </div>
          </div>
          
          {/* 진행 상태 - 향상된 단계 표시 */}
          <div className="px-5 pb-2">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4">
              <div className="space-y-3">
                {/* 진행률 바 */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(currentStep / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium min-w-[40px] text-right">
                    {currentStep}/4
                  </span>
                </div>
                
                {/* 단계 라벨 */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className={currentStep >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                    날짜
                  </span>
                  <span className={currentStep >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                    기기
                  </span>
                  <span className={currentStep >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                    시간
                  </span>
                  <span className={currentStep >= 4 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                    확인
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: 날짜 선택 */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* 대리 예약 모드 표시 */}
              {isOnBehalfMode && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        대리 예약 모드
                      </p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        {onBehalfUserName}님을 대신하여 예약을 생성합니다
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">언제 대여하실 건가요?</h2>
                <p className="text-gray-600 dark:text-gray-400">대여 가능한 날짜를 선택해주세요</p>
                {!isAdmin && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ※ 당일 예약은 불가능합니다. 대여 24시간 전부터 최대 3주 후까지 예약 가능합니다.
                  </p>
                )}
                {isAdmin && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ※ 관리자 권한으로 24시간 제한이 해제되었습니다.
                  </p>
                )}
              </div>

              <Calendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  handleStepChange(2);
                }}
                minDate={(() => {
                  // 관리자는 오늘부터 선택 가능
                  if (isAdmin) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return today;
                  }
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  return tomorrow;
                })()}
                maxDate={(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 21); // 3주(21일) 후까지
                  maxDate.setHours(23, 59, 59, 999);
                  return maxDate;
                })()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
              />
            </motion.div>
          )}

          {/* Step 2: 기기 종류 선택 */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                {/* 이전 단계로 돌아가기 버튼 */}
                <button
                  onClick={() => handleStepChange(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 -ml-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">날짜 다시 선택</span>
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">어떤 기기를 대여하실 건가요?</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatKoreanDate(parseKSTDate(selectedDate))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deviceTypes.map((deviceType) => (
                  <button
                    key={deviceType.id}
                    onClick={() => {
                      // 기기 타입 선택 시 첫 번째 기기로 시간대 미리 로드 (시간대 확인용)
                      const availableDevice = deviceType.devices?.find((d: any) => d.status === 'available');
                      if (availableDevice) {
                        setSelectedDeviceType(deviceType.id);
                        setSelectedDevice(0); // 사용자는 아직 기기 번호 선택 안함
                        // 시간대 로딩을 위해 임시로 첫 번째 기기 정보 설정
                        const tempDeviceInfo = {
                          id: availableDevice.id,
                          name: deviceType.name,
                          typeId: deviceType.id,
                          deviceNumber: availableDevice.device_number
                        };
                        setSelectedDeviceInfo(tempDeviceInfo);
                        handleStepChange(3);
                      }
                    }}
                    disabled={!deviceType.total_device_count || deviceType.total_device_count === 0}
                    className="p-6 rounded-2xl border-2 transition-all text-left hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                          {deviceType.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(() => {
                            // 전체 보유 기기 수
                            const totalDevices = deviceType.total_device_count || 0;
                            
                            // 관리자가 설정한 최대 대여 가능 대수
                            const maxRental = deviceType.max_rental_units || totalDevices;
                            
                            // 표시 형식 결정
                            if (maxRental < totalDevices) {
                              // 제한이 있는 경우 (예: 4대 중 3대까지만)
                              return `${totalDevices}대 보유 (최대 ${maxRental}대 대여 가능)`;
                            } else {
                              // 제한이 없는 경우
                              return `${totalDevices}대 보유`;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: 시간 선택 */}
          {currentStep === 3 && selectedDeviceInfo && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                {/* 이전 단계로 돌아가기 버튼 */}
                <button
                  onClick={() => handleStepChange(2)}
                  className="inline-flex items-center gap-2 px-4 py-2 -ml-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">기기 다시 선택</span>
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">언제 이용하실 건가요?</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedDeviceInfo ? `${selectedDeviceInfo.name} (${selectedDeviceInfo.deviceNumber}번)` : deviceTypes.find(dt => dt.id === selectedDeviceType)?.name} • {formatKoreanDate(parseKSTDate(selectedDate))}
                  </p>
                </div>
              </div>

              {isLoadingSlots ? (
                <TimeSlotListSkeleton count={3} />
              ) : (
                <div className="space-y-3">
                  {timeSlots
                    .sort((a, b) => {
                      // 밤샘대여를 맨 아래로
                      if (a.slot_type === 'overnight' && b.slot_type !== 'overnight') return 1;
                      if (a.slot_type !== 'overnight' && b.slot_type === 'overnight') return -1;
                      // 조기대여를 두 번째로
                      if (a.slot_type === 'early' && b.slot_type === 'regular') return -1;
                      if (a.slot_type === 'regular' && b.slot_type === 'early') return 1;
                      // 같은 타입이면 시간 순서대로
                      return a.start_time.localeCompare(b.start_time);
                    })
                    .map((slot) => {
                    const slotDate = createKSTDateTime(selectedDate, slot.start_time);
                    const within24Hours = isWithin24Hours(slotDate);
                    // 관리자는 24시간 제한 해제, 동일 시간대 체크 제거
                    const isAvailable = slot.is_available && (isAdmin || !within24Hours);
                    
                    return (
                      <motion.button
                        key={slot.id}
                        whileHover={isAvailable ? { scale: 1.01 } : {}}
                        whileTap={isAvailable ? { scale: 0.99 } : {}}
                        onClick={() => {
                          if (isAvailable) {
                            console.log('시간대 선택됨:', slot.id);
                            console.log('시간대 객체:', slot);
                            console.log('예약 상태:', slot.device_reservation_status);
                            setSelectedTimeSlot(slot.id);
                            handleStepChange(4);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                          !isAvailable
                            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                            : selectedTimeSlot === slot.id
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-gray-400" />
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </h3>
                              {slot.slot_type === 'early' && (
                                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                                  조기대여
                                </span>
                              )}
                              {slot.slot_type === 'overnight' && (
                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                  밤샘대여
                                </span>
                              )}
                              {slot.is_youth_time && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  청소년 가능
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {within24Hours && !isAdmin ? (
                                <span className="text-amber-600">24시간 이내 예약 불가</span>
                              ) : (
                                <span className="text-green-600">
                                  {slot.available_devices.length}대 예약 가능
                                  {selectedDeviceInfo.max_rental_units && (
                                    <span className="text-gray-500 ml-1">
                                      (최대 {selectedDeviceInfo.max_rental_units}대)
                                    </span>
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: 상세 옵션 및 확인 */}
          {currentStep === 4 && selectedDeviceInfo && selectedTimeSlotInfo && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                {/* 이전 단계로 돌아가기 버튼 */}
                <button
                  onClick={() => handleStepChange(3)}
                  className="inline-flex items-center gap-2 px-4 py-2 -ml-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">시간 다시 선택</span>
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">예약 정보를 확인해주세요</h2>
                  <p className="text-gray-600 dark:text-gray-400">선택하신 내용을 확인하고 추가 옵션을 선택해주세요</p>
                </div>
              </div>

              {/* 예약 정보 요약 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">날짜</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatKoreanDate(parseKSTDate(selectedDate))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">기기</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedDeviceInfo?.name} ({selectedDeviceInfo?.deviceNumber}번)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">시간</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedTimeSlotInfo.start_time)} - {formatTime(selectedTimeSlotInfo.end_time)}
                  </span>
                </div>
              </div>

              {/* 기기 번호 선택 */}
              {(() => {
                const selectedDeviceTypeObj = deviceTypes.find(dt => dt.id === selectedDeviceType);
                const selectedTimeSlotObj = timeSlots.find(ts => ts.id === selectedTimeSlot);
                
                // 디버깅용 로그
                console.log('Selected TimeSlot ID:', selectedTimeSlot);
                console.log('Selected TimeSlot Object:', selectedTimeSlotObj);
                console.log('Device Reservation Status:', selectedTimeSlotObj?.device_reservation_status);
                
                // 해당 시간대의 예약 상태 맵 생성
                const deviceReservationMap = new Map();
                (selectedTimeSlotObj?.device_reservation_status || []).forEach(status => {
                  deviceReservationMap.set(status.device_number, status.reservation_status);
                });
                console.log('Device Reservation Map:', Array.from(deviceReservationMap.entries()));

                // 물리적으로 사용 가능한 기기
                const physicallyAvailableDevices = selectedDeviceTypeObj?.devices
                  ?.filter(d => d.status === 'available')
                  ?.sort((a, b) => a.device_number - b.device_number) || [];
                
                return physicallyAvailableDevices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">기기 번호 선택</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {physicallyAvailableDevices.map((device) => {
                        const isSelected = selectedDevice === device.device_number;
                        const reservationStatus = deviceReservationMap.get(device.device_number);
                        const isReserved = !!reservationStatus;
                        const isPending = reservationStatus === 'pending';
                        const isApproved = reservationStatus === 'approved';
                        const isCheckedIn = reservationStatus === 'checked_in';
                        
                        return (
                          <motion.button
                            key={device.id}
                            whileHover={!isReserved ? { scale: 1.05 } : {}}
                            whileTap={!isReserved ? { scale: 0.95 } : {}}
                            onClick={() => {
                              if (!isReserved) {
                                const newDeviceInfo = {
                                  id: device.id,
                                  name: selectedDeviceTypeObj?.name ?? '',
                                  typeId: selectedDeviceTypeObj?.id ?? '',
                                  deviceNumber: device.device_number
                                };
                                setSelectedDeviceInfo(newDeviceInfo);
                                setSelectedDevice(device.device_number);
                              }
                            }}
                            disabled={isReserved}
                            className={`p-3 rounded-xl border-2 transition-all relative ${
                              isReserved
                                ? 'cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
                                : isSelected
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                            }`}
                          >
                            <div className="text-center">
                              <span className={`text-sm ${
                                isReserved ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {device.device_number}번
                              </span>
                              {isReserved && (
                                <div className={`text-xs mt-1 font-medium ${
                                  isPending 
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : isApproved
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isCheckedIn
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {isPending ? '예약대기' : isApproved ? '예약확정' : isCheckedIn ? '사용중' : '예약됨'}
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 크레딧 옵션 선택 */}
              {selectedTimeSlotInfo.credit_options && selectedTimeSlotInfo.credit_options.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">크레딧 타입</h3>
                  <div className="space-y-3">
                    {selectedTimeSlotInfo.credit_options.map((option) => (
                      <motion.button
                        key={option.type}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedCreditOption(option.type)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          selectedCreditOption === option.type
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles className={`w-5 h-5 ${
                              option.type === 'unlimited' ? 'text-purple-500' :
                              option.type === 'freeplay' ? 'text-blue-500' :
                              'text-amber-500'
                            }`} />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {option.type === 'fixed' ? '고정크레딧' :
                               option.type === 'freeplay' ? '프리플레이' :
                               option.type === 'unlimited' ? '무한크레딧' :
                               option.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {option.price?.toLocaleString()}원
                            </span>
                            {option.type === 'fixed' && option.fixed_credits && (
                              <span className="text-sm text-gray-600 dark:text-gray-400 block">
                                {option.fixed_credits}크레딧
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* 인원수 선택 (2인 플레이 가능한 경우만) */}
              {selectedTimeSlotInfo.enable_2p && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">플레이 인원</h3>
                  <div className="flex gap-3">
                    {[1, 2].map((count) => (
                      <motion.button
                        key={count}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlayerCount(count)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          playerCount === count
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {count}인
                            {count === 2 && selectedTimeSlotInfo.price_2p_extra && (
                              <span className="text-sm text-indigo-600 dark:text-indigo-400 ml-2">
                                (+{selectedTimeSlotInfo.price_2p_extra.toLocaleString()}원)
                              </span>
                            )}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* 메모 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">요청사항 (선택)</h3>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="특별한 요청사항이 있으시면 적어주세요"
                  className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 최종 가격 */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">총 결제 금액</p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                      {calculateTotalPrice().toLocaleString()}원
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* 예약하기 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleStepChange(3)}
                  className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  이전
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!selectedDeviceInfo || !selectedCreditOption || isSubmitting}
                  className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    !selectedDeviceInfo || !selectedCreditOption || isSubmitting
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      예약 중...
                    </>
                  ) : (
                    <>
                      예약하기
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* 안내사항 */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium mb-1">예약 안내</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 예약은 대여 시작 24시간 전까지 취소 가능합니다</li>
                      {isOnBehalfMode && (
                        <li>• 대리 예약은 {onBehalfUserName}님의 예약으로 등록됩니다</li>
                      )}
                      <li>• 무단 불참 시 다음 예약이 제한될 수 있습니다</li>
                      <li>• 대여 시작 10분 전까지 오락실에 도착해주세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
