-- Create time_adjustments table for tracking reservation time changes
CREATE TABLE IF NOT EXISTS time_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  original_start_time TIMESTAMPTZ NOT NULL,
  original_end_time TIMESTAMPTZ NOT NULL,
  actual_start_time TIMESTAMPTZ NOT NULL,
  actual_end_time TIMESTAMPTZ NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('admin_late', 'system_error', 'customer_extend', 'early_finish', 'other')),
  reason_detail TEXT,
  adjusted_by UUID NOT NULL REFERENCES auth.users(id),
  adjusted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_time_adjustments_reservation_id ON time_adjustments(reservation_id);
CREATE INDEX idx_time_adjustments_adjusted_by ON time_adjustments(adjusted_by);
CREATE INDEX idx_time_adjustments_adjusted_at ON time_adjustments(adjusted_at);

-- Enable RLS
ALTER TABLE time_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow authenticated users to view their own time adjustments
CREATE POLICY "Users can view their own time adjustments" ON time_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = time_adjustments.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

-- Allow staff and admin to view all time adjustments
CREATE POLICY "Staff can view all time adjustments" ON time_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- Allow staff and admin to create time adjustments
CREATE POLICY "Staff can create time adjustments" ON time_adjustments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_time_adjustments_updated_at
  BEFORE UPDATE ON time_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();