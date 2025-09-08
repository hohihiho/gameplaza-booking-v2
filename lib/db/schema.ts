import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core'

// Better Auth 필수 테이블들
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
})

// 게임플라자 비즈니스 테이블들
export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  deviceNumber: integer("deviceNumber").notNull(),
  name: text("name").notNull(),
  typeId: text("typeId").references(() => deviceTypes.id),
  status: text("status").notNull().default('available'), // 'available' | 'in_use' | 'maintenance'
  floor: integer("floor").notNull(), // 1 또는 2
  location: text("location"),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  deviceId: text("deviceId").notNull().references(() => devices.id),
  startTime: integer("startTime", { mode: "timestamp" }).notNull(),
  endTime: integer("endTime", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default('pending'), // 'pending' | 'active' | 'completed' | 'cancelled'
  amount: integer("amount").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

// 관리자 테이블
export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  isSuperAdmin: integer("isSuperAdmin", { mode: "boolean" }).notNull().default(false),
  permissions: text("permissions"), // JSON string
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

// 영업 시간 스케줄
export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  floor1Start: text("floor1Start"),
  floor1End: text("floor1End"),
  floor2Start: text("floor2Start"),
  floor2End: text("floor2End"),
  floor1EventType: text("floor1EventType"), // 'early_open' | 'all_night' | 'early_close'
  floor2EventType: text("floor2EventType"),
  isHoliday: integer("isHoliday", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

// 약관 및 콘텐츠 페이지
export const contentPages = sqliteTable("content_pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(), // 'terms_of_service' | 'privacy_policy'
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

// 스케줄 이벤트 (운영 일정)
export const scheduleEvents = sqliteTable("schedule_events", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("eventType").notNull(), // 'early_open' | 'all_night' | 'early_close' | 'holiday'
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

// 기기 타입 테이블
export const deviceTypes = sqliteTable("device_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  modelName: text("modelName"),
  versionName: text("versionName"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export type User = typeof user.$inferSelect
export type Device = typeof devices.$inferSelect
export type Reservation = typeof reservations.$inferSelect
export type Admin = typeof admins.$inferSelect
export type Schedule = typeof schedules.$inferSelect
export type ContentPage = typeof contentPages.$inferSelect
export type ScheduleEvent = typeof scheduleEvents.$inferSelect
export type DeviceType = typeof deviceTypes.$inferSelect