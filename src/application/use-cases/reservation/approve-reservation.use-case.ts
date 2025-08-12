import { Reservation } from '../../../domain/entities/reservation'
import { User } from '../../../domain/entities/user'
import { Device } from '../../../domain/entities/device'
import { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { INotificationRepository } from '../../../domain/repositories/notification.repository.interface'
import { Notification } from '../../../domain/entities/notification'
import { NotificationChannel } from '../../../domain/value-objects/notification-channel'
import { DeviceStatus } from '../../../domain/value-objects/device-status'
import { KSTDateTime } from '../../../domain/value-objects/kst-datetime'
import { ScheduleService } from '../../../../lib/services/schedule.service'

export interface ApproveReservationRequest {
  userId: string
  reservationId: string
}

export interface ApproveReservationResponse {
  reservation: Reservation
  assignedDeviceNumber: string
  message: string
}

export class ApproveReservationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(request: ApproveReservationRequest): Promise<ApproveReservationResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 예약을 승인할 수 있습니다')
    }

    // 2. 예약 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 예약 상태 확인
    if (reservation.status.value !== 'pending') {
      throw new Error('대기 중인 예약만 승인할 수 있습니다')
    }

    // 4. 예약한 기기 정보 조회
    const reservedDevice = await this.deviceRepository.findById(reservation.deviceId)
    if (!reservedDevice) {
      throw new Error('예약된 기기를 찾을 수 없습니다')
    }

    // 5. 사용 가능한 기기 번호 찾기
    const availableDeviceNumber = await this.findAvailableDeviceNumber(
      reservedDevice.deviceTypeId,
      reservation.date,
      reservation.timeSlot
    )

    if (!availableDeviceNumber) {
      throw new Error('사용 가능한 기기가 없습니다')
    }

    // 6. 예약 승인 및 기기 번호 할당
    const approvedReservation = reservation.approveWithDevice(availableDeviceNumber)
    await this.reservationRepository.update(approvedReservation)

    // 7. 예약한 사용자에게 알림 발송 - 임시로 주석 처리
    // const reservationUser = await this.userRepository.findById(reservation.userId)
    // if (reservationUser) {
    //   const notification = Notification.create({
    //     id: this.generateId(),
    //     userId: reservation.userId,
    //     type: 'reservation_approved',
    //     title: '예약이 승인되었습니다',
    //     content: `예약번호 ${reservation.reservationNumber}이(가) 승인되었습니다. 기기번호: ${availableDeviceNumber}`,
    //     channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    //     metadata: {
    //       reservationId: reservation.id,
    //       assignedDeviceNumber: availableDeviceNumber
    //     }
    //   })
      
    //   await this.notificationRepository.save(notification)
    // }

    // 8. 조기대여인 경우 자동으로 영업 스케줄 생성
    let scheduleCreated = false
    let scheduleError = null
    
    try {
      // reservation.id가 Value Object인 경우를 대비
      const reservationId = typeof reservation.id === 'string' 
        ? reservation.id 
        : reservation.id.value || reservation.id.toString()
      
      console.log('스케줄 서비스 호출 - 예약 ID:', reservationId)
      await ScheduleService.handleReservationApproved(reservationId)
      scheduleCreated = true
      console.log('조기영업 일정 자동 생성 성공')
    } catch (error) {
      // 스케줄 생성 실패는 예약 승인을 막지 않음
      scheduleError = error instanceof Error ? error.message : '알 수 없는 오류'
      console.error('자동 스케줄 생성 실패:', error)
      
      // 조기대여인지 확인
      const startHour = approvedReservation.timeSlot.startHour
      if (startHour >= 7 && startHour <= 14) {
        console.warn(`⚠️ 조기영업 일정 자동 생성 실패 - 예약번호: ${approvedReservation.reservationNumber}`)
        console.warn(`   날짜: ${approvedReservation.date.dateString}, 시간: ${startHour}:00`)
        console.warn(`   관리자 페이지에서 "조기영업 일정 점검" 버튼을 클릭하여 수동으로 생성하세요.`)
      }
    }

    return {
      reservation: approvedReservation,
      assignedDeviceNumber: availableDeviceNumber,
      message: `예약이 승인되었습니다. 기기번호 ${availableDeviceNumber}가 배정되었습니다.`,
      scheduleCreated,
      scheduleError
    }
  }

  private async findAvailableDeviceNumber(
    deviceTypeId: string,
    date: KSTDateTime,
    timeSlot: any
  ): Promise<string | null> {
    // 해당 기종의 모든 기기 조회
    const devices = await this.deviceRepository.findByTypeId(deviceTypeId)
    
    // 상태가 사용 가능한 기기만 필터링
    const availableDevices = devices.filter(device => 
      device.status.value === 'available' || device.status.value === 'in_use'
    )

    // 해당 시간대에 예약이 없는 기기 찾기
    for (const device of availableDevices) {
      const conflictingReservations = await this.reservationRepository.findByDeviceAndTimeSlot(
        device.id,
        date,
        timeSlot
      )

      // 활성 예약이 없으면 사용 가능
      const hasConflict = conflictingReservations.some(r => 
        r.isActive()
      )

      if (!hasConflict) {
        return device.deviceNumber // 기기 번호 반환
      }
    }

    return null
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}