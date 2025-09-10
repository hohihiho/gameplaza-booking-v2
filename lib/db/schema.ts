import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 사용자 테이블 (실제 migration과 일치)
export const users = sqliteTable('users', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('user'),
  profile_image_url: text('profile_image_url'),
  marketing_consent: integer('marketing_consent').default(0),
  marketing_agreed: integer('marketing_agreed').default(0),
  push_notifications_enabled: integer('push_notifications_enabled').default(0),
  last_login_at: integer('last_login_at'),
  created_at: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at'),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
  createdAtIdx: index('idx_users_created_at').on(table.created_at),
}));

// 세션 테이블 (Better Auth 표준)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 기기 카테고리 테이블
export const deviceCategories = sqliteTable('device_categories', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull().unique(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 기기 타입 테이블
export const deviceTypes = sqliteTable('device_types', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull().unique(),
  description: text('description'),
  hourlyRate: integer('hourly_rate').notNull().default(0),
  dailyMaxHours: integer('daily_max_hours').default(8),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(false),
  iconUrl: text('icon_url'),
  categoryId: text('category_id').references(() => deviceCategories.id),
  modelName: text('model_name'),
  versionName: text('version_name'),
  displayOrder: integer('display_order').notNull().default(0),
  isRentable: integer('is_rentable', { mode: 'boolean' }).notNull().default(true),
  playModes: text('play_modes'), // JSON array
  rentalSettings: text('rental_settings'), // JSON object
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// 기기 테이블
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  deviceTypeId: text('device_type_id').notNull().references(() => deviceTypes.id),
  deviceNumber: integer('device_number').notNull(),
  status: text('status', { enum: ['available', 'occupied', 'maintenance', 'offline'] }).notNull().default('available'),
  location: text('location'),
  serialNumber: text('serial_number'),
  specifications: text('specifications'), // JSON 문자열
  notes: text('notes'),
  lastMaintenance: integer('last_maintenance', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  typeIdx: index('idx_devices_type').on(table.deviceTypeId),
  statusIdx: index('idx_devices_status').on(table.status),
  nameIdx: index('idx_devices_name').on(table.name),
}));

// 예약 테이블
export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id),
  deviceId: text('device_id').notNull().references(() => devices.id),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  status: text('status', { 
    enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'] 
  }).notNull().default('pending'),
  totalAmount: integer('total_amount').default(0),
  notes: text('notes'),
  adminNotes: text('admin_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('idx_reservations_user').on(table.userId),
  deviceIdx: index('idx_reservations_device').on(table.deviceId),
  statusIdx: index('idx_reservations_status').on(table.status),
  timeIdx: index('idx_reservations_time').on(table.startTime, table.endTime),
  createdAtIdx: index('idx_reservations_created_at').on(table.createdAt),
  // 예약 시간 겹침 방지 인덱스
  deviceTimeConflictIdx: uniqueIndex('idx_reservations_device_time_conflict')
    .on(table.deviceId, table.startTime, table.endTime)
    .where(sql`status IN ('confirmed', 'checked_in')`),
}));

// 체크인 테이블
export const checkins = sqliteTable('checkins', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  reservationId: text('reservation_id').notNull().unique().references(() => reservations.id),
  checkedInAt: integer('checked_in_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  checkedOutAt: integer('checked_out_at', { mode: 'timestamp' }),
  actualEndTime: integer('actual_end_time', { mode: 'timestamp' }),
  overtimeMinutes: integer('overtime_minutes').default(0),
  additionalCharges: integer('additional_charges').default(0),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reservationIdx: index('idx_checkins_reservation').on(table.reservationId),
}));

// 일정 테이블
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  date: text('date').notNull(), // YYYY-MM-DD
  dayOfWeek: integer('day_of_week').notNull(), // 0=일요일, 6=토요일
  isHoliday: integer('is_holiday', { mode: 'boolean' }).default(false),
  isSpecialDay: integer('is_special_day', { mode: 'boolean' }).default(false),
  openTime: text('open_time').notNull().default('10:00'),
  closeTime: text('close_time').notNull().default('22:00'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  dateIdx: uniqueIndex('idx_schedules_date').on(table.date),
  dayOfWeekIdx: index('idx_schedules_day_of_week').on(table.dayOfWeek),
  holidayIdx: index('idx_schedules_holiday').on(table.isHoliday),
}));

