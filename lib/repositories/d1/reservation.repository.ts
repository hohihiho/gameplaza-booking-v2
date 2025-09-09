import { D1BaseRepository } from './base.repository';
import { v4 as uuidv4 } from 'uuid';

// Reservation 타입
export interface Reservation {
  id: string;
  user_id: string;
  device_id: string;
  date: string;
  start_time: string;
  end_time: string;
  units: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  amount: number;
  adjusted_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class ReservationRepository extends D1BaseRepository<Reservation> {
  constructor(db: D1Database) {
    super(db, 'reservations');
  }

  // 사용자별 예약 조회
  async findByUser(userId: string, limit = 20): Promise<Reservation[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM reservations
        WHERE user_id = ?
        ORDER BY date DESC, start_time DESC
        LIMIT ?
      `)
      .bind(userId, limit)
      .all<Reservation>();
    
    return result.results;
  }

  // 날짜별 예약 조회
  async findByDate(date: string): Promise<Reservation[]> {
    return this.findByCondition('date = ?', [date]);
  }

  // 기기별 날짜 예약 조회
  async findByDeviceAndDate(deviceId: string, date: string): Promise<Reservation[]> {
    return this.findByCondition('device_id = ? AND date = ?', [deviceId, date]);
  }

  // 상태별 예약 조회
  async findByStatus(status: string, limit = 100): Promise<Reservation[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM reservations
        WHERE status = ?
        ORDER BY date DESC, start_time DESC
        LIMIT ?
      `)
      .bind(status, limit)
      .all<Reservation>();
    
    return result.results;
  }

  // 예약 생성
  async createReservation(data: {
    user_id: string;
    device_id: string;
    date: string;
    start_time: string;
    end_time: string;
    units?: number;
    amount?: number;
    notes?: string;
  }): Promise<Reservation> {
    const reservationId = uuidv4();
    
    const reservationData = {
      id: reservationId,
      user_id: data.user_id,
      device_id: data.device_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      units: data.units || 1,
      status: 'pending',
      payment_status: 'pending',
      amount: data.amount || 0,
      notes: data.notes || null,
    };

    return this.create(reservationData);
  }

  // 예약 상태 업데이트
  async updateStatus(reservationId: string, status: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE reservations 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(status, reservationId)
      .run();
  }

  // 결제 상태 업데이트
  async updatePaymentStatus(
    reservationId: string, 
    paymentStatus: string, 
    paymentMethod?: string
  ): Promise<void> {
    await this.db
      .prepare(`
        UPDATE reservations 
        SET payment_status = ?, payment_method = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(paymentStatus, paymentMethod || null, reservationId)
      .run();
  }

  // 시간 충돌 확인
  async checkTimeConflict(
    deviceId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count FROM reservations
      WHERE device_id = ? 
      AND date = ?
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `;
    
    const params = [deviceId, date, startTime, startTime, endTime, endTime, startTime, endTime];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await this.rawFirst<{ count: number }>(query, params);
    return (result?.count || 0) > 0;
  }

  // 오늘의 예약 통계
  async getTodayStats(date: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    no_show: number;
  }> {
    const result = await this.rawFirst<{
      total: number;
      pending: number;
      confirmed: number;
      cancelled: number;
      completed: number;
      no_show: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show
      FROM reservations
      WHERE date = ?
    `, [date]);

    return result || {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      no_show: 0,
    };
  }

  // 사용자의 활성 예약 수
  async countActiveReservations(userId: string): Promise<number> {
    return this.count(
      "user_id = ? AND status IN ('pending', 'confirmed') AND date >= date('now')",
      [userId]
    );
  }

  // 예약 상세 정보 조회 (사용자, 기기 정보 포함)
  async findWithDetails(reservationId: string): Promise<any | null> {
    const result = await this.rawFirst(`
      SELECT 
        r.*,
        u.email as user_email,
        u.name as user_name,
        u.phone as user_phone,
        d.device_number,
        dt.name as device_type_name,
        dt.category as device_category
      FROM reservations r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      INNER JOIN device_types dt ON d.type_id = dt.id
      WHERE r.id = ?
    `, [reservationId]);

    return result;
  }

  // 기간별 예약 조회
  async findByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM reservations
        WHERE date >= ? AND date <= ?
        ORDER BY date, start_time
      `)
      .bind(startDate, endDate)
      .all<Reservation>();
    
    return result.results;
  }

  // 노쇼 처리
  async markAsNoShow(reservationId: string): Promise<void> {
    await this.updateStatus(reservationId, 'no_show');
  }

  // 취소 처리
  async cancel(reservationId: string, reason?: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE reservations 
        SET status = 'cancelled', 
            notes = CASE 
              WHEN notes IS NULL THEN ?
              ELSE notes || ' | 취소 사유: ' || ?
            END,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(reason || '사용자 취소', reason || '사용자 취소', reservationId)
      .run();
  }

  // 금액 조정
  async adjustAmount(reservationId: string, newAmount: number, reason?: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE reservations 
        SET adjusted_amount = ?, 
            notes = CASE 
              WHEN notes IS NULL THEN ?
              ELSE notes || ' | 금액 조정: ' || ?
            END,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(newAmount, reason || '관리자 조정', reason || '관리자 조정', reservationId)
      .run();
  }

  // 월별 예약 통계
  async getMonthlyStats(year: number, month: number): Promise<{
    total_reservations: number;
    total_revenue: number;
    total_users: number;
    avg_reservation_per_day: number;
  }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await this.rawFirst<{
      total_reservations: number;
      total_revenue: number;
      total_users: number;
      avg_reservation_per_day: number;
    }>(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(COALESCE(adjusted_amount, amount)) as total_revenue,
        COUNT(DISTINCT user_id) as total_users,
        CAST(COUNT(*) AS REAL) / 30 as avg_reservation_per_day
      FROM reservations
      WHERE date >= ? AND date <= ?
      AND status NOT IN ('cancelled', 'no_show')
    `, [startDate, endDate]);

    return result || {
      total_reservations: 0,
      total_revenue: 0,
      total_users: 0,
      avg_reservation_per_day: 0,
    };
  }
}