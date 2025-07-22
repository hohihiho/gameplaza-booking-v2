import { createAdminClient } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('계좌 관리 테이블 생성 시작...');
  
  try {
    const supabaseAdmin = createAdminClient();
    
    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'create-payment-accounts-table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL 실행
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('마이그레이션 오류:', error);
      process.exit(1);
    }
    
    console.log('계좌 관리 테이블 생성 완료!');
    
    // 샘플 데이터 추가 (테스트용)
    const { error: insertError } = await supabaseAdmin.from('payment_accounts').insert({
      bank_name: '국민은행',
      account_number: '123-456789-01-234',
      account_holder: '광주게임플라자',
      is_primary: true,
      is_active: true
    });
    
    if (insertError) {
      console.error('샘플 데이터 추가 오류:', insertError);
    } else {
      console.log('샘플 계좌 데이터 추가 완료!');
    }
    
  } catch (error) {
    console.error('예상치 못한 오류:', error);
    process.exit(1);
  }
}

runMigration();