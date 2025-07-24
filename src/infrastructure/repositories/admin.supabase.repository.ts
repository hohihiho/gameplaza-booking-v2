import { Admin } from '@/src/domain/entities/admin'
import { AdminPermissions } from '@/src/domain/value-objects/admin-permissions'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { createClient } from '@supabase/supabase-js'

interface AdminRow {
  id: string
  user_id: string
  permissions: any // JSONB
  is_super_admin: boolean
  created_at: string
  updated_at: string
}

interface AdminWithUserRow extends AdminRow {
  users?: {
    id: string
    email: string
    name: string
    role: string
  }
}

/**
 * Supabase Admin 저장소 구현
 */
export class AdminSupabaseRepository implements AdminRepository {
  constructor(
    private readonly supabase: ReturnType<typeof createClient>
  ) {}

  /**
   * ID로 관리자 조회
   */
  async findById(id: string): Promise<Admin | null> {
    const { data, error } = await this.supabase
      .from('admins')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as AdminWithUserRow)
  }

  /**
   * 사용자 ID로 관리자 조회
   */
  async findByUserId(userId: string): Promise<Admin | null> {
    const { data, error } = await this.supabase
      .from('admins')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as AdminWithUserRow)
  }

  /**
   * 모든 관리자 조회
   */
  async findAll(): Promise<Admin[]> {
    const { data, error } = await this.supabase
      .from('admins')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row as AdminWithUserRow))
  }

  /**
   * 슈퍼관리자만 조회
   */
  async findSuperAdmins(): Promise<Admin[]> {
    const { data, error } = await this.supabase
      .from('admins')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .eq('is_super_admin', true)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row as AdminWithUserRow))
  }

  /**
   * 일반 관리자만 조회
   */
  async findRegularAdmins(): Promise<Admin[]> {
    const { data, error } = await this.supabase
      .from('admins')
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .eq('is_super_admin', false)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row as AdminWithUserRow))
  }

  /**
   * 관리자 생성
   */
  async create(admin: Admin): Promise<Admin> {
    const row = this.toRow(admin)

    const { data, error } = await this.supabase
      .from('admins')
      .insert(row)
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .single()

    if (error || !data) {
      throw new Error('Failed to create admin: ' + error?.message)
    }

    // users 테이블의 role도 업데이트
    await this.supabase
      .from('users')
      .update({ role: admin.isSuperAdmin ? 'superadmin' : 'admin' })
      .eq('id', admin.userId)

    return this.toDomain(data as AdminWithUserRow)
  }

  /**
   * 관리자 정보 업데이트
   */
  async update(admin: Admin): Promise<Admin> {
    const row = this.toRow(admin)

    const { data, error } = await this.supabase
      .from('admins')
      .update({
        permissions: row.permissions,
        is_super_admin: row.is_super_admin,
        updated_at: row.updated_at
      })
      .eq('id', admin.id)
      .select(`
        *,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .single()

    if (error || !data) {
      throw new Error('Failed to update admin: ' + error?.message)
    }

    // users 테이블의 role도 업데이트
    await this.supabase
      .from('users')
      .update({ role: admin.isSuperAdmin ? 'superadmin' : 'admin' })
      .eq('id', admin.userId)

    return this.toDomain(data as AdminWithUserRow)
  }

  /**
   * 관리자 삭제
   */
  async delete(id: string): Promise<void> {
    // 슈퍼관리자인지 먼저 확인
    const admin = await this.findById(id)
    if (admin?.isSuperAdmin) {
      throw new Error('Cannot delete super admin')
    }

    const { error } = await this.supabase
      .from('admins')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Failed to delete admin: ' + error.message)
    }

    // users 테이블의 role을 user로 되돌림
    if (admin) {
      await this.supabase
        .from('users')
        .update({ role: 'user' })
        .eq('id', admin.userId)
    }
  }

  /**
   * 관리자 존재 여부 확인
   */
  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('id', id)

    if (error) {
      return false
    }

    return (count ?? 0) > 0
  }

  /**
   * 사용자 ID로 관리자 존재 여부 확인
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      return false
    }

    return (count ?? 0) > 0
  }

  /**
   * 관리자 수 조회
   */
  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return 0
    }

    return count ?? 0
  }

  /**
   * 슈퍼관리자 수 조회
   */
  async countSuperAdmins(): Promise<number> {
    const { count, error } = await this.supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('is_super_admin', true)

    if (error) {
      return 0
    }

    return count ?? 0
  }

  /**
   * DB Row를 도메인 엔티티로 변환
   */
  private toDomain(row: AdminWithUserRow): Admin {
    return Admin.create({
      id: row.id,
      userId: row.user_id,
      permissions: row.permissions,
      isSuperAdmin: row.is_super_admin,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * 도메인 엔티티를 DB Row로 변환
   */
  private toRow(admin: Admin): AdminRow {
    return {
      id: admin.id,
      user_id: admin.userId,
      permissions: admin.permissions.toJSON(),
      is_super_admin: admin.isSuperAdmin,
      created_at: admin.createdAt.toISOString(),
      updated_at: admin.updatedAt.toISOString()
    }
  }
}