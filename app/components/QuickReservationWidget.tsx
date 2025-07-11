'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggleWithMenu } from './ThemeToggleWithMenu';

export default function QuickReservationWidget() {
  const [supabase] = useState(() => createClient());
  const [availableCount, setAvailableCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // const [todaySchedule, setTodaySchedule] = useState<{ 
  //   floor2Start: string; 
  //   floor2End: string; 
  //   eventType: 'early_open' | 'all_night' | 'early_close' | null;
  // } | null>(null);

  useEffect(() => {
    const fetchReservationStatus = async () => {
      try {
        // 현재 시간
        // const now = new Date();
        // const currentHour = now.getHours();
        // const currentMinutes = now.getMinutes();
        // const currentTime = currentHour * 60 + currentMinutes;
        
        // 오늘 날짜 (KST 기준)
        // const today = new Date();
        // const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // 2층 특별 영업시간 조회 (테이블이 없을 수 있으므로 무시)
        // TODO: schedule_events 테이블 생성 후 주석 해제
        /*
        try {
          const { data: scheduleEvent } = await supabase
            .from('schedule_events')
            .select('start_time, end_time, event_type')
            .eq('date', dateStr)
            .in('event_type', ['early_open', 'all_night', 'early_close'])
            .single();
            
          if (scheduleEvent) {
            const startHour = parseInt(scheduleEvent.start_time.split(':')[0]);
            const endHour = parseInt(scheduleEvent.end_time.split(':')[0]);
            const endDisplay = endHour < 6 ? endHour + 24 : endHour; // 새벽 시간은 24시간 이상으로 표시
            
            setTodaySchedule({
              floor2Start: scheduleEvent.start_time,
              floor2End: endDisplay > 23 ? `${endDisplay}:00` : scheduleEvent.end_time,
              eventType: scheduleEvent.event_type
            });
          }
        } catch (err) {
          // 특별 영업시간이 없어도 괜찮음
        }
        */

        // 전체 기기 수 조회
        const { data: devices, error: devicesError } = await supabase
          .from('devices')
          .select('id, status');

        if (devicesError) {
          console.error('Devices query error:', devicesError);
          // 에러가 발생해도 계속 진행
        }

        // 전체 기기 수 (모든 상태 포함)
        const total = devices?.length || 0;
        setTotalCount(total);

        // 현재 이용 가능한 기기 수 (available 상태인 기기만)
        const availableDevices = devices?.filter(d => d.status === 'available') || [];
        setAvailableCount(availableDevices.length);

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
  }, [supabase]);

  const availablePercentage = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;

  return (
    <div className="relative overflow-hidden h-[50vh] md:h-[45vh] max-h-[350px] min-h-[280px]">
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
      <div className="relative z-10 px-6 py-6 md:px-8 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 왼쪽: 텍스트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 text-center lg:text-left"
            >
              {/* 메인 헤드라인 */}
              <div className="space-y-2">
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-purple-200 text-sm md:text-base font-semibold"
                >
                  광주 최고의 리듬게임 전문 오락실
                </motion.p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                  <span className="relative">
                    <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-2xl">
                      게임플라자
                    </span>
                    {/* 강화된 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent blur-md opacity-80 -z-10">
                      게임플라자
                    </div>
                    {/* 추가 하이라이트 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent blur-lg opacity-40 -z-20">
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
                className="lg:hidden space-y-3"
              >
                {/* 이용 가능 기기 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span className="text-white text-sm font-medium">현재 이용 가능</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/70">실시간</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white text-2xl font-bold">
                        {loading ? '...' : `${availableCount}대`}
                      </span>
                      <span className="text-white/80 text-sm ml-2">
                        / {totalCount}대
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-lg font-bold">
                        {Math.round(availablePercentage)}%
                      </div>
                      <div className="w-20 bg-white/20 rounded-full h-2 mt-1">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${availablePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 운영시간 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">오늘 영업시간</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/70">영업중</span>
                    </div>
                  </div>
                  
                  {/* 1층/2층 시간 - 구분 개선 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500/20 rounded border border-blue-400/50 flex items-center justify-center">
                          <span className="text-blue-300 text-xs font-bold">1</span>
                        </div>
                        <span className="text-white/90 text-xs">1층</span>
                      </div>
                      <span className="text-white text-xs font-medium">
                        {new Date().getDay() === 0 || new Date().getDay() === 6 ? '11:00-22:00' : '12:00-22:00'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500/20 rounded border border-purple-400/50 flex items-center justify-center">
                          <span className="text-purple-300 text-xs font-bold">2</span>
                        </div>
                        <span className="text-white/90 text-xs">2층</span>
                      </div>
                      <span className="text-white text-xs font-medium">
                        {new Date().getDay() === 0 || new Date().getDay() === 6 ? '11:00-22:00' : '12:00-22:00'}
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
              className="hidden lg:flex flex-row gap-4"
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
                      <span>총 {totalCount}대 중</span>
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
                          {new Date().getDay() === 0 || new Date().getDay() === 6 ? '11:00 - 22:00' : '12:00 - 22:00'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">2층</span>
                        <span className="text-lg font-bold text-white">
                          {new Date().getDay() === 0 || new Date().getDay() === 6 ? '11:00 - 22:00' : '12:00 - 22:00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 현재 상태 표시 */}
                  <div className="flex items-center justify-center mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80 font-medium">지금 영업 중</span>
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