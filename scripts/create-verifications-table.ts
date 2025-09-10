#!/usr/bin/env tsx
/**
 * verifications 테이블만 생성하는 스크립트
 */

import { getDB } from '../lib/db/server';
import { sql } from 'drizzle-orm';

async function createVerificationsTable() {
  const db = getDB();
  
  console.log('🔄 verifications 테이블을 생성합니다...');
  
  try {
    // verifications 테이블 생성
    await db.run(sql`
      CREATE TABLE verifications (
        id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
        identifier text NOT NULL,
        value text NOT NULL,
        expires_at text NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    console.log('✅ verifications 테이블 생성 완료');
    
    // 인덱스 생성
    await db.run(sql`CREATE INDEX idx_verifications_identifier ON verifications (identifier)`);
    console.log('✅ identifier 인덱스 생성 완료');
    
    await db.run(sql`CREATE INDEX idx_verifications_value ON verifications (value)`);
    console.log('✅ value 인덱스 생성 완료');
    
    // 생성 확인
    const tableCheck = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='verifications'
    `);
    
    if (tableCheck.length > 0) {
      console.log('🎉 verifications 테이블이 성공적으로 생성되었습니다!');
      console.log('🔄 개발 서버를 재시작하여 Better Auth 로그인을 테스트해보세요.');
    } else {
      console.log('❌ 테이블 생성 검증에 실패했습니다.');
      process.exit(1);
    }
    
  } catch (error: any) {
    if (error.message && error.message.includes('table verifications already exists')) {
      console.log('ℹ️  verifications 테이블이 이미 존재합니다. 문제없습니다!');
      console.log('🔄 개발 서버를 재시작하여 Better Auth 로그인을 테스트해보세요.');
    } else {
      console.error('❌ verifications 테이블 생성 중 오류 발생:', error);
      process.exit(1);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  createVerificationsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}