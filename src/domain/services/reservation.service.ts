import { Reservation } from '../entities/reservation'
import { User } from '../entities/user'
import { Device } from '../entities/device'
import { KSTDateTime } from '../value-objects/kst-datetime'
import { TimeSlot } from '../value-objects/time-slot'
import { IReservationRepository } from '../repositories/reservation.repository.interface'
import { IDeviceRepository } from '../repositories/device.repository.interface'

export interface CreateReservationDto {
  userId: string
  deviceId: string
  date: string
  timeSlot: string
}

export class ReservationService {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly deviceRepository: IDeviceRepository
  ) {}

  /**
   * 새로운 예약 생성
   */
  async createReservation(
    dto: CreateReservationDto,
    user: User
  ): Promise<Reservation> {
    // 1. 사용자 예약 권한 확인
    if (!user.canReserve()) {
      throw new Error('User is not allowed to make reservations')
    }

    // 2. 기기 존재 여부 확인
    const device = await this.deviceRepository.findDeviceById(dto.deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    // 3. 기기 이용 가능 여부 확인
    if (!device.isAvailable()) {
      throw new Error('Device is not available')
    }

    // 4. 예약 생성
    const date = KSTDateTime.fromString(dto.date)
    const timeSlot = TimeSlot.fromString(dto.timeSlot)
    
    const reservation = Reservation.create({
      id: this.generateId(),
      userId: user.id,
      deviceId: device.id,
      date,
      timeSlot
    })

    // 5. 24시간 규칙 검증
    if (!reservation.isValidFor24HourRule()) {
      throw new Error('Reservations must be made at least 24 hours in advance')
    }

    // 6. 시간 충돌 검증
    await this.validateNoTimeConflict(reservation)

    // 7. 1인 1기기 규칙 검증
    await this.validateOnePersonOneDevice(reservation)

    // 8. 예약 저장
    return await this.reservationRepository.save(reservation)
  }

  /**
   * 예약 승인
   */
  async approveReservation(
    reservationId: string,
    adminUser: User
  ): Promise<Reservation> {
    if (!adminUser.isAdmin()) {
      throw new Error('Only admins can approve reservations')
    }

    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    const approved = reservation.approve()
    return await this.reservationRepository.update(approved)
  }

  /**
   * 예약 거부
   */
  async rejectReservation(
    reservationId: string,
    adminUser: User
  ): Promise<Reservation> {
    if (!adminUser.isAdmin()) {
      throw new Error('Only admins can reject reservations')
    }

    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    const rejected = reservation.reject()
    return await this.reservationRepository.update(rejected)
  }

  /**
   * 예약 취소
   */
  async cancelReservation(
    reservationId: string,
    user: User
  ): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    // 본인 예약이거나 관리자인 경우만 취소 가능
    if (reservation.userId !== user.id && !user.isAdmin()) {
      throw new Error('You can only cancel your own reservations')
    }

    const cancelled = reservation.cancel()
    return await this.reservationRepository.update(cancelled)
  }

  /**
   * 체크인
   */
  async checkIn(
    reservationId: string,
    adminUser: User
  ): Promise<Reservation> {
    if (!adminUser.isAdmin()) {
      throw new Error('Only admins can check in reservations')
    }

    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    const checkedIn = reservation.checkIn()
    return await this.reservationRepository.update(checkedIn)
  }

  /**
   * 이용 완료
   */
  async completeReservation(
    reservationId: string,
    adminUser: User
  ): Promise<Reservation> {
    if (!adminUser.isAdmin()) {
      throw new Error('Only admins can complete reservations')
    }

    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    const completed = reservation.complete()
    return await this.reservationRepository.update(completed)
  }

  /**
   * 노쇼 처리
   */
  async markAsNoShow(
    reservationId: string,
    adminUser: User
  ): Promise<Reservation> {
    if (!adminUser.isAdmin()) {
      throw new Error('Only admins can mark no-shows')
    }

    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    const noShow = reservation.markAsNoShow()
    return await this.reservationRepository.update(noShow)
  }

  /**
   * 시간 충돌 검증
   */
  private async validateNoTimeConflict(reservation: Reservation): Promise<void> {
    const existingReservations = await this.reservationRepository
      .findActiveByDeviceIdAndDate(reservation.deviceId, reservation.date)

    for (const existing of existingReservations) {
      if (reservation.conflictsWith(existing)) {
        throw new Error('Time slot is already reserved')
      }
    }
  }

  /**
   * 1인 1기기 규칙 검증
   */
  private async validateOnePersonOneDevice(reservation: Reservation): Promise<void> {
    const userReservations = await this.reservationRepository
      .findActiveByUserId(reservation.userId)

    for (const existing of userReservations) {
      if (reservation.hasUserConflict(existing)) {
        throw new Error('You already have a reservation for this time slot')
      }
    }
  }

  private generateId(): string {
    return `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}