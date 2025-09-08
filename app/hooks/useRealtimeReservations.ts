import { useEffect } from 'react'

export function useRealtimeReservations(onUpdate: () => void) {
  useEffect(() => {
    // D1 마이그레이션 후 실시간 업데이트는 별도 구현 예정
    // TODO: D1 기반 실시간 업데이트 구현
    console.log('실시간 예약 업데이트 훅이 호출되었지만 D1 마이그레이션으로 인해 비활성화됨')
    
    // 임시로 빈 cleanup 함수 반환
    return () => {}
  }, [onUpdate])
}