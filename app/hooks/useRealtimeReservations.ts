import { useEffect } from 'react'

// D1 마이그레이션 중 Realtime 기능 임시 비활성화
export function useRealtimeReservations(onUpdate: () => void) {
  useEffect(() => {
    // D1에서는 Realtime 기능이 없으므로 폴링으로 대체
    // 15초마다 업데이트 트리거
    const interval = setInterval(() => {
      onUpdate()
    }, 15000)

    console.warn('D1 마이그레이션 중: Realtime 기능이 폴링으로 대체됨')

    return () => {
      clearInterval(interval)
    }
  }, [onUpdate])
}