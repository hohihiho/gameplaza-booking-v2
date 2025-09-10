-- Better Auth 추가 테이블 마이그레이션
-- accounts 테이블과 verifications 테이블 추가

CREATE TABLE `accounts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` text,
	`refresh_token_expires_at` text,
	`scope` text,
	`password` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_user_id` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_accounts_provider` ON `accounts` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_accounts_account_provider` ON `accounts` (`account_id`,`provider_id`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verifications_identifier` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `idx_verifications_value` ON `verifications` (`value`);