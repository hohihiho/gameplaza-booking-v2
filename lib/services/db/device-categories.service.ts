import { eq, asc, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'
import { deviceCategories } from '@/lib/db/schema'

export class DeviceCategoriesService {
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
      .from(deviceCategories)
      .orderBy(asc(deviceCategories.displayOrder))
  }

  async findById(id: string) {
    const [category] = await this.db
      .select()
      .from(deviceCategories)
      .where(eq(deviceCategories.id, id))
      .limit(1)
    
    return category
  }

  async create(data: {
    name: string
    displayOrder?: number
  }) {
    const [category] = await this.db
      .insert(deviceCategories)
      .values({
        name: data.name,
        displayOrder: data.displayOrder || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning()
    
    return category
  }

  async update(id: string, data: {
    name?: string
    displayOrder?: number
  }) {
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder
    
    const [category] = await this.db
      .update(deviceCategories)
      .set(updateData)
      .where(eq(deviceCategories.id, id))
      .returning()
    
    return category
  }

  async updateOrder(updates: Array<{ id: string, displayOrder: number }>) {
    const results = await Promise.all(
      updates.map(update => 
        this.db
          .update(deviceCategories)
          .set({ 
            displayOrder: update.displayOrder,
            updatedAt: new Date().toISOString()
          })
          .where(eq(deviceCategories.id, update.id))
          .returning()
      )
    )
    
    return results
  }

  async delete(id: string) {
    await this.db
      .delete(deviceCategories)
      .where(eq(deviceCategories.id, id))
  }
}