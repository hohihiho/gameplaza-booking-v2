-- Add youth flag to rental time blocks
ALTER TABLE rental_time_blocks ADD COLUMN IF NOT EXISTS is_youth_time INTEGER DEFAULT 0;

