#!/usr/bin/env tsx
/**
 * Better Auth 테이블 존재 여부 확인 스크립트
 */

import { getDB } from '../lib/db/server';
import { sql } from 'drizzle-orm';

async function checkAuthTables() {
  const db = getDB();
  
  console.log('🔍 Better Auth 테이블 존재 여부 확인 중...');
  
  try {
    // 모든 테이블 목록 조회
    const allTables = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    console.log('📋 전체 테이블 목록:');
    allTables.forEach((table: any) => {
      console.log(`  - ${table.name}`);
    });
    
    console.log('\n🎯 Better Auth 필수 테이블 확인:');
    
    // accounts 테이블 확인
    const accountsTable = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='accounts'
    `);
    
    console.log(`  ✅ accounts: ${accountsTable.length > 0 ? '존재함' : '❌ 누락'}`);
    
    // verifications 테이블 확인
    const verificationsTable = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='verifications'
    `);
    
    console.log(`  ✅ verifications: ${verificationsTable.length > 0 ? '존재함' : '❌ 누락'}`);
    
    // users 테이블 확인
    const usersTable = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    
    console.log(`  ✅ users: ${usersTable.length > 0 ? '존재함' : '❌ 누락'}`);
    
    // sessions 테이블 확인
    const sessionsTable = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sessions'
    `);
    
    console.log(`  ✅ sessions: ${sessionsTable.length > 0 ? '존재함' : '❌ 누락'}`);
    
    // 누락된 테이블이 있는지 확인
    const missingTables = [];
    if (accountsTable.length === 0) missingTables.push('accounts');
    if (verificationsTable.length === 0) missingTables.push('verifications');
    if (usersTable.length === 0) missingTables.push('users');
    if (sessionsTable.length === 0) missingTables.push('sessions');
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  누락된 테이블: ${missingTables.join(', ')}`);
      console.log('💡 누락된 테이블을 생성해야 합니다.');
    } else {
      console.log('\n🎉 모든 Better Auth 테이블이 존재합니다!');
      console.log('🔄 로그인 기능을 테스트해보세요.');
    }
    
  } catch (error) {
    console.error('❌ 테이블 확인 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkAuthTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}