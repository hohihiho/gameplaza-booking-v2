import { createD1Client, d1, type D1Client } from '../client';

export interface Reservation {
  id: string;
  user_id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class ReservationsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<Reservation | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM reservations WHERE id = ?')
      .bind(id)
      .first<Reservation>();
    
    return result;
  }
  
  async findByUserId(userId: string): Promise<Reservation[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY start_time DESC')
      .bind(userId)
      .all<Reservation>();
    
    return result.results || [];
  }
  
  async findByDeviceId(deviceId: string): Promise<Reservation[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM reservations WHERE device_id = ? ORDER BY start_time DESC')
      .bind(deviceId)
      .all<Reservation>();
    
    return result.results || [];
  }
  
  async findActive(): Promise<Reservation[]> {
    if (!this.db) return [];
    
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        SELECT * FROM reservations 
        WHERE status = 'active' 
        OR (status = 'confirmed' AND start_time <= ? AND end_time > ?)
        ORDER BY start_time
      `)
      .bind(now, now)
      .all<Reservation>();
    
    return result.results || [];
  }
  
  async findConflicts(deviceId: string, startTime: string, endTime: string, excludeId?: string): Promise<Reservation[]> {
    if (!this.db) return [];
    
    let query = `
      SELECT * FROM reservations 
      WHERE device_id = ? 
      AND status IN ('confirmed', 'active')
      AND ((start_time >= ? AND start_time < ?) 
        OR (end_time > ? AND end_time <= ?)
        OR (start_time <= ? AND end_time >= ?))
    `;
    
    const params = [deviceId, startTime, endTime, startTime, endTime, startTime, endTime];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<Reservation>();
    
    return result.results || [];
  }
  
  async create(reservation: Partial<Reservation>): Promise<Reservation | null> {
    if (!this.db) return null;
    
    // 충돌 체크
    const conflicts = await this.findConflicts(
      reservation.device_id!,
      reservation.start_time!,
      reservation.end_time!
    );
    
    if (conflicts.length > 0) {
      throw new Error('예약 시간이 충돌합니다.');
    }
    
    const { query, values } = d1.insert('reservations', {
      ...reservation,
      id: reservation.id || crypto.randomUUID(),
      status: reservation.status || 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(reservation.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    if (!this.db) return null;
    
    // 시간 변경시 충돌 체크
    if (updates.start_time || updates.end_time) {
      const existing = await this.findById(id);
      if (existing) {
        const conflicts = await this.findConflicts(
          existing.device_id,
          updates.start_time || existing.start_time,
          updates.end_time || existing.end_time,
          id
        );
        
        if (conflicts.length > 0) {
          throw new Error('예약 시간이 충돌합니다.');
        }
      }
    }
    
    const { query, values } = d1.update('reservations', 
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
  
  async updateStatus(id: string, status: Reservation['status']): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, new Date().toISOString(), id)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async cancel(id: string): Promise<boolean> {
    return this.updateStatus(id, 'cancelled');
  }
  
  async complete(id: string): Promise<boolean> {
    return this.updateStatus(id, 'completed');
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('reservations', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async listToday(): Promise<Reservation[]> {
    if (!this.db) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await this.db
      .prepare(`
        SELECT * FROM reservations 
        WHERE start_time >= ? AND start_time < ?
        ORDER BY start_time
      `)
      .bind(today.toISOString(), tomorrow.toISOString())
      .all<Reservation>();
    
    return result.results || [];
  }
}