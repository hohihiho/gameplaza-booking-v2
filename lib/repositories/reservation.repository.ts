import { BaseRepository } from './base.repository'
import { v4 as uuidv4 } from 'uuid'

// Reservation 타입 정의 (D1 스키마와 일치)
export interface Reservation {
  id: string
  reservation_number: string
  user_id: string
  device_id: string
  date: string
  start_time: string
  end_time: string
  status: string
  credit_type: string
  player_count: number
  total_amount: number
  user_notes?: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

// ReservationWithDetails 타입 (조인 결과용)
export interface ReservationWithDetails extends Reservation {
  devices?: {
    device_number: string
    status: string
    device_types?: {
      name: string
      model_name?: string
      version_name?: string
      category_id: string
      device_categories?: {
        name: string
      }
    }
  }
  users?: {
    name: string
    email: string
    phone?: string
  }
}

export class ReservationRepository extends BaseRepository<Reservation> {
  constructor(db: D1Database) {
    super(db, 'reservations')
  }

  // 예약 번호 생성
  private generateReservationNumber(): string {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `R${year}${month}${day}${random}`
  }

  // 예약 생성
  async createReservation(data: {
    user_id: string
    device_id: string
    date: string
    start_hour: number
    end_hour: number
    credit_type: string
    player_count: number
    user_notes?: string
  }): Promise<Reservation> {
    const reservationId = uuidv4()
    const reservationNumber = this.generateReservationNumber()
    
    // 시간을 시:분 형식으로 변환
    const startTime = `${String(data.start_hour).padStart(2, '0')}:00`
    const endTime = `${String(data.end_hour).padStart(2, '0')}:00`
    
    const reservationData = {
      id: reservationId,
      reservation_number: reservationNumber,
      user_id: data.user_id,
      device_id: data.device_id,
      date: data.date,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      credit_type: data.credit_type,
      player_count: data.player_count,
      total_amount: 0,
      user_notes: data.user_notes || null,
      admin_notes: null,
    }

    return this.create(reservationData)
  }

  // 사용자별 예약 조회
  async findByUserId(userId: string, options?: {
    status?: string
    offset?: number
    limit?: number
  }): Promise<{ data: ReservationWithDetails[], count: number }> {
    let query = `
      SELECT r.*, 
             d.device_number, d.status as device_status,
             dt.name as device_type_name, dt.model_name, dt.version_name, dt.category_id,
             dc.name as category_name,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
    `
    const params: any[] = [userId]

    if (options?.status && options.status !== 'all') {
      query += ' AND r.status = ?'
      params.push(options.status)
    }

    query += ' ORDER BY r.date DESC, r.start_time DESC'

    if (options?.limit !== undefined) {
      query += ' LIMIT ?'
      params.push(options.limit)
      
      if (options?.offset !== undefined) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const data = await this.rawQuery(query, params)
    
    // 총 개수 조회 (필터 조건 포함)
    let countQuery = 'SELECT COUNT(*) as count FROM reservations WHERE user_id = ?'
    const countParams = [userId]
    
    if (options?.status && options.status !== 'all') {
      countQuery += ' AND status = ?'
      countParams.push(options.status)
    }
    
    const countResult = await this.rawFirst(countQuery, countParams)
    const count = (countResult as any)?.count || 0

    // 데이터 변환
    const transformedData = data.map((row: any) => ({
      ...row,
      devices: {
        device_number: row.device_number,
        status: row.device_status,
        device_types: {
          name: row.device_type_name,
          model_name: row.model_name,
          version_name: row.version_name,
          category_id: row.category_id,
          device_categories: {
            name: row.category_name
          }
        }
      },
      users: {
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone
      }
    }))

    return { data: transformedData, count }
  }

  // 날짜와 기기로 예약 조회
  async findByDateAndDevice(date: string, deviceId: string, statuses: string[]): Promise<Reservation[]> {
    const placeholders = statuses.map(() => '?').join(',')
    const query = `SELECT * FROM reservations WHERE device_id = ? AND date = ? AND status IN (${placeholders})`
    const params = [deviceId, date, ...statuses]
    
    return this.rawQuery(query, params)
  }

  // 활성 예약 조회 (사용자별)
  async findActiveByUserId(userId: string): Promise<{ data: Reservation[], count: number }> {
    const query = `SELECT * FROM reservations WHERE user_id = ? AND status IN ('pending', 'approved')`
    const data = await this.rawQuery(query, [userId])
    
    return { data, count: data.length }
  }

  // 날짜별 예약 수 조회
  async countByDate(date: string): Promise<number> {
    return this.count('date = ?', [date])
  }

  // 상세 정보와 함께 예약 생성
  async createWithDetails(reservation: Partial<Reservation>): Promise<ReservationWithDetails | null> {
    const created = await this.create(reservation)
    
    // 상세 정보 조회
    const query = `
      SELECT r.*, 
             d.device_number, d.status as device_status,
             dt.name as device_type_name, dt.category_id,
             dc.name as category_name
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      WHERE r.id = ?
    `
    
    const result = await this.rawFirst(query, [created.id])
    
    if (!result) return null
    
    return {
      ...result,
      devices: {
        device_number: (result as any).device_number,
        status: (result as any).device_status,
        device_types: {
          name: (result as any).device_type_name,
          category_id: (result as any).category_id,
          device_categories: {
            name: (result as any).category_name
          }
        }
      }
    } as ReservationWithDetails
  }

  // 상태 업데이트
  async updateStatus(id: string, status: string, adminNotes?: string): Promise<ReservationWithDetails | null> {
    const updateData: any = { status }
    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes
    }
    
    await this.update(id, updateData)
    
    // 상세 정보 조회
    const query = `
      SELECT r.*, 
             d.device_number, d.status as device_status,
             dt.name as device_type_name, dt.model_name, dt.version_name, dt.category_id,
             dc.name as category_name,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `
    
    const result = await this.rawFirst(query, [id])
    
    if (!result) return null
    
    return {
      ...result,
      devices: {
        device_number: (result as any).device_number,
        status: (result as any).device_status,
        device_types: {
          name: (result as any).device_type_name,
          model_name: (result as any).model_name,
          version_name: (result as any).version_name,
          category_id: (result as any).category_id,
          device_categories: {
            name: (result as any).category_name
          }
        }
      },
      users: {
        name: (result as any).user_name,
        email: (result as any).user_email,
        phone: (result as any).user_phone
      }
    } as ReservationWithDetails
  }

