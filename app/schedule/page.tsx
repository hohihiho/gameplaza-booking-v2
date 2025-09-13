// 오락실 운영일정 페이지
// 비전공자 설명: 오락실의 영업시간과 특별 일정을 확인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  modelName?: string;
  versionName?: string;
  playerCount: number;
  time: string;
  slotType: 'early' | 'overnight' | 'regular';
};

// 24시간 이상 표시를 위한 포맷 함수
const formatTime24Plus = (timeStr: string | null | undefined) => {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  const hourNum = parseInt(hour || '0');
  if (hourNum >= 0 && hourNum <= 5) {
    return `${hourNum + 24}:${minute}`;
  }
  return `${hour}:${minute}`;
};

// 24시간 표시 형식 변환 함수 (히어로 섹션과 동일)
const formatTime24Hour = (time: string) => {
  if (!time) return '';
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour || '0');
  
  // 0~5시를 24~29시로 변환
  if (hourNum >= 0 && hourNum <= 5) {
    return `${hourNum + 24}:${minute}`;
  }
  return `${hour}:${minute}`;
};

// 영업시간 기준으로 오늘 날짜 계산 (06:00 기점으로 날짜 변경)
const getBusinessToday = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // 00:00-05:59는 전날 영업으로 간주
  if (currentHour >= 0 && currentHour < 6) {
    const businessDate = new Date(now);
    businessDate.setDate(businessDate.getDate() - 1);
    return businessDate;
  }
  
  return now;
};

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  // const [reservations, setReservations] = useState<any[]>([]);
  const [deviceColors, setDeviceColors] = useState<Record<string, string>>({});
  const [deviceOrder, setDeviceOrder] = useState<Record<string, number>>({});
  const [, setIsLoading] = useState(false);
  const [isDefaultHoursOpen, setIsDefaultHoursOpen] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<{ 
    floor1Start: string; 
    floor1End: string; 
    floor2Start: string; 
    floor2End: string; 
    floor1EventType: 'early_open' | 'all_night' | 'early_close' | null;
    floor2EventType: 'early_open' | 'all_night' | 'early_close' | null;
  } | null>(null);
  
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

  // 오늘의 영업시간 가져오기
  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        const response = await fetch('/api/public/schedule/today');
        if (!response.ok) throw new Error('Failed to fetch schedule');
        
        const data = await response.json();
        setTodaySchedule({
          floor1Start: data.floor1Start,
          floor1End: data.floor1End,
          floor2Start: data.floor2Start,
          floor2End: data.floor2End,
          floor1EventType: data.floor1EventType,
          floor2EventType: data.floor2EventType
        });
      } catch (err) {
        console.error('오늘 영업시간 조회 오류:', err);
        // 오류 발생시 기본 영업시간 사용
        const dayOfWeek = new Date().getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        setTodaySchedule({
          floor1Start: isWeekend ? '11:00' : '12:00',
          floor1End: '22:00',
          floor2Start: isWeekend ? '11:00' : '12:00',
          floor2End: isWeekend ? '24:00' : '05:00',
          floor1EventType: null,
          floor2EventType: null
        });
      }
    };
    
    fetchTodaySchedule();
  }, []);
  
  // 운영 일정 및 예약 데이터 가져오기
  const fetchScheduleData = async () => {
    try {
      setIsLoading(true);
      
      // 현재 월의 시작일과 종료일 계산
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      // API를 통해 데이터 가져오기
      const response = await fetch(`/api/public/schedule?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error('데이터 조회에 실패했습니다');
      }
      
      const { scheduleEvents, reservations: reservationsData, devices } = await response.json();
      
      console.log('예약 데이터:', reservationsData);
      console.log('기기 정보:', devices);
      
      // 기기 정보를 ID로 매핑
      const devicesInfo: Record<string, any> = {};
      devices.forEach((device: any) => {
        devicesInfo[device.id] = device;
      });

      // 3. 운영 일정 포맷팅
      const formattedEvents: ScheduleEvent[] = (scheduleEvents || []).map((event: any) => ({
        id: event.id,
        date: event.date,
        endDate: event.end_date,
        title: event.title,
        type: event.type,
        description: event.description || '',
        startTime: event.start_time,
        endTime: event.end_time,
        affectsReservation: event.affects_reservation,
        blockType: event.block_type
      }));

      // 4. 예약 데이터를 날짜별로 그룹화
      const reservationsByDate = (reservationsData || []).reduce((acc: Record<string, any[]>, res: any) => {
        const date = res.date;
        if (!date) return acc;
        
        if (!acc[date]) {
          acc[date] = [];
        }
        
        // 시간대 분석 (조기/밤샘/일반)
        let slotType = 'regular';
        if (res.start_time) {
          const hour = parseInt(res.start_time.split(':')[0]);
          if (hour >= 7 && hour < 12) {
            slotType = 'early';
          } else if (hour >= 0 && hour < 6) {
            slotType = 'overnight';
          }
        }
        
        const device = devicesInfo[res.device_id];
        const deviceName = device?.device_types?.name || '알 수 없음';
        const machineNumber = device?.device_number || '';
        const modelName = device?.device_types?.model_name || '';
        const versionName = device?.device_types?.version_name || '';
        const timeStr = res.start_time && res.end_time 
          ? `${res.start_time.slice(0, 5)}-${res.end_time.slice(0, 5)}`
          : '';
        
        acc[date].push({
          id: res.id,
          deviceType: deviceName,
          deviceNumber: machineNumber,
          modelName: modelName,
          versionName: versionName,
          playerCount: res.player_count || 1,
          time: timeStr,
          slotType
        });
        
        return acc;
      }, {});

      // 5. 예약 이벤트 생성
      console.log('reservationsByDate:', reservationsByDate);
      const reservationEvents: ScheduleEvent[] = Object.entries(reservationsByDate).map(([date, reservations]) => {
        const reservationList = reservations as any[];
        const earlyCount = reservationList.filter(r => r.slotType === 'early').length;
        const overnightCount = reservationList.filter(r => r.slotType === 'overnight').length;
        
        let title = '';
        if (earlyCount > 0 && overnightCount > 0) {
          title = `조기 ${earlyCount}건, 밤샘 ${overnightCount}건`;
        } else if (earlyCount > 0) {
          title = `조기 대여 ${earlyCount}건`;
        } else if (overnightCount > 0) {
          title = `밤샘 대여 ${overnightCount}건`;
        } else {
          title = `예약 ${reservationList.length}건`;
        }
        
        return {
          id: `res-${date}`,
          date,
          title,
          type: 'reservation',
          reservations: reservationList as ReservationInfo[]
        };
      });

      // 추가 이벤트는 사용하지 않음
      const additionalEvents: ScheduleEvent[] = [];
      
      // 모든 이벤트 합치기
      console.log('formattedEvents:', formattedEvents);
      console.log('reservationEvents:', reservationEvents);
      setEvents([...formattedEvents, ...reservationEvents, ...additionalEvents]);
    } catch (error: any) {
      console.error('운영 일정 불러오기 실패:', error);
      console.error('에러 메시지:', error?.message);
      console.error('에러 상세:', error?.details);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // 실시간 업데이트 구독 (D1은 실시간 기능 미지원으로 비활성화)
  // TODO: WebSocket 또는 Polling으로 대체 필요
  useEffect(() => {
    // D1 마이그레이션으로 인해 실시간 업데이트 일시 비활성화
    // const channel = supabase
    //   .channel('schedule-updates')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'schedule_events'
    //     },
    //     () => {
    //       fetchScheduleData();
    //     }
    //   )
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'reservations'
    //     },
    //     () => {
    //       fetchScheduleData();
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   if (channel) {
    //     supabase.removeChannel(channel);
    //   }
    // };
  }, [currentMonth, fetchScheduleData]);
  
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
    return events.filter(event => {
      // 단일 날짜 이벤트
      if (!event.endDate) {
        return event.date === date;
      }
      
      // 기간 설정된 이벤트 - UTC 파싱 방지를 위해 로컬 시간으로 처리
      const eventStart = new Date(event.date + 'T00:00:00');
      const eventEnd = new Date(event.endDate + 'T00:00:00');
      const checkDate = new Date(date + 'T00:00:00');
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };
  
  const changeMonth = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (showEventModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // 컴포넌트 언마운트 시 스타일 제거
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEventModal]);
  
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
  
  // 캘린더 데이터 생성 (월~일 형식)
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 월요일부터 시작하도록 계산
    const firstDayOfWeek = firstDay.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const daysFromMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 일요일이면 6, 나머지는 -1
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - daysFromMonday);
    
    const days = [];
    const current = new Date(startDate);
    
    // 월~일 형식으로 완전한 주를 만들 때까지 계속
    while (current <= lastDay || current.getDay() !== 1) { // 다음주 월요일이 될 때까지
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  const selectedDateEvents = selectedDate ? getEventsForDate(formatDate(selectedDate)) : [];
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      
      
      {/* 페이지 헤더 */}
      <section className="relative bg-gradient-to-r from-indigo-700 to-purple-800 py-12 px-5 overflow-hidden">
        {/* 애니메이션 배경 요소 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            {/* 왼쪽: 타이틀 */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span className="text-xs text-white font-medium">오늘의 영업시간</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">운영 일정</h1>
              <p className="text-sm md:text-base text-white/90 max-w-md">영업시간과 특별 일정을 확인하세요</p>
            </div>
            
            {/* 오른쪽: 오늘 영업시간 */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-white/80 mb-1">1층</div>
                  <div className="text-lg md:text-xl font-bold text-white">
                    {todaySchedule ? `${todaySchedule.floor1Start}-${todaySchedule.floor1End}` : '...'}
                  </div>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div className="text-center">
                  <div className="text-xs text-white/80 mb-1">2층</div>
                  <div className="text-lg md:text-xl font-bold text-white">
                    {todaySchedule ? `${formatTime24Hour(todaySchedule.floor2Start)}-${formatTime24Hour(todaySchedule.floor2End)}` : '...'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* 기본 영업시간 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8 mb-8 mt-8 relative z-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              기본 영업시간
            </h2>
            <button
              onClick={() => setIsDefaultHoursOpen(!isDefaultHoursOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <motion.div
                animate={{ rotate: isDefaultHoursOpen ? 0 : -90 }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
              >
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </motion.div>
            </button>
          </div>
          
          <motion.div 
            initial={false}
            animate={{ 
              height: isDefaultHoursOpen ? 'auto' : 0,
              opacity: isDefaultHoursOpen ? 1 : 0
            }}
            transition={{ 
              duration: 0.3,
              ease: [0.04, 0.62, 0.23, 0.98]
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 rounded border border-blue-400/50 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                </div>
                1층
              </h3>
              <div className="space-y-4">
                <div className="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 dark:text-white font-medium">평일, 주말</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                        22시 이후 손님 없으면 조기 마감
                      </div>
                    </div>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {todaySchedule ? `${formatTime24Hour(todaySchedule.floor1Start)} - ${formatTime24Hour(todaySchedule.floor1End)}` : <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse inline-block" />}
                    </span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 mt-6 flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500/20 rounded border border-purple-400/50 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">2</span>
                </div>
                2층
              </h3>
              <div className="space-y-4">
                <div className="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 dark:text-white font-medium">일 ~ 목</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        평일 자정까지 운영
                      </div>
                    </div>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {todaySchedule ? `${formatTime24Hour(todaySchedule.floor2Start)} - ${formatTime24Hour(todaySchedule.floor2End)}` : <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse inline-block" />}
                    </span>
                  </div>
                </div>
                
                <div className="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 dark:text-white font-medium">금, 토, 공휴일 전날</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        밤샘 영업 (익일 새벽 5시까지)
                      </div>
                    </div>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      12:00 - {formatTime24Hour('05:00')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-200 dark:bg-amber-800 rounded-lg flex items-center justify-center">
                    <Moon className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  밤샘 영업 안내
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>토,일 넘어가는 새벽은 대여 없어도 밤샘 영업 진행</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>22시 이후는 손님 상황에 따라 유동적</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                <div className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                  </div>
                  <span className="pt-1">조기/밤샘 대여 오픈시 추가 영업시간 연장</span>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </motion.div>
        
        <div className="grid gap-6 lg:gap-8">
          {/* 달력과 범례 */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* 달력 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8">
              {/* 달력 헤더 */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatMonth(currentMonth)}
                </h2>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeMonth(-1)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentMonth(getBusinessToday())}
                    className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium rounded-xl transition-colors"
                  >
                    오늘
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeMonth(1)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </motion.button>
                </div>
              </div>
              
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                  <div key={day} className={`text-center text-sm font-medium py-2 ${
                    index === 5 ? 'text-blue-500' : index === 6 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {day}
                  </div>
                  ))}
              </div>
              
              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  const dateStr = formatDate(date);
                  const dayEvents = getEventsForDate(dateStr);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = formatDate(getBusinessToday()) === dateStr;
                  const isSelected = selectedDate && formatDate(selectedDate) === dateStr;
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.005 }}
                      className={`min-h-[90px] md:min-h-[110px] p-2 md:p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                        isCurrentMonth
                          ? 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 hover:shadow-md'
                          : 'bg-gray-100/50 dark:bg-gray-950/50 text-gray-400 dark:text-gray-600'
                      } ${isToday ? 'ring-2 ring-indigo-500 shadow-lg' : ''} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 shadow-md' : ''}`}
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
                              {/* 일반 이벤트 표시 */}
                              {regularEvents.slice(0, 2).map(event => {
                                const config = eventTypeConfig[event.type];
                                const Icon = config?.icon || Calendar;
                                const displayTitle = event.type === 'reservation_block' && event.blockType === 'early' ? '조기 제한' :
                                                   event.type === 'reservation_block' && event.blockType === 'overnight' ? '밤샘 제한' :
                                                   event.type === 'reservation_block' && event.blockType === 'all_day' ? '종일 제한' :
                                                   event.title;
                                return (
                                  <div
                                    key={event.id}
                                    className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${config?.color || 'bg-gray-100'}`}
                                  >
                                    <Icon className="w-3 h-3" />
                                    <span className="truncate text-[10px] md:text-xs">
                                      {displayTitle}
                                    </span>
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
            </motion.div>
            
            {/* 범례 - 달력 옆에 배치 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 sticky top-6">
                <h3 className="text-sm font-bold mb-4 text-gray-900 dark:text-white">범례</h3>
                <div className="space-y-2 md:space-y-2 flex flex-row md:flex-col gap-2 md:gap-0 flex-wrap">
                  {Object.entries(eventTypeConfig).filter(([type]) => type !== 'reservation').map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={type} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300 font-medium">{config.label}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* 예약 범례 */}
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold mb-4 text-gray-900 dark:text-white">예약 현황</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${reservationTypeColors.early}`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">조기</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${reservationTypeColors.overnight}`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">밤샘</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      기종별 색상으로 예약 대수 표시
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto touch-pan-y"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedDate?.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEventModal(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>
              </div>
              
              <div className="space-y-3 overflow-y-auto">
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="p-4 md:p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
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
                    <h4 className="font-medium dark:text-white">
                      {event.type === 'reservation_block' && event.blockType === 'early' ? '조기 제한' :
                       event.type === 'reservation_block' && event.blockType === 'overnight' ? '밤샘 제한' :
                       event.type === 'reservation_block' && event.blockType === 'all_day' ? '종일 제한' :
                       event.title}
                    </h4>
                    {(event.startTime || event.endTime) && event.type !== 'overnight' && event.type !== 'early_close' && event.type !== 'reservation_block' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.type === 'early_open' ? 
                          event.startTime?.slice(0, 5) : 
                          `${event.startTime?.slice(0, 5)} - ${event.endTime?.slice(0, 5)}`
                        }
                      </p>
                    )}
                    {event.endTime && event.type === 'overnight' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatTime24Plus(event.endTime).slice(0, 5)}
                      </p>
                    )}
                    {event.endTime && event.type === 'early_close' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.endTime}
                      </p>
                    )}
                    {event.type === 'reservation_block' && event.blockType && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.blockType === 'early' && '조기 대여 제한'}
                        {event.blockType === 'overnight' && '밤샘 대여 제한'}
                        {event.blockType === 'all_day' && '종일 예약 제한'}
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
                                  <div key={deviceType} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
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
                                            {res.modelName && `${res.modelName} : `}
                                            {res.deviceNumber && `${res.deviceNumber}번기`}
                                            {` • ${res.playerCount}인 플레이`}
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
                                  <div key={deviceType} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
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
                                            {res.modelName && `${res.modelName} : `}
                                            {res.deviceNumber && `${res.deviceNumber}번기`}
                                            {` • ${res.playerCount}인 플레이`}
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