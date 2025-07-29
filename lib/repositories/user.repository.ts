import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { BaseRepository } from './base.repository'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

export interface UserWithAdmin extends User {
  admins?: {
    id: string
    user_id: string
    created_at: string
  }
}

export class UserRepository extends BaseRepository<User> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'users')
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }

    return data as User
  }

  async findWithAdminStatus(id: string): Promise<UserWithAdmin | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        admins(
          id,
          user_id,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user with admin status:', error)
      return null
    }

    return data as UserWithAdmin
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (error) {
      return false
    }

    return !!data
  }

  async createIfNotExists(user: UserInsert): Promise<User> {
    // 먼저 사용자가 존재하는지 확인
    const existing = await this.findById(user.id!)
    if (existing) {
      return existing
    }

    // 존재하지 않으면 생성
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(user)
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      throw error
    }

    return data as User
  }

  async updateLastLogin(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating last login:', error)
    }
  }

  async getActiveUsersCount(since: Date): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('last_login', since.toISOString())

    if (error) {
      console.error('Error counting active users:', error)
      throw error
    }

    return count || 0
  }

  async findRecentUsers(limit: number = 10): Promise<User[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent users:', error)
      throw error
    }

    return data as User[]
  }

  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(50)

    if (error) {
      console.error('Error searching users:', error)
      throw error
    }

    return data as User[]
  }

  async getUserStats(): Promise<{
    total: number
    active: number
    newThisMonth: number
  }> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 전체 사용자 수
    const { count: totalCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })

    // 활성 사용자 수 (최근 1달)
    const { count: activeCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('last_login', oneMonthAgo.toISOString())

    // 이번 달 신규 사용자
    const { count: newCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      newThisMonth: newCount || 0
    }
  }
}