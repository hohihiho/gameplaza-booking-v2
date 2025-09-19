// 게임플라자 예약 시스템 Drizzle ORM 스키마
// Database: Cloudflare D1 (SQLite)
// Timezone: KST (모든 날짜/시간은 TEXT 타입으로 'YYYY-MM-DD HH:MM:SS' 형식)
// 특징: 24시간+ 표시 체계 (0~5시 → 24~29시)

import { sql } from 'drizzle-orm';
import { 
  sqliteTable, 
  integer, 
  text, 
  index,
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/sqlite-core';

// ================================================
// 1. 인증 시스템 테이블 (Authentication)
// ================================================

// User 테이블 - 사용자 기본 정보 (Better Auth 표준 스키마)
export const User = sqliteTable('user', {
  id: text('id').primaryKey(), // Better Auth 필수
  email: text('email').notNull().unique(), // Better Auth 필수
  email_verified: integer('email_verified').default(0), // Better Auth 필수 - boolean을 integer로 직접 처리
  name: text('name'), // Better Auth 필수
  created_at: text('created_at').notNull(), // Better Auth는 TEXT로 처리
  updated_at: text('updated_at').notNull(), // Better Auth는 TEXT로 처리
  image: text('image'), // Better Auth 선택
}, (table) => ({
  emailIdx: index('idx_user_email').on(table.email)
}));

// UserRole 테이블 - 사용자 권한 관리
export const UserRole = sqliteTable('UserRole', {
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  role_type: text('role_type', { enum: ['user', 'admin'] }).notNull().default('user'),
  granted_at: text('granted_at').notNull(), // KST 형식
  granted_by: text('granted_by').references(() => User.id, { onDelete: 'set null' })
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.role_type] }),
  roleTypeIdx: index('idx_userrole_role_type').on(table.role_type),
  grantedAtIdx: index('idx_userrole_granted_at').on(table.granted_at)
}));

// ================================================
// Better Auth 필수 테이블들
// ================================================

// Session 테이블 - Better Auth 세션 관리 (정확한 snake_case 컬럼명)
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  token: text('token').notNull(), // Better Auth 필수 필드
  expires_at: text('expires_at').notNull(), // Better Auth는 TEXT로 처리
  ip_address: text('ip_address'), // Better Auth는 snake_case 사용
  user_agent: text('user_agent'), // Better Auth는 snake_case 사용
  created_at: text('created_at').notNull(), // Better Auth는 TEXT로 처리
  updated_at: text('updated_at').notNull(), // Better Auth는 TEXT로 처리
}, (table) => ({
  userIdIdx: index('idx_session_user_id').on(table.user_id),
  tokenIdx: index('idx_session_token').on(table.token), // 토큰 인덱스 추가
  expiresAtIdx: index('idx_session_expires_at').on(table.expires_at)
}));

// Account 테이블 - Better Auth 소셜 계정 연결
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  account_id: text('account_id').notNull(),
  provider_id: text('provider_id').notNull(),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  id_token: text('id_token'),
  access_token_expires_at: text('access_token_expires_at'), // Better Auth는 TEXT로 처리
  refresh_token_expires_at: text('refresh_token_expires_at'), // Better Auth는 TEXT로 처리
  scope: text('scope'),
  password: text('password'),
  created_at: text('created_at').notNull(), // Better Auth는 TEXT로 처리
  updated_at: text('updated_at').notNull(), // Better Auth는 TEXT로 처리
}, (table) => ({
  userIdIdx: index('idx_account_user_id').on(table.user_id),
  providerIdx: index('idx_account_provider').on(table.provider_id),
  accountProviderIdx: uniqueIndex('idx_account_provider_account').on(table.provider_id, table.account_id)
}));

// Verification 테이블 - Better Auth 이메일 인증
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expiresAt').notNull(), // Better Auth default field name
  createdAt: text('createdAt').notNull(), // Better Auth default field name
  updatedAt: text('updatedAt').notNull(), // Better Auth default field name
}, (table) => ({
  identifierIdx: index('idx_verification_identifier').on(table.identifier),
  expiresAtIdx: index('idx_verification_expiresAt').on(table.expiresAt)
}));

