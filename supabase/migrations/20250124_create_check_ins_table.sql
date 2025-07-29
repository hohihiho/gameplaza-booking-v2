-- Create check_ins table for tracking reservation check-in/out status
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  device_id UUID NOT NULL REFERENCES devices(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL CHECK (status IN ('checked_in', 'checked_out', 'cancelled')),
  check_in_by UUID NOT NULL REFERENCES auth.users(id),
  check_out_by UUID REFERENCES auth.users(id),
  payment_amount INTEGER,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_check_ins_reservation_id ON check_ins(reservation_id);
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_device_id ON check_ins(device_id);
CREATE INDEX idx_check_ins_status ON check_ins(status);
CREATE INDEX idx_check_ins_check_in_time ON check_ins(check_in_time);

-- Enable RLS
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow authenticated users to view their own check-ins
CREATE POLICY "Users can view their own check-ins" ON check_ins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow staff and admin to view all check-ins
CREATE POLICY "Staff can view all check-ins" ON check_ins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- Allow staff and admin to create check-ins
CREATE POLICY "Staff can create check-ins" ON check_ins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- Allow staff and admin to update check-ins
CREATE POLICY "Staff can update check-ins" ON check_ins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_check_ins_updated_at
  BEFORE UPDATE ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();