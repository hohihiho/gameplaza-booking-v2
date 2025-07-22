import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient<Database>
  protected tableName: string

  constructor(supabase: SupabaseClient<Database>, tableName: string) {
    this.supabase = supabase
    this.tableName = tableName
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error)
      return null
    }

    return data as T
  }

  async findAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')

    if (error) {
      console.error(`Error fetching all ${this.tableName}:`, error)
      return []
    }

    return data as T[]
  }

  async create(entity: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(entity)
      .select()
      .single()

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }

    return data as T
  }

  async update(id: string, entity: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(entity)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw error
    }

    return data as T
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      return false
    }

    return true
  }
}