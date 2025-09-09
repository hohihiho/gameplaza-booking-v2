const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * 자동화된 데이터베이스 동기화 시스템
 * 개발/프로덕션 환경간 데이터 일관성을 보장하는 통합 솔루션
 */
class DatabaseSyncSystem {
  constructor() {
    this.config = {
      sourceDb: 'database.sqlite',   // 마스터 데이터베이스
      targetDb: 'dev.db',           // 개발용 데이터베이스
      backupDir: 'backups',         // 백업 디렉토리
      syncTables: [                 // 동기화할 테이블 목록
        {
          name: 'content_pages',
          key: 'slug',
          excludeFields: ['created_by', 'updated_by'] // 외래 키 필드 제외
        }
      ]
    };
    
    this.ensureBackupDirectory();
  }
  
  /**
   * 백업 디렉토리 생성
   */
  ensureBackupDirectory() {
    const backupPath = path.join(process.cwd(), this.config.backupDir);
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
  }
  
  /**
   * 데이터베이스 백업 생성
   */
  async createBackup(dbName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sourceDbPath = path.join(process.cwd(), dbName);
    const backupPath = path.join(process.cwd(), this.config.backupDir, `${dbName}.${timestamp}.backup`);
    
    try {
      fs.copyFileSync(sourceDbPath, backupPath);
      console.log(`📦 백업 생성: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`❌ 백업 실패: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 테이블 스키마 비교
   */
  compareSchemas(sourceDb, targetDb, tableName) {
    const sourceSchema = sourceDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
    const targetSchema = targetDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
    
    if (!sourceSchema || !targetSchema) {
      console.warn(`⚠️ ${tableName} 테이블이 존재하지 않습니다`);
      return false;
    }
    
    return sourceSchema.sql === targetSchema.sql;
  }
  
  /**
   * 데이터 동기화 실행
   */
  async syncTable(sourceDb, targetDb, tableConfig) {
    const { name, key, excludeFields = [] } = tableConfig;
    
    console.log(`\n🔄 ${name} 테이블 동기화 중...`);
    
    // 소스 데이터 조회
    const sourceData = sourceDb.prepare(`SELECT * FROM ${name}`).all();
    console.log(`📋 소스 데이터: ${sourceData.length}개`);
    
    if (sourceData.length === 0) {
      console.log(`ℹ️ ${name} 테이블에 동기화할 데이터가 없습니다`);
      return { updated: 0, inserted: 0 };
    }
    
    // 타겟 데이터 조회
    const targetData = targetDb.prepare(`SELECT * FROM ${name}`).all();
    console.log(`📝 타겟 데이터: ${targetData.length}개`);
    
    // 컬럼 정보 가져오기
    const columns = sourceDb.prepare(`PRAGMA table_info(${name})`).all();
    const validColumns = columns
      .map(col => col.name)
      .filter(col => !excludeFields.includes(col));
    
    // 동적 쿼리 생성
    const updateColumns = validColumns.filter(col => col !== key);
    const updateQuery = `
      UPDATE ${name} 
      SET ${updateColumns.map(col => `${col} = ?`).join(', ')}
      WHERE ${key} = ?
    `;
    
    const insertQuery = `
      INSERT INTO ${name} (${validColumns.join(', ')}) 
      VALUES (${validColumns.map(() => '?').join(', ')})
    `;
    
    const updateStmt = targetDb.prepare(updateQuery);
    const insertStmt = targetDb.prepare(insertQuery);
    
    let updatedCount = 0;
    let insertedCount = 0;
    
    // 트랜잭션으로 실행
    const transaction = targetDb.transaction(() => {
      for (const sourceRow of sourceData) {
        const targetRow = targetData.find(row => row[key] === sourceRow[key]);
        
        if (targetRow) {
          // 업데이트
          const updateValues = updateColumns.map(col => sourceRow[col]);
          updateValues.push(sourceRow[key]); // WHERE 조건
          
          const result = updateStmt.run(...updateValues);
          if (result.changes > 0) {
            updatedCount++;
            console.log(`  ✅ ${sourceRow[key]} 업데이트`);
          }
        } else {
          // 삽입
          const insertValues = validColumns.map(col => sourceRow[col]);
          insertStmt.run(...insertValues);
          insertedCount++;
          console.log(`  ✨ ${sourceRow[key]} 신규 생성`);
        }
      }
    });
    
    transaction();
    
    return { updated: updatedCount, inserted: insertedCount };
  }
  
  /**
   * 전체 동기화 실행
   */
  async syncAll() {
    const sourceDbPath = path.join(process.cwd(), this.config.sourceDb);
    const targetDbPath = path.join(process.cwd(), this.config.targetDb);
    
    let sourceDb, targetDb;
    
    try {
      console.log('🚀 데이터베이스 동기화 시스템 시작');
      console.log(`📂 소스: ${this.config.sourceDb}`);
      console.log(`📂 타겟: ${this.config.targetDb}`);
      
      // 백업 생성
      await this.createBackup(this.config.targetDb);
      
      // 데이터베이스 연결
      sourceDb = new Database(sourceDbPath, { readonly: true });
      targetDb = new Database(targetDbPath);
      
      const totalResults = { updated: 0, inserted: 0 };
      
      // 각 테이블 동기화
      for (const tableConfig of this.config.syncTables) {
        // 스키마 검증
        const schemaMatch = this.compareSchemas(sourceDb, targetDb, tableConfig.name);
        if (!schemaMatch) {
          console.warn(`⚠️ ${tableConfig.name} 테이블 스키마가 다릅니다`);
        }
        
        // 데이터 동기화
        const result = await this.syncTable(sourceDb, targetDb, tableConfig);
        totalResults.updated += result.updated;
        totalResults.inserted += result.inserted;
      }
      
      // 결과 요약
      console.log('\n📊 동기화 완료 요약:');
      console.log(`  - 총 업데이트: ${totalResults.updated}개`);
      console.log(`  - 총 신규 생성: ${totalResults.inserted}개`);
      console.log(`  - 처리된 테이블: ${this.config.syncTables.length}개`);
      
      // 검증
      await this.verifySync();
      
      console.log('\n🎉 데이터베이스 동기화가 성공적으로 완료되었습니다!');
      
    } catch (error) {
      console.error('❌ 동기화 중 오류 발생:', error);
      throw error;
    } finally {
      if (sourceDb) sourceDb.close();
      if (targetDb) targetDb.close();
    }
  }
  
  /**
   * 동기화 검증
   */
  async verifySync() {
    console.log('\n🔍 동기화 검증 중...');
    
    const sourceDbPath = path.join(process.cwd(), this.config.sourceDb);
    const targetDbPath = path.join(process.cwd(), this.config.targetDb);
    
    const sourceDb = new Database(sourceDbPath, { readonly: true });
    const targetDb = new Database(targetDbPath, { readonly: true });
    
    try {
      for (const tableConfig of this.config.syncTables) {
        const sourceCnt = sourceDb.prepare(`SELECT COUNT(*) as cnt FROM ${tableConfig.name}`).get();
        const targetCnt = targetDb.prepare(`SELECT COUNT(*) as cnt FROM ${tableConfig.name}`).get();
        
        console.log(`  ${tableConfig.name}: 소스 ${sourceCnt.cnt}개 → 타겟 ${targetCnt.cnt}개`);
        
        if (sourceCnt.cnt === targetCnt.cnt) {
          console.log(`  ✅ ${tableConfig.name} 검증 통과`);
        } else {
          console.log(`  ⚠️ ${tableConfig.name} 데이터 수 불일치`);
        }
      }
    } finally {
      sourceDb.close();
      targetDb.close();
    }
  }
  
  /**
   * 감시 모드 (파일 변경 감지)
   */
  watchMode() {
    console.log('👀 파일 감시 모드 시작...');
    const sourceDbPath = path.join(process.cwd(), this.config.sourceDb);
    
    fs.watchFile(sourceDbPath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log(`\n📢 ${this.config.sourceDb} 파일 변경 감지!`);
        console.log('🔄 자동 동기화 시작...');
        this.syncAll().catch(console.error);
      }
    });
    
    console.log(`📁 감시 중: ${sourceDbPath}`);
    console.log('종료하려면 Ctrl+C를 누르세요');
  }
}

// CLI 인터페이스
if (require.main === module) {
  const syncSystem = new DatabaseSyncSystem();
  const command = process.argv[2];
  
  switch (command) {
    case 'sync':
      syncSystem.syncAll()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'watch':
      syncSystem.watchMode();
      break;
      
    default:
      console.log(`
🔧 데이터베이스 동기화 시스템

사용법:
  node database-sync-system.js sync   # 한 번만 동기화
  node database-sync-system.js watch  # 파일 변경 감시 모드

기능:
  ✅ 자동 백업 생성
  ✅ 스키마 검증
  ✅ 트랜잭션 기반 안전한 동기화
  ✅ 실시간 파일 감시
  ✅ 동기화 후 검증
      `);
  }
}

module.exports = DatabaseSyncSystem;