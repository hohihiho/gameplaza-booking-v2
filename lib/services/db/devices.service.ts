import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'
import { devices, deviceTypes, deviceCategories, type Device, type NewDevice, type DeviceType, type NewDeviceType } from '@/lib/db/schema'

export class DevicesService {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * ID로 기기 조회
   */
  async findById(id: string): Promise<any> {
    try {
      const [result] = await this.db
        .select({
          id: devices.id,
          name: devices.name,
          deviceTypeId: devices.deviceTypeId,
          status: devices.status,
          location: devices.location,
          serialNumber: devices.serialNumber,
          notes: devices.notes,
          device_number: devices.deviceNumber,
          createdAt: devices.createdAt,
          updatedAt: devices.updatedAt,
          device_types: {
            id: deviceTypes.id,
            name: deviceTypes.name,
            description: deviceTypes.description,
            hourlyRate: deviceTypes.hourlyRate,
            categoryId: deviceTypes.categoryId,
            modelName: deviceTypes.modelName
          }
        })
        .from(devices)
        .leftJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .where(eq(devices.id, id))
        .limit(1)

      return result || null
    } catch (error) {
      console.error('DevicesService.findById error:', error)
      return null
    }
  }

  /**
   * 모든 기기 조회
   */
  async findAll(options?: {
    status?: string[]
    typeId?: string
    orderBy?: 'name' | 'status' | 'created'
  }): Promise<Device[]> {
    try {
      let query = this.db.select().from(devices)

      // 상태 필터
      if (options?.status && options.status.length > 0) {
        query = query.where(inArray(devices.status, options.status))
      }

      // 타입 필터
      if (options?.typeId) {
        query = query.where(eq(devices.deviceTypeId, options.typeId))
      }

      // 정렬
      switch (options?.orderBy) {
        case 'name':
          query = query.orderBy(asc(devices.name))
          break
        case 'status':
          query = query.orderBy(asc(devices.status))
          break
        case 'created':
        default:
          query = query.orderBy(desc(devices.createdAt))
          break
      }

      return await query
    } catch (error) {
      console.error('DevicesService.findAll error:', error)
      return []
    }
  }

  /**
   * 이용 가능한 기기 조회
   */
  async findAvailable(typeId?: string): Promise<Device[]> {
    try {
      const conditions = [eq(devices.status, 'available')]
      
      if (typeId) {
        conditions.push(eq(devices.deviceTypeId, typeId))
      }

      return await this.db
        .select()
        .from(devices)
        .where(and(...conditions))
        .orderBy(asc(devices.name))
    } catch (error) {
      console.error('DevicesService.findAvailable error:', error)
      return []
    }
  }

  /**
   * 기기 생성
   */
  async create(data: NewDevice): Promise<Device> {
    try {
      const [device] = await this.db
        .insert(devices)
        .values({
          ...data,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        })
        .returning()

      return device
    } catch (error) {
      console.error('DevicesService.create error:', error)
      throw new Error('기기 생성 실패')
    }
  }

