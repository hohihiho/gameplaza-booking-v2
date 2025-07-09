'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UseOptimizedRealtimeConfig {
  channel: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  table?: string;
  filter?: string;
  debounceMs?: number;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
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
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateQueueRef = useRef<RealtimePostgresChangesPayload<any>[]>([]);
  
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isReconnecting: false,
    lastUpdate: null,
    updateCount: 0
  });

  // 디바운스된 업데이트 처리
  const processBatchedUpdates = useCallback(() => {
    if (updateQueueRef.current.length > 0 && onUpdate) {
      // 배치된 업데이트 중 마지막 것만 처리 (또는 모든 업데이트 처리 가능)
      const lastUpdate = updateQueueRef.current[updateQueueRef.current.length - 1];
      onUpdate(lastUpdate);
      
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        updateCount: prev.updateCount + updateQueueRef.current.length
      }));
      
      updateQueueRef.current = [];
    }
  }, [onUpdate]);

  // 업데이트 핸들러 (디바운싱 적용)
  const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    updateQueueRef.current.push(payload);
    
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 새로운 타이머 설정
    debounceTimerRef.current = setTimeout(() => {
      processBatchedUpdates();
    }, debounceMs);
  }, [debounceMs, processBatchedUpdates]);

  // 재연결 로직
  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, isReconnecting: true }));
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    // 재연결 시도
    reconnectTimerRef.current = setTimeout(() => {
      setupChannel();
    }, 3000); // 3초 후 재연결
  }, []);

  // 채널 설정
  const setupChannel = useCallback(() => {
    try {
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: channelName }
        }
      });

      if (table) {
        const options: any = { event, schema, table };
        if (filter) options.filter = filter;
        
        channel.on('postgres_changes', options, handleUpdate);
      }

      channel
        .on('system', {}, (payload) => {
          if (payload.extension === 'postgres_changes') {
            if (payload.status === 'ok') {
              setState(prev => ({ 
                ...prev, 
                isConnected: true, 
                isReconnecting: false 
              }));
              onConnect?.();
            } else if (payload.status === 'error') {
              onError?.(new Error('Realtime connection error'));
              reconnect();
            }
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setState(prev => ({ 
              ...prev, 
              isConnected: true, 
              isReconnecting: false 
            }));
            onConnect?.();
          } else if (status === 'CHANNEL_ERROR') {
            setState(prev => ({ ...prev, isConnected: false }));
            onDisconnect?.();
            reconnect();
          } else if (status === 'TIMED_OUT') {
            setState(prev => ({ ...prev, isConnected: false }));
            onDisconnect?.();
            reconnect();
          }
        });

      channelRef.current = channel;
    } catch (error) {
      onError?.(error as Error);
      setState(prev => ({ ...prev, isReconnecting: false }));
    }
  }, [channelName, table, event, schema, filter, handleUpdate, onConnect, onDisconnect, onError, reconnect]);

  // 초기 설정
  useEffect(() => {
    setupChannel();

    // 페이지 가시성 변경 감지 (백그라운드/포그라운드 전환)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.isConnected) {
        reconnect();
      }
    };

    // 네트워크 상태 변경 감지
    const handleOnline = () => {
      if (!state.isConnected) {
        reconnect();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isConnected: false }));
      onDisconnect?.();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // 타이머 정리
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      // 채널 정리
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      
      // 이벤트 리스너 정리
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 수동 새로고침 함수
  const refresh = useCallback(() => {
    processBatchedUpdates();
  }, [processBatchedUpdates]);

  return {
    ...state,
    refresh,
    reconnect
  };
}

// 특정 테이블용 프리셋 훅들
export function useRealtimeReservations(onUpdate: () => void) {
  return useOptimizedRealtime({
    channel: 'reservations-optimized',
    table: 'reservations',
    event: '*',
    debounceMs: 1000, // 예약은 1초 디바운스
    onUpdate
  });
}

export function useRealtimeDevices(onUpdate: () => void) {
  return useOptimizedRealtime({
    channel: 'devices-optimized',
    table: 'devices',
    event: '*',
    debounceMs: 500, // 기기 상태는 500ms 디바운스
    onUpdate
  });
}