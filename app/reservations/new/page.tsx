'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gamepad2, ChevronLeft, Loader2, AlertCircle, CreditCard, Users, Sparkles, ChevronRight, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase';
import { parseKSTDate, createKSTDateTime, isWithin24Hours, formatKoreanDate } from '@/lib/utils/kst-date';
import { useReservationStore } from '@/app/store/reservation-store';
import { useCreateReservation } from '@/lib/hooks/useReservations';
import { TimeSlotListSkeleton } from '@/app/components/mobile/ReservationSkeleton';
import { Calendar } from '@/src/components/ui/Calendar';
import { DeviceSelector } from '@/src/components/ui/DeviceSelector';

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
  const { status } = useSession();
  // const [supabase] = useState(() => createClient());
  const setLastReservationId = useReservationStore((state) => state.setLastReservationId);
  
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

  // 선택된 기기와 시간대 정보
  const selectedDeviceInfo = deviceTypes.find(d => d.id === selectedDeviceType);
  const selectedTimeSlotInfo = timeSlots.find(s => s.id === selectedTimeSlot);

  // 기기 타입 불러오기
  useEffect(() => {
    fetchDeviceTypes();
  }, []);

  // 날짜 선택 시 타임슬롯 불러오기
  useEffect(() => {
    if (selectedDate && selectedDeviceType) {
      fetchTimeSlots();
    }
  }, [selectedDate, selectedDeviceType]);

  const fetchDeviceTypes = async () => {
    setIsLoadingDevices(true);
    try {
      // device_types와 관련 정보 가져오기
      const supabase = createClient();
      const { data: deviceTypesData, error: typesError } = await supabase.from('device_types')
        .select(`
          *,
          device_categories!category_id (
            id,
            name,
            display_order
          ),
          devices (
            id,
            device_number,
            status
          )
        `)
        .eq('is_rentable', true)
        .order('display_order', { ascending: true });

      if (typesError) {
        console.error('Supabase query error:', typesError);
        throw typesError;
      }

      console.log('Raw device types data:', deviceTypesData);

      const processedTypes = (deviceTypesData || []).map(type => {
        // rental_settings가 JSONB인 경우 처리
        const rentalSettings = type.rental_settings || {};
        
        return {
          ...type,
          category: type.device_categories?.name || '',
          active_device_count: type.devices?.filter((d: any) => d.status === 'available').length || 0,
          total_device_count: type.devices?.length || 0,
          rental_display_order: rentalSettings.display_order,
          max_rental_units: rentalSettings.max_rental_units,
          max_players: rentalSettings.max_players,
          price_multiplier_2p: rentalSettings.price_multiplier_2p
        };
      });

      // rental_settings의 display_order로 정렬
      const sortedTypes = processedTypes.sort((a, b) => {
        const orderA = a.rental_display_order ?? a.display_order ?? 999;
        const orderB = b.rental_display_order ?? b.display_order ?? 999;
        return orderA - orderB;
      });

      console.log('Processed device types:', sortedTypes);
      setDeviceTypes(sortedTypes);
    } catch (error) {
      console.error('Error fetching device types:', error);
      setError('기기 정보를 불러올 수 없습니다');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const fetchTimeSlots = async () => {
    setIsLoadingSlots(true);
    setError(null);
    try {
      // 임시로 기본 시간 슬롯 생성 (API 개발 완료 전까지)
      const mockTimeSlots = [
        {
          id: '1',
          date: selectedDate,
          start_time: '10:00',
          end_time: '12:00',
          device_type_id: selectedDeviceType,
          max_devices: 4,
          available_devices: [1, 2, 3, 4],
          is_available: true,
          price: 8000,
          slot_type: 'regular',
          is_youth_time: true,
          credit_options: [
            { type: 'fixed', price: 8000, fixed_credits: 20 },
            { type: 'unlimited', price: 12000 }
          ],
          enable_2p: true,
          price_2p_extra: 2000,
          device_reservation_status: []
        },
        {
          id: '2',
          date: selectedDate,
          start_time: '14:00',
          end_time: '16:00',
          device_type_id: selectedDeviceType,
          max_devices: 4,
          available_devices: [1, 2, 3, 4],
          is_available: true,
          price: 8000,
          slot_type: 'regular',
          is_youth_time: false,
          credit_options: [
            { type: 'fixed', price: 8000, fixed_credits: 20 },
            { type: 'unlimited', price: 12000 }
          ],
          enable_2p: true,
          price_2p_extra: 2000,
          device_reservation_status: []
        }
      ];

      setTimeSlots(mockTimeSlots);
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

    try {
      const deviceId = selectedDeviceInfo.devices.find(d => d.device_number === selectedDevice)?.id;
      if (!deviceId) {
        throw new Error('선택한 기기를 찾을 수 없습니다');
      }

      const reservationData = {
        date: selectedDate,
        device_id: deviceId,
        start_time: selectedTimeSlotInfo.start_time,
        end_time: selectedTimeSlotInfo.end_time,
        player_count: playerCount,
        credit_type: selectedCreditOption,
        fixed_credits: selectedTimeSlotInfo.credit_options?.find(opt => opt.type === selectedCreditOption)?.fixed_credits || undefined,
        user_notes: userNotes || undefined,
        slot_type: selectedTimeSlotInfo.slot_type || 'regular',
        total_amount: calculateTotalPrice()
      };

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
      console.error('Reservation error:', error);
      setError(error.message || '예약 중 오류가 발생했습니다');
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
          
          {/* 진행 상태 */}
          <div className="px-5 pb-2">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4">
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">언제 대여하실 건가요?</h2>
                <p className="text-gray-600 dark:text-gray-400">대여 가능한 날짜를 선택해주세요</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  ※ 당일 예약은 불가능합니다. 대여 24시간 전부터 최대 3주 후까지 예약 가능합니다.
                </p>
              </div>

              <Calendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  handleStepChange(2);
                }}
                minDate={(() => {
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

              <DeviceSelector
                deviceTypes={deviceTypes}
                selectedDeviceId={selectedDeviceType}
                onDeviceSelect={(deviceId) => {
                  setSelectedDeviceType(deviceId);
                  handleStepChange(3);
                }}
                isLoading={isLoadingDevices}
                emptyMessage="대여 가능한 기기가 없습니다"
                columns={{ mobile: 1, tablet: 2, desktop: 2 }}
              />
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
                    {selectedDeviceInfo.name} • {formatKoreanDate(parseKSTDate(selectedDate))}
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
                    const isAvailable = slot.is_available && !within24Hours;
                    
                    return (
                      <motion.button
                        key={slot.id}
                        whileHover={isAvailable ? { scale: 1.01 } : {}}
                        whileTap={isAvailable ? { scale: 0.99 } : {}}
                        onClick={() => {
                          if (isAvailable) {
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
                              {within24Hours ? (
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
                    {selectedDeviceInfo.name}
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
              {selectedTimeSlotInfo.available_devices && selectedTimeSlotInfo.available_devices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">기기 번호 선택</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {selectedTimeSlotInfo.available_devices.map((deviceNum) => {
                      const deviceStatus = selectedTimeSlotInfo.device_reservation_status?.find(
                        d => d.device_number === deviceNum
                      );
                      const isReserved = deviceStatus?.reservation_status === 'approved' || 
                                        deviceStatus?.reservation_status === 'pending';
                      
                      return (
                        <motion.button
                          key={deviceNum}
                          whileHover={!isReserved ? { scale: 1.05 } : {}}
                          whileTap={!isReserved ? { scale: 0.95 } : {}}
                          onClick={() => !isReserved && setSelectedDevice(deviceNum)}
                          disabled={isReserved}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isReserved
                              ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                              : selectedDevice === deviceNum
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{deviceNum}번</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  disabled={!selectedDevice || !selectedCreditOption || isSubmitting}
                  className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    !selectedDevice || !selectedCreditOption || isSubmitting
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