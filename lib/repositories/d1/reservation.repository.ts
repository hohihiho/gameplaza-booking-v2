import { D1BaseRepository } from './base.repository';
import { v4 as uuidv4 } from 'uuid';

// Reservation 타입 정의
export interface Reservation {
  id: string;
  reservation_number: string;
  user_id: string;
  device_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  credit_type: string;
  player_count: number;
  total_amount: number;
  user_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// User 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  profile_image?: string;
  marketing_consent: number;
  marketing_agreed: number;
  push_notifications_enabled: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export class ReservationRepository extends D1BaseRepository<Reservation> {
  constructor(db: D1Database) {
    super(db, 'reservations');
  }

  // 예약 번호 생성
  private generateReservationNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `R${year}${month}${day}${random}`;
  }

  // 예약 생성
  async createReservation(data: {
    user_id: string;
    device_id: string;
    date: string;
    start_hour: number;
    end_hour: number;
    credit_type: string;
    player_count: number;
    user_notes?: string;
  }): Promise<Reservation> {
    const reservationId = uuidv4();
    const reservationNumber = this.generateReservationNumber();
    
    // 시간을 시:분 형식으로 변환
    const startTime = `${String(data.start_hour).padStart(2, '0')}:00`;
    const endTime = `${String(data.end_hour).padStart(2, '0')}:00`;
    
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
    };

    return this.create(reservationData);
  }

  // 사용자별 예약 조회
  async findByUserId(userId: string, options?: {
    status?: string;
    date?: string;
    device_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<Reservation[]> {
    let query = `
      SELECT r.*, 
             d.device_number, d.type_id,
             dt.name as device_type_name, dt.description as device_type_description
      FROM reservations r
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN device_types dt ON d.type_id = dt.id
      WHERE r.user_id = ?
    `;
    const params: any[] = [userId];

    if (options?.status && options.status !== 'all') {
      query += ' AND r.status = ?';
      params.push(options.status);
    }

    if (options?.date) {
      query += ' AND r.date = ?';
      params.push(options.date);
    }

    if (options?.device_id) {
      query += ' AND r.device_id = ?';
      params.push(options.device_id);
    }

    query += ' ORDER BY r.created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return this.rawQuery(query, params);
  }

  // 날짜별 예약 조회
  async findByDate(date: string): Promise<Reservation[]> {
    return this.findByCondition('date = ?', [date]);
  }

  // 기기별 예약 조회
  async findByDeviceId(deviceId: string, date?: string): Promise<Reservation[]> {
    if (date) {
      return this.findByCondition('device_id = ? AND date = ?', [deviceId, date]);
    }
    return this.findByCondition('device_id = ?', [deviceId]);
  }

  // 상태별 예약 조회
  async findByStatus(status: string): Promise<Reservation[]> {
    return this.findByCondition('status = ?', [status]);
  }

  // 예약 상태 업데이트
  async updateStatus(reservationId: string, status: string, adminNotes?: string): Promise<void> {
    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }
    
    await this.update(reservationId, updateData);
  }

  // 시간 충돌 체크
  async checkTimeConflict(deviceId: string, date: string, startHour: number, endHour: number, excludeReservationId?: string): Promise<boolean> {
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;

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
    `;
    
    const params = [
      deviceId, date,
      startTime, startTime,
      endTime, endTime,
      startTime, endTime
    ];

    if (excludeReservationId) {
      query += ' AND id != ?';
      params.push(excludeReservationId);
    }

    const result = await this.rawFirst(query, params);
    return (result as any)?.count > 0;
  }

  // 예약 통계
  async getReservationStats(userId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count,
        SUM(total_amount) as total_amount
      FROM reservations
    `;
    
    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    return this.rawFirst(query, params);
  }

  // 사용자 예약 수 제한 체크
  async getUserReservationCount(userId: string, date: string, status?: string[]): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM reservations WHERE user_id = ? AND date = ?';
    const params = [userId, date];

    if (status && status.length > 0) {
      const placeholders = status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...status);
    }

    const result = await this.rawFirst(query, params);
    return (result as any)?.count || 0;
  }

  // 예약 번호로 조회
  async findByReservationNumber(reservationNumber: string): Promise<Reservation | null> {
    return this.findOneByCondition('reservation_number = ?', [reservationNumber]);
  }

  // 기간별 예약 조회
  async findByDateRange(startDate: string, endDate: string, options?: {
    userId?: string;
    deviceId?: string;
    status?: string;
  }): Promise<Reservation[]> {
    let query = 'SELECT * FROM reservations WHERE date >= ? AND date <= ?';
    const params = [startDate, endDate];

    if (options?.userId) {
      query += ' AND user_id = ?';
      params.push(options.userId);
    }

    if (options?.deviceId) {
      query += ' AND device_id = ?';
      params.push(options.deviceId);
    }

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY date, start_time';

    return this.rawQuery(query, params);
  }

  // 예약 사용자 수 조회 (중복 제거)
  async getUniqueUserCount(date?: string): Promise<number> {
    let query = 'SELECT COUNT(DISTINCT user_id) as count FROM reservations';
    const params: any[] = [];

    if (date) {
      query += ' WHERE date = ?';
      params.push(date);
    }

    const result = await this.rawFirst(query, params);
    return (result as any)?.count || 0;
  }
}

export class UserRepository extends D1BaseRepository<User> {
  constructor(db: D1Database) {
    super(db, 'users');
  }

  // 이메일로 사용자 조회
  async findByEmail(email: string): Promise<User | null> {
    return this.findOneByCondition('email = ?', [email]);
  }

  // 사용자 역할 업데이트
  async updateRole(userId: string, role: string): Promise<void> {
    await this.update(userId, { role });
  }

  // 마케팅 동의 업데이트
  async updateMarketingConsent(userId: string, consent: boolean, agreed: boolean): Promise<void> {
    await this.update(userId, {
      marketing_consent: consent ? 1 : 0,
      marketing_agreed: agreed ? 1 : 0
    });
  }

  // 푸시 알림 설정 업데이트
  async updatePushNotifications(userId: string, enabled: boolean): Promise<void> {
    await this.update(userId, { push_notifications_enabled: enabled ? 1 : 0 });
  }

  // 마지막 로그인 시간 업데이트
  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, { 
      last_login_at: new Date().toISOString() 
    });
  }

  // 활성 사용자 조회
  async findActiveUsers(limit?: number): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE last_login_at IS NOT NULL ORDER BY last_login_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      return this.rawQuery(query, [limit]);
    }

    return this.rawQuery(query);
  }

  // 사용자 통계
  async getUserStats(): Promise<any> {
    const result = await this.rawFirst(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN marketing_consent = 1 THEN 1 ELSE 0 END) as marketing_consent_count,
        SUM(CASE WHEN push_notifications_enabled = 1 THEN 1 ELSE 0 END) as push_enabled_count
      FROM users
    `);

    return result;
  }
}