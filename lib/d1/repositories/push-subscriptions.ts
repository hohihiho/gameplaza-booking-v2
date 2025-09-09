import { createD1Client, d1, type D1Client } from '../client';

export interface PushSubscription {
  id: string;
  user_email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export class PushSubscriptionsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findByUserEmail(userEmail: string, enabledOnly = true): Promise<PushSubscription[]> {
    if (!this.db) return [];
    
    let query = 'SELECT * FROM push_subscriptions WHERE user_email = ?';
    const params = [userEmail];
    
    if (enabledOnly) {
      query += ' AND enabled = ?';
      params.push(1); // SQLite uses 1 for true
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<PushSubscription>();
    
    return result.results || [];
  }
  
  async findById(id: string): Promise<PushSubscription | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM push_subscriptions WHERE id = ?')
      .bind(id)
      .first<PushSubscription>();
    
    return result;
  }
  
  async create(subscription: Partial<PushSubscription>): Promise<PushSubscription | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('push_subscriptions', {
      ...subscription,
      id: subscription.id || crypto.randomUUID(),
      enabled: subscription.enabled !== false, // 기본값 true
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success) {
      return this.findById(subscription.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<PushSubscription>): Promise<PushSubscription | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('push_subscriptions', 
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
  
  async disable(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE push_subscriptions SET enabled = 0, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), id)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async enable(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE push_subscriptions SET enabled = 1, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), id)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('push_subscriptions', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async deleteByUserEmail(userEmail: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('DELETE FROM push_subscriptions WHERE user_email = ?')
      .bind(userEmail)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}