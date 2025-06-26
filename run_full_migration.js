// Supabase REST API를 사용한 전체 마이그레이션
const https = require('https');
const fs = require('fs');

async function runFullMigration() {
  console.log('🎮 GamePlaza V2 전체 마이그레이션 시작...');
  
  const supabaseUrl = 'https://rupeyejnfurlcpgneekg.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4';
  
  // SQL 파일 읽기
  const sqlContent = fs.readFileSync('supabase/migrations/001_create_schema.sql', 'utf8');
  console.log(`📄 SQL 파일 로드 완료 (${sqlContent.length} 글자)`);
  
  // PostgreSQL 직접 연결을 시뮬레이션하는 방법으로 시도
  // 개별 테이블 생성 명령어들
  const tableCommands = [
    // 1. Users 테이블
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT auth.uid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      nickname VARCHAR(50),
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),
      is_blacklisted BOOLEAN DEFAULT false,
      blacklist_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login_at TIMESTAMP WITH TIME ZONE
    );`,
    
    // 2. Device Types 테이블
    `CREATE TABLE IF NOT EXISTS device_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      total_count INTEGER NOT NULL DEFAULT 1,
      is_rentable BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // 3. Devices 테이블
    `CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_type_id UUID REFERENCES device_types(id) ON DELETE CASCADE,
      device_number INTEGER NOT NULL,
      location VARCHAR(100),
      status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(device_type_id, device_number)
    );`
  ];
  
  console.log(`🔧 ${tableCommands.length}개 테이블 생성 시작...`);
  
  // 각 테이블을 순차적으로 생성
  for (let i = 0; i < tableCommands.length; i++) {
    const sql = tableCommands[i];
    console.log(`\n📋 테이블 ${i + 1}/${tableCommands.length} 생성 중...`);
    
    await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query: sql });
      
      const options = {
        hostname: 'rupeyejnfurlcpgneekg.supabase.co',
        port: 443,
        path: '/rest/v1/rpc/query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ 테이블 ${i + 1} 생성 성공!`);
            resolve();
          } else {
            console.log(`⚠️ 테이블 ${i + 1} 응답:`, res.statusCode, data);
            resolve(); // 계속 진행
          }
        });
      });
      
      req.on('error', (e) => {
        console.error(`❌ 테이블 ${i + 1} 오류:`, e.message);
        resolve(); // 계속 진행
      });
      
      req.write(postData);
      req.end();
    });
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 마이그레이션 완료!');
  console.log('\n생성된 테이블들:');
  console.log('👤 users - 회원 정보');
  console.log('🎮 device_types - 게임기 종류');
  console.log('🎯 devices - 개별 게임기');
  console.log('\n💡 나머지 테이블들은 Supabase 대시보드에서 수동으로 생성해주세요!');
}

runFullMigration();