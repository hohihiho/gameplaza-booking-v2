// 클라이언트 측 실시간 타이머 관리 시스템
// 비전공자 설명: 브라우저에서 실시간으로 예약 시간을 추적하고
// 자동으로 만료된 예약을 감지하여 UI를 업데이트하는 시스템입니다.

'use client';

import { useEffect, useRef, useCallback } from 'react';

// 예약 정보 인터페이스
interface ReservationInfo {
  id: string;
  startTime: string; // HH:MM 형식
  endTime: string;   // HH:MM 형식
  date: string;      // YYYY-MM-DD 형식
  status: 'pending' | 'approved' | 'checked_in' | 'completed' | 'cancelled';
}

// 타이머 상태 인터페이스
interface TimerState {
  currentTime: Date;
  expiredReservations: string[];
  startingReservations: string[];
  nextUpdate: Date | null;
}

// 콜백 함수 타입
type OnExpiredCallback = (reservationIds: string[]) => void;
type OnStartingCallback = (reservationIds: string[]) => void;

// KST 시간 기준으로 현재 시간 반환
function getCurrentKSTTime(): Date {
  const now = new Date();
  // KST는 UTC+9
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kstTime;
}

// 시간 문자열을 오늘 날짜의 Date 객체로 변환 (KST 기준)
function timeStringToDate(timeStr: string, dateStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // KST 기준으로 Date 객체 생성
  return new Date(year, month - 1, day, hours, minutes, 0);
}

// 현재 시간을 HH:MM 형식으로 반환 (KST 기준)
function getCurrentTimeString(): string {
  const now = getCurrentKSTTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (KST 기준)
function getTodayDateString(): string {
  const now = getCurrentKSTTime();
  return now.toISOString().split('T')[0];
}

/**
 * 실시간 예약 타이머 관리 훅
 * 사용법: const timer = useReservationTimer(reservations, { onExpired, onStarting });
 */
export function useReservationTimer(
  reservations: ReservationInfo[],
  callbacks?: {
    onExpired?: OnExpiredCallback;
    onStarting?: OnStartingCallback;
  }
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<TimerState>({
    currentTime: getCurrentKSTTime(),
    expiredReservations: [],
    startingReservations: [],
    nextUpdate: null
  });

  // 만료된 예약과 시작되어야 할 예약 확인
  const checkReservationStatus = useCallback(() => {
    const now = getCurrentKSTTime();
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();
    
    const expiredIds: string[] = [];
    const startingIds: string[] = [];
    
    reservations.forEach(reservation => {
      // 오늘 날짜의 예약만 체크
      if (reservation.date !== today) return;
      
      const endTime = timeStringToDate(reservation.endTime, reservation.date);
      const startTime = timeStringToDate(reservation.startTime, reservation.date);
      
      // 체크인된 예약이 종료 시간을 지났는지 확인
      if (reservation.status === 'checked_in' && now >= endTime) {
        expiredIds.push(reservation.id);
      }
      
      // 체크인된 예약이 시작 시간이 되었는지 확인
      if (reservation.status === 'checked_in' && now >= startTime && now < endTime) {
        startingIds.push(reservation.id);
      }
    });
    
    // 이전 체크와 비교하여 새로운 변경사항만 콜백 호출
    const prevState = lastCheckRef.current;
    const newExpired = expiredIds.filter(id => !prevState.expiredReservations.includes(id));
    const newStarting = startingIds.filter(id => !prevState.startingReservations.includes(id));
    
    if (newExpired.length > 0 && callbacks?.onExpired) {
      callbacks.onExpired(newExpired);
    }
    
    if (newStarting.length > 0 && callbacks?.onStarting) {
      callbacks.onStarting(newStarting);
    }
    
    // 상태 업데이트
    lastCheckRef.current = {
      currentTime: now,
      expiredReservations: expiredIds,
      startingReservations: startingIds,
      nextUpdate: new Date(now.getTime() + 30000) // 30초 후 다음 업데이트
    };
    
    return {
      expiredCount: expiredIds.length,
      startingCount: startingIds.length,
      nextCheck: lastCheckRef.current.nextUpdate
    };
  }, [reservations, callbacks]);

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 즉시 한 번 체크
    checkReservationStatus();
    
    // 30초마다 체크
    timerRef.current = setInterval(() => {
      checkReservationStatus();
    }, 30000);
  }, [checkReservationStatus]);

  // 타이머 중지
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 수동 체크 실행
  const manualCheck = useCallback(() => {
    return checkReservationStatus();
  }, [checkReservationStatus]);

  // 컴포넌트 마운트/언마운트 시 타이머 관리
  useEffect(() => {
    if (reservations.length > 0) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [reservations, startTimer, stopTimer]);

  // 현재 상태 반환
  const currentState = lastCheckRef.current;
  
  return {
    currentTime: currentState.currentTime,
    expiredReservations: currentState.expiredReservations,
    startingReservations: currentState.startingReservations,
    nextUpdate: currentState.nextUpdate,
    manualCheck,
    startTimer,
    stopTimer,
    isRunning: timerRef.current !== null
  };
}

/**
 * 단순한 현재 시간 표시 훅 (KST 기준)
 * 사용법: const currentTime = useCurrentTime();
 */
export function useCurrentTime(updateInterval: number = 1000) {
  const [currentTime, setCurrentTime] = useState(getCurrentKSTTime());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentKSTTime());
    };

    // 즉시 한 번 업데이트
    updateTime();

    // 주기적 업데이트
    timerRef.current = setInterval(updateTime, updateInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [updateInterval]);

  return currentTime;
}

/**
 * 특정 시간까지의 카운트다운 훅 (KST 기준)
 * 사용법: const timeLeft = useCountdown(targetTime);
 */
export function useCountdown(targetTime: Date) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = getCurrentKSTTime();
      const difference = targetTime.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          hours,
          minutes,
          seconds,
          total: difference
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    // 즉시 한 번 업데이트
    updateCountdown();

    // 1초마다 업데이트
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  return timeLeft;
}

// React import 추가 (useState가 필요한 경우)
import { useState } from 'react';

/**
 * 유틸리티 함수들
 */
export const TimerUtils = {
  getCurrentKSTTime,
  getCurrentTimeString,
  getTodayDateString,
  timeStringToDate,
  
  // 시간 형식 변환 유틸리티
  formatTime: (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
  
  // 24시간 표시 형식 (0~5시는 24~29시로 표시)
  formatDisplayTime: (timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0]);
    const minute = timeStr.split(':')[1];
    
    if (hour >= 0 && hour <= 5) {
      return `${hour + 24}:${minute}`;
    }
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  },
  
  // 두 시간 사이의 차이 계산 (분 단위)
  getTimeDifferenceInMinutes: (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }
};