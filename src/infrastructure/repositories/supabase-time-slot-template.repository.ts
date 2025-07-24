import { TimeSlotTemplate, TimeSlotType, TimeSlotTemplateProps } from '@/src/domain/entities/time-slot-template'
import { TimeSlotTemplateRepository, TimeSlotTemplateFilters } from '@/src/domain/repositories/time-slot-template-repository.interface'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { SupabaseClient } from '@supabase/supabase-js'

interface TimeSlotTemplateRow {
  id: string
  name: string
  description: string | null
  type: 'early' | 'overnight'
  start_hour: number
  end_hour: number
  credit_options: any // JSONB
  enable_2p: boolean
  price_2p_extra: number | null
  is_youth_time: boolean
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export class SupabaseTimeSlotTemplateRepository implements TimeSlotTemplateRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<TimeSlotTemplate | null> {
    const { data, error } = await this.supabase
      .from('time_slot_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`템플릿 조회 실패: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async findAll(filters?: TimeSlotTemplateFilters): Promise<TimeSlotTemplate[]> {
    let query = this.supabase
      .from('time_slot_templates')
      .select('*')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.isYouthTime !== undefined) {
      query = query.eq('is_youth_time', filters.isYouthTime)
    }

    const { data, error } = await query.order('priority', { ascending: false })

    if (error) {
      throw new Error(`템플릿 목록 조회 실패: ${error.message}`)
    }

    return data.map(row => this.toDomain(row))
  }

  async save(template: TimeSlotTemplate): Promise<TimeSlotTemplate> {
    const row = this.toRow(template)

    const { data, error } = await this.supabase
      .from('time_slot_templates')
      .upsert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`템플릿 저장 실패: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async saveMany(templates: TimeSlotTemplate[]): Promise<TimeSlotTemplate[]> {
    const rows = templates.map(template => this.toRow(template))

    const { data, error } = await this.supabase
      .from('time_slot_templates')
      .upsert(rows)
      .select()

    if (error) {
      throw new Error(`템플릿 일괄 저장 실패: ${error.message}`)
    }

    return data.map(row => this.toDomain(row))
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('time_slot_templates')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`템플릿 삭제 실패: ${error.message}`)
    }
  }

  async findByName(name: string): Promise<TimeSlotTemplate | null> {
    const { data, error } = await this.supabase
      .from('time_slot_templates')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`템플릿 조회 실패: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async findConflicting(
    startHour: number,
    endHour: number,
    type: TimeSlotType,
    excludeId?: string
  ): Promise<TimeSlotTemplate[]> {
    let query = this.supabase
      .from('time_slot_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .or(`and(start_hour.lt.${endHour},end_hour.gt.${startHour})`)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`충돌 템플릿 조회 실패: ${error.message}`)
    }

    return data.map(row => this.toDomain(row))
  }

  async findByPriority(type?: TimeSlotType): Promise<TimeSlotTemplate[]> {
    let query = this.supabase
      .from('time_slot_templates')
      .select('*')
      .eq('is_active', true)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('priority', { ascending: false })

    if (error) {
      throw new Error(`템플릿 우선순위 조회 실패: ${error.message}`)
    }

    return data.map(row => this.toDomain(row))
  }

  private toDomain(row: TimeSlotTemplateRow): TimeSlotTemplate {
    const props: TimeSlotTemplateProps = {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      type: row.type,
      timeSlot: TimeSlot.create(row.start_hour, row.end_hour),
      creditOptions: row.credit_options,
      enable2P: row.enable_2p,
      price2PExtra: row.price_2p_extra || undefined,
      isYouthTime: row.is_youth_time,
      priority: row.priority,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    return TimeSlotTemplate.create(props)
  }

  private toRow(template: TimeSlotTemplate): Omit<TimeSlotTemplateRow, 'created_at' | 'updated_at'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: template.id,
      name: template.name,
      description: template.description || null,
      type: template.type,
      start_hour: template.timeSlot.startHour,
      end_hour: template.timeSlot.endHour,
      credit_options: template.creditOptions,
      enable_2p: template.enable2P,
      price_2p_extra: template.price2PExtra || null,
      is_youth_time: template.isYouthTime,
      priority: template.priority,
      is_active: template.isActive,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString()
    }
  }
}