// 예약 관련 실시간 이벤트 처리
import { broadcastReservationUpdate } from '@/app/api/sse/reservations/route'
import { broadcastDeviceStatusUpdate } from '@/app/api/sse/device-status/route'

export type ReservationEventType = 
  | 'reservation_created'
  | 'reservation_updated' 
  | 'reservation_cancelled'
  | 'reservation_approved'
  | 'reservation_checked_in'
  | 'reservation_completed'
  | 'device_status_changed'

export interface ReservationEvent {
  type: ReservationEventType
  reservationId?: string
  deviceId?: string
  userId?: string
  data: any
  timestamp: string
}

// 예약 생성 이벤트 발송
export function emitReservationCreated(reservation: any) {
  const event: ReservationEvent = {
    type: 'reservation_created',
    reservationId: reservation.id,
    deviceId: reservation.deviceId,
    userId: reservation.userId,
    data: reservation,
    timestamp: new Date().toISOString()
  }
  
  broadcastReservationUpdate(event)
}

// 예약 업데이트 이벤트 발송
export function emitReservationUpdated(reservation: any) {
  const event: ReservationEvent = {
    type: 'reservation_updated',
    reservationId: reservation.id,
    deviceId: reservation.deviceId,
    userId: reservation.userId,
    data: reservation,
    timestamp: new Date().toISOString()
  }
  
  broadcastReservationUpdate(event)
}

// 예약 취소 이벤트 발송
export function emitReservationCancelled(reservationId: string, deviceId?: string) {
  const event: ReservationEvent = {
    type: 'reservation_cancelled',
    reservationId,
    deviceId,
    data: { reservationId, deviceId },
    timestamp: new Date().toISOString()
  }
  
  broadcastReservationUpdate(event)
}

// 예약 승인 이벤트 발송
export function emitReservationApproved(reservation: any) {
  const event: ReservationEvent = {
    type: 'reservation_approved',
    reservationId: reservation.id,
    deviceId: reservation.deviceId,
    userId: reservation.userId,
    data: reservation,
    timestamp: new Date().toISOString()
  }
  
  broadcastReservationUpdate(event)
}

// 체크인 이벤트 발송
export function emitReservationCheckedIn(reservation: any) {
  const event: ReservationEvent = {
    type: 'reservation_checked_in',
    reservationId: reservation.id,
    deviceId: reservation.deviceId,
    userId: reservation.userId,
    data: reservation,
    timestamp: new Date().toISOString()
  }
  
  broadcastReservationUpdate(event)
}

// 기기 상태 변경 이벤트 발송
export function emitDeviceStatusChanged(deviceId: string, status: string) {
  const event: ReservationEvent = {
    type: 'device_status_changed',
    deviceId,
    data: { deviceId, status },
    timestamp: new Date().toISOString()
  }
  
  // 두 채널 모두에 브로드캐스트
  broadcastReservationUpdate(event)
  broadcastDeviceStatusUpdate({
    type: 'device_status_changed',
    deviceId,
    status,
    timestamp: new Date().toISOString()
  })
}