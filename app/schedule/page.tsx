// 오락실 운영일정 페이지
// 비전공자 설명: 오락실의 영업시간과 특별 일정을 확인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Sun,
  Moon,
  Coffee,
  XCircle,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ScheduleEvent = {
  id: string;
  date: string;
  endDate?: string;
  title: string;
  type: 'special' | 'early_open' | 'overnight' | 'early_close' | 'event' | 'reservation_block' | 'reservation';
  description?: string;
  startTime?: string;
  endTime?: string;
  affectsReservation?: boolean;
  blockType?: 'early' | 'overnight' | 'all_day';
  reservations?: ReservationInfo[];
};

type ReservationInfo = {
  id: string;
  deviceType: string;
  deviceNumber?: number;
  playerCount: number;
  time: string;
  slotType: 'early' | 'overnight' | 'regular';
};

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  // const [reservations, setReservations] = useState<any[]>([]);
  const [deviceColors, setDeviceColors] = useState<Record<string, string>>({});
  const [deviceOrder, setDeviceOrder] = useState<Record<string, number>>({});
  const [supabase] = useState(() => createClient());
  const [, setIsLoading] = useState(false);
  
  // 기종별 색상 정보 로드
  useEffect(() => {
    const loadDeviceColors = async () => {
      try {
        const response = await fetch('/api/admin/devices/types');
        if (response.ok) {
          const devices = await response.json();
          const colors: Record<string, string> = {};
          const orders: Record<string, number> = {};
          devices.forEach((device: any) => {
            if (device.rental_settings?.color) {
              colors[device.name] = device.rental_settings.color;
            }
            if (device.rental_settings?.display_order !== undefined) {
              orders[device.name] = device.rental_settings.display_order;
            }
          });
          setDeviceColors(colors);
          setDeviceOrder(orders);
        }
      } catch (error) {
        console.error('Error loading device colors:', error);
      }
    };
    
    loadDeviceColors();
  }, []);
  
  // Supabase에서 운영 일정 및 예약 데이터 가져오기
  const fetchScheduleData = async () => {
    try {
      setIsLoading(true);
      
      // 현재 월의 시작일과 종료일 계산
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // 1. 특별 운영 일정 가져오기
      const { data: specialOps, error: specialOpsError } = await supabase
        .from('special_operations')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (specialOpsError) throw specialOpsError;

      // 2. 예약 데이터 가져오기
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          rental_time_slots (
            date,
            start_time,
            end_time,
            slot_type
          ),
          device_types (
            name
          )
        `)
        .in('status', ['approved', 'checked_in'])
        .gte('rental_time_slots.date', startDate.toISOString().split('T')[0])
        .lte('rental_time_slots.date', endDate.toISOString().split('T')[0]);

      if (reservationsError) throw reservationsError;

      // 3. 특별 운영 일정 포맷팅
      const formattedEvents: ScheduleEvent[] = (specialOps || []).map(op => ({
        id: op.id,
        date: op.date,
        title: op.operation_type === 'early' ? '조기 오픈' : '밤샘 영업',
        type: op.operation_type === 'early' ? 'early_open' : 'overnight',
        description: op.notes || '',
        startTime: op.operation_type === 'early' ? '07:00' : undefined,
        endTime: op.operation_type === 'overnight' ? '05:00' : undefined,
        affectsReservation: false
      }));

      // 4. 예약 데이터를 날짜별로 그룹화
      const reservationsByDate = (reservationsData || []).reduce((acc: Record<string, any[]>, res) => {
        const date = res.rental_time_slots?.date;
        if (!date) return acc;
        
        if (!acc[date]) {
          acc[date] = [];
        }
        
        acc[date].push({
          id: res.id,
          deviceType: res.device_types?.name || '알 수 없음',
          deviceNumber: res.device_number,
          playerCount: res.player_count || 1,
          time: `${res.rental_time_slots.start_time.slice(0, 5)}-${res.rental_time_slots.end_time.slice(0, 5)}`,
          slotType: res.rental_time_slots.slot_type || 'regular'
        });
        
        return acc;
      }, {});

      // 5. 예약 이벤트 생성
      const reservationEvents: ScheduleEvent[] = Object.entries(reservationsByDate).map(([date, reservations]) => {
        const earlyCount = reservations.filter(r => r.slotType === 'early').length;
        const overnightCount = reservations.filter(r => r.slotType === 'overnight').length;
        
        let title = '';
        if (earlyCount > 0 && overnightCount > 0) {
          title = `조기 ${earlyCount}건, 밤샘 ${overnightCount}건`;
        } else if (earlyCount > 0) {
          title = `조기 대여 ${earlyCount}건`;
        } else if (overnightCount > 0) {
          title = `밤샘 대여 ${overnightCount}건`;
        } else {
          title = `예약 ${reservations.length}건`;
        }
        
        return {
          id: `res-${date}`,
          date,
          title,
          type: 'reservation',
          reservations: reservations as ReservationInfo[]
        };
      });

      // 6. 설정에서 추가 이벤트 가져오기 (예: 휴무일, 특별 이벤트 등)
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'special_events')
        .single();

      const additionalEvents: ScheduleEvent[] = settingsData?.value?.events || [];
      
      // 모든 이벤트 합치기
      setEvents([...formattedEvents, ...reservationEvents, ...additionalEvents]);
    } catch (error) {
      console.error('운영 일정 불러오기 실패:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // 실시간 업데이트 구독
  useEffect(() => {
    const channel = supabase
      .channel('schedule-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'special_operations'
        },
        () => {
          fetchScheduleData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => {
          fetchScheduleData();
        }
      )
      .subscribe();


    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, currentMonth, fetchScheduleData]);
  
  // 날짜 관련 유틸리티 함수들
  // const getDaysInMonth = (date: Date) => {
  //   return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  // };
  
  // const getFirstDayOfMonth = (date: Date) => {
  //   return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  // };
  
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };
  
  const changeMonth = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };
  
  const eventTypeConfig = {
    special: {
      label: '특별 운영',
      icon: Clock,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    early_open: {
      label: '조기 오픈',
      icon: Sun,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    overnight: {
      label: '밤샘 영업',
      icon: Moon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    early_close: {
      label: '조기 마감',
      icon: Coffee,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    event: {
      label: '이벤트',
      icon: Calendar,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    reservation_block: {
      label: '예약 제한',
      icon: XCircle,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    reservation: {
      label: '예약 현황',
      icon: Gamepad2,
      color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800'
    }
  };
  
  // 예약 시간대별 색상 - 조기오픈/밤샘영업과 유사한 색상
  const reservationTypeColors = {
    early: 'bg-yellow-500 dark:bg-yellow-600',      // 조기오픈과 비슷한 노란색
    overnight: 'bg-purple-500 dark:bg-purple-600',  // 밤샘영업과 비슷한 보라색
    regular: 'bg-gray-500 dark:bg-gray-600'
  };
  
  // 기종별 색상 (연한 색상) - 사용자가 지정한 색상
  const deviceTypeColors: Record<string, string> = {
    '사운드 볼텍스': 'bg-blue-200 dark:bg-blue-800',      // 파랑
    '비트매니아 IIDX': 'bg-pink-200 dark:bg-pink-800',    // 핑크
    '마이마이 DX': 'bg-purple-200 dark:bg-purple-800',    // 보라
    '츄니즘 NEW!!': 'bg-orange-200 dark:bg-orange-800',   // 주황
    '춘리즘': 'bg-orange-200 dark:bg-orange-800',         // 주황 (츄니즘과 같은 계열)
    '왓카': 'bg-amber-200 dark:bg-amber-800',
    '노스텔지아': 'bg-green-200 dark:bg-green-800',
    '태고의 달인': 'bg-yellow-200 dark:bg-yellow-800'
  };
  
  // 캘린더 데이터 생성
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  const selectedDateEvents = selectedDate ? getEventsForDate(formatDate(selectedDate)) : [];
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 페이지 헤더 */}
      <section className="bg-white dark:bg-gray-900 py-8 px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white">운영 일정</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">오락실 영업시간과 특별 일정을 확인하세요</p>
        </div>
      </section>
      
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* 기본 영업시간 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-8">
          <h2 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            기본 영업시간
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">일 ~ 목, 공휴일</span>
                    <span className="font-medium dark:text-white">12:00 - 22:00</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    22시 이후 손님 없으면 마감
                  </div>
                </div>
                
                <div className="py-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">금, 토, 공휴일 전날</span>
                    <span className="font-medium dark:text-white">11:00 - 05:00</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    밤샘 영업 (익일 새벽 5시까지)
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  밤샘 영업 안내
                </h3>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• 대여 없어도 밤샘 영업 진행</li>
                  <li>• 22시 이후는 손님 상황에 따라 유동적</li>
                </ul>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  조기/밤샘 대여 오픈시 추가 영업시간 연장
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:gap-8">
          {/* 달력과 범례 */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* 달력 */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              {/* 달력 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold dark:text-white">
                  {formatMonth(currentMonth)}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors dark:text-white"
                  >
                    오늘
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div key={day} className={`text-center text-sm font-medium py-2 ${
                    index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {day}
                  </div>
                  ))}
              </div>
              
              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const dateStr = formatDate(date);
                  const dayEvents = getEventsForDate(dateStr);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = formatDate(new Date()) === dateStr;
                  const isSelected = selectedDate && formatDate(selectedDate) === dateStr;
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 border rounded-lg cursor-pointer transition-colors ${
                        isCurrentMonth
                          ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''} ${isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      onClick={() => {
                        if (isCurrentMonth) {
                          setSelectedDate(date);
                          if (dayEvents.length > 0) {
                            setShowEventModal(true);
                          }
                        }
                      }}
                    >
                      <div className={`text-xs md:text-sm font-medium mb-1 ${
                        dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : ''
                      }`}>{date.getDate()}</div>
                      <div className="space-y-0.5 md:space-y-1">
                        {(() => {
                          // 일반 이벤트와 예약을 분리
                          const regularEvents = dayEvents.filter(e => e.type !== 'reservation');
                          const reservationEvents = dayEvents.filter(e => e.type === 'reservation');
                          
                          return (
                            <>
                              {/* 일반 이벤트 표시 - 모바일에서는 아이콘만 */}
                              {regularEvents.slice(0, 2).map(event => {
                                const config = eventTypeConfig[event.type];
                                const Icon = config?.icon || Calendar;
                                return (
                                  <div
                                    key={event.id}
                                    className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${config?.color || 'bg-gray-100'}`}
                                  >
                                    <Icon className="w-3 h-3" />
                                    <span className="hidden md:inline truncate">{event.title}</span>
                                  </div>
                                );
                              })}
                              
                              {/* 예약 현황 표시 - 기종별로 */}
                              {reservationEvents.length > 0 && (
                                <div className="space-y-0.5">
                                  {reservationEvents.map(event => {
                                    if (event.reservations) {
                                      // 시간대별로 그룹화
                                      const earlyReservations = event.reservations.filter(r => r.slotType === 'early');
                                      const overnightReservations = event.reservations.filter(r => r.slotType === 'overnight');
                                      
                                      // 기종별로 카운트
                                      const deviceCounts: Record<string, number> = {};
                                      event.reservations.forEach(r => {
                                        const key = `${r.slotType}-${r.deviceType}`;
                                        deviceCounts[key] = (deviceCounts[key] || 0) + 1;
                                      });
                                      
                                      return (
                                        <div key={event.id} className="space-y-0.5">
                                          {earlyReservations.length > 0 && (
                                            <div className="flex gap-0.5 md:gap-1 items-center">
                                              <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${reservationTypeColors.early} flex-shrink-0`}></div>
                                              <div className="flex gap-0.5 md:gap-1">
                                                {/* 모바일에서는 총 개수만 표시 */}
                                                <span className="md:hidden px-0.5 rounded text-[8px] bg-yellow-100 dark:bg-yellow-900/50">
                                                  {earlyReservations.length}
                                                </span>
                                                {/* 데스크톱에서는 기종별 표시 */}
                                                <div className="hidden md:flex gap-1">
                                                  {Object.entries(deviceCounts)
                                                    .filter(([key]) => key.startsWith('early-'))
                                                    .map(([key, count]) => {
                                                      const deviceType = key.replace('early-', '');
                                                      return (
                                                        <span key={key} className={`px-1 rounded text-[10px] ${deviceColors[deviceType] || deviceTypeColors[deviceType] || 'bg-gray-200'}`}>
                                                          {count}
                                                        </span>
                                                      );
                                                    })}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {overnightReservations.length > 0 && (
                                            <div className="flex gap-0.5 md:gap-1 items-center">
                                              <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${reservationTypeColors.overnight} flex-shrink-0`}></div>
                                              <div className="flex gap-0.5 md:gap-1">
                                                {/* 모바일에서는 총 개수만 표시 */}
                                                <span className="md:hidden px-0.5 rounded text-[8px] bg-purple-100 dark:bg-purple-900/50">
                                                  {overnightReservations.length}
                                                </span>
                                                {/* 데스크톱에서는 기종별 표시 */}
                                                <div className="hidden md:flex gap-1">
                                                  {Object.entries(deviceCounts)
                                                    .filter(([key]) => key.startsWith('overnight-'))
                                                    .map(([key, count]) => {
                                                      const deviceType = key.replace('overnight-', '');
                                                      return (
                                                        <span key={key} className={`px-1 rounded text-[10px] ${deviceColors[deviceType] || deviceTypeColors[deviceType] || 'bg-gray-200'}`}>
                                                          {count}
                                                        </span>
                                                      );
                                                    })}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {dayEvents.filter(e => e.type !== 'reservation').length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            +{dayEvents.filter(e => e.type !== 'reservation').length - 2}개
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              </div>
            </div>
            
            {/* 범례 - 달력 옆에 배치 */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 sticky top-6">
                <h3 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase">범례</h3>
                <div className="space-y-1 text-xs">
                  {Object.entries(eventTypeConfig).filter(([type]) => type !== 'reservation').map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={type} className="flex items-center gap-1.5">
                        <div className={`p-1 rounded ${config.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">{config.label}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* 예약 범례 */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase">예약 현황</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${reservationTypeColors.early}`}></div>
                      <span className="text-gray-600 dark:text-gray-400">조기</span>
                      <div className={`w-2 h-2 rounded-full ${reservationTypeColors.overnight}`}></div>
                      <span className="text-gray-600 dark:text-gray-400">밤샘</span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                      기종별 색상으로 예약 대수 표시
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 예정된 일정 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold mb-4 dark:text-white">이번 달 주요 일정</h2>
              
              {events.filter(event => event.date.startsWith(currentMonth.toISOString().slice(0, 7))).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">이번 달에는 특별한 일정이 없습니다</p>
              ) : (
                <div className="space-y-3">
              {events
                .filter(event => event.date.startsWith(currentMonth.toISOString().slice(0, 7)))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(event => (
                  <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0">
                      {(() => {
                        const config = eventTypeConfig[event.type];
                        const Icon = config?.icon || Calendar;
                        return (
                          <div className={`p-2 rounded ${config?.color || 'bg-gray-100'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium dark:text-white">{event.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(event.date).toLocaleDateString('ko-KR', {
                              month: 'long',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                            {event.endDate && ` ~ ${new Date(event.endDate).getDate()}일`}
                            {event.type === 'reservation_block' && event.blockType && (
                              <span className="ml-2">
                                {event.blockType === 'early' && '(조기 대여 제한)'}
                                {event.blockType === 'overnight' && '(밤샘 대여 제한)'}
                                {event.blockType === 'all_day' && '(종일 예약 제한)'}
                              </span>
                            )}
                            {event.startTime && event.type !== 'reservation_block' && ` • ${event.startTime}`}
                            {event.endTime && event.type !== 'reservation_block' && ` - ${event.endTime}`}
                          </p>
                          {event.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{event.description}</p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-white dark:bg-gray-900 rounded">
                          {eventTypeConfig[event.type]?.label || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      
      {/* 이벤트 상세 모달 */}
      <AnimatePresence>
        {showEventModal && selectedDateEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 max-w-md w-full my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold dark:text-white">
                  {selectedDate?.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-3 overflow-y-auto">
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const config = eventTypeConfig[event.type];
                        const Icon = config?.icon || Calendar;
                        return (
                          <>
                            <div className={`p-1 rounded ${config?.color || 'bg-gray-100'}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium dark:text-white">
                              {config?.label || ''}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <h4 className="font-medium dark:text-white">{event.title}</h4>
                    {(event.startTime || event.endTime) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.startTime && `${event.startTime}`}
                        {event.endTime && ` - ${event.endTime}`}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{event.description}</p>
                    )}
                    {event.type === 'reservation' && event.reservations && (
                      <div className="mt-3 space-y-3">
                        {/* 조기 대여 */}
                        {event.reservations.filter(r => r.slotType === 'early').length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${reservationTypeColors.early}`}></div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">조기 대여</span>
                              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                                {event.reservations.filter(r => r.slotType === 'early').length}건
                              </span>
                            </div>
                            <div className="space-y-2">
                              {(() => {
                                // 기종별로 그룹화
                                const groupedReservations = event.reservations
                                  .filter(r => r.slotType === 'early')
                                  .reduce((acc, res) => {
                                    if (!acc[res.deviceType]) {
                                      acc[res.deviceType] = [];
                                    }
                                    acc[res.deviceType]!.push(res);
                                    return acc;
                                  }, {} as Record<string, typeof event.reservations>);

                                return Object.entries(groupedReservations)
                                  .sort(([a], [b]) => {
                                    const orderA = deviceOrder[a] ?? 999;
                                    const orderB = deviceOrder[b] ?? 999;
                                    return orderA - orderB;
                                  })
                                  .map(([deviceType, reservations]) => (
                                  <div key={deviceType} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${deviceColors[deviceType] || deviceTypeColors[deviceType] || 'bg-gray-200'}`}>
                                        {deviceType}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {reservations.length}건
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      {reservations.map((res) => (
                                        <div key={res.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                          <span>
                                            {res.deviceNumber && `${res.deviceNumber}번기 • `}
                                            {res.playerCount}인 플레이
                                          </span>
                                          <span className="font-mono">{res.time}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {/* 밤샘 대여 */}
                        {event.reservations.filter(r => r.slotType === 'overnight').length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${reservationTypeColors.overnight}`}></div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">밤샘 대여</span>
                              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded">
                                {event.reservations.filter(r => r.slotType === 'overnight').length}건
                              </span>
                            </div>
                            <div className="space-y-2">
                              {(() => {
                                // 기종별로 그룹화
                                const groupedReservations = event.reservations
                                  .filter(r => r.slotType === 'overnight')
                                  .reduce((acc, res) => {
                                    if (!acc[res.deviceType]) {
                                      acc[res.deviceType] = [];
                                    }
                                    acc[res.deviceType]!.push(res);
                                    return acc;
                                  }, {} as Record<string, typeof event.reservations>);

                                return Object.entries(groupedReservations)
                                  .sort(([a], [b]) => {
                                    const orderA = deviceOrder[a] ?? 999;
                                    const orderB = deviceOrder[b] ?? 999;
                                    return orderA - orderB;
                                  })
                                  .map(([deviceType, reservations]) => (
                                  <div key={deviceType} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${deviceColors[deviceType] || deviceTypeColors[deviceType] || 'bg-gray-200'}`}>
                                        {deviceType}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {reservations.length}건
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      {reservations.map((res) => (
                                        <div key={res.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                          <span>
                                            {res.deviceNumber && `${res.deviceNumber}번기 • `}
                                            {res.playerCount}인 플레이
                                          </span>
                                          <span className="font-mono">{res.time}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}