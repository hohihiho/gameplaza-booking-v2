import { createD1Client, d1, type D1Client } from '../client';

export interface Admin {
  id: string;
  user_id: string;
  is_super_admin: boolean;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export class AdminsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findByUserId(userId: string): Promise<Admin | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM admins WHERE user_id = ?')
      .bind(userId)
      .first<Admin>();
    
    return result;
  }
  
  async findById(id: string): Promise<Admin | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM admins WHERE id = ?')
      .bind(id)
      .first<Admin>();
    
    return result;
  }
  
  async isSuperAdmin(userId: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('SELECT is_super_admin FROM admins WHERE user_id = ?')
      .bind(userId)
      .first<{ is_super_admin: boolean }>();
    
    return result?.is_super_admin || false;
  }
  
  async create(admin: Partial<Admin>): Promise<Admin | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('admins', {
      ...admin,
      id: admin.id || crypto.randomUUID(),
      is_super_admin: admin.is_super_admin || false,
      permissions: JSON.stringify(admin.permissions || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(admin.id || '');
    }
    
    return null;
  }
  
  async update(userId: string, updates: Partial<Admin>): Promise<Admin | null> {
    if (!this.db) return null;
    
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    if (updates.permissions) {
      updateData.permissions = JSON.stringify(updates.permissions);
    }
    
    const { query, values } = d1.update('admins', updateData, { user_id: userId });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success) {
      return this.findByUserId(userId);
    }
    
    return null;
  }
  
  async grantSuperAdmin(userId: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE admins SET is_super_admin = ?, updated_at = ? WHERE user_id = ?')
      .bind(true, new Date().toISOString(), userId)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async revokeSuperAdmin(userId: string): Promise<boolean> {
    if (!this.db) return false;
    
    const result = await this.db
      .prepare('UPDATE admins SET is_super_admin = ?, updated_at = ? WHERE user_id = ?')
      .bind(false, new Date().toISOString(), userId)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async delete(userId: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('admins', { user_id: userId });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async listSuperAdmins(): Promise<Admin[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM admins WHERE is_super_admin = ? ORDER BY created_at')
      .bind(true)
      .all<Admin>();
    
    return result.results || [];
  }
  
  async listAll(limit = 100, offset = 0): Promise<Admin[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM admins ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<Admin>();
    
    return result.results || [];
  }
}