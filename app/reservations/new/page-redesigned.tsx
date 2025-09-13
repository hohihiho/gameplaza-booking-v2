'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, AlertCircle, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/db';
import { parseKSTDate, formatKSTDate, createKSTDateTime, isWithin24Hours, formatKoreanDate } from '@/lib/utils/kst-date';
import { useReservationStore } from '@/app/store/reservation-store';
import { BottomSheet, TouchRipple, SkeletonCard } from '@/app/components/mobile';

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
  credit_options?: any[];
  enable_2p?: boolean;
  price_2p_extra?: number;
  device_reservation_status?: Array<{
    device_number: number;
    reservation_status: string | null;
  }>;
};

interface ReservationData {
  date: string;
  deviceType: string;
  timeSlot: string;
  deviceNumber: number;
  creditOption: string;
  playerCount: number;
}

export default function NewReservationPageRedesigned() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [supabase] = useState(() => createClient());
  const setLastReservationId = useReservationStore((state) => state.setLastReservationId);
  
  // 현재 단계 (1-3)
  const [currentStep, setCurrentStep] = useState(1);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<'device' | 'time' | 'options' | null>(null);
  
  // 예약 데이터
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: '',
    deviceType: '',
    timeSlot: '',
    deviceNumber: 0,
    creditOption: '',
    playerCount: 1
  });
  
  // API 데이터
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/login');
    }
  }, [status, session, router]);
  
  // 기기 타입 목록 불러오기
  useEffect(() => {
    loadDeviceTypes();
  }, []);
  
  const loadDeviceTypes = async () => {
    try {
      setIsLoadingDevices(true);
      
      const supabase = createClient();
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

      const formattedData: DeviceType[] = (deviceTypesData || []).map(type => {
        const activeDevices = (type.devices || []).filter((d: any) => 
          d.status !== 'maintenance' && d.status !== 'broken'
        );
        
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
          fixed_credits: rentalSettings.fixed_credits,
          rental_settings: rentalSettings
        };
      })
      .sort((a, b) => a.display_order - b.display_order);
      
      setDeviceTypes(formattedData);
    } catch (error) {
      console.error('Failed to load device types:', error);
      setError('기기 정보를 불러올 수 없습니다');
    } finally {
      setIsLoadingDevices(false);
    }
  };
  
  // 시간대 슬롯 불러오기
  const loadTimeSlots = async () => {
    if (!reservationData.deviceType || !reservationData.date || !deviceTypes.length) return;
    
    try {
      setIsLoadingSlots(true);
      setError(null);
      
      const supabase = createClient();
      const { data: slotsData, error: slotsError } = await supabase.from('rental_time_slots')
        .select('*')
        .eq('device_type_id', reservationData.deviceType)
        .order('slot_type', { ascending: true })
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;

      const response = await fetch(`/api/reservations/check-availability?date=${reservationData.date}&deviceTypeId=${reservationData.deviceType}`);
      const { reservations, error: apiError } = await response.json();
      
      if (apiError) {
        console.error('예약 조회 오류:', apiError);
      }
      
      const filteredReservations = (reservations || []).filter(
        (r: any) => r.devices?.device_type_id === reservationData.deviceType
      );

      const formattedSlots: TimeSlot[] = await Promise.all((slotsData || []).map(async slot => {
        const selectedDeviceInfo = deviceTypes.find(d => d.id === reservationData.deviceType);
        const allDevices = selectedDeviceInfo?.devices
          .map(d => d.device_number) || [];
        
        const reservedDevices = (filteredReservations || [])
          .filter((res: any) => {
            const isOverlapping = res.start_time < slot.end_time && res.end_time > slot.start_time;
            return isOverlapping;
          })
          .map((res: any) => ({
            device_number: res.devices?.device_number,
            status: res.status
          }))
          .filter((item: any) => item.device_number !== undefined);
        
        const reservedDeviceNumbers = reservedDevices.map((d: any) => d.device_number);
        const availableDevices = allDevices.filter(num => !reservedDeviceNumbers.includes(num));
        
        const maxRentalUnits = selectedDeviceInfo?.max_rental_units || selectedDeviceInfo?.active_device_count || 4;
        const reservedCount = reservedDeviceNumbers.length;
        const actualAvailableDevices = reservedCount >= maxRentalUnits ? [] : availableDevices;
        
        const deviceReservationStatus = allDevices.map(num => {
          const reservation = reservedDevices.find((d: any) => d.device_number === num);
          return {
            device_number: num,
            reservation_status: reservation?.status || null
          };
        });
        
        let price = 50000;
        if (slot.credit_options && Array.isArray(slot.credit_options)) {
          const freeplayOption = slot.credit_options.find((opt: any) => opt.type === 'freeplay');
          if (freeplayOption?.price) {
            price = freeplayOption.price;
          }
        }
        
        return {
          id: slot.id,
          date: reservationData.date,
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
  
  useEffect(() => {
    if (reservationData.deviceType && reservationData.date) {
      loadTimeSlots();
    }
  }, [reservationData.deviceType, reservationData.date]);
  
  // 날짜 선택을 위한 달력 데이터 생성
  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    const threeWeeksLater = new Date(today);
    threeWeeksLater.setDate(today.getDate() + 21);
    
    const daysUntilSunday = threeWeeksLater.getDay() === 0 ? 0 : 7 - threeWeeksLater.getDay();
    const lastSunday = new Date(threeWeeksLater);
    lastSunday.setDate(threeWeeksLater.getDate() + daysUntilSunday);
    
    const totalDays = Math.ceil((lastSunday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // 시간 포맷
  const formatTime = (time: string) => {
    const [hour] = time.split(':');
    if (!hour) return '';
    const h = parseInt(hour);
    if (h >= 0 && h <= 5) {
      return `${h + 24}시`;
    }
    return `${h}시`;
  };
  
  // 선택한 정보 가져오기
  const selectedDeviceInfo = deviceTypes.find(d => d.id === reservationData.deviceType);
  const selectedTimeSlotInfo = timeSlots.find(s => s.id === reservationData.timeSlot);
  
  // 가격 계산
  const calculatePrice = () => {
    if (!selectedTimeSlotInfo || !reservationData.creditOption) return 0;
    
    const selectedCreditOption = selectedTimeSlotInfo.credit_options?.find(
      (opt: any) => opt.type === reservationData.creditOption
    );
    
    if (!selectedCreditOption) return 0;
    
    let basePrice = selectedCreditOption.price;
    
    if (reservationData.playerCount === 2 && selectedTimeSlotInfo.enable_2p && selectedTimeSlotInfo.price_2p_extra) {
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
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const supabase = createClient();
  const { data: availableDevice, error: deviceError } = await supabase.from('devices')
        .select('*')
        .eq('device_type_id', reservationData.deviceType)
        .eq('device_number', reservationData.deviceNumber)
        .single();

      if (deviceError || !availableDevice) {
        throw new Error('선택한 기기를 찾을 수 없습니다');
      }

      if (availableDevice.status !== 'available' && availableDevice.status !== 'in_use') {
        throw new Error(`선택한 기기를 사용할 수 없습니다 (상태: ${availableDevice.status})`);
      }

      if (!session?.user?.email) {
        throw new Error('로그인이 필요합니다');
      }

      const supabase = createClient();
  const { data: userData } = await supabase.from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (userError || !userData) {
        throw new Error('사용자 정보를 찾을 수 없습니다. 회원가입을 완료해주세요.');
      }

      const reservationPayload = {
        user_id: userData.id,
        rental_time_slot_id: reservationData.timeSlot,
        device_type_id: reservationData.deviceType,
        device_number: reservationData.deviceNumber,
        player_count: reservationData.playerCount,
        credit_option: reservationData.creditOption,
        total_price: totalPrice,
        status: 'pending',
        notes: ''
      };
      
      const supabase = createClient();
  const { data: newReservation, error: reservationError } = await supabase.from('reservations')
        .insert(reservationPayload)
        .select()
        .single();

      if (reservationError) {
        throw new Error(reservationError.message || '예약 생성에 실패했습니다');
      }
      
      if (newReservation?.id) {
        setLastReservationId(newReservation.id);
        router.push('/reservations/complete');
      } else {
        router.push('/reservations');
      }
    } catch (error: any) {
      console.error('예약 처리 중 오류:', error);
      setError(error.message || '예약 신청에 실패했습니다');
      setIsSubmitting(false);
    }
  };
  
  const openSheet = (content: 'device' | 'time' | 'options') => {
    setSheetContent(content);
    setIsBottomSheetOpen(true);
  };
  
  const closeSheet = () => {
    setIsBottomSheetOpen(false);
    setSheetContent(null);
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
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold dark:text-white">예약하기</h1>
          </div>
          
          {/* 진행 상태 바 */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStep / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {currentStep}/3
            </span>
          </div>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto px-5 py-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </motion.div>
        )}
        
        {/* Step 1: 날짜 선택 */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold mb-6 dark:text-white">날짜를 선택해주세요</h2>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                <div key={day} className={`text-center text-xs font-medium py-2 ${
                  index === 6 ? 'text-red-500' : index === 5 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays[0] && Array.from({ length: calendarDays[0].getDay() === 0 ? 6 : calendarDays[0].getDay() - 1 }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {calendarDays.map((date) => {
                const dateStr = formatKSTDate(date);
                const isSelected = reservationData.date === dateStr;
                const now = new Date();
                const isToday = now.toDateString() === date.toDateString();
                const dayOfWeek = date.getDay();
                
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const isDisabled = date < tomorrow;
                
                return (
                  <TouchRipple key={dateStr}>
                    <button
                      onClick={() => {
                        if (dateStr && !isDisabled) {
                          setReservationData(prev => ({ ...prev, date: dateStr }));
                          setCurrentStep(2);
                        }
                      }}
                      disabled={isDisabled}
                      className={`aspect-square p-2 rounded-xl border transition-all touch-target ${
                        isDisabled
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : isToday
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        isDisabled
                          ? 'text-gray-400 dark:text-gray-600'
                          : isSelected 
                            ? 'text-white' 
                            : dayOfWeek === 0 
                              ? 'text-red-500' 
                              : dayOfWeek === 6 
                                ? 'text-blue-500' 
                                : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {date.getDate()}
                      </span>
                    </button>
                  </TouchRipple>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* Step 2: 기기 및 시간 선택 */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold dark:text-white">기기와 시간 선택</h2>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                날짜 변경
              </button>
            </div>
            
            {/* 선택된 날짜 표시 */}
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                {formatKoreanDate(parseKSTDate(reservationData.date))}
              </p>
            </div>
            
            {/* 기기 선택 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">기기 선택</h3>
              <TouchRipple>
                <button
                  onClick={() => openSheet('device')}
                  className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left"
                >
                  {selectedDeviceInfo ? (
                    <div>
                      <p className="font-medium dark:text-white">{selectedDeviceInfo.name}</p>
                      {selectedDeviceInfo.model_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedDeviceInfo.model_name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">기기를 선택해주세요</p>
                  )}
                </button>
              </TouchRipple>
            </div>
            
            {/* 시간대 선택 */}
            {selectedDeviceInfo && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">시간대 선택</h3>
                <TouchRipple>
                  <button
                    onClick={() => openSheet('time')}
                    className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left"
                  >
                    {selectedTimeSlotInfo ? (
                      <div>
                        <p className="font-medium dark:text-white">
                          {formatTime(selectedTimeSlotInfo.start_time)} - {formatTime(selectedTimeSlotInfo.end_time)}
                        </p>
                        {selectedTimeSlotInfo.slot_type === 'early' && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">조기대여</p>
                        )}
                        {selectedTimeSlotInfo.slot_type === 'overnight' && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">밤샘대여</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400">시간대를 선택해주세요</p>
                    )}
                  </button>
                </TouchRipple>
              </div>
            )}
            
            {/* 다음 단계 버튼 */}
            {selectedDeviceInfo && selectedTimeSlotInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <TouchRipple>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    다음 단계
                  </button>
                </TouchRipple>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Step 3: 옵션 선택 및 확인 */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold dark:text-white">예약 확인</h2>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                이전 단계
              </button>
            </div>
            
            {/* 선택 내용 요약 */}
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">날짜</p>
                <p className="font-medium dark:text-white">{formatKoreanDate(parseKSTDate(reservationData.date))}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">기기</p>
                <p className="font-medium dark:text-white">
                  {selectedDeviceInfo?.name}
                  {reservationData.deviceNumber > 0 && ` ${reservationData.deviceNumber}번기`}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">시간</p>
                <p className="font-medium dark:text-white">
                  {selectedTimeSlotInfo && (
                    `${formatTime(selectedTimeSlotInfo.start_time)} - ${formatTime(selectedTimeSlotInfo.end_time)}`
                  )}
                </p>
              </div>
            </div>
            
            {/* 추가 옵션 선택 */}
            <TouchRipple>
              <button
                onClick={() => openSheet('options')}
                className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left mb-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium dark:text-white">옵션 선택</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      기기 번호, 크레딧, 인원수
                    </p>
                  </div>
                  {reservationData.deviceNumber > 0 && reservationData.creditOption && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </button>
            </TouchRipple>
            
            {/* 총 금액 */}
            {totalPrice > 0 && (
              <div className="p-4 bg-indigo-600 text-white rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm opacity-90">총 금액</p>
                  <p className="text-2xl font-bold">{totalPrice.toLocaleString()}원</p>
                </div>
              </div>
            )}
            
            {/* 예약하기 버튼 */}
            {reservationData.deviceNumber > 0 && reservationData.creditOption && (
              <TouchRipple>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      예약 중...
                    </>
                  ) : (
                    '예약하기'
                  )}
                </button>
              </TouchRipple>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Bottom Sheets */}
      <BottomSheet
        isOpen={isBottomSheetOpen && sheetContent === 'device'}
        onClose={closeSheet}
        title="기기 선택"
        snapPoints={[0.7, 1]}
        defaultSnapPoint={0}
      >
        <div className="p-5 pb-8">
          {isLoadingDevices ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-3">
              {deviceTypes.map((device) => (
                <TouchRipple key={device.id}>
                  <button
                    onClick={() => {
                      setReservationData(prev => ({ 
                        ...prev, 
                        deviceType: device.id,
                        timeSlot: '',
                        deviceNumber: 0,
                        creditOption: '',
                        playerCount: 1
                      }));
                      closeSheet();
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      reservationData.deviceType === device.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium dark:text-white">{device.name}</h3>
                        {device.model_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {device.model_name}
                          </p>
                        )}
                        {device.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            {device.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {device.category}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      최대 {device.max_rental_units || device.active_device_count}대 동시 대여 가능
                    </div>
                  </button>
                </TouchRipple>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
      
      <BottomSheet
        isOpen={isBottomSheetOpen && sheetContent === 'time'}
        onClose={closeSheet}
        title="시간대 선택"
        snapPoints={[0.6, 1]}
        defaultSnapPoint={0}
      >
        <div className="p-5 pb-8">
          {isLoadingSlots ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-3">
              {timeSlots.map((slot) => {
                const slotDate = createKSTDateTime(reservationData.date, slot.start_time);
                const within24Hours = isWithin24Hours(slotDate);
                const isAvailable = slot.is_available && !within24Hours;
                
                return (
                  <TouchRipple key={slot.id}>
                    <button
                      onClick={() => {
                        if (isAvailable) {
                          setReservationData(prev => ({ 
                            ...prev, 
                            timeSlot: slot.id,
                            deviceNumber: 0,
                            creditOption: '',
                            playerCount: 1
                          }));
                          closeSheet();
                        }
                      }}
                      disabled={!isAvailable}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        !isAvailable
                          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                          : reservationData.timeSlot === slot.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium dark:text-white">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {within24Hours ? (
                              <span className="text-red-500">24시간 이내 예약 불가</span>
                            ) : !slot.is_available ? (
                              <span className="text-red-500">예약 마감</span>
                            ) : (
                              `${slot.available_devices.length}대 예약 가능`
                            )}
                          </p>
                        </div>
                        {slot.slot_type === 'early' && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                            조기대여
                          </span>
                        )}
                        {slot.slot_type === 'overnight' && (
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                            밤샘대여
                          </span>
                        )}
                      </div>
                    </button>
                  </TouchRipple>
                );
              })}
            </div>
          )}
        </div>
      </BottomSheet>
      
      <BottomSheet
        isOpen={isBottomSheetOpen && sheetContent === 'options'}
        onClose={closeSheet}
        title="옵션 선택"
        snapPoints={[0.8, 1]}
        defaultSnapPoint={0}
      >
        <div className="p-5 pb-8 space-y-6">
          {/* 기기 번호 선택 */}
          {selectedTimeSlotInfo && selectedDeviceInfo && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">기기 번호</h3>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: selectedDeviceInfo.total_device_count }, (_, i) => i + 1).map((deviceNum) => {
                  const device = selectedDeviceInfo.devices.find((d: any) => d.device_number === deviceNum);
                  const isAvailable = selectedTimeSlotInfo.available_devices.includes(deviceNum);
                  const isMaintenance = device?.status === 'maintenance';
                  const isBroken = device?.status === 'broken';
                  
                  const reservationInfo = selectedTimeSlotInfo.device_reservation_status?.find(
                    (d: any) => d.device_number === deviceNum
                  );
                  const reservationStatus = reservationInfo?.reservation_status;
                  
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
                    <TouchRipple key={deviceNum}>
                      <button
                        onClick={() => {
                          if (canSelect) {
                            setReservationData(prev => ({ ...prev, deviceNumber: deviceNum }));
                          }
                        }}
                        disabled={!canSelect}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          !canSelect
                            ? `cursor-not-allowed ${statusInfo?.color || 'opacity-50 border-gray-200 dark:border-gray-700'}`
                            : reservationData.deviceNumber === deviceNum
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
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
                    </TouchRipple>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 크레딧 옵션 */}
          {selectedTimeSlotInfo && selectedTimeSlotInfo.credit_options && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">크레딧 옵션</h3>
              <div className="space-y-3">
                {selectedTimeSlotInfo.credit_options.map((option: any) => (
                  <TouchRipple key={option.type}>
                    <button
                      onClick={() => {
                        setReservationData(prev => ({ ...prev, creditOption: option.type }));
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        reservationData.creditOption === option.type
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
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
                  </TouchRipple>
                ))}
              </div>
            </div>
          )}
          
          {/* 인원수 선택 */}
          {selectedTimeSlotInfo?.enable_2p && selectedDeviceInfo?.max_players && selectedDeviceInfo.max_players > 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">인원수</h3>
              <div className="grid grid-cols-2 gap-3">
                <TouchRipple>
                  <button
                    onClick={() => setReservationData(prev => ({ ...prev, playerCount: 1 }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reservationData.playerCount === 1
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <h3 className="font-medium dark:text-white">1인 플레이</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">기본 요금</p>
                  </button>
                </TouchRipple>
                
                <TouchRipple>
                  <button
                    onClick={() => setReservationData(prev => ({ ...prev, playerCount: 2 }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reservationData.playerCount === 2
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <h3 className="font-medium dark:text-white">2인 플레이</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      +₩{selectedTimeSlotInfo.price_2p_extra?.toLocaleString() || '0'}
                    </p>
                  </button>
                </TouchRipple>
              </div>
            </div>
          )}
          
          {/* 적용 버튼 */}
          {reservationData.deviceNumber > 0 && reservationData.creditOption && (
            <TouchRipple>
              <button
                onClick={closeSheet}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                적용하기
              </button>
            </TouchRipple>
          )}
        </div>
      </BottomSheet>
    </main>
  );
}