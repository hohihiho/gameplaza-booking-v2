import { CheckIn, CheckInStatus } from '../entities/check-in.entity'
import { KSTDateTime } from '../value-objects/kst-datetime'

export interface CheckInRepository {
  findById(id: string): Promise<CheckIn | null>
  findByReservationId(reservationId: string): Promise<CheckIn | null>
  findActiveByUserId(userId: string): Promise<CheckIn[]>
  findActiveByDeviceId(deviceId: string): Promise<CheckIn | null>
  findByDateRange(startDate: KSTDateTime, endDate: KSTDateTime): Promise<CheckIn[]>
  save(checkIn: CheckIn): Promise<void>
  update(checkIn: CheckIn): Promise<void>
}