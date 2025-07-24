import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { User } from '../../domain/entities/user'
import { Email } from '../../domain/value-objects/email'
import { PhoneNumber } from '../../domain/value-objects/phone-number'

type UserRow = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

/**
 * 실제 Supabase 데이터베이스와 연결되는 사용자 리포지토리
 */
export class SupabaseUserRepositoryV2 implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByEmail(email: Email): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email.value)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByPhone(phone: PhoneNumber): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('phone', phone.value)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.role === 'admin'
  }

  async save(user: User): Promise<User> {
    const record = this.toRecord(user)
    
    const { data, error } = await this.supabase
      .from('users')
      .upsert(record)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(user: User): Promise<User> {
    const record = this.toRecord(user)
    
    const { data, error } = await this.supabase
      .from('users')
      .update({
        name: record.name,
        phone: record.phone,
        updated_at: record.updated_at
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  private toDomain(record: UserRow): User {
    return User.create({
      id: record.id,
      email: Email.create(record.email),
      name: record.name,
      phone: record.phone ? PhoneNumber.create(record.phone) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    })
  }

  private toRecord(user: User): UserInsert {
    return {
      id: user.id,
      email: user.email.value,
      name: user.name,
      phone: user.phone?.value || null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      role: 'user' // 기본값
    }
  }
}