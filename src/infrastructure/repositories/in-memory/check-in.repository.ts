import { CheckIn, CheckInStatus } from '@/src/domain/entities/check-in.entity'
import { CheckInRepository } from '@/src/domain/repositories/check-in.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export class InMemoryCheckInRepository implements CheckInRepository {
  private checkIns: Map<string, CheckIn> = new Map()

  async findById(id: string): Promise<CheckIn | null> {
    return this.checkIns.get(id) || null
  }

  async findByReservationId(reservationId: string): Promise<CheckIn | null> {
    const checkIns = Array.from(this.checkIns.values())
    return checkIns.find(checkIn => checkIn.reservationId === reservationId) || null
  }

  async findActiveByUserId(userId: string): Promise<CheckIn[]> {
    const checkIns = Array.from(this.checkIns.values())
    return checkIns.filter(
      checkIn => checkIn.userId === userId && checkIn.status === 'checked_in'
    )
  }

  async findActiveByDeviceId(deviceId: string): Promise<CheckIn | null> {
    const checkIns = Array.from(this.checkIns.values())
    return checkIns.find(
      checkIn => checkIn.deviceId === deviceId && checkIn.status === 'checked_in'
    ) || null
  }

  async findByDateRange(startDate: KSTDateTime, endDate: KSTDateTime): Promise<CheckIn[]> {
    const checkIns = Array.from(this.checkIns.values())
    return checkIns.filter(checkIn => {
      const checkInTime = checkIn.checkInTime.toDate().getTime()
      const startTime = startDate.toDate().getTime()
      const endTime = endDate.toDate().getTime()
      return checkInTime >= startTime && checkInTime <= endTime
    })
  }

  async save(checkIn: CheckIn): Promise<void> {
    this.checkIns.set(checkIn.id, checkIn)
  }

  async update(checkIn: CheckIn): Promise<void> {
    this.checkIns.set(checkIn.id, checkIn)
  }

  // 테스트 헬퍼 메서드
  clear(): void {
    this.checkIns.clear()
  }

  getAll(): CheckIn[] {
    return Array.from(this.checkIns.values())
  }
}