// Terms 테이블 - 약관 내용 관리
export const terms = sqliteTable('terms', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  type: text('type', { 
    enum: ['terms_of_service', 'privacy_policy'] 
  }).notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  version: text('version').notNull().default('1.0.0'),
  effective_date: text('effective_date').notNull().default(sql`CURRENT_DATE`),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  created_by: text('created_by').references(() => User.id),
  updated_by: text('updated_by').references(() => User.id)
}, (table) => ({
  typeIdx: index('idx_terms_type').on(table.type),
  effectiveDateIdx: index('idx_terms_effective_date').on(table.effective_date)
}));

// User Agreements 테이블 - 사용자 약관 동의 관리
export const userAgreements = sqliteTable('user_agreements', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  agreement_type: text('agreement_type', { 
    enum: ['terms_of_service', 'privacy_policy', 'age_verification', 'marketing'] 
  }).notNull(),
  agreed: integer('agreed').notNull().default(0),
  agreed_at: text('agreed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  ip_address: text('ip_address'),
  user_agent: text('user_agent')
}, (table) => ({
  userIdIdx: index('idx_user_agreements_user_id').on(table.user_id),
  uniqueUserAgreement: uniqueIndex('idx_unique_user_agreement').on(table.user_id, table.agreement_type)
}));

// UserRestriction 테이블 - 예약 제한 상태 관리
export const UserRestriction = sqliteTable('UserRestriction', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  restriction_type: text('restriction_type', { 
    enum: ['normal', 'restricted', 'suspended'] 
  }).notNull().default('normal'),
  reason: text('reason'),
  start_date: text('start_date'), // KST 형식
  end_date: text('end_date'),     // KST 형식, NULL이면 무기한
  created_at: text('created_at').notNull(),
  created_by: text('created_by').references(() => User.id, { onDelete: 'set null' }),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
}, (table) => ({
  userIdIdx: index('idx_userrestriction_user_id').on(table.user_id),
  typeIdx: index('idx_userrestriction_type').on(table.restriction_type),
  activeIdx: index('idx_userrestriction_active').on(table.is_active),
  endDateIdx: index('idx_userrestriction_end_date').on(table.end_date)
}));

// LoginLog 테이블 - 로그인 이력 추적
export const LoginLog = sqliteTable('LoginLog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').references(() => User.id, { onDelete: 'set null' }),
  success: integer('success', { mode: 'boolean' }).notNull().default(false),
  ip_address: text('ip_address'),
  attempted_at: text('attempted_at').notNull(), // KST 형식
  failure_reason: text('failure_reason'),
  user_agent: text('user_agent')
}, (table) => ({
  userIdIdx: index('idx_loginlog_user_id').on(table.user_id),
  successIdx: index('idx_loginlog_success').on(table.success),
  ipAddressIdx: index('idx_loginlog_ip_address').on(table.ip_address),
  attemptedAtIdx: index('idx_loginlog_attempted_at').on(table.attempted_at)
}));

// PasskeyCredential 테이블 - 패스키 인증 정보
export const PasskeyCredential = sqliteTable('PasskeyCredential', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  credential_id: text('credential_id').notNull().unique(),
  public_key: text('public_key').notNull(),
  device_info: text('device_info'), // JSON
  device_name: text('device_name'),
  registered_at: text('registered_at').notNull(), // KST 형식
  last_used_at: text('last_used_at'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
}, (table) => ({
  userIdIdx: index('idx_passkey_user_id').on(table.user_id),
  credentialIdIdx: index('idx_passkey_credential_id').on(table.credential_id),
  activeIdx: index('idx_passkey_active').on(table.is_active)
}));


// ================================================
// 2. 기기 관리 테이블 (Device Management)
// ================================================

