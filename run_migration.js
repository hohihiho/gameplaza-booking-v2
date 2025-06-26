// HTTP 요청으로 Supabase SQL 실행
const https = require('https');
const fs = require('fs');

async function runMigration() {
  console.log('🎮 GamePlaza V2 마이그레이션 시작...');
  
  // SQL 파일 읽기
  const sqlContent = fs.readFileSync('supabase/migrations/001_create_schema.sql', 'utf8');
  console.log(`📄 SQL 파일 로드 완료 (${sqlContent.length} 글자)`);
  
  // SQL을 개별 명령어로 분할
  const sqlCommands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--'));
  
  console.log(`🔧 총 ${sqlCommands.length}개 명령어 실행 예정`);
  
  // Supabase REST API 설정
  const supabaseUrl = 'https://rupeyejnfurlcpgneekg.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4';
  
  // 첫 번째 테이블만 테스트로 생성
  const firstTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
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
    );
  `;
  
  const postData = JSON.stringify({
    query: firstTableSQL
  });
  
  const options = {
    hostname: 'rupeyejnfurlcpgneekg.supabase.co',
    port: 443,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`✅ 응답 상태: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('🎉 테이블 생성 성공!');
        console.log('응답:', data);
      } else {
        console.log('❌ 오류 응답:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ 요청 오류:', e.message);
  });
  
  req.write(postData);
  req.end();
}

runMigration();