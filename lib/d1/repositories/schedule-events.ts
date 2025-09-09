import { createD1Client, d1, type D1Client } from '../client';

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  event_type: 'holiday' | 'special' | 'maintenance' | 'closed';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ScheduleEventsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<ScheduleEvent | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_events WHERE id = ?')
      .bind(id)
      .first<ScheduleEvent>();
    
    return result;
  }
  
  async findByDate(date: string): Promise<ScheduleEvent[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_events WHERE event_date = ? AND is_active = ? ORDER BY start_time')
      .bind(date, true)
      .all<ScheduleEvent>();
    
    return result.results || [];
  }
  
  async findByDateRange(startDate: string, endDate: string): Promise<ScheduleEvent[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_events WHERE event_date >= ? AND event_date <= ? AND is_active = ? ORDER BY event_date, start_time')
      .bind(startDate, endDate, true)
      .all<ScheduleEvent>();
    
    return result.results || [];
  }
  
  async findByType(eventType: string): Promise<ScheduleEvent[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_events WHERE event_type = ? AND is_active = ? ORDER BY event_date DESC')
      .bind(eventType, true)
      .all<ScheduleEvent>();
    
    return result.results || [];
  }
  
  async list(limit = 100, offset = 0): Promise<ScheduleEvent[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM schedule_events ORDER BY event_date DESC, start_time LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<ScheduleEvent>();
    
    return result.results || [];
  }
  
  async create(event: Partial<ScheduleEvent>): Promise<ScheduleEvent | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('schedule_events', {
      ...event,
      id: event.id || crypto.randomUUID(),
      is_active: event.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(event.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<ScheduleEvent>): Promise<ScheduleEvent | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('schedule_events', 
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
    
    const { query, values } = d1.delete('schedule_events', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}