// device_categories 테이블 - 기기 카테고리 (예: 리듬게임, 슈팅게임 등)
export const device_categories = sqliteTable('device_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  display_order: integer('display_order').notNull().default(0),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  nameUnique: uniqueIndex('idx_device_categories_name').on(table.name),
  displayOrderIdx: index('idx_device_categories_display_order').on(table.display_order),
  activeIdx: index('idx_device_categories_active').on(table.is_active)
}));

// device_types 테이블 - 기기 타입 (예: 사운드볼텍스, 비트매니아 등)
export const device_types = sqliteTable('device_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category_id: integer('category_id').notNull().references(() => device_categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  model_name: text('model_name'),
  version_name: text('version_name'),
  company: text('company').notNull(), // 제조사 (UI에서 필수 사용)
  is_rentable: integer('is_rentable', { mode: 'boolean' }).notNull().default(false),
  display_order: integer('display_order').notNull().default(0),
  
  // JSON 필드 (SQLite TEXT로 저장)
  rental_settings: text('rental_settings'), // JSON: { base_price, credit_types, max_players 등 }
  
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  categoryIdIdx: index('idx_device_types_category_id').on(table.category_id),
  nameIdx: index('idx_device_types_name').on(table.name),
  displayOrderIdx: index('idx_device_types_display_order').on(table.display_order),
  rentableIdx: index('idx_device_types_rentable').on(table.is_rentable)
}));

// devices 테이블 - 개별 기기 정보
export const devices = sqliteTable('devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  device_type_id: integer('device_type_id').notNull().references(() => device_types.id, { onDelete: 'cascade' }),
  device_number: integer('device_number').notNull(),
  name: text('name').notNull(),
  
  // API 호환성을 위한 추가 필드들 (커밋 c63165a 관련)
  manufacturer: text('manufacturer'), // API에서 요구하는 제조사 정보
  model: text('model'),               // API에서 요구하는 모델명
  device_type: text('device_type'),   // API에서 요구하는 기기 타입명
  
  status: text('status', { 
    enum: ['available', 'in_use', 'maintenance', 'reserved', 'broken'] 
  }).notNull().default('available'),
  location: text('location'),
  serial_number: text('serial_number').unique(),
  purchase_date: text('purchase_date'), // DATE 형식
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  deviceTypeIdIdx: index('idx_devices_device_type_id').on(table.device_type_id),
  deviceNumberUnique: uniqueIndex('idx_devices_unique_number').on(table.device_type_id, table.device_number),
  statusIdx: index('idx_devices_status').on(table.status),
  serialNumberIdx: index('idx_devices_serial_number').on(table.serial_number)
}));

// play_modes 테이블 - 플레이 모드 및 가격 정보
export const play_modes = sqliteTable('play_modes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  device_type_id: integer('device_type_id').notNull().references(() => device_types.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  display_order: integer('display_order').notNull().default(0),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  deviceTypeIdIdx: index('idx_play_modes_device_type_id').on(table.device_type_id),
  displayOrderIdx: index('idx_play_modes_display_order').on(table.display_order),
  activeIdx: index('idx_play_modes_active').on(table.is_active)
}));

// machine_rules 테이블 - 기기 현황 안내사항
export const machine_rules = sqliteTable('machine_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  display_order: integer('display_order').notNull().default(0),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  displayOrderIdx: index('idx_machine_rules_display_order').on(table.display_order),
  activeIdx: index('idx_machine_rules_active').on(table.is_active)
}));

// ================================================
// 3. 예약 관리 테이블 (Reservation Management)
// ================================================

// time_slots 테이블 - 시간대 정보 (24시간+ 표시 지원)
export const time_slots = sqliteTable('time_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slot_name: text('slot_name').notNull(),
  start_hour: integer('start_hour').notNull(), // 0~29
  end_hour: integer('end_hour').notNull(),     // 0~29
  slot_type: text('slot_type', { 
    enum: ['early', 'overnight', 'custom'] 
  }).notNull(),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// rental_time_policy 테이블 - 시간대별 대여 정책
export const rental_time_policy = sqliteTable('rental_time_policy', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  time_slot_id: integer('time_slot_id').notNull().references(() => time_slots.id, { onDelete: 'cascade' }),
  device_id: integer('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  price_multiplier: text('price_multiplier').default('1.0'), // DECIMAL(3,2)를 TEXT로 저장
  additional_price: integer('additional_price').default(0),
  is_available: integer('is_available', { mode: 'boolean' }).default(true),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  uniquePolicy: uniqueIndex('idx_rental_time_policy_unique').on(table.time_slot_id, table.device_id)
}));

