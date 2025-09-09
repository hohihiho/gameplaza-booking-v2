import { D1BaseRepository } from './base.repository';
import { v4 as uuidv4 } from 'uuid';

// DeviceType 타입
export interface DeviceType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  max_units: number;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Device 타입
export interface Device {
  id: string;
  type_id: string;
  device_number: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class DeviceRepository extends D1BaseRepository<Device> {
  constructor(db: D1Database) {
    super(db, 'devices');
  }

  // 기기 타입별 조회
  async findByType(typeId: string): Promise<Device[]> {
    return this.findByCondition('type_id = ?', [typeId]);
  }

  // 상태별 기기 조회
  async findByStatus(status: string): Promise<Device[]> {
    return this.findByCondition('status = ?', [status]);
  }

  // 이용 가능한 기기 조회
  async findAvailable(typeId?: string): Promise<Device[]> {
    if (typeId) {
      return this.findByCondition('type_id = ? AND status = ?', [typeId, 'available']);
    }
    return this.findByCondition('status = ?', ['available']);
  }

  // 기기 생성
  async createDevice(data: {
    type_id: string;
    device_number: number;
    status?: string;
    notes?: string;
  }): Promise<Device> {
    const deviceId = uuidv4();
    
    const deviceData = {
      id: deviceId,
      type_id: data.type_id,
      device_number: data.device_number,
      status: data.status || 'available',
      notes: data.notes || null,
    };

    return this.create(deviceData);
  }

  // 기기 상태 업데이트
  async updateStatus(deviceId: string, status: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE devices 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(status, deviceId)
      .run();
  }

  // 기기 정보와 타입 정보 함께 조회
  async findWithType(deviceId: string): Promise<(Device & { type: DeviceType }) | null> {
    const result = await this.rawFirst<Device & { type: DeviceType }>(`
      SELECT 
        d.*,
        dt.id as type_id,
        dt.name as type_name,
        dt.description as type_description,
        dt.category as type_category,
        dt.max_units as type_max_units
      FROM devices d
      INNER JOIN device_types dt ON d.type_id = dt.id
      WHERE d.id = ?
    `, [deviceId]);

    return result;
  }

  // 기기 타입별 통계
  async getDeviceStats(): Promise<{
    type_id: string;
    type_name: string;
    total: number;
    available: number;
    in_use: number;
    maintenance: number;
  }[]> {
    const result = await this.raw<{
      type_id: string;
      type_name: string;
      total: number;
      available: number;
      in_use: number;
      maintenance: number;
    }>(`
      SELECT 
        dt.id as type_id,
        dt.name as type_name,
        COUNT(d.id) as total,
        SUM(CASE WHEN d.status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN d.status = 'in_use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN d.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM device_types dt
      LEFT JOIN devices d ON dt.id = d.type_id
      WHERE dt.is_active = 1
      GROUP BY dt.id, dt.name
      ORDER BY dt.display_order
    `);

    return result;
  }
}

// DeviceType Repository
export class DeviceTypeRepository extends D1BaseRepository<DeviceType> {
  constructor(db: D1Database) {
    super(db, 'device_types');
  }

  // 활성 기기 타입 조회
  async findActive(): Promise<DeviceType[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM device_types
        WHERE is_active = 1
        ORDER BY display_order, name
      `)
      .all<DeviceType>();
    
    return result.results;
  }

  // 카테고리별 조회
  async findByCategory(category: string): Promise<DeviceType[]> {
    return this.findByCondition('category = ? AND is_active = 1', [category]);
  }

  // 기기 타입 생성
  async createDeviceType(data: {
    name: string;
    description?: string;
    category?: string;
    max_units?: number;
    display_order?: number;
  }): Promise<DeviceType> {
    const typeId = uuidv4();
    
    const typeData = {
      id: typeId,
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      max_units: data.max_units || 1,
      display_order: data.display_order || 0,
      is_active: 1,
    };

    return this.create(typeData);
  }

  // 활성/비활성 설정
  async setActive(typeId: string, isActive: boolean): Promise<void> {
    await this.db
      .prepare(`
        UPDATE device_types 
        SET is_active = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(isActive ? 1 : 0, typeId)
      .run();
  }

  // 표시 순서 업데이트
  async updateDisplayOrder(typeId: string, order: number): Promise<void> {
    await this.db
      .prepare(`
        UPDATE device_types 
        SET display_order = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(order, typeId)
      .run();
  }

  // 카테고리 목록 조회
  async getCategories(): Promise<string[]> {
    const result = await this.raw<{ category: string }>(`
      SELECT DISTINCT category 
      FROM device_types 
      WHERE category IS NOT NULL AND is_active = 1
      ORDER BY category
    `);

    return result.map(r => r.category);
  }
}