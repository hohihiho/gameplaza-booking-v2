import { BaseRepository } from './base.repository'
import { v4 as uuidv4 } from 'uuid'

// Device 타입 정의 (D1 스키마와 일치)
export interface Device {
  id: string
  type_id: string
  device_number: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

// DeviceType 타입 정의 (D1 스키마와 일치)
export interface DeviceType {
  id: string
  name: string
  description?: string
  category?: string
  max_units: number
  display_order: number
  is_active: number
  created_at: string
  updated_at: string
}

// DeviceWithType 타입 (조인 결과용)
export interface DeviceWithType extends Device {
  type_name?: string
  type_description?: string
  type_category?: string
  max_units?: number
}

export class DeviceRepository extends BaseRepository<Device> {
  constructor(db: D1Database) {
    super(db, 'devices')
  }

  // 타입별 기기 조회
  async findByTypeId(typeId: string): Promise<Device[]> {
    return this.findByCondition('type_id = ?', [typeId])
  }

  // 상태별 기기 조회
  async findByStatus(status: string): Promise<Device[]> {
    return this.findByCondition('status = ?', [status])
  }

  // 사용 가능한 기기 조회
  async findAvailable(typeId?: string): Promise<Device[]> {
    if (typeId) {
      return this.findByCondition('type_id = ? AND status = ?', [typeId, 'available'])
    }
    return this.findByCondition('status = ?', ['available'])
  }

  // 기기 번호로 조회
  async findByDeviceNumber(typeId: string, deviceNumber: number): Promise<Device | null> {
    return this.findOneByCondition('type_id = ? AND device_number = ?', [typeId, deviceNumber])
  }

  // 기기 생성
  async createDevice(data: {
    type_id: string
    device_number: number
    status?: string
    notes?: string
  }): Promise<Device> {
    const deviceId = uuidv4()
    
    const deviceData = {
      id: deviceId,
      type_id: data.type_id,
      device_number: data.device_number,
      status: data.status || 'available',
      notes: data.notes || null,
    }

    return this.create(deviceData)
  }

  // 기기 상태 업데이트
  async updateStatus(deviceId: string, status: string, notes?: string): Promise<Device | null> {
    const updateData: any = { status }
    if (notes !== undefined) {
      updateData.notes = notes
    }
    
    return await this.update(deviceId, updateData)
  }

  // 타입별 기기 수 조회
  async countByTypeId(typeId: string): Promise<number> {
    return this.count('type_id = ?', [typeId])
  }

  // 타입별 사용 가능한 기기 수 조회
  async countAvailableByTypeId(typeId: string): Promise<number> {
    return this.count('type_id = ? AND status = ?', [typeId, 'available'])
  }

  // 기기 상세 정보 조회 (타입 정보 포함)
  async findByIdWithType(deviceId: string): Promise<DeviceWithType | null> {
    const result = await this.rawFirst(`
      SELECT 
        d.*,
        dt.name as type_name,
        dt.description as type_description,
        dt.category as type_category,
        dt.max_units
      FROM devices d
      INNER JOIN device_types dt ON d.type_id = dt.id
      WHERE d.id = ?
    `, [deviceId])

    return result as DeviceWithType | null
  }

  // 모든 기기 조회 (타입 정보 포함)
  async findAllWithTypes(): Promise<DeviceWithType[]> {
    const result = await this.db
      .prepare(`
        SELECT 
          d.*,
          dt.name as type_name,
          dt.description as type_description,
          dt.category as type_category,
          dt.max_units
        FROM devices d
        INNER JOIN device_types dt ON d.type_id = dt.id
        ORDER BY dt.display_order, d.device_number
      `)
      .all()

    return result.results as DeviceWithType[]
  }

  // 카테고리별 기기 조회
  async findByCategory(categoryId: string): Promise<DeviceWithType[]> {
    const result = await this.db
      .prepare(`
        SELECT 
          d.*,
          dt.name as type_name,
          dt.description as type_description,
          dt.category as type_category,
          dt.max_units
        FROM devices d
        INNER JOIN device_types dt ON d.type_id = dt.id
        WHERE dt.category = ?
        ORDER BY dt.display_order, d.device_number
      `)
      .bind(categoryId)
      .all()

    return result.results as DeviceWithType[]
  }

  // 특정 시간대에 사용 가능한 기기 조회
  async findAvailableDevices(date: string, startTime: string, endTime: string): Promise<DeviceWithType[]> {
    const result = await this.db
      .prepare(`
        SELECT 
          d.*,
          dt.name as type_name,
          dt.description as type_description,
          dt.category as type_category,
          dt.max_units
        FROM devices d
        INNER JOIN device_types dt ON d.type_id = dt.id
        WHERE d.status = 'available'
        AND d.id NOT IN (
          SELECT device_id 
          FROM reservations 
          WHERE date = ? 
          AND status IN ('pending', 'approved', 'checked_in')
          AND start_time < ? 
          AND end_time > ?
        )
        ORDER BY dt.display_order, d.device_number
      `)
      .bind(date, endTime, startTime)
      .all()

    return result.results as DeviceWithType[]
  }

  // 기기 통계 조회
  async getDeviceStats(): Promise<{
    total: number
    available: number
    inUse: number
    maintenance: number
  }> {
    const result = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as inUse,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
        FROM devices
      `)
      .first()

    return {
      total: (result as any)?.total || 0,
      available: (result as any)?.available || 0,
      inUse: (result as any)?.inUse || 0,
      maintenance: (result as any)?.maintenance || 0
    }
  }

  // 기기 일괄 상태 업데이트
  async bulkUpdateStatus(deviceIds: string[], status: string): Promise<void> {
    const placeholders = deviceIds.map(() => '?').join(',')
    await this.db
      .prepare(`
        UPDATE devices 
        SET status = ?, updated_at = datetime('now')
        WHERE id IN (${placeholders})
      `)
      .bind(status, ...deviceIds)
      .run()
  }

  // BaseRepository의 findByCondition을 사용하기 위한 헬퍼 메서드
  private async findByCondition(condition: string, params: any[] = []): Promise<Device[]> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition}`)
        .bind(...params)
        .all()

      return result.results as Device[]
    } catch (error) {
      console.error(`Error fetching ${this.tableName} with condition:`, error)
      return []
    }
  }

  private async findOneByCondition(condition: string, params: any[] = []): Promise<Device | null> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition} LIMIT 1`)
        .bind(...params)
        .first()

      return result as Device | null
    } catch (error) {
      console.error(`Error fetching ${this.tableName} with condition:`, error)
      return null
    }
  }

  private async count(condition?: string, params: any[] = []): Promise<number> {
    try {
      const query = condition 
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${condition}`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .first()

      return (result as any)?.count || 0
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error)
      return 0
    }
  }

  private async rawFirst(query: string, params: any[] = []): Promise<any | null> {
    try {
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .first()

      return result
    } catch (error) {
      console.error('Error executing raw query:', error)
      return null
    }
  }
}