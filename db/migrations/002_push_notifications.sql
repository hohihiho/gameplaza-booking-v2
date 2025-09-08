-- Push notifications migration
-- Adding push subscriptions table and marketing consent to users

-- Add marketing consent and push notification settings to users table
-- Note: These columns might already exist from the main schema
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we'll handle this in the app

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_email TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Indexes for push subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON push_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON push_subscriptions(enabled);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_unique ON push_subscriptions(user_email, endpoint);

-- Trigger for push_subscriptions updated_at
CREATE TRIGGER IF NOT EXISTS update_push_subscriptions_updated_at
  AFTER UPDATE ON push_subscriptions
  BEGIN
    UPDATE push_subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
  END;