// user_rental_limits 테이블 - 사용자별 대여 제한
export const user_rental_limits = sqliteTable('user_rental_limits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull(), // Better Auth user ID
  max_rental_count: integer('max_rental_count').notNull().default(2),
  start_date: text('start_date'), // DATE 형식
  end_date: text('end_date'),     // DATE 형식
  notes: text('notes'),
  set_by: text('set_by'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// reservations 테이블 - 예약 정보 (핵심 테이블)
export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  device_id: integer('device_id').references(() => devices.id),
  
  // 예약 시간 정보 (기존 DB 호환성을 위한 필드)
  reservation_date: text('reservation_date').notNull(), // 기존 DB 컬럼 (DATE 형식)
  slot_time: text('slot_time'), // 기존 DB 컬럼 (TIME 형식)
  
  // 예약 시간 정보 (신규 방식)
  date: text('date'), // DATE 형식 (YYYY-MM-DD) - 새로운 구조용
  start_time: text('start_time'), // TIME 형식 (HH:MM) - 새로운 구조용
  end_time: text('end_time'),     // TIME 형식 (HH:MM) - 새로운 구조용
  
  status: text('status', { 
    enum: ['pending', 'approved', 'checked_in', 'completed', 'cancelled', 'no_show'] 
  }).notNull().default('pending'),
  
  // 기존 DB 호환 필드들
  slot_id: integer('slot_id'),
  device_mode: text('device_mode'),
  credit_amount: integer('credit_amount'),
  payment_status: text('payment_status').default('pending'),
  cancelled_at: text('cancelled_at'),
  cancelled_by: integer('cancelled_by'),
  cancel_reason: text('cancel_reason'),
  
  // 플레이어 정보
  player_count: integer('player_count').notNull().default(1),
  
  // 가격 정보
  base_price: integer('base_price').notNull().default(0),
  additional_price: integer('additional_price').default(0),
  total_price: integer('total_price').notNull().default(0),
  payment_method: text('payment_method', { 
    enum: ['cash', 'transfer', 'card'] 
  }),
  
  // 시간 관리
  check_in_time: text('check_in_time'),    // DATETIME 형식
  check_out_time: text('check_out_time'),  // DATETIME 형식
  extended_minutes: integer('extended_minutes').default(0),
  extended_price: integer('extended_price').default(0),
  
  // 메모
  user_notes: text('user_notes'),
  admin_notes: text('admin_notes'), // 기존 DB 호환
  
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userDateIdx: index('idx_reservations_user_date').on(
    table.user_id, 
    table.reservation_date, 
    table.slot_time
  ),
  deviceDateIdx: index('idx_reservations_device_date').on(
    table.device_id,
    table.reservation_date
  ),
  dateIdx: index('idx_reservations_date').on(table.reservation_date),
  statusIdx: index('idx_reservations_status').on(table.status),
  createdIdx: index('idx_reservations_created').on(table.created_at)
}));

// ================================================
// 4. 체크인/결제 관리 테이블 (Check-in & Payment)
// ================================================

// check_in_processes 테이블 - 체크인 프로세스 관리
export const check_in_processes = sqliteTable('check_in_processes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reservation_id: integer('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  admin_id: text('admin_id').notNull(),
  process_status: text('process_status', { 
    enum: ['started', 'device_assigned', 'payment_completed', 'completed', 'cancelled'] 
  }).notNull().default('started'),
  device_number: text('device_number'),
  started_at: text('started_at').notNull(),    // KST DATETIME
  device_assigned_at: text('device_assigned_at'),
  payment_completed_at: text('payment_completed_at'),
  completed_at: text('completed_at'),
  cancelled_at: text('cancelled_at'),
  cancel_reason: text('cancel_reason'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  reservationIdUnique: uniqueIndex('idx_checkin_reservation_id').on(table.reservation_id),
  statusIdx: index('idx_checkin_status').on(table.process_status),
  adminIdx: index('idx_checkin_admin').on(table.admin_id)
}));

