'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface CloudflareRealtimeConfig {
  room: string; // 방 이름 (예: 'reservations', 'devices')
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

interface RealtimeState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastMessage: any;
  messageCount: number;
}

export function useCloudflareRealtime({
  room,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  autoReconnect = true,
  reconnectDelay = 3000
}: CloudflareRealtimeConfig) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isReconnecting: false,
    lastMessage: null,
    messageCount: 0
  });

  // WebSocket URL - 개발 환경에서는 로컬, 프로덕션에서는 Cloudflare Workers
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? 'gameplaza-realtime.your-subdomain.workers.dev'  // 실제 배포 시 수정 필요
      : 'localhost:8787'; // Cloudflare Workers 로컬 개발 포트
    return `${protocol}//${host}/ws/${encodeURIComponent(room)}`;
  }, [room]);

  // 연결 함수
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    
    try {
      const wsUrl = getWebSocketUrl();
      console.log(`[CloudflareRealtime] 연결 시도: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`[CloudflareRealtime] 연결됨: ${room}`);
        setState(prev => ({
          ...prev,
          isConnected: true,
          isReconnecting: false
        }));
        onConnect?.();
      };
      
      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log(`[CloudflareRealtime] 메시지 수신:`, data);
          
          setState(prev => ({
            ...prev,
            lastMessage: data,
            messageCount: prev.messageCount + 1
          }));
          
          onMessage?.(data);
        } catch (error) {
          console.error('[CloudflareRealtime] 메시지 파싱 오류:', error);
          onError?.(new Error('메시지 파싱 실패'));
        }
      };
      
      ws.onclose = (event) => {
        console.log(`[CloudflareRealtime] 연결 종료:`, event.code, event.reason);
        
        if (!mountedRef.current) return;
        
        setState(prev => ({
          ...prev,
          isConnected: false
        }));
        
        onDisconnect?.();
        
        // 자동 재연결
        if (autoReconnect && event.code !== 1000) { // 정상 종료가 아닌 경우
          setState(prev => ({ ...prev, isReconnecting: true }));
          
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectDelay);
        }
      };
      
      ws.onerror = (event) => {
        console.error('[CloudflareRealtime] WebSocket 오류:', event);
        onError?.(new Error('WebSocket 연결 오류'));
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('[CloudflareRealtime] 연결 생성 오류:', error);
      onError?.(error as Error);
    }
  }, [room, getWebSocketUrl, onConnect, onMessage, onDisconnect, onError, autoReconnect, reconnectDelay]);

  // 메시지 전송
  const sendMessage = useCallback((data: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[CloudflareRealtime] WebSocket이 연결되지 않았습니다.');
      return false;
    }
    
    try {
      const message = JSON.stringify(data);
      wsRef.current.send(message);
      console.log(`[CloudflareRealtime] 메시지 전송:`, data);
      return true;
    } catch (error) {
      console.error('[CloudflareRealtime] 메시지 전송 오류:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);

  // 수동 재연결
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    connect();
  }, [connect]);

  // 연결 종료
  const disconnect = useCallback(() => {
    mountedRef.current = false;
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isReconnecting: false
    }));
  }, []);

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    mountedRef.current = true;
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // 페이지 가시성 변경 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.isConnected && autoReconnect) {
        reconnect();
      }
    };

    const handleOnline = () => {
      if (!state.isConnected && autoReconnect) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [state.isConnected, autoReconnect, reconnect]);

  return {
    ...state,
    sendMessage,
    reconnect,
    disconnect
  };
}

// 예약 전용 훅
export function useRealtimeReservations(onUpdate: (data: any) => void) {
  return useCloudflareRealtime({
    room: 'reservations',
    onMessage: (data) => {
      // 예약 관련 메시지만 필터링
      if (data.type === 'reservation_update') {
        onUpdate(data.payload);
      }
    },
    onConnect: () => console.log('예약 실시간 연결됨'),
    onDisconnect: () => console.log('예약 실시간 연결 끊김'),
    onError: (error) => console.error('예약 실시간 오류:', error)
  });
}

// 기기 상태 전용 훅
export function useRealtimeDevices(onUpdate: (data: any) => void) {
  return useCloudflareRealtime({
    room: 'devices',
    onMessage: (data) => {
      // 기기 상태 관련 메시지만 필터링
      if (data.type === 'device_update') {
        onUpdate(data.payload);
      }
    },
    onConnect: () => console.log('기기 상태 실시간 연결됨'),
    onDisconnect: () => console.log('기기 상태 실시간 연결 끊김'),
    onError: (error) => console.error('기기 상태 실시간 오류:', error)
  });
}