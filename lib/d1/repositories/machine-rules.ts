import { createD1Client, d1, type D1Client } from '../client';

export interface MachineRule {
  id: string;
  device_type: string;
  max_duration_hours: number;
  cooldown_hours?: number;
  daily_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class MachineRulesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<MachineRule | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM machine_rules WHERE id = ?')
      .bind(id)
      .first<MachineRule>();
    
    return result;
  }
  
  async findByDeviceType(deviceType: string): Promise<MachineRule | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM machine_rules WHERE device_type = ? AND is_active = ?')
      .bind(deviceType, true)
      .first<MachineRule>();
    
    return result;
  }
  
  async findActive(): Promise<MachineRule[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM machine_rules WHERE is_active = ? ORDER BY device_type')
      .bind(true)
      .all<MachineRule>();
    
    return result.results || [];
  }
  
  async list(): Promise<MachineRule[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM machine_rules ORDER BY device_type')
      .all<MachineRule>();
    
    return result.results || [];
  }
  
  async create(rule: Partial<MachineRule>): Promise<MachineRule | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('machine_rules', {
      ...rule,
      id: rule.id || crypto.randomUUID(),
      is_active: rule.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(rule.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<MachineRule>): Promise<MachineRule | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('machine_rules', 
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
    
    const { query, values } = d1.delete('machine_rules', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}