// 환경 변수 먼저 로드
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigrations() {
  try {
    // rental_time_slots 테이블 생성
    const createTableSQL = `
      -- rental_time_slots 테이블이 없으면 생성
      CREATE TABLE IF NOT EXISTS rental_time_slots (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
        slot_type TEXT NOT NULL CHECK (slot_type IN ('early', 'overnight')),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        credit_options JSONB NOT NULL DEFAULT '[]'::jsonb,
        enable_2p BOOLEAN NOT NULL DEFAULT false,
        price_2p_extra INTEGER,
        is_youth_time BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
      CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);

      -- rental_settings 테이블 생성
      CREATE TABLE IF NOT EXISTS rental_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        device_type_id UUID NOT NULL UNIQUE REFERENCES device_types(id) ON DELETE CASCADE,
        max_rental_units INTEGER,
        min_rental_hours INTEGER NOT NULL DEFAULT 1,
        max_rental_hours INTEGER NOT NULL DEFAULT 24,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- device_types에 rental_settings 컬럼 추가
      ALTER TABLE device_types 
      ADD COLUMN IF NOT EXISTS rental_settings JSONB DEFAULT '{}'::jsonb;
    `;

    console.log('Applying migrations...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (error) {
      console.error('Error applying migrations:', error);
      
      // RPC가 없으면 직접 실행 시도
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase.from('rental_time_slots').select('count');
      
      if (directError && directError.code === '42P01') {
        console.log('Table does not exist. Please create it manually in Supabase dashboard.');
        console.log('\nSQL to execute:\n');
        console.log(createTableSQL);
      }
    } else {
      console.log('Migrations applied successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigrations();