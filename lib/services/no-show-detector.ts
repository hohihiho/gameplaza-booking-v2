// 일일 노쇼 감지 시스템 (당일 체크인 여부 기반)
import { emitReservationCancelled } from '@/lib/realtime/reservation-events'
import { DeviceStatusManager } from './device-status-manager'
import { sendNoShowAlert, sendSystemAlert } from '@/app/api/sse/admin-alerts/route'

export interface Reservation {
  id: string
  deviceId: string
  userId: string
  startTime: Date
  endTime: Date
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
  checkedInAt?: Date
}

// 메모리 저장소 (실제로는 DB 사용)
const reservations = new Map<string, Reservation>()

export class NoShowDetector {
  // 예약 등록
  static registerReservation(reservation: Reservation): void {
    console.log(`📅 예약 등록: ${reservation.id}`)
    reservations.set(reservation.id, reservation)
  }
  
  // 체크인 처리
  static checkIn(reservationId: string): void {
    console.log(`✅ 체크인: 예약 ${reservationId}`)
    
    const reservation = reservations.get(reservationId)
    if (reservation) {
      reservation.status = 'checked_in'
      reservation.checkedInAt = new Date()
      reservations.set(reservationId, reservation)
    }
  }
  
  // 일일 노쇼 체크 (매일 29시(새벽 5시)에 실행)
  static async checkDailyNoShows(): Promise<void> {
    console.log('🔍 일일 노쇼 체크 시작...')
    
    // 어제 5시부터 오늘 5시까지가 하루 기준
    const today = new Date()
    const dayStart = new Date(today)
    dayStart.setHours(5, 0, 0, 0)
    
    // 오늘 5시가 아직 안 지났으면 어제 5시부터
    if (today.getHours() < 5) {
      dayStart.setDate(dayStart.getDate() - 1)
    }
    
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1) // 다음날 5시까지
    
    let noShowCount = 0
    const noShowList: Reservation[] = []
    
    // 해당 기간의 모든 예약 확인
    reservations.forEach(reservation => {
      const startTime = new Date(reservation.startTime)
      
      // 해당 일자 예약인지 확인 (5시 ~ 다음날 5시)
      if (startTime >= dayStart && startTime < dayEnd) {
        // 체크인하지 않은 예약 찾기
        if (reservation.status === 'pending' || reservation.status === 'confirmed') {
          console.log(`🚫 노쇼 감지: 예약 ${reservation.id}`)
          
          // 예약 상태를 노쇼로 변경
          reservation.status = 'no_show'
          reservations.set(reservation.id, reservation)
          
          noShowCount++
          noShowList.push(reservation)
          
          // 관리자에게 개별 알림
          sendNoShowAlert({
            id: reservation.id,
            deviceId: reservation.deviceId,
            deviceName: `기기 ${reservation.deviceId}`,
            userId: reservation.userId,
            startTime: reservation.startTime.toISOString()
          })
        }
      }
    })
    
    // 일일 노쇼 요약 알림
    if (noShowCount > 0) {
      sendSystemAlert(
        '일일 노쇼 감지 완료',
        `오늘 총 ${noShowCount}건의 노쇼가 발생했습니다. 상세 내역을 확인해주세요.`,
        'high'
      )
      
      console.log(`📊 일일 노쇼 통계: ${noShowCount}건`)
      noShowList.forEach(res => {
        console.log(`   - 예약 ID: ${res.id}, 사용자: ${res.userId}, 시간: ${res.startTime.toLocaleString('ko-KR')}`)
      })
    } else {
      console.log('✅ 오늘은 노쇼가 없습니다!')
    }
    
    console.log('✅ 일일 노쇼 체크 완료')
  }
  
  // 예약 취소 (수동)
  static cancelReservation(reservationId: string): void {
    console.log(`❌ 예약 취소: ${reservationId}`)
    
    const reservation = reservations.get(reservationId)
    if (reservation) {
      reservation.status = 'cancelled'
      reservations.set(reservationId, reservation)
      
      // 기기 상태 해제
      DeviceStatusManager.manualRelease(reservation.deviceId)
    }
  }
  
  // 예약 완료 처리
  static completeReservation(reservationId: string): void {
    console.log(`✔️ 예약 완료: ${reservationId}`)
    
    const reservation = reservations.get(reservationId)
    if (reservation) {
      reservation.status = 'completed'
      reservations.set(reservationId, reservation)
    }
  }
  
  // 오늘의 체크인 안 한 예약 조회 (실시간 확인용)
  static getTodayUncheckedReservations(): Reservation[] {
    const today = new Date()
    const dayStart = new Date(today)
    dayStart.setHours(5, 0, 0, 0)
    
    // 오늘 5시가 아직 안 지났으면 어제 5시부터
    if (today.getHours() < 5) {
      dayStart.setDate(dayStart.getDate() - 1)
    }
    
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1) // 다음날 5시까지
    
    const uncheckedReservations: Reservation[] = []
    
    reservations.forEach(reservation => {
      const startTime = new Date(reservation.startTime)
      
      // 해당 일자 예약이면서 아직 체크인 안 한 경우
      if (startTime >= dayStart && startTime < dayEnd) {
        if (reservation.status === 'pending' || reservation.status === 'confirmed') {
          uncheckedReservations.push(reservation)
        }
      }
    })
    
    return uncheckedReservations
  }
  
  // 노쇼 통계 조회
  static getNoShowStats(startDate: Date, endDate: Date): {
    total: number
    noShows: number
    rate: number
  } {
    let total = 0
    let noShows = 0
    
    reservations.forEach(reservation => {
      if (reservation.startTime >= startDate && reservation.startTime <= endDate) {
        total++
        if (reservation.status === 'no_show') {
          noShows++
        }
      }
    })
    
    return {
      total,
      noShows,
      rate: total > 0 ? (noShows / total) * 100 : 0
    }
  }
  
  // 서버 시작 시 기존 예약 복원
  static async restoreFromDatabase(): Promise<void> {
    console.log('🔄 예약 데이터 복원 중...')
    
    // TODO: DB에서 오늘의 예약 조회
    // 실제 구현 시 DB 쿼리로 대체
    
    console.log('✅ 예약 데이터 복원 완료')
  }
  
  // 일일 노쇼 체크 스케줄러 설정
  static setupDailyCheck(): void {
    // 매일 새벽 5시(29시)에 실행
    const now = new Date()
    const nextCheck = new Date()
    nextCheck.setHours(5, 0, 0, 0)
    
    // 오늘 5시가 이미 지났으면 내일 5시
    if (now.getHours() >= 5) {
      nextCheck.setDate(nextCheck.getDate() + 1)
    }
    
    const msUntilNextCheck = nextCheck.getTime() - now.getTime()
    
    // 다음 5시에 첫 실행
    setTimeout(() => {
      this.checkDailyNoShows()
      
      // 이후 매일 5시에 실행
      setInterval(() => {
        this.checkDailyNoShows()
      }, 24 * 60 * 60 * 1000) // 24시간마다
    }, msUntilNextCheck)
    
    console.log(`⏰ 일일 노쇼 체크 예약: 매일 새벽 5시(29시) 실행`)
    console.log(`   다음 체크: ${nextCheck.toLocaleString('ko-KR')}`)
  }
  
  // 수동으로 노쇼 체크 실행 (관리자용)
  static async manualNoShowCheck(): Promise<void> {
    console.log('👤 관리자가 수동으로 노쇼 체크 실행')
    await this.checkDailyNoShows()
  }
  
  // 정리 (서버 종료 시)
  static cleanup(): void {
    reservations.clear()
  }
}

// 서버 시작 시 자동 설정
if (typeof window === 'undefined') {
  NoShowDetector.restoreFromDatabase().catch(console.error)
  NoShowDetector.setupDailyCheck()
  
  // 프로세스 종료 시 정리
  process.on('SIGTERM', () => NoShowDetector.cleanup())
  process.on('SIGINT', () => NoShowDetector.cleanup())
}