  // 기기의 다가오는 예약 조회
  async findUpcomingByDevice(deviceId: string, currentDate: string, currentTime: string): Promise<Reservation[]> {
    const query = `
      SELECT * FROM reservations 
      WHERE device_id = ? 
      AND status IN ('approved', 'checked_in')
      AND (
        date > ? OR 
        (date = ? AND start_time >= ?)
      )
      ORDER BY date ASC, start_time ASC
      LIMIT 10
    `
    
    return this.rawQuery(query, [deviceId, currentDate, currentDate, currentTime])
  }

  // 분석용 예약 조회
  async findForAnalytics(startDate: string, endDate: string): Promise<ReservationWithDetails[]> {
    const query = `
      SELECT r.*, 
             d.device_number,
             dt.name as device_type_name, dt.category_id,
             dc.name as category_name,
             u.name as user_name, u.email as user_email
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.date >= ? AND r.date <= ?
      AND r.status IN ('approved', 'checked_in', 'completed')
      ORDER BY r.date DESC
    `
    
    const data = await this.rawQuery(query, [startDate, endDate])
    
    return data.map((row: any) => ({
      ...row,
      devices: {
        device_number: row.device_number,
        device_types: {
          name: row.device_type_name,
          category_id: row.category_id,
          device_categories: {
            name: row.category_name
          }
        }
      },
      users: {
        name: row.user_name,
        email: row.user_email
      }
    }))
  }

  // 시간 충돌 체크
  async checkTimeConflict(deviceId: string, date: string, startHour: number, endHour: number, excludeReservationId?: string): Promise<boolean> {
    const startTime = `${String(startHour).padStart(2, '0')}:00`
    const endTime = `${String(endHour).padStart(2, '0')}:00`

    let query = `
      SELECT COUNT(*) as count
      FROM reservations
      WHERE device_id = ? 
        AND date = ?
        AND status IN ('pending', 'approved', 'checked_in')
        AND (
          (start_time < ? AND end_time > ?) OR
          (start_time < ? AND end_time > ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `
    
    const params = [
      deviceId, date,
      startTime, startTime,
      endTime, endTime,
      startTime, endTime
    ]

    if (excludeReservationId) {
      query += ' AND id != ?'
      params.push(excludeReservationId)
    }

    const result = await this.rawFirst(query, params)
    return (result as any)?.count > 0
  }

  // 예약 번호로 조회
  async findByReservationNumber(reservationNumber: string): Promise<Reservation | null> {
    return this.findOneByCondition('reservation_number = ?', [reservationNumber])
  }

  // BaseRepository의 헬퍼 메서드들
  private async findByCondition(condition: string, params: any[] = []): Promise<Reservation[]> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition}`)
        .bind(...params)
        .all()

      return result.results as Reservation[]
    } catch (error) {
      console.error(`Error fetching ${this.tableName} with condition:`, error)
      return []
    }
  }

  private async findOneByCondition(condition: string, params: any[] = []): Promise<Reservation | null> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition} LIMIT 1`)
        .bind(...params)
        .first()

      return result as Reservation | null
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