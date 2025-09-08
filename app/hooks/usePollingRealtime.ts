'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// D1 기반 폴링 실시간 업데이트 훅
// Supabase 실시간 기능의 폴링 기반 대안

interface UsePollingRealtimeConfig {
  endpoint: string;          // API 엔드포인트
  intervalMs?: number;       // 폴링 간격 (기본 30초)
  enabled?: boolean;         // 폴링 활성화 여부
  onUpdate?: (data: any) => void;  // 데이터 업데이트 시 콜백
  onError?: (error: Error) => void; // 에러 발생 시 콜백
}

interface PollingState {
  data: any;
  loading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  isPolling: boolean;
}

export function usePollingRealtime({
  endpoint,
  intervalMs = 30000, // 30초 기본값
  enabled = true,
  onUpdate,
  onError
}: UsePollingRealtimeConfig) {
  const [state, setState] = useState<PollingState>({
    data: null,
    loading: false,
    error: null,
    lastUpdate: null,
    isPolling: false
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current || !enabled) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!mountedRef.current) return;
      
      setState(prev => {
        const hasChanged = JSON.stringify(prev.data) !== JSON.stringify(data);
        if (hasChanged) {
          onUpdate?.(data);
        }
        
        return {
          ...prev,
          data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        };
      });
      
    } catch (error) {
      if (!mountedRef.current) return;
      
      const err = error as Error;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err
      }));
      onError?.(err);
    }
  }, [endpoint, enabled, onUpdate, onError]);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;
    
    setState(prev => ({ ...prev, isPolling: true }));
    
    // 즉시 첫 번째 요청 실행
    fetchData();
    
    // 주기적 폴링 시작
    intervalRef.current = setInterval(() => {
      fetchData();
    }, intervalMs);
  }, [enabled, intervalMs, fetchData]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // 페이지 가시성 변경 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !intervalRef.current) {
        startPolling();
      } else if (document.visibilityState === 'hidden') {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    isPolling: state.isPolling,
    refresh,
    startPolling,
    stopPolling
  };
}

// 특정 데이터용 프리셋 훅들
export function usePollingReservations(onUpdate: (data: any) => void) {
  return usePollingRealtime({
    endpoint: '/api/reservations',
    intervalMs: 30000, // 30초마다 예약 상태 확인
    onUpdate
  });
}

export function usePollingDevices(onUpdate: (data: any) => void) {
  return usePollingRealtime({
    endpoint: '/api/devices/status',
    intervalMs: 60000, // 1분마다 기기 상태 확인
    onUpdate
  });
}

export function usePollingSchedule(date: string, onUpdate: (data: any) => void) {
  return usePollingRealtime({
    endpoint: `/api/schedule?date=${date}`,
    intervalMs: 20000, // 20초마다 스케줄 확인
    onUpdate
  });
}