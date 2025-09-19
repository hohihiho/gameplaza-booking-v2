import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'
import { admins, users, deviceTypes, type DeviceType } from '@/lib/db/schema'

export class AdminsService {
  private _db: any
  
  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  async findByUserId(userId: string) {
    const [admin] = await this.db
      .select()
      .from(admins)
      .where(eq(admins.userId, userId))
      .limit(1)
    
    return admin
  }

  async findByEmail(email: string) {
    const [result] = await this.db
      .select({
        admin: admins,
        user: users
      })
      .from(users)
      .leftJoin(admins, eq(admins.userId, users.id))
      .where(eq(users.email, email))
      .limit(1)
    
    return result
  }

  async isAdmin(userId: string): Promise<boolean> {
    const admin = await this.findByUserId(userId)
    return !!admin
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const admin = await this.findByUserId(userId)
    return admin?.isSuperAdmin === 1
  }

  async getAllAdmins() {
    const results = await this.db
      .select({
        admin: admins,
        user: users
      })
      .from(admins)
      .innerJoin(users, eq(admins.userId, users.id))
      .orderBy(desc(admins.createdAt))
    
    return results.map(r => ({
      ...r.admin,
      user: r.user
    }))
  }

  async createAdmin(userId: string, isSuperAdmin: boolean = false) {
    const [admin] = await this.db
      .insert(admins)
      .values({
        userId,
        isSuperAdmin: isSuperAdmin ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning()
    
    return admin
  }

  async updateAdmin(userId: string, data: { isSuperAdmin?: boolean }) {
    const [admin] = await this.db
      .update(admins)
      .set({
        ...(data.isSuperAdmin !== undefined && { isSuperAdmin: data.isSuperAdmin ? 1 : 0 }),
        updatedAt: new Date().toISOString()
      })
      .where(eq(admins.userId, userId))
      .returning()
    
    return admin
  }

  async deleteAdmin(userId: string) {
    await this.db
      .delete(admins)
      .where(eq(admins.userId, userId))
  }
}

export class UsersService {
  private _db: any
  
  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    
    return user
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    
    return user
  }

  async getAllUsers() {
    return await this.db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
  }

  async createUser(data: {
    email: string
    name?: string
    phone?: string
    image?: string
  }) {
    const [user] = await this.db
      .insert(users)
      .values({
        email: data.email,
        name: data.name || data.email.split('@')[0],
        phone: data.phone,
        image: data.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning()
    
    return user
  }

  async updateUser(id: string, data: {
    email?: string
    name?: string
    phone?: string
    image?: string
  }) {
    const [user] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, id))
      .returning()
    
    return user
  }

  async deleteUser(id: string) {
    await this.db
      .delete(users)
      .where(eq(users.id, id))
  }

  async getUserStats(startDate: string, endDate: string) {
    const totalUsers = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
    
    const newUsers = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          sql`date(${users.createdAt}) >= ${startDate}`,
          sql`date(${users.createdAt}) <= ${endDate}`
        )
      )
    
    return {
      total: totalUsers[0]?.count || 0,
      new: newUsers[0]?.count || 0
    }
  }
}

/**
 * DeviceTypes 서비스
 */
export class DeviceTypesService {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * 모든 기종 목록 조회
   */
  async findAll(): Promise<DeviceType[]> {
    try {
      return await this.db
        .select()
        .from(deviceTypes)
        .orderBy(asc(deviceTypes.name))
    } catch (error) {
      console.error('DeviceTypesService.findAll error:', error)
      return []
    }
  }

  /**
   * ID로 기종 조회
   */
  async findById(id: string): Promise<DeviceType | null> {
    try {
      const [deviceType] = await this.db
        .select()
        .from(deviceTypes)
        .where(eq(deviceTypes.id, id))
        .limit(1)

      return deviceType || null
    } catch (error) {
      console.error('DeviceTypesService.findById error:', error)
      return null
    }
  }
}