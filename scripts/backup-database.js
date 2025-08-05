#!/usr/bin/env node

/**
 * 게임플라자 데이터베이스 백업 시스템
 * Supabase PostgreSQL 데이터를 로컬 및 클라우드에 백업
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = 30; // 최대 보관 일수
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 환경 변수 로드
    require('dotenv').config({ path: '.env.local' });
    
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.dbUrl = process.env.DATABASE_URL; // pg_dump용
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.initBackupDirectory();
  }

  initBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // 백업 타입별 디렉토리 생성
    ['sql', 'json', 'logs'].forEach(type => {
      const dir = path.join(this.backupDir, type);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    // 로그 파일에 기록
    const logFile = path.join(this.backupDir, 'logs', `backup-${this.timestamp.split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
  }

  // PostgreSQL pg_dump를 사용한 완전 백업
  async createSqlBackup() {
    this.log('SQL 백업 시작', 'INFO');
    
    if (!this.dbUrl) {
      this.log('DATABASE_URL이 설정되지 않았습니다. SQL 백업을 건너뜁니다.', 'WARN');
      return false;
    }

    const backupFile = path.join(this.backupDir, 'sql', `gameplaza-${this.timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', [
        this.dbUrl,
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '--verbose',
        '--file', backupFile
      ]);

      let errorOutput = '';
      
      pgDump.stderr.on('data', (data) => {
        const output = data.toString();
        // pg_dump의 진행 상황은 stderr로 출력됨
        if (output.includes('NOTICE') || output.includes('dumping')) {
          this.log(`pg_dump: ${output.trim()}`, 'DEBUG');
        } else {
          errorOutput += output;
        }
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          const stats = fs.statSync(backupFile);
          this.log(`SQL 백업 완료: ${backupFile} (크기: ${(stats.size / 1024 / 1024).toFixed(2)}MB)`, 'INFO');
          resolve(backupFile);
        } else {
          this.log(`SQL 백업 실패 (코드: ${code}): ${errorOutput}`, 'ERROR');
          reject(new Error(`pg_dump failed with code ${code}`));
        }
      });
    });
  }

  // Supabase API를 사용한 JSON 백업 (테이블별)
  async createJsonBackup() {
    this.log('JSON 백업 시작', 'INFO');
    
    const tables = [
      'users',
      'devices', 
      'device_groups',
      'reservations',
      'time_slots',
      'analytics_events',
      'feedback',
      'announcements'
    ];

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };

    let totalRecords = 0;

    for (const table of tables) {
      try {
        this.log(`테이블 ${table} 백업 중...`, 'INFO');
        
        const { data, error } = await this.supabase
          .from(table)
          .select('*');

        if (error) {
          this.log(`테이블 ${table} 백업 오류: ${error.message}`, 'ERROR');
          continue;
        }

        backupData.tables[table] = data;
        totalRecords += data.length;
        
        this.log(`테이블 ${table}: ${data.length}개 레코드 백업 완료`, 'INFO');
        
      } catch (err) {
        this.log(`테이블 ${table} 백업 중 예외 발생: ${err.message}`, 'ERROR');
      }
    }

    // JSON 파일로 저장
    const backupFile = path.join(this.backupDir, 'json', `gameplaza-${this.timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    const stats = fs.statSync(backupFile);
    this.log(`JSON 백업 완료: ${backupFile} (총 ${totalRecords}개 레코드, 크기: ${(stats.size / 1024 / 1024).toFixed(2)}MB)`, 'INFO');
    
    return backupFile;
  }

  // 데이터베이스 스키마만 백업
  async createSchemaBackup() {
    this.log('스키마 백업 시작', 'INFO');
    
    if (!this.dbUrl) {
      this.log('DATABASE_URL이 설정되지 않았습니다. 스키마 백업을 건너뜁니다.', 'WARN');
      return false;
    }

    const schemaFile = path.join(this.backupDir, 'sql', `schema-${this.timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', [
        this.dbUrl,
        '--schema-only',
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '--file', schemaFile
      ]);

      pgDump.on('close', (code) => {
        if (code === 0) {
          this.log(`스키마 백업 완료: ${schemaFile}`, 'INFO');
          resolve(schemaFile);
        } else {
          this.log(`스키마 백업 실패 (코드: ${code})`, 'ERROR');
          reject(new Error(`Schema backup failed with code ${code}`));
        }
      });
    });
  }

  // 백업 검증
  async verifyBackup(backupFile) {
    this.log(`백업 파일 검증 중: ${backupFile}`, 'INFO');
    
    if (!fs.existsSync(backupFile)) {
      this.log('백업 파일이 존재하지 않습니다', 'ERROR');
      return false;
    }

    const stats = fs.statSync(backupFile);
    
    if (stats.size === 0) {
      this.log('백업 파일이 비어있습니다', 'ERROR');
      return false;
    }

    if (backupFile.endsWith('.json')) {
      try {
        const content = fs.readFileSync(backupFile, 'utf8');
        const data = JSON.parse(content);
        
        if (!data.timestamp || !data.tables) {
          this.log('JSON 백업 파일 형식이 올바르지 않습니다', 'ERROR');
          return false;
        }
        
        const tableCount = Object.keys(data.tables).length;
        this.log(`JSON 백업 검증 성공: ${tableCount}개 테이블`, 'INFO');
        
      } catch (err) {
        this.log(`JSON 백업 파일 파싱 오류: ${err.message}`, 'ERROR');
        return false;
      }
    }

    this.log(`백업 파일 검증 완료: 크기 ${(stats.size / 1024 / 1024).toFixed(2)}MB`, 'INFO');
    return true;
  }

  // 오래된 백업 정리
  async cleanupOldBackups() {
    this.log('오래된 백업 정리 중...', 'INFO');
    
    const backupTypes = ['sql', 'json'];
    let deletedCount = 0;
    
    for (const type of backupTypes) {
      const typeDir = path.join(this.backupDir, type);
      
      if (!fs.existsSync(typeDir)) continue;
      
      const files = fs.readdirSync(typeDir)
        .filter(file => file.startsWith('gameplaza-') || file.startsWith('schema-'))
        .map(file => ({
          name: file,
          path: path.join(typeDir, file),
          mtime: fs.statSync(path.join(typeDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // 최신순 정렬

      // 최대 보관 개수를 초과하는 파일들 삭제
      const filesToDelete = files.slice(this.maxBackups);
      
      for (const file of filesToDelete) {
        try {
          fs.unlinkSync(file.path);
          this.log(`오래된 백업 삭제: ${file.name}`, 'INFO');
          deletedCount++;
        } catch (err) {
          this.log(`백업 삭제 오류: ${file.name} - ${err.message}`, 'ERROR');
        }
      }
    }
    
    if (deletedCount > 0) {
      this.log(`총 ${deletedCount}개의 오래된 백업을 정리했습니다`, 'INFO');
    } else {
      this.log('정리할 오래된 백업이 없습니다', 'INFO');
    }
  }

  // 백업 상태 리포트
  getBackupStatus() {
    const status = {
      lastBackup: null,
      totalBackups: 0,
      totalSize: 0,
      backupsByType: {}
    };

    const backupTypes = ['sql', 'json'];
    
    for (const type of backupTypes) {
      const typeDir = path.join(this.backupDir, type);
      status.backupsByType[type] = { count: 0, size: 0, latest: null };
      
      if (!fs.existsSync(typeDir)) continue;
      
      const files = fs.readdirSync(typeDir)
        .filter(file => file.startsWith('gameplaza-') || file.startsWith('schema-'))
        .map(file => {
          const filePath = path.join(typeDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            mtime: stats.mtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.mtime - a.mtime);

      status.backupsByType[type].count = files.length;
      status.backupsByType[type].size = files.reduce((sum, f) => sum + f.size, 0);
      status.backupsByType[type].latest = files[0]?.mtime || null;
      
      if (files[0] && (!status.lastBackup || files[0].mtime > status.lastBackup)) {
        status.lastBackup = files[0].mtime;
      }
      
      status.totalBackups += files.length;
      status.totalSize += status.backupsByType[type].size;
    }

    return status;
  }

  // 전체 백업 실행
  async runFullBackup() {
    this.log('=== 전체 데이터베이스 백업 시작 ===', 'INFO');
    
    const results = {
      success: false,
      files: [],
      errors: []
    };

    try {
      // 1. JSON 백업 (항상 가능)
      try {
        const jsonFile = await this.createJsonBackup();
        if (await this.verifyBackup(jsonFile)) {
          results.files.push(jsonFile);
        }
      } catch (err) {
        results.errors.push(`JSON 백업 실패: ${err.message}`);
      }

      // 2. SQL 백업 (pg_dump 필요)
      try {
        const sqlFile = await this.createSqlBackup();
        if (sqlFile && await this.verifyBackup(sqlFile)) {
          results.files.push(sqlFile);
        }
      } catch (err) {
        results.errors.push(`SQL 백업 실패: ${err.message}`);
      }

      // 3. 스키마 백업
      try {
        const schemaFile = await this.createSchemaBackup();
        if (schemaFile && await this.verifyBackup(schemaFile)) {
          results.files.push(schemaFile);
        }
      } catch (err) {
        results.errors.push(`스키마 백업 실패: ${err.message}`);
      }

      // 4. 오래된 백업 정리
      await this.cleanupOldBackups();

      results.success = results.files.length > 0;
      
      if (results.success) {
        this.log(`=== 백업 완료: ${results.files.length}개 파일 생성 ===`, 'INFO');
        results.files.forEach(file => {
          this.log(`  - ${path.basename(file)}`, 'INFO');
        });
      } else {
        this.log('=== 백업 실패: 생성된 파일 없음 ===', 'ERROR');
      }

      if (results.errors.length > 0) {
        this.log('백업 중 발생한 오류:', 'WARN');
        results.errors.forEach(error => {
          this.log(`  - ${error}`, 'WARN');
        });
      }

    } catch (err) {
      this.log(`백업 중 예상치 못한 오류: ${err.message}`, 'ERROR');
      results.errors.push(err.message);
    }

    return results;
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const backup = new DatabaseBackup();

  try {
    if (args.length === 0 || args[0] === 'full') {
      await backup.runFullBackup();
      
    } else if (args[0] === 'json') {
      await backup.createJsonBackup();
      
    } else if (args[0] === 'sql') {
      await backup.createSqlBackup();
      
    } else if (args[0] === 'schema') {
      await backup.createSchemaBackup();
      
    } else if (args[0] === 'status') {
      const status = backup.getBackupStatus();
      console.log('\n=== 백업 상태 ===');
      console.log(`마지막 백업: ${status.lastBackup ? status.lastBackup.toLocaleString('ko-KR') : '없음'}`);
      console.log(`총 백업 파일: ${status.totalBackups}개`);
      console.log(`총 크기: ${(status.totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      Object.entries(status.backupsByType).forEach(([type, info]) => {
        console.log(`\n${type.toUpperCase()} 백업:`);
        console.log(`  - 파일 수: ${info.count}개`);
        console.log(`  - 크기: ${(info.size / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  - 최신: ${info.latest ? info.latest.toLocaleString('ko-KR') : '없음'}`);
      });
      
    } else if (args[0] === 'cleanup') {
      await backup.cleanupOldBackups();
      
    } else {
      console.log(`
사용법:
  node backup-database.js [command]

명령어:
  full      - 전체 백업 (기본값)
  json      - JSON 백업만
  sql       - SQL 백업만  
  schema    - 스키마 백업만
  status    - 백업 상태 확인
  cleanup   - 오래된 백업 정리
      `);
    }
    
  } catch (err) {
    console.error('백업 실행 중 오류:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;