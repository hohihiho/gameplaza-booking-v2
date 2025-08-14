'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export function useReservationReminder() {
  const { data: session } = useSession();
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const notifiedReservationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user) return;

    const checkUpcomingReservations = async () => {
      try {
        const response = await fetch('/api/v2/reservations/upcoming');
        const data = await response.json();

        if (data.reservations) {
          const now = new Date();
          
          data.reservations.forEach((reservation: any) => {
            const reservationTime = new Date(`${reservation.date}T${reservation.start_time}`);
            const timeDiff = reservationTime.getTime() - now.getTime();
            const minutesUntil = Math.floor(timeDiff / (1000 * 60));

            // 30분 이내이고 아직 알림을 보내지 않은 예약
            if (minutesUntil > 0 && minutesUntil <= 30 && !notifiedReservationsRef.current.has(reservation.id)) {
              notifiedReservationsRef.current.add(reservation.id);
              
              // 브라우저 알림
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('예약 알림', {
                  body: `${minutesUntil}분 후 예약이 있습니다!`,
                  icon: '/icon-192x192.png'
                });
              }

              // 토스트 알림
              toast.success(
                `${reservation.device_name} 예약이 ${minutesUntil}분 남았습니다!`,
                { duration: 10000 }
              );
            }
          });
        }
      } catch (error) {
        console.error('예약 확인 실패:', error);
      }
    };

    // 초기 확인
    checkUpcomingReservations();

    // 5분마다 확인
    checkIntervalRef.current = setInterval(checkUpcomingReservations, 5 * 60 * 1000);

    // 브라우저 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [session]);
}