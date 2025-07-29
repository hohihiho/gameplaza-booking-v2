'use client';

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useOptimizedRealtime } from '@/app/hooks/useOptimizedRealtime';

interface RealtimeContextValue {
  reservations: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastUpdate: Date | null;
    updateCount: number;
    refresh: () => void;
    reconnect: () => void;
    subscribe: (callback: () => void) => () => void;
  };
  devices: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastUpdate: Date | null;
    updateCount: number;
    refresh: () => void;
    reconnect: () => void;
    subscribe: (callback: () => void) => () => void;
  };
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [reservationCallbacks, setReservationCallbacks] = useState<Set<() => void>>(new Set());
  const [deviceCallbacks, setDeviceCallbacks] = useState<Set<() => void>>(new Set());

  // 예약 실시간 업데이트
  const reservationsState = useOptimizedRealtime({
    channel: 'global-reservations',
    table: 'reservations',
    event: '*',
    debounceMs: 1000,
    onUpdate: () => {
      // 모든 구독자에게 알림
      reservationCallbacks.forEach(callback => callback());
    }
  });

  // 기기 실시간 업데이트
  const devicesState = useOptimizedRealtime({
    channel: 'global-devices',
    table: 'devices',
    event: '*',
    debounceMs: 500,
    onUpdate: () => {
      // 모든 구독자에게 알림
      deviceCallbacks.forEach(callback => callback());
    }
  });

  // 예약 구독 관리
  const subscribeToReservations = useCallback((callback: () => void) => {
    setReservationCallbacks(prev => {
      const newSet = new Set(prev);
      newSet.add(callback);
      return newSet;
    });

    // 구독 해제 함수 반환
    return () => {
      setReservationCallbacks(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  // 기기 구독 관리
  const subscribeToDevices = useCallback((callback: () => void) => {
    setDeviceCallbacks(prev => {
      const newSet = new Set(prev);
      newSet.add(callback);
      return newSet;
    });

    // 구독 해제 함수 반환
    return () => {
      setDeviceCallbacks(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const value: RealtimeContextValue = {
    reservations: {
      ...reservationsState,
      subscribe: subscribeToReservations
    },
    devices: {
      ...devicesState,
      subscribe: subscribeToDevices
    }
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

// 개별 훅들
export function useRealtimeReservationsContext(callback: () => void) {
  const { reservations } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = reservations.subscribe(callback);
    return unsubscribe;
  }, [callback, reservations]);
  
  return reservations;
}

export function useRealtimeDevicesContext(callback: () => void) {
  const { devices } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = devices.subscribe(callback);
    return unsubscribe;
  }, [callback, devices]);
  
  return devices;
}