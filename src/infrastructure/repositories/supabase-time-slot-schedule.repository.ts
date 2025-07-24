import { TimeSlotSchedule, TimeSlotScheduleProps } from '@/src/domain/entities/time-slot-schedule'
import { TimeSlotTemplate } from '@/src/domain/entities/time-slot-template'
import { TimeSlotScheduleRepository, TimeSlotScheduleFilters } from '@/src/domain/repositories/time-slot-schedule-repository.interface'
import { TimeSlotTemplateRepository } from '@/src/domain/repositories/time-slot-template-repository.interface'
import { SupabaseClient } from '@supabase/supabase-js'

interface TimeSlotScheduleRow {
  id: string
  date: string
  device_type_id: string
  template_ids: string[]
  created_at: string
  updated_at: string
  device_types?: {
    name: string
  }
}

export class SupabaseTimeSlotScheduleRepository implements TimeSlotScheduleRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly templateRepository?: TimeSlotTemplateRepository
  ) {}

  async findById(id: string): Promise<TimeSlotSchedule | null> {
    const { data, error } = await this.supabase
      .from('time_slot_schedules')
      .select(`
        *,
        device_types (name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`스케줄 조회 실패: ${error.message}`)
    }

    return await this.toDomain(data)
  }

  async findByDateAndDeviceType(date: Date, deviceTypeId: string): Promise<TimeSlotSchedule | null> {
    const dateString = this.formatDate(date)

    const { data, error } = await this.supabase
      .from('time_slot_schedules')
      .select(`
        *,
        device_types (name)
      `)
      .eq('date', dateString)
      .eq('device_type_id', deviceTypeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`스케줄 조회 실패: ${error.message}`)
    }

    return await this.toDomain(data)
  }

  async findByDateRange(filters: TimeSlotScheduleFilters): Promise<TimeSlotSchedule[]> {
    let query = this.supabase
      .from('time_slot_schedules')
      .select(`
        *,
        device_types (name)
      `)

    if (filters.startDate) {
      query = query.gte('date', this.formatDate(filters.startDate))
    }
    if (filters.endDate) {
      query = query.lte('date', this.formatDate(filters.endDate))
    }
    if (filters.deviceTypeId) {
      query = query.eq('device_type_id', filters.deviceTypeId)
    }
    if (filters.deviceTypeIds && filters.deviceTypeIds.length > 0) {
      query = query.in('device_type_id', filters.deviceTypeIds)
    }

    const { data, error } = await query.order('date', { ascending: true })

    if (error) {
      throw new Error(`스케줄 목록 조회 실패: ${error.message}`)
    }

    return await Promise.all(data.map(row => this.toDomain(row)))
  }

  async save(schedule: TimeSlotSchedule): Promise<TimeSlotSchedule> {
    const row = this.toRow(schedule)

    const { data, error } = await this.supabase
      .from('time_slot_schedules')
      .upsert(row)
      .select(`
        *,
        device_types (name)
      `)
      .single()

    if (error) {
      throw new Error(`스케줄 저장 실패: ${error.message}`)
    }

    return await this.toDomain(data)
  }

  async saveMany(schedules: TimeSlotSchedule[]): Promise<TimeSlotSchedule[]> {
    const rows = schedules.map(schedule => this.toRow(schedule))

    const { data, error } = await this.supabase
      .from('time_slot_schedules')
      .upsert(rows)
      .select(`
        *,
        device_types (name)
      `)

    if (error) {
      throw new Error(`스케줄 일괄 저장 실패: ${error.message}`)
    }

    return await Promise.all(data.map(row => this.toDomain(row)))
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('time_slot_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`스케줄 삭제 실패: ${error.message}`)
    }
  }

  async deleteByDateAndDeviceType(date: Date, deviceTypeId: string): Promise<void> {
    const dateString = this.formatDate(date)

    const { error } = await this.supabase
      .from('time_slot_schedules')
      .delete()
      .eq('date', dateString)
      .eq('device_type_id', deviceTypeId)

    if (error) {
      throw new Error(`스케줄 삭제 실패: ${error.message}`)
    }
  }

  async deleteByDateRange(startDate: Date, endDate: Date, deviceTypeId?: string): Promise<number> {
    let query = this.supabase
      .from('time_slot_schedules')
      .delete()
      .gte('date', this.formatDate(startDate))
      .lte('date', this.formatDate(endDate))

    if (deviceTypeId) {
      query = query.eq('device_type_id', deviceTypeId)
    }

    const { data, error } = await query.select('id')

    if (error) {
      throw new Error(`스케줄 범위 삭제 실패: ${error.message}`)
    }

    return data?.length || 0
  }

  async findByTemplateId(templateId: string): Promise<TimeSlotSchedule[]> {
    const { data, error } = await this.supabase
      .from('time_slot_schedules')
      .select(`
        *,
        device_types (name)
      `)
      .contains('template_ids', [templateId])

    if (error) {
      throw new Error(`템플릿별 스케줄 조회 실패: ${error.message}`)
    }

    return await Promise.all(data.map(row => this.toDomain(row)))
  }

  async findFutureSchedules(deviceTypeId?: string): Promise<TimeSlotSchedule[]> {
    const today = this.formatDate(new Date())
    
    let query = this.supabase
      .from('time_slot_schedules')
      .select(`
        *,
        device_types (name)
      `)
      .gte('date', today)

    if (deviceTypeId) {
      query = query.eq('device_type_id', deviceTypeId)
    }

    const { data, error } = await query.order('date', { ascending: true })

    if (error) {
      throw new Error(`미래 스케줄 조회 실패: ${error.message}`)
    }

    return await Promise.all(data.map(row => this.toDomain(row)))
  }

  private async toDomain(row: TimeSlotScheduleRow): Promise<TimeSlotSchedule> {
    // 템플릿들 조회
    let templates: TimeSlotTemplate[] = []
    
    if (this.templateRepository) {
      const templatePromises = row.template_ids.map(id => 
        this.templateRepository!.findById(id)
      )
      const templateResults = await Promise.all(templatePromises)
      templates = templateResults.filter((t): t is TimeSlotTemplate => t !== null)
    } else {
      // 템플릿 레포지토리가 없는 경우 직접 조회
      const { data: templateData, error } = await this.supabase
        .from('time_slot_templates')
        .select('*')
        .in('id', row.template_ids)

      if (!error && templateData) {
        // 임시로 빈 템플릿 생성 (실제로는 TimeSlotTemplate.create를 사용해야 함)
        // 이 부분은 나중에 개선 필요
        templates = templateData as any[]
      }
    }

    const props: TimeSlotScheduleProps = {
      id: row.id,
      date: new Date(row.date),
      deviceTypeId: row.device_type_id,
      deviceTypeName: row.device_types?.name,
      templates,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    return TimeSlotSchedule.create(props)
  }

  private toRow(schedule: TimeSlotSchedule): Omit<TimeSlotScheduleRow, 'created_at' | 'updated_at' | 'device_types'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: schedule.id,
      date: schedule.dateString,
      device_type_id: schedule.deviceTypeId,
      template_ids: schedule.templates.map(t => t.id),
      created_at: schedule.createdAt.toISOString(),
      updated_at: schedule.updatedAt.toISOString()
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}