import { createD1Client, d1, type D1Client } from '../client';

export interface ReservationRule {
  id: string;
  name: string;
  description?: string;
  max_duration_hours: number;
  max_reservations_per_day?: number;
  max_advance_days?: number;
  min_advance_hours?: number;
  allowed_times_start?: string;
  allowed_times_end?: string;
  allowed_days?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ReservationRulesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<ReservationRule | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM reservation_rules WHERE id = ?')
      .bind(id)
      .first<ReservationRule>();
    
    return result;
  }
  
  async findActive(): Promise<ReservationRule[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM reservation_rules WHERE is_active = ? ORDER BY created_at DESC')
      .bind(true)
      .all<ReservationRule>();
    
    return result.results || [];
  }
  
  async list(): Promise<ReservationRule[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM reservation_rules ORDER BY created_at DESC')
      .all<ReservationRule>();
    
    return result.results || [];
  }
  
  async create(rule: Partial<ReservationRule>): Promise<ReservationRule | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('reservation_rules', {
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
  
  async update(id: string, updates: Partial<ReservationRule>): Promise<ReservationRule | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('reservation_rules', 
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
    
    const { query, values } = d1.delete('reservation_rules', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}