// payment_transactions 테이블 - 결제 거래 내역
export const payment_transactions = sqliteTable('payment_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reservation_id: integer('reservation_id').references(() => reservations.id, { onDelete: 'set null' }),
  check_in_process_id: integer('check_in_process_id').references(() => check_in_processes.id, { onDelete: 'set null' }),
  user_id: text('user_id').notNull(),
  transaction_type: text('transaction_type', { 
    enum: ['rental', 'extension', 'penalty', 'refund'] 
  }).notNull(),
  payment_method: text('payment_method', { 
    enum: ['cash', 'transfer', 'card'] 
  }).notNull(),
  
  // 금액 정보
  amount: integer('amount').notNull(),
  tax_amount: integer('tax_amount').default(0),
  total_amount: integer('total_amount').notNull(),
  
  // 결제 상태
  payment_status: text('payment_status', { 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'] 
  }).notNull().default('pending'),
  
  // 시간 정보
  transaction_date: text('transaction_date').notNull(), // KST DATE
  payment_completed_at: text('payment_completed_at'),   // KST DATETIME
  
  // 추가 정보
  reference_number: text('reference_number').unique(),
  receipt_number: text('receipt_number').unique(),
  admin_id: text('admin_id'),
  notes: text('notes'),
  
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('idx_payment_user_id').on(table.user_id),
  statusIdx: index('idx_payment_status').on(table.payment_status),
  dateIdx: index('idx_payment_date').on(table.transaction_date),
  methodIdx: index('idx_payment_method').on(table.payment_method)
}));

// payment_status_history 테이블 - 결제 상태 변경 이력
export const payment_status_history = sqliteTable('payment_status_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  payment_transaction_id: integer('payment_transaction_id').notNull()
    .references(() => payment_transactions.id, { onDelete: 'cascade' }),
  previous_status: text('previous_status', { 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'] 
  }),
  new_status: text('new_status', { 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'] 
  }).notNull(),
  changed_by: text('changed_by'),
  change_reason: text('change_reason'),
  changed_at: text('changed_at').notNull(), // KST DATETIME
  metadata: text('metadata'), // JSON
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  transactionIdx: index('idx_payment_history_transaction').on(table.payment_transaction_id),
  changedAtIdx: index('idx_payment_history_changed_at').on(table.changed_at)
}));

// qr_code_managers 테이블 - QR코드 관리자 정보
export const qr_code_managers = sqliteTable('qr_code_managers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  manager_id: text('manager_id').notNull().unique(),
  manager_name: text('manager_name').notNull(),
  qr_image_url: text('qr_image_url').notNull(),
  payment_info: text('payment_info'), // JSON (계좌번호 등)
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  managerIdIdx: uniqueIndex('idx_qr_manager_id').on(table.manager_id),
  activeIdx: index('idx_qr_manager_active').on(table.is_active)
}));

// daily_payment_stats 테이블 - 일별 결제 통계
export const daily_payment_stats = sqliteTable('daily_payment_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stat_date: text('stat_date').notNull(), // DATE 형식
  
  // 결제 방법별 통계
  cash_count: integer('cash_count').notNull().default(0),
  cash_amount: integer('cash_amount').notNull().default(0),
  transfer_count: integer('transfer_count').notNull().default(0),
  transfer_amount: integer('transfer_amount').notNull().default(0),
  card_count: integer('card_count').notNull().default(0),
  card_amount: integer('card_amount').notNull().default(0),
  
  // 전체 통계
  total_count: integer('total_count').notNull().default(0),
  total_amount: integer('total_amount').notNull().default(0),
  
  // 거래 유형별 통계
  rental_amount: integer('rental_amount').notNull().default(0),
  extension_amount: integer('extension_amount').notNull().default(0),
  penalty_amount: integer('penalty_amount').notNull().default(0),
  refund_amount: integer('refund_amount').notNull().default(0),
  
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  dateUnique: uniqueIndex('idx_daily_stats_date').on(table.stat_date)
}));

