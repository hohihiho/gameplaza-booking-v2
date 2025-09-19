import Database from 'better-sqlite3';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  profileImageUrl?: string;
  marketingConsent?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NewUser {
  email: string;
  name: string;
  phone?: string;
  role?: string;
  marketingConsent?: boolean;
}

export class UsersService {
  private _db: Database.Database | null = null;
  
  private get db() {
    if (!this._db) {
      this._db = new Database(path.join(process.cwd(), "dev.db"));
    }
    return this._db;
  }
  
  // 사용자 생성
  async create(userData: NewUser): Promise<User> {
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);  // Unix timestamp로 변경
    
    console.log('[UsersService.create] 시작:', { id, userData });
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, phone, role, marketing_agreed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(
        id,
        userData.email,
        userData.name,
        userData.phone || null,
        userData.role || 'customer',
        userData.marketingConsent ? 1 : 0,
        now,
        now
      );
      console.log('[UsersService.create] INSERT 결과:', result);
    } catch (insertError) {
      console.error('[UsersService.create] INSERT 오류:', insertError);
      throw insertError;
    }
    
    const createdUser = await this.findById(id);
    console.log('[UsersService.create] 생성된 사용자:', createdUser);
    
    if (!createdUser) {
      throw new Error(`사용자 생성 후 조회 실패: ${id}`);
    }
    
    return createdUser;
  }
  
  // ID로 사용자 조회
  async findById(id: string): Promise<User | undefined> {
    console.log('[UsersService.findById] 조회 시작:', id);
    
    const stmt = this.db.prepare(`
      SELECT id, email, name, phone, role, profile_image as profileImageUrl, 
             marketing_agreed as marketingConsent, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `);
    
    const result = stmt.get(id) as any;
    console.log('[UsersService.findById] 조회 결과:', result);
    
    if (!result) {
      console.log('[UsersService.findById] 사용자를 찾을 수 없음:', id);
      return undefined;
    }
    
    const user = {
      ...result,
      marketingConsent: Boolean(result.marketingConsent),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
    
    console.log('[UsersService.findById] 반환할 사용자:', user);
    return user;
  }
  
  // 이메일로 사용자 조회
  async findByEmail(email: string): Promise<User | undefined> {
    const stmt = this.db.prepare(`
      SELECT id, email, name, phone, role, profile_image as profileImageUrl, 
             marketing_agreed as marketingConsent, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE email = ?
    `);
    const result = stmt.get(email) as any;
    if (!result) return undefined;
    
    return {
      ...result,
      marketingConsent: Boolean(result.marketingConsent),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }
  
  // 전화번호로 사용자 조회
  async findByPhone(phone: string): Promise<User | undefined> {
    const stmt = this.db.prepare(`
      SELECT id, email, name, phone, role, profile_image as profileImageUrl, 
             marketing_agreed as marketingConsent, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE phone = ?
    `);
    const result = stmt.get(phone) as any;
    if (!result) return undefined;
    
    return {
      ...result,
      marketingConsent: Boolean(result.marketingConsent),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }
  
  // 사용자 목록 조회
  async findAll(options?: {
    role?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    let sql = `
      SELECT id, email, name, phone, role, profile_image as profileImageUrl, 
             marketing_agreed as marketingConsent, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE 1=1
    `;
    const params: any[] = [];
    
    if (options?.role) {
      sql += ` AND role = ?`;
      params.push(options.role);
    }
    
    if (options?.search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }
    
    if (options?.offset) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }
    
    const stmt = this.db.prepare(sql);
    const results = stmt.all(...params) as any[];
    
    return results.map(result => ({
      ...result,
      marketingConsent: Boolean(result.marketingConsent),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }));
  }
  
  // 사용자 정보 업데이트
  async update(id: string, userData: Partial<NewUser>): Promise<User | undefined> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (userData.name !== undefined) {
      updates.push('name = ?');
      params.push(userData.name);
    }
    
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      params.push(userData.phone);
    }
    
    if (userData.role !== undefined) {
      updates.push('role = ?');
      params.push(userData.role);
    }
    
    if (userData.marketingConsent !== undefined) {
      updates.push('marketing_agreed = ?');
      params.push(userData.marketingConsent ? 1 : 0);
    }
    
    updates.push('updated_at = ?');
    params.push(Math.floor(Date.now() / 1000));  // Unix timestamp로 변경
    params.push(id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...params);
    
    return this.findById(id);
  }
  
  // 사용자 삭제
  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  // 관리자 권한 확인
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user?.role === 'admin' || user?.role === 'super_admin' || Boolean((user as any)?.is_admin);
  }
  
  // 슈퍼 관리자 권한 확인
  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user?.role === 'super_admin' || Boolean((user as any)?.is_superadmin);
  }
  
  // 마지막 로그인 시간 업데이트
  async updateLastLogin(userId: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE users SET last_visit_at = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), userId);
  }
}

// 싱글톤 인스턴스
export const usersService = new UsersService();