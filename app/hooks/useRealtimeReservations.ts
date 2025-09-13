import { useEffect } from 'react'
import { createClient } from '@/lib/db'

export function useRealtimeReservations(onUpdate: () => void) {
  const supabase = createClient()

  useEffect(() => {
    // 예약 테이블의 변경사항 구독
    const channel = supabase
      .channel('reservation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log('Reservation change:', payload)
          onUpdate()
        }
      )
      .subscribe()

    // 브로드캐스트 이벤트도 구독
    channel.on('broadcast', { event: 'new_reservation' }, (payload) => {
      console.log('New reservation broadcast:', payload)
      onUpdate()
    })

    channel.on('broadcast', { event: 'cancelled_reservation' }, (payload) => {
      console.log('Cancelled reservation broadcast:', payload)
      onUpdate()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, onUpdate])
}