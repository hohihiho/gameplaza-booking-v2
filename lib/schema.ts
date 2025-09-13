import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name'),
  image: text('image'),
  role: text('role').default('user'), // user, vip, admin, super_admin
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  banExpiresAt: integer('ban_expires_at', { mode: 'timestamp' }),
  banReason: text('ban_reason'),
  warningCount: integer('warning_count').default(0),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  phoneNumber: text('phone_number'),
  birthDate: text('birth_date'),
  profileCompleted: integer('profile_completed', { mode: 'boolean' }).default(false),
});

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

// Accounts table (OAuth providers)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Verification codes
export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Devices table
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // PS5, XBOX, SWITCH, PC, RACING
  status: text('status').default('available'), // available, in_use, maintenance
  currentUserId: text('current_user_id').references(() => users.id),
  position: integer('position'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Reservations table
export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull().references(() => devices.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  status: text('status').default('pending'), // pending, confirmed, completed, cancelled
  paymentStatus: text('payment_status').default('pending'), // pending, paid, refunded
  paymentAmount: real('payment_amount'),
  checkinAt: integer('checkin_at', { mode: 'timestamp' }),
  checkoutAt: integer('checkout_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Time slots configuration
export const timeSlots = sqliteTable('time_slots', {
  id: text('id').primaryKey(),
  deviceType: text('device_type').notNull(),
  dayType: text('day_type').notNull(), // weekday, weekend
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  duration: integer('duration').notNull(), // in minutes
  price: real('price').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Rankings table
export const rankings = sqliteTable('rankings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull(),
  gameName: text('game_name').notNull(),
  score: integer('score').notNull(),
  deviceType: text('device_type').notNull(),
  playDate: text('play_date').notNull(),
  playTime: text('play_time').notNull(),
  weekNumber: integer('week_number'),
  monthNumber: integer('month_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Banned words table
export const bannedWords = sqliteTable('banned_words', {
  id: text('id').primaryKey(),
  word: text('word').notNull().unique(),
  severity: text('severity').default('low'), // low, medium, high
  reason: text('reason'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Terms of service
export const terms = sqliteTable('terms', {
  id: text('id').primaryKey(),
  version: text('version').notNull().unique(),
  content: text('content').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Business info
export const businessInfo = sqliteTable('business_info', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  hours: text('hours').notNull(),
  description: text('description'),
  policies: text('policies'),
  updatedBy: text('updated_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Activity logs
export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  metadata: text('metadata'), // JSON string
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Export all tables
export default {
  users,
  sessions,
  accounts,
  verifications,
  devices,
  reservations,
  timeSlots,
  rankings,
  bannedWords,
  terms,
  businessInfo,
  activityLogs,
};