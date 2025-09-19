import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'
import { rentalTimeSlots } from '@/lib/db/schema'

export class RentalTimeSlotsService {
  private _db: any
  
  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  async getAll() {
    return await this.db
      .select()
      .from(rentalTimeSlots)
      .orderBy(asc(rentalTimeSlots.startTime))
  }

  async getActiveSlots() {
    return await this.db
      .select()
      .from(rentalTimeSlots)
      .where(eq(rentalTimeSlots.isActive, 1))
      .orderBy(asc(rentalTimeSlots.startTime))
  }

  async getByType(slotType: string) {
    return await this.db
      .select()
      .from(rentalTimeSlots)
      .where(
        and(
          eq(rentalTimeSlots.slotType, slotType),
          eq(rentalTimeSlots.isActive, 1)
        )
      )
      .orderBy(asc(rentalTimeSlots.startTime))
  }

  async findById(id: string) {
    const [slot] = await this.db
      .select()
      .from(rentalTimeSlots)
      .where(eq(rentalTimeSlots.id, id))
      .limit(1)
    
    return slot
  }

  async findByTime(startTime: string, endTime: string) {
    const [slot] = await this.db
      .select()
      .from(rentalTimeSlots)
      .where(
        and(
          eq(rentalTimeSlots.startTime, startTime),
          eq(rentalTimeSlots.endTime, endTime)
        )
      )
      .limit(1)
    
    return slot
  }

  async create(data: {
    startTime: string
    endTime: string
    price: number
    slotType?: string
    isActive?: boolean
  }) {
    const [slot] = await this.db
      .insert(rentalTimeSlots)
      .values({
        startTime: data.startTime,
        endTime: data.endTime,
        price: data.price,
        slotType: data.slotType || 'regular',
        isActive: data.isActive !== false ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning()
    
    return slot
  }

  async update(id: string, data: {
    startTime?: string
    endTime?: string
    price?: number
    slotType?: string
    isActive?: boolean
  }) {
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }
    
    if (data.startTime !== undefined) updateData.startTime = data.startTime
    if (data.endTime !== undefined) updateData.endTime = data.endTime
    if (data.price !== undefined) updateData.price = data.price
    if (data.slotType !== undefined) updateData.slotType = data.slotType
    if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0
    
    const [slot] = await this.db
      .update(rentalTimeSlots)
      .set(updateData)
      .where(eq(rentalTimeSlots.id, id))
      .returning()
    
    return slot
  }

  async delete(id: string) {
    await this.db
      .delete(rentalTimeSlots)
      .where(eq(rentalTimeSlots.id, id))
  }

  async toggleActive(id: string) {
    const slot = await this.findById(id)
    if (!slot) return null
    
    const [updated] = await this.db
      .update(rentalTimeSlots)
      .set({
        isActive: slot.isActive === 1 ? 0 : 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(rentalTimeSlots.id, id))
      .returning()
    
    return updated
  }

  async getHourlyStats(startDate: string, endDate: string) {
    // 시간대별 예약 통계를 위한 헬퍼 메서드
    // 실제 예약 데이터와 조인하여 시간대별 매출/이용률 계산
    const slots = await this.getActiveSlots()
    
    return slots.map(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0])
      const endHour = parseInt(slot.endTime.split(':')[0])
      const displayStart = startHour < 6 ? startHour + 24 : startHour
      const displayEnd = endHour < 6 ? endHour + 24 : endHour
      
      return {
        ...slot,
        displayTimeRange: `${displayStart}-${displayEnd}시`
      }
    })
  }
}