// device_status_logs 테이블 - 기기 상태 변경 로그
export const device_status_logs = sqliteTable('device_status_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  device_id: integer('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  previous_status: text('previous_status', { 
    enum: ['available', 'in_use', 'maintenance', 'broken'] 
  }),
  new_status: text('new_status', { 
    enum: ['available', 'in_use', 'maintenance', 'broken'] 
  }).notNull(),
  changed_by: text('changed_by'),
  change_reason: text('change_reason'),
  reservation_id: integer('reservation_id').references(() => reservations.id, { onDelete: 'set null' }),
  changed_at: text('changed_at').notNull(), // KST DATETIME
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  deviceIdx: index('idx_device_status_log_device').on(table.device_id),
  changedAtIdx: index('idx_device_status_log_changed_at').on(table.changed_at)
}));

// ================================================
// 5. 사용자 직급 시스템 테이블 (User Tier System)
// ================================================

// user_points 테이블 - 사용자 포인트 적립 내역
export const user_points = sqliteTable('user_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  payment_transaction_id: integer('payment_transaction_id').references(() => payment_transactions.id, { onDelete: 'set null' }),

  // 포인트 정보
  points_earned: integer('points_earned').notNull(), // 적립된 포인트 (결제금액의 1%)
  payment_amount: integer('payment_amount').notNull(), // 기준이 된 결제 금액

  // 월별 정산 정보
  month_year: text('month_year').notNull(), // 'YYYY-MM' 형식
  earned_at: text('earned_at').notNull(),   // KST DATETIME

  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('idx_user_points_user_id').on(table.user_id),
  monthYearIdx: index('idx_user_points_month_year').on(table.month_year),
  earnedAtIdx: index('idx_user_points_earned_at').on(table.earned_at),
  userMonthIdx: index('idx_user_points_user_month').on(table.user_id, table.month_year)
}));

// user_tiers 테이블 - 사용자 직급 정보
export const user_tiers = sqliteTable('user_tiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),

  // 현재 직급 정보
  current_tier: text('current_tier', {
    enum: ['gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier']
  }).notNull().default('no_tier'),
  current_points: integer('current_points').notNull().default(0),
  current_rank: integer('current_rank'), // 전체 순위 (null이면 순위 없음)

  // 월별 정산 정보
  month_year: text('month_year').notNull(), // 'YYYY-MM' 형식
  calculated_at: text('calculated_at').notNull(), // KST DATETIME (월별 정산 실행 시각)

  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('idx_user_tiers_user_id').on(table.user_id),
  monthYearIdx: index('idx_user_tiers_month_year').on(table.month_year),
  tierIdx: index('idx_user_tiers_tier').on(table.current_tier),
  rankIdx: index('idx_user_tiers_rank').on(table.current_rank),
  userMonthUnique: uniqueIndex('idx_user_tiers_user_month_unique').on(table.user_id, table.month_year)
}));

// monthly_rankings 테이블 - 월별 순위 히스토리
export const monthly_rankings = sqliteTable('monthly_rankings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),

  // 월별 성과 정보
  month_year: text('month_year').notNull(), // 'YYYY-MM' 형식
  final_points: integer('final_points').notNull(), // 해당 월 최종 포인트
  final_rank: integer('final_rank').notNull(), // 해당 월 최종 순위
  achieved_tier: text('achieved_tier', {
    enum: ['gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier']
  }).notNull(),

  // 통계 정보
  total_transactions: integer('total_transactions').notNull().default(0), // 해당 월 거래 횟수
  total_spent: integer('total_spent').notNull().default(0), // 해당 월 총 결제액

  // 기록 시간
  settlement_date: text('settlement_date').notNull(), // KST DATETIME (정산 완료 시각)

  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('idx_monthly_rankings_user_id').on(table.user_id),
  monthYearIdx: index('idx_monthly_rankings_month_year').on(table.month_year),
  rankIdx: index('idx_monthly_rankings_rank').on(table.final_rank),
  tierIdx: index('idx_monthly_rankings_tier').on(table.achieved_tier),
  userMonthUnique: uniqueIndex('idx_monthly_rankings_user_month_unique').on(table.user_id, table.month_year)
}));

