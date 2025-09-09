import { createD1Client, d1, type D1Client } from '../client';

export interface PushMessageTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category?: string;
  variables?: string; // JSON string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class PushMessageTemplatesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<PushMessageTemplate | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM push_message_templates WHERE id = ?')
      .bind(id)
      .first<PushMessageTemplate>();
    
    return result;
  }
  
  async findByName(name: string): Promise<PushMessageTemplate | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM push_message_templates WHERE name = ?')
      .bind(name)
      .first<PushMessageTemplate>();
    
    return result;
  }
  
  async findByCategory(category: string): Promise<PushMessageTemplate[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM push_message_templates WHERE category = ? AND is_active = ? ORDER BY name')
      .bind(category, true)
      .all<PushMessageTemplate>();
    
    return result.results || [];
  }
  
  async findActive(): Promise<PushMessageTemplate[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM push_message_templates WHERE is_active = ? ORDER BY category, name')
      .bind(true)
      .all<PushMessageTemplate>();
    
    return result.results || [];
  }
  
  async list(): Promise<PushMessageTemplate[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM push_message_templates ORDER BY category, name')
      .all<PushMessageTemplate>();
    
    return result.results || [];
  }
  
  async create(template: Partial<PushMessageTemplate>): Promise<PushMessageTemplate | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('push_message_templates', {
      ...template,
      id: template.id || crypto.randomUUID(),
      is_active: template.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(template.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<PushMessageTemplate>): Promise<PushMessageTemplate | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('push_message_templates', 
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
    
    const { query, values } = d1.delete('push_message_templates', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}