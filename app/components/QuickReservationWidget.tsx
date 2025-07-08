'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowRight, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function QuickReservationWidget() {
  const [supabase] = useState(() => createClient());
  const [availableCount, setAvailableCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<{ 
    floor2Start: string; 
    floor2End: string; 
    eventType: 'early_open' | 'all_night' | 'early_close' | null;
  } | null>(null);

  useEffect(() => {
    const fetchReservationStatus = async () => {
      try {
        // 현재 시간
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinutes;
        
        // 오늘 날짜 (KST 기준)
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // 2층 특별 영업시간 조회
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

        // 전체 기기 수 조회 (관리자가 설정한 활성 기기)
        const { data: devices, error: devicesError } = await supabase
          .from('devices')
          .select('id, status');

        if (devicesError) {
          console.error('Devices query error:', devicesError);
          // 에러가 발생해도 계속 진행
        }

        // available 또는 in_use 상태인 기기만 카운트
        const activeDevices = devices?.filter(d => d.status === 'available' || d.status === 'in_use') || [];
        const total = activeDevices.length;
        setTotalCount(total);

        // 현재 시간대의 예약 조회
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('id, device_id, start_time, end_time, status');

        if (reservationsError) {
          console.error('Reservations query error:', reservationsError);
          // 에러가 발생해도 계속 진행
        }

        // 현재 시간에 활성화된 예약만 필터링
        const activeReservations = reservations?.filter(r => {
          if (r.status !== 'approved' && r.status !== 'checked_in') return false;
          const startTime = new Date(r.start_time);
          const endTime = new Date(r.end_time);
          return startTime <= now && endTime >= now;
        }) || [];

        // 현재 사용 중인 기기 수
        const inUseDevices = new Set(activeReservations.map(r => r.device_id));
        const available = total - inUseDevices.size;
        setAvailableCount(Math.max(0, available));

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
    <div className="relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800">
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 px-6 py-8 md:px-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* 왼쪽: 텍스트와 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                지금 바로
                <span className="block text-4xl md:text-6xl font-extrabold text-white drop-shadow-xl">
                  게임을 시작하세요
                </span>
              </h1>
              <p className="text-white text-lg mb-8 font-medium drop-shadow-md">
                최고의 리듬게임 장비로 완벽한 플레이를 경험하세요
              </p>
              
              <Link
                href="/reservations/new"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                예약하기
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* 오른쪽: 대시보드 카드 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* 이용 가능 기기 카드 */}
              <div className="col-span-2 bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/90 text-sm font-semibold mb-1">현재 이용 가능</p>
                    <p className="text-4xl md:text-5xl font-bold text-white">
                      {loading ? (
                        <span className="inline-block w-12 h-12 bg-white/20 rounded animate-pulse" />
                      ) : (
                        `${availableCount}대`
                      )}
                    </p>
                  </div>
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - availablePercentage / 100)}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {Math.round(availablePercentage)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  <span>총 {totalCount}대 중</span>
                </div>
              </div>

              {/* 영업 시간 카드 */}
              <div className="col-span-2 bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 dark:bg-white/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/90 text-sm font-semibold mb-1">오늘 영업시간</p>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-white">
                        1층 : {new Date().getDay() === 0 || new Date().getDay() === 6 ? '11:00 - 22:00' : '12:00 - 22:00'}
                      </p>
                      {todaySchedule ? (
                        <p className="text-base font-bold text-white">
                          2층 : {todaySchedule.floor2Start} - {todaySchedule.floor2End}
                          <span className="text-xs text-white/70 ml-1">
                            ({todaySchedule.eventType === 'early_open' ? '조기영업' : 
                              todaySchedule.eventType === 'all_night' ? '밤샘영업' : 
                              todaySchedule.eventType === 'early_close' ? '조기마감' : '특별영업'})
                          </span>
                        </p>
                      ) : (
                        <p className="text-base font-bold text-white">
                          2층 : {new Date().getDay() === 0 || new Date().getDay() === 6 ? '11:00 - 22:00' : '12:00 - 22:00'}
                        </p>
                      )}
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