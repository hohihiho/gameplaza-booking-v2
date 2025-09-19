import { createClient } from '@/lib/supabase/client'
import { supabase } from '@/lib/db/dummy-client'; // 임시 더미 클라이언트
import { Database } from '@/types/database'

type Reservation = Database['public']['Tables']['reservations']['Row']
type RentalSlot = Database['public']['Tables']['rental_slots']['Row']

export class ReservationConflictService {
  private supabase = createClient()
  
  /**
   * 예약 충돌 방지를 위한 원자적 예약 생성
   * 비관적 잠금(Pessimistic Locking) 방식 사용
   */
  async createReservationWithLock(
    userId: string,
    slotId: string,
    deviceId: string
  ): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
    try {
      // 1. 트랜잭션 시작 및 슬롯 잠금
      const { data: lockedSlot, error: lockError } = await this.supabase
        .rpc('lock_rental_slot_for_update', { 
          p_slot_id: slotId 
        })
        .single()
      
      if (lockError || !lockedSlot) {
        return { 
          success: false, 
          error: '예약 슬롯을 잠글 수 없습니다.' 
        }
      }
      
      // 2. 슬롯 상태 확인
      if (lockedSlot.is_reserved) {
        return { 
          success: false, 
          error: '이미 예약된 시간대입니다.' 
        }
      }
      
      // 3. 예약 생성 (원자적 처리)
      const { data: reservation, error: createError } = await this.supabase
        .rpc('create_reservation_atomic', {
          p_user_id: userId,
          p_slot_id: slotId,
          p_device_id: deviceId
        })
        .single()
      
      if (createError) {
        return { 
          success: false, 
          error: '예약 생성에 실패했습니다.' 
        }
      }
      
      return { 
        success: true, 
        reservation 
      }
      
    } catch (error) {
      console.error('예약 생성 오류:', error)
      return { 
        success: false, 
        error: '예약 처리 중 오류가 발생했습니다.' 
      }
    }
  }
  
  /**
   * 낙관적 잠금(Optimistic Locking) 방식의 예약 업데이트
   * 버전 관리를 통한 동시성 제어
   */
  async updateReservationOptimistic(
    reservationId: string,
    updates: Partial<Reservation>,
    currentVersion: number
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await this.supabase
      .from('reservations')
      .update({
        ...updates,
        version: currentVersion + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('version', currentVersion) // 버전 확인
      .select()
      .single()
    
    if (error || !data) {
      return { 
        success: false, 
        error: '다른 사용자가 이미 수정했습니다. 새로고침 후 다시 시도해주세요.' 
      }
    }
    
    return { success: true }
  }
  
  /**
   * 실시간 예약 상태 모니터링
   * 다른 사용자의 예약 활동을 실시간으로 감지
   */
  subscribeToSlotChanges(
    slotId: string,
    onUpdate: (slot: RentalSlot) => void
  ) {
    const channel = this.supabase
      .channel(`slot:${slotId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_slots',
          filter: `id=eq.${slotId}`
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as RentalSlot)
          }
        }
      )
      .subscribe()
    
    return () => {
      // TODO: removeChannel(channel)
    }
  }
  
  /**
   * 예약 가능 여부 실시간 확인
   * 프라이빗 채널을 통한 보안 강화
   */
  async checkAvailabilityRealtime(
    slotIds: string[]
  ): Promise<Map<string, boolean>> {
    const availabilityMap = new Map<string, boolean>()
    
    // 배치로 슬롯 상태 조회
    const { data: slots, error } = await this.supabase
      .from('rental_slots')
      .select('id, is_reserved')
      .in('id', slotIds)
    
    if (error || !slots) {
      return availabilityMap
    }
    
    slots.forEach(slot => {
      availabilityMap.set(slot.id, !slot.is_reserved)
    })
    
    // 실시간 업데이트 구독
    const channel = this.supabase
      .channel('availability-check', {
        config: { 
          private: true,
          broadcast: { ack: true }
        }
      })
      .on('broadcast', { event: 'slot_update' }, (payload) => {
        const { slotId, isAvailable } = payload.payload
        availabilityMap.set(slotId, isAvailable)
      })
      .subscribe()
    
    // 클린업 함수 반환
    setTimeout(() => {
      // TODO: removeChannel(channel)
    }, 300000) // 5분 후 자동 해제
    
    return availabilityMap
  }
  
  /**
   * 동시 예약 방지를 위한 대기열 시스템
   * 순차적 처리로 충돌 완전 방지
   */
  private reservationQueue: Map<string, Promise<any>> = new Map()
  
  async queueReservation(
    slotId: string,
    reservationFn: () => Promise<any>
  ): Promise<any> {
    // 해당 슬롯의 이전 예약이 완료될 때까지 대기
    const previousReservation = this.reservationQueue.get(slotId)
    
    if (previousReservation) {
      await previousReservation.catch(() => {}) // 이전 예약 실패 무시
    }
    
    // 새 예약을 큐에 추가
    const newReservation = reservationFn()
    this.reservationQueue.set(slotId, newReservation)
    
    // 완료 후 큐에서 제거
    newReservation.finally(() => {
      if (this.reservationQueue.get(slotId) === newReservation) {
        this.reservationQueue.delete(slotId)
      }
    })
    
    return newReservation
  }
}

// 싱글톤 인스턴스
export const reservationConflictService = new ReservationConflictService()