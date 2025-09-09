import { createD1Client, d1, type D1Client } from '../client';

export interface ScheduleManagement {
  id: string;
  date: string;
  is_operating: boolean;
  opening_hours?: string;
  closing_hours?: string;
  note?: string;
  type: 'regular' | 'special' | 'holiday';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class ScheduleManagementRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findByDate(date: string): Promise<ScheduleManagement | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_management WHERE date = ?')
      .bind(date)
      .first<ScheduleManagement>();
    
    return result;
  }
  
  async findByDateRange(startDate: string, endDate: string): Promise<ScheduleManagement[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_management WHERE date >= ? AND date <= ? ORDER BY date ASC')
      .bind(startDate, endDate)
      .all<ScheduleManagement>();
    
    return result.results || [];
  }
  
  async create(schedule: Partial<ScheduleManagement>): Promise<ScheduleManagement | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('schedule_management', {
      ...schedule,
      id: schedule.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && schedule.date) {
      return this.findByDate(schedule.date);
    }
    
    return null;
  }
  
  async upsert(schedule: Partial<ScheduleManagement>): Promise<ScheduleManagement | null> {
    if (!this.db || !schedule.date) return null;
    
    // Check if schedule exists for this date
    const existing = await this.findByDate(schedule.date);
    
    if (existing) {
      // Update existing
      const { query, values } = d1.update('schedule_management',
        { ...schedule, updated_at: new Date().toISOString() },
        { id: existing.id }
      );
      
      const result = await this.db
        .prepare(query)
        .bind(...values)
        .run();
      
      if (result.success) {
        return this.findByDate(schedule.date);
      }
    } else {
      // Create new
      return this.create(schedule);
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<ScheduleManagement>): Promise<ScheduleManagement | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('schedule_management',
      { ...updates, updated_at: new Date().toISOString() },
      { id }
    );
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success) {
      const updated = await this.db
        .prepare('SELECT * FROM schedule_management WHERE id = ?')
        .bind(id)
        .first<ScheduleManagement>();
      
      return updated;
    }
    
    return null;
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('schedule_management', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async deleteByDate(date: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('DELETE FROM schedule_management WHERE date = ?')
      .bind(date)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}