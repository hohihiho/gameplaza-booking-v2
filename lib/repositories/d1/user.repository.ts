import { D1BaseRepository } from './base.repository';
import { v4 as uuidv4 } from 'uuid';

// User 타입 정의
export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  phone?: string;
  role: string;
  is_blacklisted: number;
  marketing_agreed: number;
  created_at: string;
  updated_at: string;
}

export class UserRepository extends D1BaseRepository<User> {
  constructor(db: D1Database) {
    super(db, 'users');
  }

  // 이메일로 사용자 찾기
  async findByEmail(email: string): Promise<User | null> {
    return this.findOneByCondition('email = ?', [email]);
  }

  // 사용자 생성
  async createUser(data: {
    email: string;
    name?: string;
    nickname?: string;
    phone?: string;
    role?: string;
    marketing_agreed?: boolean;
  }): Promise<User> {
    const userId = uuidv4();
    
    const userData = {
      id: userId,
      email: data.email,
      name: data.name || null,
      nickname: data.nickname || null,
      phone: data.phone || null,
      role: data.role || 'user',
      is_blacklisted: 0,
      marketing_agreed: data.marketing_agreed ? 1 : 0,
    };

    return this.create(userData);
  }

  // 관리자 여부 확인
  async isAdmin(userId: string): Promise<boolean> {
    const result = await this.rawFirst<{ is_admin: number }>(
      `SELECT 1 as is_admin FROM admins WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    
    return result !== null;
  }

  // 슈퍼 관리자 여부 확인
  async isSuperAdmin(userId: string): Promise<boolean> {
    const result = await this.rawFirst<{ is_super_admin: number }>(
      `SELECT is_super_admin FROM admins WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    
    return result?.is_super_admin === 1;
  }

  // 관리자 권한 부여
  async grantAdminRole(userId: string, isSuperAdmin = false): Promise<void> {
    const adminId = uuidv4();
    
    await this.db
      .prepare(`
        INSERT INTO admins (id, user_id, is_super_admin)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          is_super_admin = ?,
          updated_at = datetime('now')
      `)
      .bind(adminId, userId, isSuperAdmin ? 1 : 0, isSuperAdmin ? 1 : 0)
      .run();
  }

  // 관리자 권한 제거
  async revokeAdminRole(userId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM admins WHERE user_id = ?`)
      .bind(userId)
      .run();
  }

  // 블랙리스트 설정
  async setBlacklist(userId: string, isBlacklisted: boolean): Promise<void> {
    await this.db
      .prepare(`
        UPDATE users 
        SET is_blacklisted = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(isBlacklisted ? 1 : 0, userId)
      .run();
  }

  // 마케팅 동의 업데이트
  async updateMarketingAgreement(userId: string, agreed: boolean): Promise<void> {
    await this.db
      .prepare(`
        UPDATE users 
        SET marketing_agreed = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(agreed ? 1 : 0, userId)
      .run();
  }

  // 활성 사용자 수 조회
  async countActiveUsers(): Promise<number> {
    return this.count('is_blacklisted = 0');
  }

  // 관리자 목록 조회
  async findAdmins(): Promise<(User & { is_super_admin: number })[]> {
    const result = await this.db
      .prepare(`
        SELECT u.*, a.is_super_admin
        FROM users u
        INNER JOIN admins a ON u.id = a.user_id
        ORDER BY a.is_super_admin DESC, u.created_at DESC
      `)
      .all<User & { is_super_admin: number }>();
    
    return result.results;
  }

  // 사용자 검색
  async searchUsers(query: string, limit = 20): Promise<User[]> {
    const searchPattern = `%${query}%`;
    
    const result = await this.db
      .prepare(`
        SELECT * FROM users
        WHERE (email LIKE ? OR name LIKE ? OR nickname LIKE ? OR phone LIKE ?)
        AND is_blacklisted = 0
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .bind(searchPattern, searchPattern, searchPattern, searchPattern, limit)
      .all<User>();
    
    return result.results;
  }

  // 최근 가입 사용자
  async findRecentUsers(limit = 10): Promise<User[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all<User>();
    
    return result.results;
  }

  // 사용자 통계
  async getUserStats(): Promise<{
    total: number;
    active: number;
    blacklisted: number;
    admins: number;
    marketing_agreed: number;
  }> {
    const result = await this.rawFirst<{
      total: number;
      active: number;
      blacklisted: number;
      admins: number;
      marketing_agreed: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_blacklisted = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklisted,
        (SELECT COUNT(*) FROM admins) as admins,
        SUM(CASE WHEN marketing_agreed = 1 THEN 1 ELSE 0 END) as marketing_agreed
      FROM users
    `);

    return result || {
      total: 0,
      active: 0,
      blacklisted: 0,
      admins: 0,
      marketing_agreed: 0,
    };
  }
}