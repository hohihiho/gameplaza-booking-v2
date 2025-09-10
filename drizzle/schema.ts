// 게임플라자 V2 - Drizzle ORM Schema for Cloudflare D1
// Supabase와 완전히 독립적으로 재설계된 스키마

import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================================================
// 1. 사용자 관리 (Better Auth와 연동)
// ============================================================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Better Auth UUID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  nickname: text('nickname'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  
  // 권한 및 상태
  role: text('role', { enum: ['customer', 'admin', 'super_admin'] }).notNull().default('customer'),
  status: text('status', { enum: ['active', 'suspended', 'banned'] }).notNull().default('active'),
  
  // 마케팅 및 알림 동의
  marketingConsent: integer('marketing_consent', { mode: 'boolean' }).notNull().default(false),
  pushNotifications: integer('push_notifications', { mode: 'boolean' }).notNull().default(true),
  
  // 시간 정보 (KST, Unix timestamp)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  
  // 사용자 통계
  totalReservations: integer('total_reservations').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0), // 원 단위
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
});

// ============================================================================
// 2. 기기 관리 시스템
// ============================================================================

export const deviceCategories = sqliteTable('device_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // 'rhythm', 'racing', 'shooting' 등
  displayName: text('display_name').notNull(), // '리듬게임', '레이싱', '슈팅게임'
  description: text('description'),
  icon: text('icon'), // 아이콘 이름 또는 URL
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const deviceTypes = sqliteTable('device_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => deviceCategories.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(), // 'sound_voltex', 'maimai', 'chunithm'
  displayName: text('display_name').notNull(), // '사운드볼텍스', '마이마이', '츄니즘'
  description: text('description'),
  manufacturer: text('manufacturer'), // 제조사
  model: text('model'), // 모델명
  
  // 가격 정책
  basePrice: integer('base_price').notNull().default(1000), // 원 단위
  peakTimeMultiplier: real('peak_time_multiplier').notNull().default(1.2),
  
  // 예약 정책
  maxPlayTime: integer('max_play_time').notNull().default(30), // 분 단위
  advanceBookingDays: integer('advance_booking_days').notNull().default(7),
  
  // 기타 정보
  imageUrl: text('image_url'),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const devices = sqliteTable('devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceTypeId: integer('device_type_id').notNull().references(() => deviceTypes.id, { onDelete: 'cascade' }),
  
  // 기기 식별 정보
  deviceNumber: text('device_number').notNull().unique(), // '001', '002' 등
  location: text('location'), // 'A구역', 'B구역' 등
  
  // 상태 정보
  status: text('status', { enum: ['available', 'occupied', 'maintenance', 'out_of_order'] }).notNull().default('available'),
  
  // 관리 정보
  lastMaintenanceAt: integer('last_maintenance_at', { mode: 'timestamp' }),
  maintenanceNotes: text('maintenance_notes'),
  
  // 설치 및 관리
  installedAt: integer('installed_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ============================================================================
// 3. 예약 시스템
// ============================================================================

export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // 기본 정보
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: integer('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  
  // 시간 정보 (KST 기준)
  reservedDate: text('reserved_date').notNull(), // YYYY-MM-DD 형식
  startTime: text('start_time').notNull(), // HH:MM 형식 (24~29시 포함)
  endTime: text('end_time').notNull(), // HH:MM 형식
  duration: integer('duration').notNull(), // 분 단위
  
  // 상태 관리
  status: text('status', { enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'] }).notNull().default('pending'),
  
  // 금액 정보
  baseAmount: integer('base_amount').notNull(), // 원 단위
  finalAmount: integer('final_amount').notNull(), // 원 단위
  
  // 체크인/아웃 정보
  checkedInAt: integer('checked_in_at', { mode: 'timestamp' }),
  checkedOutAt: integer('checked_out_at', { mode: 'timestamp' }),
  actualStartTime: text('actual_start_time'), // 실제 시작 시간
  actualEndTime: text('actual_end_time'), // 실제 종료 시간
  
  // 추가 정보
  notes: text('notes'), // 사용자 메모
  adminNotes: text('admin_notes'), // 관리자 메모
  
  // 시간 정보
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ============================================================================
// 4. 결제 시스템
// ============================================================================

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reservationId: integer('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // 결제 정보
  amount: integer('amount').notNull(), // 원 단위
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'mobile', 'account_transfer'] }).notNull(),
  
  // 결제 상태
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'] }).notNull().default('pending'),
  
  // 외부 결제 정보
  transactionId: text('transaction_id'), // 외부 결제 시스템 거래 ID
  paymentGateway: text('payment_gateway'), // 'toss', 'kakao_pay' 등
  
  // 시간 정보
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ============================================================================
// 5. 운영 시간 및 일정 관리
// ============================================================================

export const businessSchedules = sqliteTable('business_schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // 날짜 정보
  date: text('date').notNull().unique(), // YYYY-MM-DD 형식
  dayOfWeek: integer('day_of_week').notNull(), // 0: 일요일, 1: 월요일, ..., 6: 토요일
  
  // 영업 시간
  openTime: text('open_time').notNull(), // HH:MM 형식
  closeTime: text('close_time').notNull(), // HH:MM 형식 (24~29시 포함)
  
  // 특별 운영
  isHoliday: integer('is_holiday', { mode: 'boolean' }).notNull().default(false),
  isSpecialEvent: integer('is_special_event', { mode: 'boolean' }).notNull().default(false),
  eventName: text('event_name'),
  
  // 요금 정책
  isPeakTime: integer('is_peak_time', { mode: 'boolean' }).notNull().default(false),
  priceMultiplier: real('price_multiplier').notNull().default(1.0),
  
  // 예약 정책
  maxAdvanceBooking: integer('max_advance_booking'), // 해당 날짜의 최대 사전 예약 일수
  
  notes: text('notes'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ============================================================================
// 6. 시스템 설정 및 관리
// ============================================================================

export const systemSettings = sqliteTable('system_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(), // 'business', 'payment', 'notification' 등
  key: text('key').notNull(),
  value: text('value').notNull(),
  dataType: text('data_type', { enum: ['string', 'number', 'boolean', 'json'] }).notNull().default('string'),
  
  description: text('description'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const adminLogs = sqliteTable('admin_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: text('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // 액션 정보
  action: text('action').notNull(), // 'create_reservation', 'cancel_reservation', 'update_device' 등
  targetType: text('target_type').notNull(), // 'reservation', 'device', 'user' 등
  targetId: text('target_id').notNull(), // 대상의 ID
  
  // 변경 내용
  oldData: text('old_data'), // JSON 형태의 변경 전 데이터
  newData: text('new_data'), // JSON 형태의 변경 후 데이터
  
  // 추가 정보
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  notes: text('notes'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ============================================================================
// 타입 정의 (TypeScript 타입 추출)
// ============================================================================

// 인서트 타입 (생성시 사용)
export type InsertUser = typeof users.$inferInsert;
export type InsertDeviceCategory = typeof deviceCategories.$inferInsert;
export type InsertDeviceType = typeof deviceTypes.$inferInsert;
export type InsertDevice = typeof devices.$inferInsert;
export type InsertReservation = typeof reservations.$inferInsert;
export type InsertPayment = typeof payments.$inferInsert;
export type InsertBusinessSchedule = typeof businessSchedules.$inferInsert;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

// 셀렉트 타입 (조회시 사용)
export type SelectUser = typeof users.$inferSelect;
export type SelectDeviceCategory = typeof deviceCategories.$inferSelect;
export type SelectDeviceType = typeof deviceTypes.$inferSelect;
export type SelectDevice = typeof devices.$inferSelect;
export type SelectReservation = typeof reservations.$inferSelect;
export type SelectPayment = typeof payments.$inferSelect;
export type SelectBusinessSchedule = typeof businessSchedules.$inferSelect;
export type SelectSystemSetting = typeof systemSettings.$inferSelect;
export type SelectAdminLog = typeof adminLogs.$inferSelect;