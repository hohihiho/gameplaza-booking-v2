const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase Admin 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTables() {
  console.log('🚀 Starting table creation...\n');

  try {
    // 1. 먼저 기존 테이블 확인
    console.log('📋 Checking existing tables...');
    const { data: existingTables, error: checkError } = await supabase
      .from('rental_time_slots')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('✅ Table does not exist, proceeding with creation...\n');
    } else if (!checkError) {
      console.log('⚠️  Table already exists. Do you want to drop and recreate? (This will delete all data!)');
      console.log('   If yes, please run: node create_rental_tables.js --force');
      
      if (process.argv[2] !== '--force') {
        process.exit(0);
      }
    }

    // 2. SQL 실행을 위한 함수
    const executeSql = async (sql, description) => {
      console.log(`\n📌 ${description}...`);
      
      // Supabase의 SQL 실행을 위해 직접 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql })
      });

      if (!response.ok) {
        // RPC 함수가 없을 수 있으므로 대체 방법 시도
        console.log('   ⚠️  Direct SQL execution not available, saving SQL for manual execution');
        return false;
      }

      console.log(`   ✅ ${description} completed`);
      return true;
    };

    // 3. 테이블 생성 SQL
    const createTablesSQL = `
      -- Drop existing tables if force flag is used
      ${process.argv[2] === '--force' ? 'DROP TABLE IF EXISTS rental_time_slots CASCADE;' : ''}
      ${process.argv[2] === '--force' ? 'DROP TABLE IF EXISTS rental_settings CASCADE;' : ''}

      -- Create rental_time_slots table
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
      CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);
      CREATE INDEX IF NOT EXISTS idx_rental_time_slots_time ON rental_time_slots(start_time, end_time);

      -- Create rental_settings table
      CREATE TABLE IF NOT EXISTS rental_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        device_type_id UUID NOT NULL UNIQUE REFERENCES device_types(id) ON DELETE CASCADE,
        max_rental_units INTEGER,
        min_rental_hours INTEGER NOT NULL DEFAULT 1,
        max_rental_hours INTEGER NOT NULL DEFAULT 24,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_rental_settings_device_type ON rental_settings(device_type_id);

      -- Add column to device_types if not exists
      ALTER TABLE device_types 
      ADD COLUMN IF NOT EXISTS rental_settings JSONB DEFAULT '{}'::jsonb;
    `;

    // 4. RLS 정책 SQL
    const rlsPoliciesSQL = `
      -- Enable RLS
      ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;
      ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if any
      DROP POLICY IF EXISTS "rental_time_slots_admin_all" ON rental_time_slots;
      DROP POLICY IF EXISTS "rental_time_slots_public_read" ON rental_time_slots;
      DROP POLICY IF EXISTS "rental_settings_admin_all" ON rental_settings;
      DROP POLICY IF EXISTS "rental_settings_public_read" ON rental_settings;

      -- Create policies (temporarily allow all authenticated users)
      CREATE POLICY "rental_time_slots_admin_all" ON rental_time_slots
        FOR ALL TO authenticated
        USING (true);

      CREATE POLICY "rental_time_slots_public_read" ON rental_time_slots
        FOR SELECT TO anon
        USING (true);

      CREATE POLICY "rental_settings_admin_all" ON rental_settings
        FOR ALL TO authenticated
        USING (true);

      CREATE POLICY "rental_settings_public_read" ON rental_settings
        FOR SELECT TO anon
        USING (true);
    `;

    // 5. 트리거 SQL
    const triggersSQL = `
      -- Create or replace update function
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Drop existing triggers if any
      DROP TRIGGER IF EXISTS update_rental_time_slots_updated_at ON rental_time_slots;
      DROP TRIGGER IF EXISTS update_rental_settings_updated_at ON rental_settings;

      -- Create triggers
      CREATE TRIGGER update_rental_time_slots_updated_at
        BEFORE UPDATE ON rental_time_slots
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();

      CREATE TRIGGER update_rental_settings_updated_at
        BEFORE UPDATE ON rental_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `;

    // SQL 실행 시도
    const tableCreated = await executeSql(createTablesSQL, 'Creating tables');
    const rlsCreated = await executeSql(rlsPoliciesSQL, 'Setting up RLS policies');
    const triggersCreated = await executeSql(triggersSQL, 'Creating triggers');

    // 직접 SQL 실행이 안되면 수동 실행 안내
    if (!tableCreated || !rlsCreated || !triggersCreated) {
      console.log('\n⚠️  Could not execute SQL directly. Please run the following SQL in Supabase Dashboard:\n');
      console.log('1. Go to: https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/sql/new');
      console.log('2. Copy and paste the SQL from: setup_rental_tables.sql');
      console.log('3. Click "Run" button\n');
      
      // SQL 파일 저장
      const fs = require('fs');
      const fullSQL = `${createTablesSQL}\n\n${rlsPoliciesSQL}\n\n${triggersSQL}`;
      fs.writeFileSync('setup_rental_tables_complete.sql', fullSQL);
      console.log('📄 Complete SQL saved to: setup_rental_tables_complete.sql');
    } else {
      console.log('\n✅ All tables created successfully!');
      
      // 테이블 생성 확인
      const { data: checkData, error: finalError } = await supabase
        .from('rental_time_slots')
        .select('id')
        .limit(1);
      
      if (!finalError) {
        console.log('✅ Table creation verified!');
        
        // API 파일 교체
        console.log('\n📄 Updating API routes...');
        const fs = require('fs');
        if (fs.existsSync('app/api/admin/rental-time-slots/route_new.ts')) {
          fs.renameSync('app/api/admin/rental-time-slots/route.ts', 'app/api/admin/rental-time-slots/route_old.ts');
          fs.renameSync('app/api/admin/rental-time-slots/route_new.ts', 'app/api/admin/rental-time-slots/route.ts');
          console.log('✅ API routes updated!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Please check your environment variables and try again.');
  }
}

// 실행
createTables();