// user_tier_current 테이블 - 현재 활성 사용자 직급 정보 (빠른 조회용)
export const user_tier_current = sqliteTable('user_tier_current', {
  user_id: text('user_id').primaryKey().references(() => User.id, { onDelete: 'cascade' }),

  // 현재 상태
  current_tier: text('current_tier', {
    enum: ['gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier']
  }).notNull().default('no_tier'),
  current_points: integer('current_points').notNull().default(0),
  current_rank: integer('current_rank'), // 현재 전체 순위

  // 이번 달 정보
  current_month: text('current_month').notNull(), // 'YYYY-MM' 형식

  // 최고 기록
  best_tier: text('best_tier', {
    enum: ['gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier']
  }).default('no_tier'),
  best_rank: integer('best_rank'), // 역대 최고 순위
  best_points: integer('best_points').default(0), // 역대 최고 포인트

  last_updated: text('last_updated').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  tierIdx: index('idx_user_tier_current_tier').on(table.current_tier),
  rankIdx: index('idx_user_tier_current_rank').on(table.current_rank),
  pointsIdx: index('idx_user_tier_current_points').on(table.current_points)
}));

// ================================================
// 타입 정의 (Type Exports)
// ================================================

export type UserType = typeof User.$inferSelect;
export type NewUserType = typeof User.$inferInsert;
export type UserRoleType = typeof UserRole.$inferSelect;
export type NewUserRoleType = typeof UserRole.$inferInsert;
export type UserRestrictionType = typeof UserRestriction.$inferSelect;
export type NewUserRestrictionType = typeof UserRestriction.$inferInsert;
export type SessionType = typeof Session.$inferSelect;
export type NewSessionType = typeof Session.$inferInsert;
export type LoginLogType = typeof LoginLog.$inferSelect;
export type NewLoginLogType = typeof LoginLog.$inferInsert;
export type PasskeyCredentialType = typeof PasskeyCredential.$inferSelect;
export type NewPasskeyCredentialType = typeof PasskeyCredential.$inferInsert;
export type AccountType = typeof account.$inferSelect;
export type NewAccountType = typeof account.$inferInsert;
export type VerificationType = typeof verification.$inferSelect;
export type NewVerificationType = typeof verification.$inferInsert;

export type DeviceCategoryType = typeof device_categories.$inferSelect;
export type NewDeviceCategoryType = typeof device_categories.$inferInsert;
export type DeviceTypeTable = typeof device_types.$inferSelect;
export type NewDeviceTypeTable = typeof device_types.$inferInsert;
export type DeviceType = typeof devices.$inferSelect;
export type NewDeviceType = typeof devices.$inferInsert;
export type PlayModeType = typeof play_modes.$inferSelect;
export type NewPlayModeType = typeof play_modes.$inferInsert;
export type MachineRuleType = typeof machine_rules.$inferSelect;
export type NewMachineRuleType = typeof machine_rules.$inferInsert;

export type TimeSlotType = typeof time_slots.$inferSelect;
export type NewTimeSlotType = typeof time_slots.$inferInsert;
export type RentalTimePolicyType = typeof rental_time_policy.$inferSelect;
export type NewRentalTimePolicyType = typeof rental_time_policy.$inferInsert;
export type UserRentalLimitType = typeof user_rental_limits.$inferSelect;
export type NewUserRentalLimitType = typeof user_rental_limits.$inferInsert;
export type ReservationType = typeof reservations.$inferSelect;
export type NewReservationType = typeof reservations.$inferInsert;

