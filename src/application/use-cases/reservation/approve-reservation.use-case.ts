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

    // 4. 사용 가능한 기기 번호 찾기
    const availableDeviceNumber = await this.findAvailableDeviceNumber(
      reservation.deviceId,
      reservation.date,
      reservation.timeSlot
    )

    if (!availableDeviceNumber) {
      throw new Error('사용 가능한 기기가 없습니다')
    }

    // 5. 예약 승인 및 기기 번호 할당
    const approvedReservation = reservation.approveWithDevice(availableDeviceNumber)
    await this.reservationRepository.update(approvedReservation)

    // 6. 예약한 사용자에게 알림 발송
    const reservationUser = await this.userRepository.findById(reservation.userId)
    if (reservationUser) {
      const notification = Notification.create({
        id: this.generateId(),
        userId: reservation.userId,
        type: 'reservation_approved',
        title: '예약이 승인되었습니다',
        content: `예약번호 ${reservation.reservationNumber}이(가) 승인되었습니다. 기기번호: ${availableDeviceNumber}`,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        metadata: {
          reservationId: reservation.id,
          assignedDeviceNumber: availableDeviceNumber
        }
      })
      
      await this.notificationRepository.save(notification)
    }

    return {
      reservation: approvedReservation,
      assignedDeviceNumber: availableDeviceNumber,
      message: `예약이 승인되었습니다. 기기번호 ${availableDeviceNumber}가 배정되었습니다.`
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