  /**
   * 기기 업데이트
   */
  async update(id: string, data: Partial<NewDevice>): Promise<Device | null> {
    try {
      const [updated] = await this.db
        .update(devices)
        .set({
          ...data,
          updatedAt: new Date().getTime()
        })
        .where(eq(devices.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('DevicesService.update error:', error)
      return null
    }
  }

  /**
   * 기기 상태 변경
   */
  async updateStatus(id: string, status: 'available' | 'occupied' | 'maintenance' | 'offline'): Promise<boolean> {
    try {
      const result = await this.db
        .update(devices)
        .set({
          status,
          updatedAt: new Date().getTime()
        })
        .where(eq(devices.id, id))

      return result.changes > 0
    } catch (error) {
      console.error('DevicesService.updateStatus error:', error)
      return false
    }
  }

  /**
   * 기기 삭제
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(devices)
        .where(eq(devices.id, id))

      return result.changes > 0
    } catch (error) {
      console.error('DevicesService.delete error:', error)
      return false
    }
  }

  /**
   * 기기 타입별 통계
   */
  async getStatisticsByType(): Promise<Record<string, { total: number, available: number }>> {
    try {
      const result = await this.db
        .select({
          deviceTypeId: devices.deviceTypeId,
          status: devices.status,
          count: sql<number>`count(*)`
        })
        .from(devices)
        .groupBy(devices.deviceTypeId, devices.status)

      const stats: Record<string, { total: number, available: number }> = {}

      result.forEach(row => {
        if (!stats[row.deviceTypeId]) {
          stats[row.deviceTypeId] = { total: 0, available: 0 }
        }
        stats[row.deviceTypeId].total += row.count
        if (row.status === 'available') {
          stats[row.deviceTypeId].available = row.count
        }
      })

      return stats
    } catch (error) {
      console.error('DevicesService.getStatisticsByType error:', error)
      return {}
    }
  }
}

export class DeviceTypesService {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * ID로 기기 타입 조회
   */
  async findById(id: string): Promise<DeviceType | null> {
    try {
      const [type] = await this.db
        .select()
        .from(deviceTypes)
        .where(eq(deviceTypes.id, id))
        .limit(1)

      return type || null
    } catch (error) {
      console.error('DeviceTypesService.findById error:', error)
      return null
    }
  }

  /**
   * 이름으로 기기 타입 조회
   */
  async findByName(name: string): Promise<DeviceType | null> {
    try {
      const [type] = await this.db
        .select()
        .from(deviceTypes)
        .where(eq(deviceTypes.name, name))
        .limit(1)

      return type || null
    } catch (error) {
      console.error('DeviceTypesService.findByName error:', error)
      return null
    }
  }

  /**
   * 모든 기기 타입 조회
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
   * 기기 타입 조회 (카테고리별 또는 전체, 카테고리 및 기기 정보 포함)
   */
  async findAllWithDetails(categoryId?: string): Promise<any[]> {
    try {
      let query = this.db
        .select({
          id: deviceTypes.id,
          name: deviceTypes.name,
          categoryId: deviceTypes.categoryId,
          description: deviceTypes.description,
          modelName: deviceTypes.modelName,
          versionName: deviceTypes.versionName,
          displayOrder: deviceTypes.displayOrder,
          isRentable: deviceTypes.isRentable,
          playModes: deviceTypes.playModes,
          rentalSettings: deviceTypes.rentalSettings,
          createdAt: deviceTypes.createdAt,
          updatedAt: deviceTypes.updatedAt,
          // 카테고리 정보
          categoryName: deviceCategories.name,
          // 기기 정보는 별도 쿼리에서 가져옴
        })
        .from(deviceTypes)
        .leftJoin(deviceCategories, eq(deviceTypes.categoryId, deviceCategories.id))
        .orderBy(asc(deviceTypes.createdAt))

      if (categoryId) {
        query = query.where(eq(deviceTypes.categoryId, categoryId))
      }

      const types = await query

      // 각 타입별 기기 정보 가져오기
      const results = []
      for (const type of types) {
        const deviceList = await this.db
          .select({
            id: devices.id,
            deviceNumber: devices.deviceNumber,
            status: devices.status
          })
          .from(devices)
          .where(eq(devices.deviceTypeId, type.id))

        results.push({
          id: type.id,
          name: type.name,
          category_id: type.categoryId,
          category_name: type.categoryName || '',
          description: type.description,
          model_name: type.modelName,
          version_name: type.versionName,
          display_order: type.displayOrder,
          is_rentable: type.isRentable,
          play_modes: type.playModes ? 
            (Array.isArray(JSON.parse(type.playModes)) ? JSON.parse(type.playModes) : [])
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            : [],
          rental_settings: type.rentalSettings ? JSON.parse(type.rentalSettings) : {},
          created_at: type.createdAt,
          updated_at: type.updatedAt,
          devices: deviceList,
          device_count: deviceList.length,
          active_count: deviceList.filter((d: any) => d.status === 'available').length
        })
      }

      return results
    } catch (error) {
      console.error('DeviceTypesService.findAllWithDetails error:', error)
      return []
    }
  }

  /**
   * 기기 타입 생성
   */
  async create(data: NewDeviceType): Promise<DeviceType> {
    try {
      const [type] = await this.db
        .insert(deviceTypes)
        .values({
          ...data,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        })
        .returning()

      return type
    } catch (error) {
      console.error('DeviceTypesService.create error:', error)
      throw new Error('기기 타입 생성 실패')
    }
  }

  /**
   * 기기 타입과 개별 기기들을 함께 생성
   */
  async createWithDevices(typeData: NewDeviceType, deviceCount: number): Promise<DeviceType> {
    try {
      // 기기 타입 생성
      const [deviceType] = await this.db
        .insert(deviceTypes)
        .values({
          ...typeData,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        })
        .returning()

      // 개별 기기들 생성
      if (deviceCount && deviceCount > 0) {
        const devicesData = Array.from({ length: deviceCount }, (_, index) => ({
          deviceTypeId: deviceType.id,
          deviceNumber: index + 1,
          name: `${typeData.name} #${index + 1}`,
          status: 'available' as const,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        }))

        await this.db.insert(devices).values(devicesData)
      }

      return deviceType
    } catch (error) {
      console.error('DeviceTypesService.createWithDevices error:', error)
      throw new Error('기기 타입 및 기기들 생성 실패')
    }
  }

  /**
   * 기기 타입 업데이트
   */
  async update(id: string, data: Partial<NewDeviceType>): Promise<DeviceType | null> {
    try {
      const [updated] = await this.db
        .update(deviceTypes)
        .set({
          ...data,
          updatedAt: new Date().getTime()
        })
        .where(eq(deviceTypes.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('DeviceTypesService.update error:', error)
      return null
    }
  }

  /**
   * 기기 타입 삭제
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(deviceTypes)
        .where(eq(deviceTypes.id, id))

      return result.changes > 0
    } catch (error) {
      console.error('DeviceTypesService.delete error:', error)
      return false
    }
  }
}
