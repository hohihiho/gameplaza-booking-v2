import { createD1Client, d1, type D1Client } from '../client';

export interface RentalSetting {
  id: string;
  device_type_id: string;
  hourly_rate?: number;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  deposit_amount?: number;
  min_rental_hours?: number;
  max_rental_hours?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class RentalSettingsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<RentalSetting | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM rental_settings WHERE id = ?')
      .bind(id)
      .first<RentalSetting>();
    
    return result;
  }
  
  async findByDeviceType(deviceTypeId: string): Promise<RentalSetting | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM rental_settings WHERE device_type_id = ? AND is_active = ?')
      .bind(deviceTypeId, true)
      .first<RentalSetting>();
    
    return result;
  }
  
  async findActive(): Promise<RentalSetting[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM rental_settings WHERE is_active = ? ORDER BY device_type_id')
      .bind(true)
      .all<RentalSetting>();
    
    return result.results || [];
  }
  
  async list(): Promise<RentalSetting[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM rental_settings ORDER BY device_type_id')
      .all<RentalSetting>();
    
    return result.results || [];
  }
  
  async create(setting: Partial<RentalSetting>): Promise<RentalSetting | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('rental_settings', {
      ...setting,
      id: setting.id || crypto.randomUUID(),
      is_active: setting.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(setting.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<RentalSetting>): Promise<RentalSetting | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('rental_settings', 
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
    
    const { query, values } = d1.delete('rental_settings', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}