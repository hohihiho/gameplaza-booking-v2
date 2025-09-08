import Database from 'better-sqlite3';

// 개발 환경에서는 로컬 SQLite 파일 사용
let db: Database.Database;

if (process.env.NODE_ENV === 'development') {
  db = new Database(process.env.DATABASE_URL || './dev.db');
} else {
  // 프로덕션에서는 Cloudflare D1 사용
  // 추후 Cloudflare D1 바인딩으로 교체 예정
  db = new Database('./production.db');
}

// 개발 시 스키마 자동 실행
if (process.env.NODE_ENV === 'development') {
  // 스키마 마이그레이션 실행
  const fs = require('fs');
  const path = require('path');
  
  try {
    const schemaPath = path.join(process.cwd(), 'db/migrations/001_init.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('Database schema initialized');
    }
    
    // 시드 데이터 실행
    const seedDeviceTypesPath = path.join(process.cwd(), 'db/seed/001_device_types.sql');
    if (fs.existsSync(seedDeviceTypesPath)) {
      const seedDeviceTypes = fs.readFileSync(seedDeviceTypesPath, 'utf8');
      db.exec(seedDeviceTypes);
      console.log('Device types seed data loaded');
    }
    
    const seedGuidePath = path.join(process.cwd(), 'db/seed/002_guide_content.sql');
    if (fs.existsSync(seedGuidePath)) {
      const seedGuide = fs.readFileSync(seedGuidePath, 'utf8');
      db.exec(seedGuide);
      console.log('Guide content seed data loaded');
    }
    
    // Push notifications migration
    const pushNotificationsMigrationPath = path.join(process.cwd(), 'db/migrations/002_push_notifications.sql');
    if (fs.existsSync(pushNotificationsMigrationPath)) {
      const pushNotificationsMigration = fs.readFileSync(pushNotificationsMigrationPath, 'utf8');
      db.exec(pushNotificationsMigration);
      console.log('Push notifications migration completed');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export { db };

// 헬퍼 함수들
export const query = {
  // Users
  getUserByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as any;
  },
  
  getUserById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as any;
  },
  
  createUser: (userData: any) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, nickname, image, role) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(userData.id, userData.email, userData.name, userData.nickname, userData.image, userData.role || 'user');
  },
  
  // Sessions
  createSession: (sessionData: any) => {
    const stmt = db.prepare(`
      INSERT INTO session (id, user_id, expires_at, token, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      sessionData.id,
      sessionData.user_id,
      sessionData.expires_at,
      sessionData.token,
      sessionData.ip_address,
      sessionData.user_agent
    );
  },
  
  getSessionByToken: (token: string) => {
    const stmt = db.prepare('SELECT * FROM session WHERE token = ?');
    return stmt.get(token) as any;
  },
  
  deleteSession: (id: string) => {
    const stmt = db.prepare('DELETE FROM session WHERE id = ?');
    return stmt.run(id);
  },
  
  // Device types
  getDeviceTypes: () => {
    const stmt = db.prepare('SELECT * FROM device_types WHERE is_active = 1 ORDER BY sort_order');
    return stmt.all() as any[];
  },
  
  getDeviceTypeById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM device_types WHERE id = ? AND is_active = 1');
    return stmt.get(id) as any;
  },
  
  // Devices
  getDevicesByType: (deviceTypeId: string) => {
    const stmt = db.prepare('SELECT * FROM devices WHERE device_type_id = ? ORDER BY position');
    return stmt.all(deviceTypeId) as any[];
  },
  
  getDeviceCount: () => {
    const stmt = db.prepare(`
      SELECT dt.name, dt.display_name, COUNT(d.id) as total,
             SUM(CASE WHEN d.status = 'available' THEN 1 ELSE 0 END) as available,
             SUM(CASE WHEN d.status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM device_types dt
      LEFT JOIN devices d ON dt.id = d.device_type_id
      WHERE dt.is_active = 1
      GROUP BY dt.id, dt.name, dt.display_name
      ORDER BY dt.sort_order
    `);
    return stmt.all() as any[];
  },

  // Reservations
  getReservations: (userId?: string) => {
    let sql = `
      SELECT r.*, 
             dt.display_name as device_type_name,
             d.name as device_name,
             u.name as user_name, u.nickname as user_nickname
      FROM reservations r
      JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN users u ON r.user_id = u.id
    `;
    
    if (userId) {
      sql += ' WHERE r.user_id = ? ORDER BY r.start_time DESC';
      const stmt = db.prepare(sql);
      return stmt.all(userId) as any[];
    } else {
      sql += ' ORDER BY r.start_time DESC';
      const stmt = db.prepare(sql);
      return stmt.all() as any[];
    }
  },

  getReservationById: (id: string) => {
    const stmt = db.prepare(`
      SELECT r.*, 
             dt.display_name as device_type_name,
             d.name as device_name,
             u.name as user_name, u.nickname as user_nickname, u.email as user_email
      FROM reservations r
      JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `);
    return stmt.get(id) as any;
  },

  createReservation: (reservationData: any) => {
    const stmt = db.prepare(`
      INSERT INTO reservations (
        id, user_id, device_type_id, device_id, start_time, end_time, 
        duration_hours, total_price, credit_type, credit_amount, 
        is_2p, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      reservationData.id || db.prepare('SELECT lower(hex(randomblob(16))) as id').get().id,
      reservationData.user_id,
      reservationData.device_type_id,
      reservationData.device_id,
      reservationData.start_time,
      reservationData.end_time,
      reservationData.duration_hours,
      reservationData.total_price,
      reservationData.credit_type,
      reservationData.credit_amount,
      reservationData.is_2p || 0,
      reservationData.status || 'pending',
      reservationData.notes
    );
  },

  updateReservationStatus: (id: string, status: string, additionalData?: any) => {
    let sql = 'UPDATE reservations SET status = ?';
    const params: any[] = [status];

    if (additionalData?.check_in_time) {
      sql += ', check_in_time = ?';
      params.push(additionalData.check_in_time);
    }
    
    if (additionalData?.check_out_time) {
      sql += ', check_out_time = ?';
      params.push(additionalData.check_out_time);
    }

    if (additionalData?.device_id) {
      sql += ', device_id = ?';
      params.push(additionalData.device_id);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  cancelReservation: (id: string, reason?: string) => {
    const stmt = db.prepare(`
      UPDATE reservations 
      SET status = 'cancelled', notes = COALESCE(notes || ' | ', '') || ? 
      WHERE id = ?
    `);
    return stmt.run(`취소됨${reason ? `: ${reason}` : ''}`, id);
  },

  getUserReservations: (userId: string, status?: string) => {
    let sql = `
      SELECT r.*, 
             dt.display_name as device_type_name, dt.color as device_type_color,
             d.name as device_name
      FROM reservations r
      JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN devices d ON r.device_id = d.id
      WHERE r.user_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY r.start_time DESC';
    
    const stmt = db.prepare(sql);
    return stmt.all(...params) as any[];
  },

  // Schedule and Time Slots
  getAvailableSlots: (date: string, deviceTypeId: string) => {
    const stmt = db.prepare(`
      SELECT rts.*
      FROM rental_time_slots rts
      WHERE rts.device_type_id = ?
      ORDER BY rts.start_time
    `);
    return stmt.all(deviceTypeId) as any[];
  },

  getScheduleByDate: (date: string, deviceTypeId?: string) => {
    let sql = `
      SELECT r.*, 
             dt.display_name as device_type_name, dt.color as device_type_color,
             d.name as device_name,
             u.name as user_name, u.nickname as user_nickname
      FROM reservations r
      JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE DATE(r.start_time) = ?
    `;
    
    const params: any[] = [date];
    
    if (deviceTypeId) {
      sql += ' AND r.device_type_id = ?';
      params.push(deviceTypeId);
    }
    
    sql += ' AND r.status IN ("pending", "confirmed", "active") ORDER BY r.start_time';
    
    const stmt = db.prepare(sql);
    return stmt.all(...params) as any[];
  },

  checkSlotAvailability: (deviceTypeId: string, date: string, startTime: string, endTime: string, excludeReservationId?: string) => {
    let sql = `
      SELECT COUNT(*) as conflict_count
      FROM reservations r
      WHERE r.device_type_id = ?
        AND DATE(r.start_time) = ?
        AND r.status IN ('pending', 'confirmed', 'active')
        AND (
          (TIME(r.start_time) < ? AND TIME(r.end_time) > ?) OR
          (TIME(r.start_time) < ? AND TIME(r.end_time) > ?) OR
          (TIME(r.start_time) >= ? AND TIME(r.end_time) <= ?)
        )
    `;
    
    const params: any[] = [deviceTypeId, date, endTime, startTime, endTime, startTime, startTime, endTime];
    
    if (excludeReservationId) {
      sql += ' AND r.id != ?';
      params.push(excludeReservationId);
    }
    
    const stmt = db.prepare(sql);
    const result = stmt.get(...params) as any;
    return result.conflict_count === 0;
  },

  // Device Availability
  getAvailableDevices: (deviceTypeId: string, date: string, startTime: string, endTime?: string) => {
    let sql = `
      SELECT d.*
      FROM devices d
      WHERE d.device_type_id = ? 
        AND d.status = 'available'
        AND d.id NOT IN (
          SELECT DISTINCT r.device_id
          FROM reservations r
          WHERE r.device_id IS NOT NULL
            AND DATE(r.start_time) = ?
            AND r.status IN ('pending', 'confirmed', 'active')
    `;
    
    const params: any[] = [deviceTypeId, date];
    
    if (endTime) {
      sql += `
            AND (
              (TIME(r.start_time) < ? AND TIME(r.end_time) > ?) OR
              (TIME(r.start_time) < ? AND TIME(r.end_time) > ?) OR
              (TIME(r.start_time) >= ? AND TIME(r.end_time) <= ?)
            )
      `;
      params.push(endTime, startTime, endTime, startTime, startTime, endTime);
    }
    
    sql += `
        )
      ORDER BY d.position
    `;
    
    const stmt = db.prepare(sql);
    return stmt.all(...params) as any[];
  },

  getDeviceReservations: (deviceId: string, date: string) => {
    const stmt = db.prepare(`
      SELECT r.*, 
             u.name as user_name, u.nickname as user_nickname
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.device_id = ? 
        AND DATE(r.start_time) = ?
        AND r.status IN ('pending', 'confirmed', 'active')
      ORDER BY r.start_time
    `);
    return stmt.all(deviceId, date) as any[];
  },

  // Statistics
  getReservationStats: (userId: string) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_reservations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reservations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_reservations,
        SUM(duration_hours) as total_hours,
        SUM(total_price) as total_spent,
        COUNT(CASE WHEN DATE(start_time) >= DATE('now', '-30 days') THEN 1 END) as recent_reservations
      FROM reservations
      WHERE user_id = ?
    `);
    return stmt.get(userId) as any;
  },

  getDeviceUsageStats: (startDate?: string, endDate?: string) => {
    let sql = `
      SELECT 
        dt.display_name as device_type_name,
        dt.color as device_type_color,
        COUNT(r.id) as reservation_count,
        SUM(r.duration_hours) as total_hours,
        SUM(r.total_price) as total_revenue,
        AVG(r.duration_hours) as avg_duration,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as cancelled_count
      FROM device_types dt
      LEFT JOIN reservations r ON dt.id = r.device_type_id
    `;
    
    const params: any[] = [];
    
    if (startDate || endDate) {
      sql += ' WHERE';
      const conditions: string[] = [];
      
      if (startDate) {
        conditions.push(' DATE(r.start_time) >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push(' DATE(r.start_time) <= ?');
        params.push(endDate);
      }
      
      sql += conditions.join(' AND');
    }
    
    sql += `
      GROUP BY dt.id, dt.display_name, dt.color
      ORDER BY reservation_count DESC
    `;
    
    const stmt = db.prepare(sql);
    return stmt.all(...params) as any[];
  },

  // Rental Time Slots
  getRentalTimeSlots: (deviceTypeId: string) => {
    const stmt = db.prepare(`
      SELECT * FROM rental_time_slots 
      WHERE device_type_id = ? 
      ORDER BY slot_type, start_time
    `);
    return stmt.all(deviceTypeId) as any[];
  },

  // Rental Settings
  getRentalSettings: (deviceTypeId: string) => {
    const stmt = db.prepare(`
      SELECT * FROM rental_settings 
      WHERE device_type_id = ?
    `);
    return stmt.get(deviceTypeId) as any;
  },

  // Push Notifications
  getPushSubscriptions: (userEmail: string) => {
    const stmt = db.prepare(`
      SELECT * FROM push_subscriptions 
      WHERE user_email = ? AND enabled = 1
    `);
    return stmt.all(userEmail) as any[];
  },

  createOrUpdatePushSubscription: (subscriptionData: any) => {
    // Check if subscription exists
    const existingStmt = db.prepare(`
      SELECT * FROM push_subscriptions 
      WHERE user_email = ? AND endpoint = ?
    `);
    const existing = existingStmt.get(subscriptionData.user_email, subscriptionData.endpoint);

    if (existing) {
      // Update existing subscription
      const updateStmt = db.prepare(`
        UPDATE push_subscriptions 
        SET p256dh = ?, auth = ?, user_agent = ?, enabled = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      return updateStmt.run(
        subscriptionData.p256dh,
        subscriptionData.auth,
        subscriptionData.user_agent,
        subscriptionData.enabled ? 1 : 0,
        existing.id
      );
    } else {
      // Create new subscription
      const insertStmt = db.prepare(`
        INSERT INTO push_subscriptions (user_email, endpoint, p256dh, auth, user_agent, enabled)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      return insertStmt.run(
        subscriptionData.user_email,
        subscriptionData.endpoint,
        subscriptionData.p256dh,
        subscriptionData.auth,
        subscriptionData.user_agent,
        subscriptionData.enabled ? 1 : 0
      );
    }
  },

  updatePushSubscriptionStatus: (id: string, enabled: boolean) => {
    const stmt = db.prepare(`
      UPDATE push_subscriptions 
      SET enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    return stmt.run(enabled ? 1 : 0, id);
  },

  updateUserMarketingAgreement: (email: string, marketing_agreed: boolean) => {
    const stmt = db.prepare(`
      UPDATE users 
      SET marketing_agreed = ?, updated_at = datetime('now')
      WHERE email = ?
    `);
    return stmt.run(marketing_agreed ? 1 : 0, email);
  },

  updateUserPushNotificationsSetting: (email: string, push_notifications_enabled: boolean) => {
    const stmt = db.prepare(`
      UPDATE users 
      SET push_notifications_enabled = ?, updated_at = datetime('now')
      WHERE email = ?
    `);
    return stmt.run(push_notifications_enabled ? 1 : 0, email);
  },

  getUserMarketingAgreement: (email: string) => {
    const stmt = db.prepare(`
      SELECT marketing_agreed FROM users WHERE email = ?
    `);
    const result = stmt.get(email) as any;
    return result ? Boolean(result.marketing_agreed) : false;
  },

  getUserPushNotificationsSetting: (email: string) => {
    const stmt = db.prepare(`
      SELECT push_notifications_enabled FROM users WHERE email = ?
    `);
    const result = stmt.get(email) as any;
    return result ? Boolean(result.push_notifications_enabled) : false;
  }
};