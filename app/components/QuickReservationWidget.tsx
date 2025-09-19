'use client';

import { useState, useEffect } from 'react';
import { Zap, Clock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggleWithMenu } from './ThemeToggleWithMenu';
import { useSession } from '@/components/providers/AuthProvider';
import Link from 'next/link';

export default function QuickReservationWidget() {
  const { data: session, isPending } = useSession();
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<{ 
    floor1Start: string; 
    floor1End: string; 
    floor2Start: string; 
    floor2End: string; 
    floor1EventType: 'early_open' | 'all_night' | 'early_close' | null;
    floor2EventType: 'early_open' | 'all_night' | 'early_close' | null;
  } | null>(null);

  // 24시간 표시 형식 변환 함수
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

  const buildDefaultSchedule = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;

    return {
      floor1Start: isWeekend ? '11:00' : '12:00',
      floor1End: '22:00',
      floor2Start: '12:00',
      floor2End: (isFriday || isSaturday) ? '05:00' : '24:00',
      floor1EventType: null,
      floor2EventType: (isFriday || isSaturday) ? 'overnight' : null
    };
  };

  useEffect(() => {
    // 세션 캐시에 저장된 데이터를 먼저 불러와 바로 표시
    try {
      const storedCounts = sessionStorage.getItem('gp-hero-device-status');
      if (storedCounts) {
        const parsed = JSON.parse(storedCounts);
        if (typeof parsed.total === 'number') setTotalCount(parsed.total);
        if (typeof parsed.available === 'number') setAvailableCount(parsed.available);
      }
      const storedSchedule = sessionStorage.getItem('gp-hero-today-schedule');
      if (storedSchedule) {
        const parsed = JSON.parse(storedSchedule);
        setTodaySchedule(parsed);
      } else {
        setTodaySchedule(buildDefaultSchedule());
      }
      setIsFetching(false);
    } catch (error) {
      console.error('Failed to restore hero widget cache:', error);
      setTodaySchedule(buildDefaultSchedule());
    }
  }, []);

  useEffect(() => {
    const fetchReservationStatus = async () => {
      try {
        setIsFetching(true);
        // 병렬로 데이터 조회 (성능 최적화)
        const [scheduleResponse, deviceCountResponse] = await Promise.all([
          fetch('/api/public/schedule/today'),
          fetch('/api/public/device-count')
        ]);

        // 영업시간 데이터 처리
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setTodaySchedule({
            floor1Start: scheduleData.floor1Start,
            floor1End: scheduleData.floor1End,
            floor2Start: scheduleData.floor2Start,
            floor2End: scheduleData.floor2End,
            floor1EventType: scheduleData.floor1EventType,
            floor2EventType: scheduleData.floor2EventType
          });
          sessionStorage.setItem('gp-hero-today-schedule', JSON.stringify({
            floor1Start: scheduleData.floor1Start,
            floor1End: scheduleData.floor1End,
            floor2Start: scheduleData.floor2Start,
            floor2End: scheduleData.floor2End,
            floor1EventType: scheduleData.floor1EventType,
            floor2EventType: scheduleData.floor2EventType
          }));
        } else {
          // 오류 발생시 기본 영업시간 사용
          setTodaySchedule(buildDefaultSchedule());
        }

        // 기기 카운트 데이터 처리
        if (deviceCountResponse.ok) {
          const deviceData = await deviceCountResponse.json();
          setTotalCount(typeof deviceData.total === 'number' ? deviceData.total : 0);
          setAvailableCount(typeof deviceData.available === 'number' ? deviceData.available : 0);
          sessionStorage.setItem('gp-hero-device-status', JSON.stringify({
            total: deviceData.total,
            available: deviceData.available,
            updatedAt: Date.now()
          }));
        } else {
          // API 실패 시 기본값 설정
          console.error('Failed to fetch device count from API');
          setTotalCount((prev) => (prev ?? 0));
          setAvailableCount((prev) => (prev ?? 0));
        }

      } catch (error) {
        console.error('Failed to fetch reservation status:', error);
        // 에러가 발생해도 기본값 표시
        if (totalCount === null) setTotalCount(0);
        if (availableCount === null) setAvailableCount(0);
      } finally {
        setIsFetching(false);
      }
    };

    fetchReservationStatus();
    
    // 1분마다 새로고침
    const interval = setInterval(fetchReservationStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const safeTotalCount = typeof totalCount === 'number' ? totalCount : 0;
  const safeAvailableCount = typeof availableCount === 'number' ? availableCount : 0;
  const availablePercentage = safeTotalCount > 0 ? (safeAvailableCount / safeTotalCount) * 100 : 0;

  const schedule = todaySchedule ?? buildDefaultSchedule();

  return (
    <div className="relative overflow-hidden 
      min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[320px] lg:min-h-[360px] xl:min-h-[380px] 
      h-auto hero-compact hero-ultra-compact">
      {/* 다중 레이어 배경 */}
      <div className="absolute inset-0">
        {/* 기본 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-800 to-blue-900" />
        
        {/* 네온 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20" />
        
        {/* 애니메이션 도형들 */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-cyan-400/25 to-blue-400/25 rounded-full blur-lg animate-bounce" 
             style={{ animationDelay: '1s', animationDuration: '3s' }} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-lg animate-pulse" 
             style={{ animationDelay: '2s' }} />
        
        {/* 게임 테마 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-white rounded-full animate-ping" 
               style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-white rounded-full animate-ping" 
               style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" 
               style={{ animationDelay: '2.5s' }} />
        </div>
        
        {/* 미세한 노이즈 텍스처 */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-15" />
      </div>
      
      {/* 헤더 버튼들 - 모바일 전용 */}
      <div className="lg:hidden absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* 로그인 버튼 - 로그인하지 않은 경우에만 표시 */}
        {!isPending && !session?.user && (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors touch-target touch-feedback"
          >
            <LogIn className="w-4 h-4" />
            <span>로그인</span>
          </Link>
        )}
        <ThemeToggleWithMenu variant="transparent" size="sm" />
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 px-4 py-4 xs:px-5 xs:py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 xl:px-12 xl:py-14 h-full flex items-center">
        <div className="mx-auto w-full max-w-6xl xl:max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-10 xl:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] items-center lg:items-stretch">
            {/* 왼쪽: 텍스트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 xl:space-y-7 text-center lg:text-left lg:max-w-xl"
            >
              {/* 메인 헤드라인 - 시각적 계층 구조 개선 */}
              <div className="space-y-3">
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="hero-subtitle text-purple-200/90 text-xs xs:text-sm sm:text-base md:text-lg font-medium tracking-wide"
                >
                  광주 최고의 리듬게임 전문 오락실
                </motion.p>
                <h1 className="hero-title text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.9] break-keep">
                  <span className="relative block">
                    <span className="bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-2xl">
                      게임플라자
                    </span>
                    {/* 단순화된 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent blur-sm opacity-50 -z-10" aria-hidden="true">
                      게임플라자
                    </div>
                  </span>
                </h1>
              </div>
              
              {/* 모바일용 간단한 상태 정보 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hero-cards lg:hidden space-y-1.5 xs:space-y-2 sm:space-y-3 max-w-xs xs:max-w-sm sm:max-w-md mx-auto lg:mx-0 px-2 xs:px-0"
              >
                {/* 이용 가능 기기 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-white/20">
                  <div className="flex items-center gap-1.5 xs:gap-2 mb-2 sm:mb-3">
                    <Zap className="w-3.5 xs:w-4 h-3.5 xs:h-4 text-yellow-300" aria-hidden="true" />
                    <span className="hero-card-content text-white text-xs xs:text-sm sm:text-base font-medium whitespace-nowrap">현재 이용 가능</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-2xs xs:text-xs text-white/70">실시간</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-white text-lg xs:text-xl sm:text-2xl font-bold ${isFetching ? 'animate-pulse' : ''}`}>
                          {typeof availableCount === 'number' ? availableCount : '—'}
                        </span>
                        <span className="text-white/80 text-xs xs:text-sm font-medium">
                          /{typeof totalCount === 'number' ? totalCount : '—'}대
                        </span>
                        <span className={`text-white text-xs xs:text-sm sm:text-base font-bold ml-2 ${isFetching ? 'animate-pulse' : ''}`}>
                          {safeTotalCount > 0 ? `${Math.round(availablePercentage)}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${availablePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 운영시간 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-white/20">
                  <div className="flex items-center gap-1.5 xs:gap-2 mb-2">
                    <Clock className="w-3.5 xs:w-4 h-3.5 xs:h-4 text-white" aria-hidden="true" />
                    <span className="hero-card-content text-white text-xs xs:text-sm sm:text-base font-medium">오늘 영업시간</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-2xs xs:text-xs text-white/70">영업중</span>
                    </div>
                  </div>
                  
                  {/* 1층/2층 시간 - 컴팩트 버전 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs xs:text-sm">
                      <span className="text-blue-300 font-medium">1층</span>
                      <span className="text-white font-medium">
                        {`${formatTime24Hour(schedule.floor1Start)}-${formatTime24Hour(schedule.floor1End)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs xs:text-sm">
                      <span className="text-purple-300 font-medium">2층</span>
                      <span className="text-white font-medium">
                        {`${formatTime24Hour(schedule.floor2Start)}-${formatTime24Hour(schedule.floor2End)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* 오른쪽: 대시보드 카드 (데스크톱 전용) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex w-full max-w-[420px] flex-col gap-4 ml-auto"
            >
              {/* 이용 가능 기기 카드 */}
              <div className="relative bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-2xl overflow-hidden flex-1">
                {/* 배경 패턴 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/15 to-violet-400/15 rounded-full blur-xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        <p className="text-white/90 text-sm font-semibold tracking-wide whitespace-nowrap">현재 이용 가능</p>
                      </div>
                      <p className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                        <span className={`bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent ${isFetching ? 'animate-pulse' : ''}`}>
                          {typeof availableCount === 'number' ? availableCount : '—'}
                        </span>
                        <span className="text-2xl text-white/80 ml-2">대</span>
                      </p>
                    </div>
                    
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="44"
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="10"
                          fill="none"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="44"
                          stroke="url(#enhanced-gradient)"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - availablePercentage / 100)}`}
                          strokeLinecap="round"
                          className="drop-shadow-lg"
                        />
                        <defs>
                          <linearGradient id="enhanced-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-2xl font-black text-white drop-shadow-lg">
                            {Math.round(availablePercentage)}
                          </span>
                          <span className="text-sm text-white/90 block">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/90 text-sm font-semibold">
                      <Zap className="w-5 h-5 text-yellow-300" />
                      <span>총 {safeTotalCount}대 중</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80 font-medium">실시간 업데이트</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 영업 시간 카드 */}
              <div className="relative bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl overflow-hidden flex-1">
                {/* 배경 패턴 */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white/90 text-sm font-semibold tracking-wide">오늘 영업시간</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">1층</span>
                        <span className="text-lg font-bold text-white">
                          {`${formatTime24Hour(schedule.floor1Start)} - ${formatTime24Hour(schedule.floor1End)}`}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">2층</span>
                        <span className="text-lg font-bold text-white">
                          {`${formatTime24Hour(schedule.floor2Start)} - ${formatTime24Hour(schedule.floor2End)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