export type CheckInProcessType = typeof check_in_processes.$inferSelect;
export type NewCheckInProcessType = typeof check_in_processes.$inferInsert;
export type PaymentTransactionType = typeof payment_transactions.$inferSelect;
export type NewPaymentTransactionType = typeof payment_transactions.$inferInsert;
export type PaymentStatusHistoryType = typeof payment_status_history.$inferSelect;
export type NewPaymentStatusHistoryType = typeof payment_status_history.$inferInsert;
export type QrCodeManagerType = typeof qr_code_managers.$inferSelect;
export type NewQrCodeManagerType = typeof qr_code_managers.$inferInsert;
export type DailyPaymentStatsType = typeof daily_payment_stats.$inferSelect;
export type NewDailyPaymentStatsType = typeof daily_payment_stats.$inferInsert;
export type DeviceStatusLogType = typeof device_status_logs.$inferSelect;
export type NewDeviceStatusLogType = typeof device_status_logs.$inferInsert;

// 사용자 직급 시스템 타입
export type UserPointsType = typeof user_points.$inferSelect;
export type NewUserPointsType = typeof user_points.$inferInsert;
export type UserTiersType = typeof user_tiers.$inferSelect;
export type NewUserTiersType = typeof user_tiers.$inferInsert;
export type MonthlyRankingsType = typeof monthly_rankings.$inferSelect;
export type NewMonthlyRankingsType = typeof monthly_rankings.$inferInsert;
export type UserTierCurrentType = typeof user_tier_current.$inferSelect;
export type NewUserTierCurrentType = typeof user_tier_current.$inferInsert;

// ================================================

// ================================================
// 6. 콘텐츠 관리 테이블 (Content Management)
// ================================================

// content_pages 테이블 - 약관, 개인정보처리방침 등 콘텐츠 페이지
export const contentPages = sqliteTable('content_pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  page_type: text('page_type', { 
    enum: ['terms_of_service', 'privacy_policy', 'notice', 'guide'] 
  }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  version: text('version').notNull().default('1.0'),
  isPublished: integer('isPublished', { mode: 'boolean' }).notNull().default(false),
  publishedAt: text('publishedAt'), // KST DATETIME
  createdBy: text('createdBy').notNull(),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  pageTypeIdx: index('idx_content_pages_type').on(table.page_type),
  publishedIdx: index('idx_content_pages_published').on(table.isPublished),
  publishedAtIdx: index('idx_content_pages_published_at').on(table.publishedAt)
}));

// schedule_events 테이블 - 스케줄 이벤트 관리
export const scheduleEvents = sqliteTable('schedule_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  event_type: text('event_type', {
    enum: ['maintenance', 'special_event', 'tournament', 'closed']
  }).notNull(),
  start_date: text('start_date').notNull(), // DATE 형식
  end_date: text('end_date').notNull(),     // DATE 형식
  start_time: text('start_time'),           // TIME 형식 (선택적)
  end_time: text('end_time'),               // TIME 형식 (선택적)
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  affectedDevices: text('affectedDevices'), // JSON array of device IDs
  createdBy: text('createdBy').notNull(),
  updatedBy: text('updatedBy'),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  eventTypeIdx: index('idx_schedule_events_type').on(table.event_type),
  startDateIdx: index('idx_schedule_events_start_date').on(table.start_date),
  endDateIdx: index('idx_schedule_events_end_date').on(table.end_date),
  activeIdx: index('idx_schedule_events_active').on(table.isActive)
}));

// 타입 정의 추가
export type UserAgreementType = typeof userAgreements.$inferSelect;
export type NewUserAgreementType = typeof userAgreements.$inferInsert;
export type ContentPageType = typeof contentPages.$inferSelect;
export type NewContentPageType = typeof contentPages.$inferInsert;
export type ScheduleEventType = typeof scheduleEvents.$inferSelect;
export type NewScheduleEventType = typeof scheduleEvents.$inferInsert;

// 기존 호환성을 위한 별칭 (점진적 마이그레이션용)
export const UserCompat = User;
export const SessionCompat = session;  // 소문자 session 테이블 사용
export const Reservation = reservations;
export const Device = devices;