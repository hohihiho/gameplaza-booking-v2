import { createD1Client, d1, type D1Client } from '../client';

export interface DeviceType {
  id: string;
  name: string;
  description?: string;
  hourly_rate?: number;
  daily_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class DeviceTypesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<DeviceType | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM device_types WHERE id = ?')
      .bind(id)
      .first<DeviceType>();
    
    return result;
  }
  
  async findByName(name: string): Promise<DeviceType | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM device_types WHERE name = ?')
      .bind(name)
      .first<DeviceType>();
    
    return result;
  }
  
  async findActive(): Promise<DeviceType[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM device_types WHERE is_active = ? ORDER BY name')
      .bind(true)
      .all<DeviceType>();
    
    return result.results || [];
  }
  
  async list(): Promise<DeviceType[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM device_types ORDER BY name')
      .all<DeviceType>();
    
    return result.results || [];
  }
  
  async create(deviceType: Partial<DeviceType>): Promise<DeviceType | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('device_types', {
      ...deviceType,
      id: deviceType.id || crypto.randomUUID(),
      is_active: deviceType.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(deviceType.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<DeviceType>): Promise<DeviceType | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('device_types', 
      { ...updates, updated_at: new Date().toISOString() },
      { id }
    );
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success) {
      return this.findById(id);
    }
    
    return null;
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('device_types', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}