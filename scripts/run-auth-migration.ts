#!/usr/bin/env tsx
/**
 * Better Auth 테이블을 위한 마이그레이션 실행 스크립트
 * accounts와 verifications 테이블을 생성합니다.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getDB } from '../lib/db/server';
import { sql } from 'drizzle-orm';

async function runAuthMigration() {
  const db = getDB();
  
  console.log('🔄 Better Auth 테이블 마이그레이션을 시작합니다...');
  
  try {
    // 마이그레이션 SQL 파일 읽기
    const migrationPath = join(process.cwd(), 'drizzle', '0001_better_auth_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // SQL 명령어들을 분리하여 실행
    const statements = migrationSQL
      .split('-->')
      .map(stmt => stmt.replace(/statement-breakpoint/g, '').trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 실행 중:', statement.substring(0, 50) + '...');
        await db.run(sql.raw(statement));
        console.log('✅ 완료');
      }
    }
    
    // 테이블이 생성되었는지 확인
    console.log('🔍 생성된 테이블 확인 중...');
    
    const accountsTableCheck = await db.run(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='accounts'
    `);
    
    const verificationsTableCheck = await db.run(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='verifications'  
    `);
    
    console.log('📊 테이블 생성 결과:');
    console.log(`  - accounts 테이블: ${accountsTableCheck ? '✅ 생성됨' : '❌ 실패'}`);
    console.log(`  - verifications 테이블: ${verificationsTableCheck ? '✅ 생성됨' : '❌ 실패'}`);
    
    console.log('🎉 마이그레이션이 완료되었습니다!');
    console.log('🔄 개발 서버를 재시작하여 변경사항을 반영하세요.');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error);
    
    if (error instanceof Error && error.message.includes('table accounts already exists')) {
      console.log('ℹ️  accounts 테이블이 이미 존재합니다.');
    }
    
    if (error instanceof Error && error.message.includes('table verifications already exists')) {
      console.log('ℹ️  verifications 테이블이 이미 존재합니다.');
    }
    
    // 테이블 존재 확인
    console.log('🔍 현재 테이블 상태 확인...');
    try {
      const tables = await db.all(sql`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('accounts', 'verifications')
        ORDER BY name
      `);
      
      console.log('📋 Better Auth 테이블 목록:');
      if (tables.length === 0) {
        console.log('  없음');
      } else {
        tables.forEach((table: any) => {
          console.log(`  ✅ ${table.name}`);
        });
      }
    } catch (checkError) {
      console.error('테이블 확인 중 오류:', checkError);
    }
    
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  runAuthMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}