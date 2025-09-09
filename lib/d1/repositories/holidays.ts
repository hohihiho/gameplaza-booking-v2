import { createD1Client, d1, type D1Client } from '../client';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'official' | 'temporary' | 'substitute';
  is_red_day: boolean;
  year: number;
  source: 'api' | 'manual';
  last_synced_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class HolidaysRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findAll(): Promise<Holiday[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM holidays ORDER BY date DESC')
      .all<Holiday>();
    
    return result.results || [];
  }
  
  async findByYear(year: number): Promise<Holiday[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM holidays WHERE year = ? ORDER BY date ASC')
      .bind(year)
      .all<Holiday>();
    
    return result.results || [];
  }
  
  async findByDateRange(startDate: string, endDate: string): Promise<Holiday[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM holidays WHERE date >= ? AND date <= ? ORDER BY date ASC')
      .bind(startDate, endDate)
      .all<Holiday>();
    
    return result.results || [];
  }
  
  async findById(id: string): Promise<Holiday | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM holidays WHERE id = ?')
      .bind(id)
      .first<Holiday>();
    
    return result;
  }
  
  async findByDate(date: string): Promise<Holiday | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM holidays WHERE date = ?')
      .bind(date)
      .first<Holiday>();
    
    return result;
  }
  
  async create(holiday: Partial<Holiday>): Promise<Holiday | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('holidays', {
      ...holiday,
      id: holiday.id || crypto.randomUUID(),
      is_red_day: holiday.is_red_day !== false,
      source: holiday.source || 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && holiday.id) {
      return this.findById(holiday.id);
    }
    
    return null;
  }
  
  async createMany(holidays: Partial<Holiday>[]): Promise<boolean> {
    if (!this.db || holidays.length === 0) return false;
    
    // SQLite doesn't support bulk insert with returning, so we do it in a transaction
    const statements = holidays.map(holiday => {
      const { query, values } = d1.insert('holidays', {
        ...holiday,
        id: holiday.id || crypto.randomUUID(),
        is_red_day: holiday.is_red_day !== false,
        source: holiday.source || 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return this.db!.prepare(query).bind(...values);
    });
    
    try {
      await this.db.batch(statements);
      return true;
    } catch (error) {
      console.error('Failed to create holidays in batch:', error);
      return false;
    }
  }
  
  async update(id: string, updates: Partial<Holiday>): Promise<Holiday | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('holidays', 
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
    
    // Check if it's a temporary holiday (only temporary holidays can be deleted)
    const holiday = await this.findById(id);
    if (!holiday || holiday.type !== 'temporary') {
      return false;
    }
    
    const { query, values } = d1.delete('holidays', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async deleteByYear(year: number, source: 'api' | 'manual' = 'api'): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('DELETE FROM holidays WHERE year = ? AND source = ?')
      .bind(year, source)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async syncFromAPI(year: number, apiHolidays: Partial<Holiday>[]): Promise<boolean> {
    if (!this.db) return false;
    
    // Delete existing API holidays for the year
    await this.deleteByYear(year, 'api');
    
    // Insert new holidays from API
    const holidaysToInsert = apiHolidays.map(h => ({
      ...h,
      year,
      source: 'api' as const,
      last_synced_at: new Date().toISOString()
    }));
    
    return this.createMany(holidaysToInsert);
  }
}