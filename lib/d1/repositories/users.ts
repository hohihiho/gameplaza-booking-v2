import { createD1Client, d1, type D1Client } from '../client';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export class UsersRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findByEmail(email: string): Promise<User | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
    
    return result;
  }
  
  async findById(id: string): Promise<User | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
    
    return result;
  }
  
  async create(user: Partial<User>): Promise<User | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('users', {
      ...user,
      id: user.id || crypto.randomUUID(),
      role: user.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(user.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('users', 
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
    
    const { query, values } = d1.delete('users', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async list(limit = 100, offset = 0): Promise<User[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<User>();
    
    return result.results || [];
  }
}