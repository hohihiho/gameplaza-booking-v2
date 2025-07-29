import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseReservationRealtimeProps {
  onUpdate?: (payload: any) => void
  onInsert?: (payload: any) => void
  onDelete?: (payload: any) => void
  userId?: string
}

export function useReservationRealtime({
  onUpdate,
  onInsert,
  onDelete,
  userId
}: UseReservationRealtimeProps) {
  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel

    const setupRealtime = async () => {
      // 예약 테이블 변경사항 구독
      channel = supabase
        .channel('reservations-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'reservations',
            filter: userId ? `user_id=eq.${userId}` : undefined
          },
          (payload) => {
            console.log('Reservation updated:', payload)
            onUpdate?.(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reservations',
            filter: userId ? `user_id=eq.${userId}` : undefined
          },
          (payload) => {
            console.log('Reservation inserted:', payload)
            onInsert?.(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'reservations',
            filter: userId ? `user_id=eq.${userId}` : undefined
          },
          (payload) => {
            console.log('Reservation deleted:', payload)
            onDelete?.(payload)
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
        })
    }

    setupRealtime()

    // 클린업
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, onUpdate, onInsert, onDelete])
}

// 관리자용 실시간 구독 (모든 예약)
export function useAdminReservationRealtime({
  onUpdate,
  onInsert,
  onDelete
}: Omit<UseReservationRealtimeProps, 'userId'>) {
  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel

    const setupRealtime = async () => {
      channel = supabase
        .channel('admin-reservations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations'
          },
          (payload) => {
            console.log('Admin: Reservation changed:', payload)
            
            switch (payload.eventType) {
              case 'UPDATE':
                onUpdate?.(payload)
                break
              case 'INSERT':
                onInsert?.(payload)
                break
              case 'DELETE':
                onDelete?.(payload)
                break
            }
          }
        )
        .subscribe((status) => {
          console.log('Admin realtime subscription status:', status)
        })
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [onUpdate, onInsert, onDelete])
}