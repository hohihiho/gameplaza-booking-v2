CREATE TABLE `admins` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`permissions` text,
	`is_super_admin` integer DEFAULT false,
	`bank_account` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admins_user` ON `admins` (`user_id`);--> statement-breakpoint
CREATE TABLE `banned_words` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`word` text NOT NULL,
	`category` text DEFAULT 'general',
	`severity` integer DEFAULT 1,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `banned_words_word_unique` ON `banned_words` (`word`);--> statement-breakpoint
CREATE TABLE `checkins` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`reservation_id` text NOT NULL,
	`checked_in_at` integer DEFAULT CURRENT_TIMESTAMP,
	`checked_out_at` integer,
	`actual_end_time` integer,
	`overtime_minutes` integer DEFAULT 0,
	`additional_charges` integer DEFAULT 0,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkins_reservation_id_unique` ON `checkins` (`reservation_id`);--> statement-breakpoint
CREATE INDEX `idx_checkins_reservation` ON `checkins` (`reservation_id`);--> statement-breakpoint
CREATE TABLE `device_categories` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_categories_name_unique` ON `device_categories` (`name`);--> statement-breakpoint
CREATE TABLE `device_types` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`hourly_rate` integer DEFAULT 0 NOT NULL,
	`daily_max_hours` integer DEFAULT 8,
	`requires_approval` integer DEFAULT false,
	`icon_url` text,
	`category_id` text,
	`model_name` text,
	`version_name` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_rentable` integer DEFAULT true NOT NULL,
	`play_modes` text,
	`rental_settings` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`category_id`) REFERENCES `device_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_types_name_unique` ON `device_types` (`name`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`name` text NOT NULL,
	`device_type_id` text NOT NULL,
	`device_number` integer NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`location` text,
	`serial_number` text,
	`specifications` text,
	`notes` text,
	`last_maintenance` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`device_type_id`) REFERENCES `device_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_devices_type` ON `devices` (`device_type_id`);--> statement-breakpoint
CREATE INDEX `idx_devices_status` ON `devices` (`status`);--> statement-breakpoint
CREATE INDEX `idx_devices_name` ON `devices` (`name`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false,
	`metadata` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_created_at` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE TABLE `payment_accounts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`account_holder` text NOT NULL,
	`is_primary` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_payment_accounts_primary` ON `payment_accounts` (`is_primary`);--> statement-breakpoint
CREATE INDEX `idx_payment_accounts_active` ON `payment_accounts` (`is_active`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`reservation_id` text,
	`amount` integer NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`transaction_id` text,
	`metadata` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payments_reservation` ON `payments` (`reservation_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`status`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_email` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text,
	`auth` text,
	`user_agent` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_user_email` ON `push_subscriptions` (`user_email`);--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_endpoint` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_enabled` ON `push_subscriptions` (`enabled`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_amount` integer DEFAULT 0,
	`notes` text,
	`admin_notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reservations_user` ON `reservations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_reservations_device` ON `reservations` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_reservations_status` ON `reservations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_reservations_time` ON `reservations` (`start_time`,`end_time`);--> statement-breakpoint
CREATE INDEX `idx_reservations_created_at` ON `reservations` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reservations_device_time_conflict` ON `reservations` (`device_id`,`start_time`,`end_time`) WHERE status IN ('confirmed', 'checked_in');--> statement-breakpoint
CREATE TABLE `schedule_events` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_auto_generated` integer DEFAULT false,
	`source_type` text,
	`source_reference` text,
	`title` text,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_schedule_events_date` ON `schedule_events` (`date`);--> statement-breakpoint
CREATE INDEX `idx_schedule_events_type` ON `schedule_events` (`type`);--> statement-breakpoint
CREATE INDEX `idx_schedule_events_date_type` ON `schedule_events` (`date`,`type`);--> statement-breakpoint
CREATE INDEX `idx_schedule_events_auto_generated` ON `schedule_events` (`is_auto_generated`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`date` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`is_holiday` integer DEFAULT false,
	`is_special_day` integer DEFAULT false,
	`open_time` text DEFAULT '10:00' NOT NULL,
	`close_time` text DEFAULT '22:00' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_schedules_date` ON `schedules` (`date`);--> statement-breakpoint
CREATE INDEX `idx_schedules_day_of_week` ON `schedules` (`day_of_week`);--> statement-breakpoint
CREATE INDEX `idx_schedules_holiday` ON `schedules` (`is_holiday`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token_expires_at` text NOT NULL,
	`refresh_token_expires_at` text NOT NULL,
	`device_info` text,
	`ip_address` text,
	`user_agent` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_activity_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'user' NOT NULL,
	`profile_image_url` text,
	`marketing_consent` integer DEFAULT false,
	`marketing_agreed` integer DEFAULT false,
	`push_notifications_enabled` integer DEFAULT false,
	`last_login_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_users_created_at` ON `users` (`created_at`);