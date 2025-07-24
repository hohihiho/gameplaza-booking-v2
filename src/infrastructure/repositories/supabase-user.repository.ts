import { SupabaseClient } from '@supabase/supabase-js'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { User } from '../../domain/entities/user'

interface UserRecord {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

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

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async save(user: User): Promise<User> {
    const record = this.toRecord(user)
    
    const { data, error } = await this.supabase
      .from('users')
      .insert(record)
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
        full_name: record.full_name,
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

  private toDomain(record: UserRecord): User {
    return User.create({
      id: record.id,
      email: record.email,
      fullName: record.full_name,
      phone: record.phone,
      role: record.role,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    })
  }

  private toRecord(user: User): UserRecord {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      phone: user.phone,
      role: user.role,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    }
  }
}