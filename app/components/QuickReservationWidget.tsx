'use client';

import { useState, useEffect } from 'react';
import { Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleWithMenu } from './ThemeToggleWithMenu';

export default function QuickReservationWidget() {
  const [availableCount, setAvailableCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); // 카드 확장 상태
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

  useEffect(() => {
    const fetchReservationStatus = async () => {
      try {
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
        } else {
          // 오류 발생시 기본 영업시간 사용
          const today = new Date();
          const dayOfWeek = today.getDay();
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

        // 기기 카운트 데이터 처리
        if (deviceCountResponse.ok) {
          const deviceData = await deviceCountResponse.json();
          setTotalCount(deviceData.total);
          setAvailableCount(deviceData.available);
        } else {
          // Fallback: 서버에서 직접 조회하지 말고 기본값 사용
          console.warn('기기 카운트 API가 실패했습니다. 기본값을 사용합니다.');
          setTotalCount(0);
          setAvailableCount(0);
        }

      } catch (error) {
        console.error('Failed to fetch reservation status:', error);
        // 에러가 발생해도 기본값 표시
        setTotalCount(0);
        setAvailableCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationStatus();
    
    // 1분마다 새로고침
    const interval = setInterval(fetchReservationStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const availablePercentage = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;

  return (
    <div className="relative overflow-hidden 
      min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[320px] lg:min-h-[360px] xl:min-h-[380px] 
      max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] 
      h-auto hero-compact hero-ultra-compact hero-tablet-portrait">
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
      
      {/* 다크모드 버튼 - 모바일 전용 */}
      <div className="lg:hidden absolute top-4 right-4 z-20">
        <ThemeToggleWithMenu variant="transparent" size="sm" />
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 px-2 py-2 xs:px-3 xs:py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 lg:px-8 lg:py-8 xl:py-12 h-full flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 items-center lg:items-start">
            {/* 왼쪽: 텍스트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 xl:space-y-7 text-center lg:text-left"
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
              
              {/* 모바일용 간단한 상태 정보 - 토글 가능 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hero-cards lg:hidden space-y-1.5 xs:space-y-2 sm:space-y-3 max-w-xs xs:max-w-sm sm:max-w-md mx-auto lg:mx-0 px-2 xs:px-0"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer' }}
              >
                {/* 토글 헤더 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 xs:gap-2">
                      <Zap className="w-3.5 xs:w-4 h-3.5 xs:h-4 text-yellow-300" aria-hidden="true" />
                      <span className="hero-card-content text-white text-xs xs:text-sm sm:text-base font-medium">
                        현재 이용 가능: {loading ? '...' : `${availableCount}/${totalCount}대`}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-4 h-4 xs:w-5 xs:h-5 text-white/70" />
                    </motion.div>
                  </div>
                </div>

                {/* 확장 가능한 콘텐츠 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5 xs:space-y-2 overflow-hidden"
                    >
                      {/* 이용 가능 기기 상세 */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-white text-lg xs:text-xl sm:text-2xl font-bold">
                                {loading ? <div className="w-8 h-6 bg-white/20 rounded animate-pulse inline-block" /> : availableCount}
                              </span>
                              <span className="text-white/80 text-xs xs:text-sm font-medium">
                                /{loading ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse inline-block" /> : totalCount}대
                              </span>
                              <span className="text-white text-xs xs:text-sm sm:text-base font-bold ml-2">
                                {loading ? <div className="w-8 h-4 bg-white/20 rounded animate-pulse inline-block" /> : `${Math.round(availablePercentage)}%`}
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

                      {/* 운영시간 - 컴팩트 버전 */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-white/20">
                        <div className="flex items-center gap-1.5 xs:gap-2 mb-2">
                          <Clock className="w-3.5 xs:w-4 h-3.5 xs:h-4 text-white" aria-hidden="true" />
                          <span className="hero-card-content text-white text-xs xs:text-sm sm:text-base font-medium">오늘 영업시간</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-2xs xs:text-xs text-white/70">영업중</span>
                          </div>
                        </div>

                        {/* 1층/2층 시간 - 컴팩트 그리드 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 rounded-lg p-1.5 xs:p-2 text-center">
                            <span className="text-blue-300 text-2xs xs:text-xs font-medium block">1층</span>
                            <span className="text-white text-xs xs:text-sm font-bold block">
                              {todaySchedule ? formatTime24Hour(todaySchedule.floor1Start) : '-'}
                            </span>
                            <span className="text-white/60 text-2xs block">~</span>
                            <span className="text-white text-xs xs:text-sm font-bold block">
                              {todaySchedule ? formatTime24Hour(todaySchedule.floor1End) : '-'}
                            </span>
                          </div>

                          <div className="bg-white/5 rounded-lg p-1.5 xs:p-2 text-center">
                            <span className="text-purple-300 text-2xs xs:text-xs font-medium block">2층</span>
                            <span className="text-white text-xs xs:text-sm font-bold block">
                              {todaySchedule ? formatTime24Hour(todaySchedule.floor2Start) : '-'}
                            </span>
                            <span className="text-white/60 text-2xs block">~</span>
                            <span className="text-white text-xs xs:text-sm font-bold block">
                              {todaySchedule ? formatTime24Hour(todaySchedule.floor2End) : '-'}
                              {todaySchedule?.floor2EventType === 'overnight' && (
                                <span className="text-yellow-300 text-2xs ml-1">🌙</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* 오른쪽: 대시보드 카드 (데스크톱 전용) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex flex-col xl:flex-row gap-4 h-fit"
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
                        <p className="text-white/90 text-sm font-semibold tracking-wide">현재 이용 가능</p>
                      </div>
                      <p className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                        {loading ? (
                          <span className="inline-block w-16 h-16 bg-white/20 rounded-xl animate-pulse" />
                        ) : (
                          <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                            {availableCount}
                          </span>
                        )}
                        <span className="text-2xl text-white/80 ml-2">대</span>
                      </p>
                    </div>
                    
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
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
                      <span>총 {totalCount}대 중</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80 font-medium">실시간 업데이트</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 영업 시간 카드 - 컴팩트 버전 */}
              <div className="relative bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl overflow-hidden flex-1">
                {/* 배경 패턴 */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/90 text-sm font-semibold">오늘 영업시간</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-white/70">영업 중</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <span className="text-blue-300 text-xs font-medium block mb-2">1층</span>
                      <div className="space-y-1">
                        <span className="text-xl font-bold text-white block">
                          {todaySchedule ? formatTime24Hour(todaySchedule.floor1Start) : '-'}
                        </span>
                        <span className="text-white/40 text-xs block">~</span>
                        <span className="text-xl font-bold text-white block">
                          {todaySchedule ? formatTime24Hour(todaySchedule.floor1End) : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <span className="text-purple-300 text-xs font-medium block mb-2">2층</span>
                      <div className="space-y-1">
                        <span className="text-xl font-bold text-white block">
                          {todaySchedule ? formatTime24Hour(todaySchedule.floor2Start) : '-'}
                        </span>
                        <span className="text-white/40 text-xs block">~</span>
                        <span className="text-xl font-bold text-white block">
                          {todaySchedule ? formatTime24Hour(todaySchedule.floor2End) : '-'}
                          {todaySchedule?.floor2EventType === 'overnight' && (
                            <span className="text-yellow-300 text-xs ml-1" title="밤샘 영업">🌙</span>
                          )}
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