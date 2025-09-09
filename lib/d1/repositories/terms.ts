import { createD1Client, d1, type D1Client } from '../client';

export interface Terms {
  id: string;
  type: 'privacy' | 'service' | 'marketing';
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  is_required: boolean;
  effective_date?: string;
  created_at: string;
  updated_at: string;
}

export class TermsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<Terms | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM terms WHERE id = ?')
      .bind(id)
      .first<Terms>();
    
    return result;
  }
  
  async findByType(type: string): Promise<Terms | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM terms WHERE type = ? AND is_active = ? ORDER BY created_at DESC')
      .bind(type, true)
      .first<Terms>();
    
    return result;
  }
  
  async findByTypeAndVersion(type: string, version: string): Promise<Terms | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM terms WHERE type = ? AND version = ?')
      .bind(type, version)
      .first<Terms>();
    
    return result;
  }
  
  async findActive(): Promise<Terms[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM terms WHERE is_active = ? ORDER BY type, created_at DESC')
      .bind(true)
      .all<Terms>();
    
    return result.results || [];
  }
  
  async findRequired(): Promise<Terms[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM terms WHERE is_active = ? AND is_required = ? ORDER BY type')
      .bind(true, true)
      .all<Terms>();
    
    return result.results || [];
  }
  
  async list(): Promise<Terms[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM terms ORDER BY type, created_at DESC')
      .all<Terms>();
    
    return result.results || [];
  }
  
  async create(terms: Partial<Terms>): Promise<Terms | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('terms', {
      ...terms,
      id: terms.id || crypto.randomUUID(),
      is_active: terms.is_active ?? true,
      is_required: terms.is_required ?? true,
      version: terms.version || '1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(terms.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<Terms>): Promise<Terms | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('terms', 
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
    
    const { query, values } = d1.delete('terms', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async deactivateOldVersions(type: string, currentId: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE terms SET is_active = ?, updated_at = ? WHERE type = ? AND id != ?')
      .bind(false, new Date().toISOString(), type, currentId)
      .run();
    
    return result.success;
  }
}