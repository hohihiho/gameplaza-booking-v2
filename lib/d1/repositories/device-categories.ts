import { createD1Client, d1, type D1Client } from '../client';

export interface DeviceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class DeviceCategoriesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<DeviceCategory | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM device_categories WHERE id = ?')
      .bind(id)
      .first<DeviceCategory>();
    
    return result;
  }
  
  async findByName(name: string): Promise<DeviceCategory | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM device_categories WHERE name = ?')
      .bind(name)
      .first<DeviceCategory>();
    
    return result;
  }
  
  async findActive(): Promise<DeviceCategory[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM device_categories WHERE is_active = ? ORDER BY sort_order, name')
      .bind(true)
      .all<DeviceCategory>();
    
    return result.results || [];
  }
  
  async list(): Promise<DeviceCategory[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM device_categories ORDER BY sort_order, name')
      .all<DeviceCategory>();
    
    return result.results || [];
  }
  
  async create(category: Partial<DeviceCategory>): Promise<DeviceCategory | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('device_categories', {
      ...category,
      id: category.id || crypto.randomUUID(),
      is_active: category.is_active ?? true,
      sort_order: category.sort_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(category.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<DeviceCategory>): Promise<DeviceCategory | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('device_categories', 
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
    
    const { query, values } = d1.delete('device_categories', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}