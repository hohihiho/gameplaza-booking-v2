import { BaseRepository } from './base.repository'

// User 타입 정의 (D1 스키마와 일치)
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  profile_image?: string
  marketing_consent: number
  marketing_agreed: number
  push_notifications_enabled: number
  last_login_at?: string
  created_at: string
  updated_at: string
}

// UserWithAdmin 타입 (조인 결과용)
export interface UserWithAdmin extends User {
  admins?: {
    id: string
    user_id: string
    created_at: string
  }
}

export class UserRepository extends BaseRepository<User> {
  constructor(db: D1Database) {
    super(db, 'users')
  }

  // 이메일로 사용자 조회
  async findByEmail(email: string): Promise<User | null> {
    return this.findOneByCondition('email = ?', [email])
  }

  // 관리자 상태와 함께 사용자 조회
  async findWithAdminStatus(id: string): Promise<UserWithAdmin | null> {
    const query = `
      SELECT u.*, 
             a.id as admin_id, a.user_id as admin_user_id, a.created_at as admin_created_at
      FROM users u
      LEFT JOIN admins a ON u.id = a.user_id
      WHERE u.id = ?
    `
    
    const result = await this.rawFirst(query, [id])
    
    if (!result) return null
    
    return {
      ...result,
      admins: result.admin_id ? {
        id: result.admin_id,
        user_id: result.admin_user_id,
        created_at: result.admin_created_at
      } : undefined
    } as UserWithAdmin
  }

  // 관리자 여부 확인
  async isAdmin(userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT user_id FROM admins WHERE user_id = ? LIMIT 1')
      .bind(userId)
      .first()
    
    return !!result
  }

  // 사용자 생성 (존재하지 않는 경우에만)
  async createIfNotExists(user: Partial<User>): Promise<User> {
    // 먼저 사용자가 존재하는지 확인
    const existing = await this.findById(user.id!)
    if (existing) {
      return existing
    }

    // 존재하지 않으면 생성
    return this.create(user)
  }

  // 마지막 로그인 시간 업데이트
  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { 
      last_login_at: new Date().toISOString() 
    })
  }

  // 활성 사용자 수 조회
  async getActiveUsersCount(since: Date): Promise<number> {
    return this.count('last_login_at >= ?', [since.toISOString()])
  }

  // 최근 사용자 조회
  async findRecentUsers(limit: number = 10): Promise<User[]> {
    const query = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT ?
    `
    
    return this.rawQuery(query, [limit])
  }

  // 사용자 검색
  async searchUsers(query: string): Promise<User[]> {
    const searchQuery = `
      SELECT * FROM users 
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY name ASC 
      LIMIT 50
    `
    
    const searchTerm = `%${query}%`
    return this.rawQuery(searchQuery, [searchTerm, searchTerm, searchTerm])
  }

  // 사용자 통계
  async getUserStats(): Promise<{
    total: number
    active: number
    newThisMonth: number
  }> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 전체 사용자 수
    const totalCount = await this.count()

    // 활성 사용자 수 (최근 1달)
    const activeCount = await this.count('last_login_at >= ?', [oneMonthAgo.toISOString()])

    // 이번 달 신규 사용자
    const newCount = await this.count('created_at >= ?', [startOfMonth.toISOString()])

    return {
      total: totalCount,
      active: activeCount,
      newThisMonth: newCount
    }
  }

  // 사용자 역할 업데이트
  async updateRole(userId: string, role: string): Promise<void> {
    await this.update(userId, { role })
  }

  // 마케팅 동의 업데이트
  async updateMarketingConsent(userId: string, consent: boolean, agreed: boolean): Promise<void> {
    await this.update(userId, {
      marketing_consent: consent ? 1 : 0,
      marketing_agreed: agreed ? 1 : 0
    })
  }

  // 푸시 알림 설정 업데이트
  async updatePushNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.update(userId, { push_notifications_enabled: enabled ? 1 : 0 })
  }

  // 활성 사용자 조회
  async findActiveUsers(limit?: number): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE last_login_at IS NOT NULL ORDER BY last_login_at DESC'
    
    if (limit) {
      query += ' LIMIT ?'
      return this.rawQuery(query, [limit])
    }

    return this.rawQuery(query)
  }

  // 관리자 사용자 조회
  async findAdminUsers(): Promise<User[]> {
    const query = `
      SELECT u.* FROM users u
      INNER JOIN admins a ON u.id = a.user_id
      ORDER BY u.name ASC
    `
    
    return this.rawQuery(query)
  }

  // 사용자 이름으로 조회
  async findByName(name: string): Promise<User[]> {
    return this.findByCondition('name LIKE ?', [`%${name}%`])
  }

  // 전화번호로 조회
  async findByPhone(phone: string): Promise<User | null> {
    return this.findOneByCondition('phone = ?', [phone])
  }

  // BaseRepository의 헬퍼 메서드들
  private async findByCondition(condition: string, params: any[] = []): Promise<User[]> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition}`)
        .bind(...params)
        .all()

      return result.results as User[]
    } catch (error) {
      console.error(`Error fetching ${this.tableName} with condition:`, error)
      return []
    }
  }

  private async findOneByCondition(condition: string, params: any[] = []): Promise<User | null> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition} LIMIT 1`)
        .bind(...params)
        .first()

      return result as User | null
    } catch (error) {
      console.error(`Error fetching ${this.tableName} with condition:`, error)
      return null
    }
  }

  private async count(condition?: string, params: any[] = []): Promise<number> {
    try {
      const query = condition 
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${condition}`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .first()

      return (result as any)?.count || 0
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error)
      return 0
    }
  }

  private async rawQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all()

      return result.results
    } catch (error) {
      console.error('Error executing raw query:', error)
      return []
    }
  }

  private async rawFirst(query: string, params: any[] = []): Promise<any | null> {
    try {
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .first()

      return result
    } catch (error) {
      console.error('Error executing raw query:', error)
      return null
    }
  }
}