import { D1BaseRepository } from './base.repository';
import { v4 as uuidv4 } from 'uuid';

// Device 타입 정의
export interface Device {
  id: string;
  type_id: string;
  device_number: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// DeviceType 타입 정의
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

export class DeviceRepository extends D1BaseRepository<Device> {
  constructor(db: D1Database) {
    super(db, 'devices');
  }

  // 타입별 기기 조회
  async findByTypeId(typeId: string): Promise<Device[]> {
    return this.findByCondition('type_id = ?', [typeId]);
  }

  // 상태별 기기 조회
  async findByStatus(status: string): Promise<Device[]> {
    return this.findByCondition('status = ?', [status]);
  }

  // 사용 가능한 기기 조회
  async findAvailable(typeId?: string): Promise<Device[]> {
    if (typeId) {
      return this.findByCondition('type_id = ? AND status = ?', [typeId, 'available']);
    }
    return this.findByCondition('status = ?', ['available']);
  }

  // 기기 번호로 조회
  async findByDeviceNumber(typeId: string, deviceNumber: number): Promise<Device | null> {
    return this.findOneByCondition('type_id = ? AND device_number = ?', [typeId, deviceNumber]);
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
  async updateStatus(deviceId: string, status: string, notes?: string): Promise<void> {
    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    await this.update(deviceId, updateData);
  }

  // 타입별 기기 수 조회
  async countByTypeId(typeId: string): Promise<number> {
    return this.count('type_id = ?', [typeId]);
  }

  // 타입별 사용 가능한 기기 수 조회
  async countAvailableByTypeId(typeId: string): Promise<number> {
    return this.count('type_id = ? AND status = ?', [typeId, 'available']);
  }

  // 기기 상세 정보 조회 (타입 정보 포함)
  async findWithType(deviceId: string): Promise<any | null> {
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
    `, [deviceId]);

    return result;
  }

  // 모든 기기 조회 (타입 정보 포함)
  async findAllWithTypes(): Promise<any[]> {
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
      .all();

    return result.results;
  }

  // 기기 일괄 상태 업데이트
  async bulkUpdateStatus(deviceIds: string[], status: string): Promise<void> {
    const placeholders = deviceIds.map(() => '?').join(',');
    await this.db
      .prepare(`
        UPDATE devices 
        SET status = ?, updated_at = datetime('now')
        WHERE id IN (${placeholders})
      `)
      .bind(status, ...deviceIds)
      .run();
  }
}

export class DeviceTypeRepository extends D1BaseRepository<DeviceType> {
  constructor(db: D1Database) {
    super(db, 'device_types');
  }

  // 카테고리별 타입 조회
  async findByCategory(category: string): Promise<DeviceType[]> {
    return this.findByCondition('category = ? AND is_active = 1', [category]);
  }

  // 활성 타입만 조회
  async findActive(): Promise<DeviceType[]> {
    return this.findByCondition('is_active = 1');
  }

  // 이름으로 조회
  async findByName(name: string): Promise<DeviceType | null> {
    return this.findOneByCondition('name = ?', [name]);
  }

  // 타입 생성
  async createType(data: {
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

  // 타입 활성화/비활성화
  async setActive(typeId: string, isActive: boolean): Promise<void> {
    await this.update(typeId, { is_active: isActive ? 1 : 0 });
  }

  // 표시 순서 업데이트
  async updateDisplayOrder(typeId: string, displayOrder: number): Promise<void> {
    await this.update(typeId, { display_order: displayOrder });
  }

  // 카테고리별 타입 수 조회
  async countByCategory(category: string): Promise<number> {
    return this.count('category = ? AND is_active = 1', [category]);
  }

  // 모든 카테고리 조회
  async findAllCategories(): Promise<string[]> {
    const result = await this.db
      .prepare(`
        SELECT DISTINCT category
        FROM device_types
        WHERE category IS NOT NULL AND is_active = 1
        ORDER BY category
      `)
      .all();

    return result.results.map((row: any) => row.category);
  }

  // 타입별 통계 조회
  async getTypeStats(typeId: string): Promise<any> {
    const result = await this.rawFirst(`
      SELECT 
        dt.*,
        COUNT(d.id) as total_devices,
        SUM(CASE WHEN d.status = 'available' THEN 1 ELSE 0 END) as available_devices,
        SUM(CASE WHEN d.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_devices,
        SUM(CASE WHEN d.status = 'broken' THEN 1 ELSE 0 END) as broken_devices
      FROM device_types dt
      LEFT JOIN devices d ON dt.id = d.type_id
      WHERE dt.id = ?
      GROUP BY dt.id
    `, [typeId]);

    return result;
  }
}