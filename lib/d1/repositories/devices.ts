import { createD1Client, d1, type D1Client } from '../client';

export interface Device {
  id: string;
  name: string;
  type: 'ps5' | 'switch' | 'racing' | 'beatmania' | 'taiko' | 'karaoke' | 'pc' | 'other';
  status: 'available' | 'in_use' | 'maintenance';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class DevicesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<Device | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM devices WHERE id = ?')
      .bind(id)
      .first<Device>();
    
    return result;
  }
  
  async findByType(type: Device['type']): Promise<Device[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM devices WHERE type = ? ORDER BY name')
      .bind(type)
      .all<Device>();
    
    return result.results || [];
  }
  
  async findAvailable(): Promise<Device[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM devices WHERE status = ? ORDER BY type, name')
      .bind('available')
      .all<Device>();
    
    return result.results || [];
  }
  
  async create(device: Partial<Device>): Promise<Device | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('devices', {
      ...device,
      id: device.id || crypto.randomUUID(),
      status: device.status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(device.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<Device>): Promise<Device | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('devices', 
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
  
  async updateStatus(id: string, status: Device['status']): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE devices SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, new Date().toISOString(), id)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('devices', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async list(limit = 100, offset = 0): Promise<Device[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM devices ORDER BY type, name LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<Device>();
    
    return result.results || [];
  }
}