// 일정 이벤트 테이블 (조기영업, 주말연장 등)
export const scheduleEvents = sqliteTable('schedule_events', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type', { enum: ['early_open', 'overnight', 'special'] }).notNull(),
  startTime: text('start_time').notNull(), // HH:mm format
  endTime: text('end_time').notNull(), // HH:mm format
  isAutoGenerated: integer('is_auto_generated', { mode: 'boolean' }).default(false),
  sourceType: text('source_type'), // 'reservation_auto', 'manual' 등
  sourceReference: text('source_reference'), // 참조 ID (예약 ID 등)
  title: text('title'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  dateIdx: index('idx_schedule_events_date').on(table.date),
  typeIdx: index('idx_schedule_events_type').on(table.type),
  dateTypeIdx: index('idx_schedule_events_date_type').on(table.date, table.type),
  autoGeneratedIdx: index('idx_schedule_events_auto_generated').on(table.isAutoGenerated),
}));

// 알림 테이블
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // reservation_reminder, status_change, etc
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  metadata: text('metadata'), // JSON 문자열
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('idx_notifications_user').on(table.userId),
  readIdx: index('idx_notifications_read').on(table.isRead),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}));

// 금지어 테이블
export const bannedWords = sqliteTable('banned_words', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  word: text('word').notNull().unique(),
  category: text('category').default('general'),
  severity: integer('severity').default(1), // 1-5
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// 결제 테이블
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  reservationId: text('reservation_id').references(() => reservations.id),
  amount: integer('amount').notNull(),
  method: text('method').notNull(), // cash, card, transfer
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded'] }).notNull().default('pending'),
  transactionId: text('transaction_id'),
  metadata: text('metadata'), // JSON 문자열
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reservationIdx: index('idx_payments_reservation').on(table.reservationId),
  statusIdx: index('idx_payments_status').on(table.status),
}));

// 관리자 테이블
export const admins = sqliteTable('admins', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'super_admin'] }).notNull().default('admin'),
  permissions: text('permissions'), // JSON 문자열로 저장된 권한 목록
  isSuperAdmin: integer('is_super_admin', { mode: 'boolean' }).default(false),
  bankAccount: text('bank_account'), // JSON 문자열로 저장된 계좌 정보
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: uniqueIndex('idx_admins_user').on(table.userId),
}));

// 결제 계좌 테이블
export const paymentAccounts = sqliteTable('payment_accounts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountHolder: text('account_holder').notNull(),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  primaryIdx: index('idx_payment_accounts_primary').on(table.isPrimary),
  activeIdx: index('idx_payment_accounts_active').on(table.isActive),
}));

// 푸시 구독 테이블
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  user_email: text('user_email').notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh'),
  auth: text('auth'),
  user_agent: text('user_agent'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
}, (table) => ({
  userEmailIdx: index('idx_push_subscriptions_user_email').on(table.user_email),
  endpointIdx: index('idx_push_subscriptions_endpoint').on(table.endpoint),
  enabledIdx: index('idx_push_subscriptions_enabled').on(table.enabled),
}));

// 컨텐츠 페이지 테이블
export const contentPages = sqliteTable('content_pages', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  contentType: text('content_type').default('markdown'),
  version: integer('version').default(1),
  isPublished: integer('is_published', { mode: 'boolean' }).default(true),
  publishedAt: text('published_at'),
  metadata: text('metadata'), // JSON
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex('idx_content_pages_slug').on(table.slug),
  publishedIdx: index('idx_content_pages_published').on(table.isPublished),
}));

// Better Auth 계정 테이블
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: text('access_token_expires_at'),
  refreshTokenExpiresAt: text('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('idx_accounts_user_id').on(table.userId),
  providerIdx: index('idx_accounts_provider').on(table.providerId),
  accountIdx: uniqueIndex('idx_accounts_account_provider').on(table.accountId, table.providerId),
}));

// Better Auth 인증 테이블
export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  identifierIdx: index('idx_verifications_identifier').on(table.identifier),
  valueIdx: index('idx_verifications_value').on(table.value),
}));

// 타입 추론을 위한 유틸리티 타입
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type DeviceCategory = typeof deviceCategories.$inferSelect;
export type NewDeviceCategory = typeof deviceCategories.$inferInsert;
export type DeviceType = typeof deviceTypes.$inferSelect;
export type NewDeviceType = typeof deviceTypes.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type NewScheduleEvent = typeof scheduleEvents.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type BannedWord = typeof bannedWords.$inferSelect;
export type NewBannedWord = typeof bannedWords.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type PaymentAccount = typeof paymentAccounts.$inferSelect;
export type NewPaymentAccount = typeof paymentAccounts.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type ContentPage = typeof contentPages.$inferSelect;
export type NewContentPage = typeof contentPages.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;