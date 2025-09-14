-- Add reservation_number to reservations and indexes for Cloudflare D1
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_reservations_reservation_number ON reservations (reservation_number);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_number ON reservations (reservation_number);

