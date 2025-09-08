'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCloudflareRealtime } from './useCloudflareRealtime';

interface UseOptimizedRealtimeConfig {
  channel: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  table?: string;
  filter?: string;
  debounceMs?: number;
  onUpdate?: (payload: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface RealtimeState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastUpdate: Date | null;
  updateCount: number;
}

export function useOptimizedRealtime({
  channel: channelName,
  event = '*',
  schema = 'public',
  table,
  filter,
  debounceMs = 500,
  onUpdate,
  onConnect,
  onDisconnect,
  onError
}: UseOptimizedRealtimeConfig) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateQueueRef = useRef<any[]>([]);
  
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isReconnecting: false,
    lastUpdate: null,
    updateCount: 0
  });

  // 디바운스된 업데이트 처리
  const processBatchedUpdates = useCallback(() => {
    if (updateQueueRef.current.length > 0 && onUpdate) {
      // 배치된 업데이트 중 마지막 것만 처리
      const lastUpdate = updateQueueRef.current[updateQueueRef.current.length - 1];
      if (lastUpdate) onUpdate(lastUpdate);
      
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        updateCount: prev.updateCount + updateQueueRef.current.length
      }));
      
      updateQueueRef.current = [];
    }
  }, [onUpdate]);

  // Cloudflare Realtime 연결
  const cloudflareRealtime = useCloudflareRealtime({
    room: table || channelName,
    onMessage: (data) => {
      // 이벤트 필터링
      if (event !== '*' && data.eventType !== event) {
        return;
      }

      // 테이블 필터링
      if (table && data.table !== table) {
        return;
      }

      // 커스텀 필터 적용
      if (filter && !data.record) {
        return;
      }

      // 디바운스 처리
      updateQueueRef.current.push(data);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        processBatchedUpdates();
      }, debounceMs);
    },
    onConnect: () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        isReconnecting: false 
      }));
      onConnect?.();
    },
    onDisconnect: () => {
      setState(prev => ({ ...prev, isConnected: false }));
      onDisconnect?.();
    },
    onError: (error) => {
      setState(prev => ({ ...prev, isReconnecting: false }));
      onError?.(error);
    }
  });

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      updateQueueRef.current = [];
    };
  }, []);

  // 상태 동기화
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: cloudflareRealtime.isConnected,
      isReconnecting: cloudflareRealtime.isReconnecting
    }));
  }, [cloudflareRealtime.isConnected, cloudflareRealtime.isReconnecting]);

  // 수동 새로고침 함수
  const refresh = useCallback(() => {
    processBatchedUpdates();
  }, [processBatchedUpdates]);

  const reconnect = useCallback(() => {
    cloudflareRealtime.reconnect();
  }, [cloudflareRealtime]);

  return {
    ...state,
    refresh,
    reconnect
  };
}

// 특정 테이블용 프리셋 훅들 - Cloudflare Realtime 기반
export function useRealtimeReservations(onUpdate: (data?: any) => void) {
  return useOptimizedRealtime({
    channel: 'reservations-optimized',
    table: 'reservations',
    event: '*',
    debounceMs: 1000, // 예약은 1초 디바운스
    onUpdate: (payload) => onUpdate(payload)
  });
}

export function useRealtimeDevices(onUpdate: (data?: any) => void) {
  return useOptimizedRealtime({
    channel: 'devices-optimized',
    table: 'devices',
    event: '*',
    debounceMs: 500, // 기기 상태는 500ms 디바운스
    onUpdate: (payload) => onUpdate(payload)
  });
}