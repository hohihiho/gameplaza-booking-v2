import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Map<string, Reservation> = new Map()

  async findById(id: string): Promise<Reservation | null> {
    return this.reservations.get(id) || null
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => reservation.userId === userId)
  }

  async findByDeviceId(deviceId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => reservation.deviceId === deviceId)
  }

  async findByDate(date: KSTDateTime): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => reservation.date.isSameDay(date))
  }

  async findActiveByUserId(userId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => 
        reservation.userId === userId && 
        reservation.isActive()
      )
  }

  async findActiveByDeviceIdAndDate(deviceId: string, date: KSTDateTime): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => 
        reservation.deviceId === deviceId && 
        reservation.date.isSameDay(date) &&
        reservation.isActive()
      )
  }

  async findByDeviceAndTimeRange(
    deviceId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => {
        if (reservation.deviceId !== deviceId) return false
        if (!reservation.isActive()) return false
        
        const reservationStart = reservation.startDateTime
        const reservationEnd = reservation.endDateTime
        
        // 시간 범위가 겹치는지 확인
        return !(reservationEnd.isBefore(startTime) || reservationStart.isAfter(endTime))
      })
  }

  async findByUserAndTimeRange(
    userId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => {
        if (reservation.userId !== userId) return false
        if (!reservation.isActive()) return false
        
        const reservationStart = reservation.startDateTime
        const reservationEnd = reservation.endDateTime
        
        // 시간 범위가 겹치는지 확인
        return !(reservationEnd.isBefore(startTime) || reservationStart.isAfter(endTime))
      })
  }

  async findByDateRange(
    startDate: KSTDateTime,
    endDate: KSTDateTime
  ): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => {
        const reservationDate = reservation.date
        return !reservationDate.isBefore(startDate) && !reservationDate.isAfter(endDate)
      })
  }

  async save(reservation: Reservation): Promise<Reservation> {
    this.reservations.set(reservation.id, reservation)
    return reservation
  }

  async update(reservation: Reservation): Promise<Reservation> {
    this.reservations.set(reservation.id, reservation)
    return reservation
  }

  async delete(id: string): Promise<void> {
    this.reservations.delete(id)
  }

  // 테스트 헬퍼 메서드
  clear(): void {
    this.reservations.clear()
  }

  getAll(): Reservation[] {
    return Array.from(this.reservations.values())
  }
}