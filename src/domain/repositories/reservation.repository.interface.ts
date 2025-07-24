import { Reservation } from '../entities/reservation'
import { KSTDateTime } from '../value-objects/kst-datetime'
import { TimeSlot } from '../value-objects/time-slot'

export interface ReservationFilterOptions {
  status?: string[]
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
}

export interface ReservationListResult {
  reservations: Reservation[]
  totalCount: number
}

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>
  findByUserId(userId: string, options?: ReservationFilterOptions): Promise<ReservationListResult>
  findByDeviceId(deviceId: string): Promise<Reservation[]>
  findByDate(date: KSTDateTime): Promise<Reservation[]>
  findActiveByUserId(userId: string): Promise<Reservation[]>
  findActiveByDeviceIdAndDate(deviceId: string, date: KSTDateTime): Promise<Reservation[]>
  findByDeviceAndTimeRange(
    deviceId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]>
  findByUserAndTimeRange(
    userId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]>
  findByDateRange(
    startDate: KSTDateTime,
    endDate: KSTDateTime
  ): Promise<Reservation[]>
  findByDeviceAndTimeSlot(
    deviceId: string,
    date: KSTDateTime,
    timeSlot: TimeSlot
  ): Promise<Reservation[]>
  findActiveByDeviceId(deviceId: string): Promise<Reservation[]>
  findFutureByDeviceId(deviceId: string): Promise<Reservation[]>
  save(reservation: Reservation): Promise<Reservation>
  update(reservation: Reservation): Promise<Reservation>
  delete(id: string): Promise<void>
}

// 기존 인터페이스명과의 호환성을 위한 타입 별칭
export type IReservationRepository = ReservationRepository