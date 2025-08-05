#!/usr/bin/env node

/**
 * 게임플라자 데이터베이스 복원 시스템
 * 백업된 데이터를 Supabase에 복원
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

class DatabaseRestore {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 환경 변수 로드
    require('dotenv').config({ path: '.env.local' });
    
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.dbUrl = process.env.DATABASE_URL;
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // readline 인터페이스 설정
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    
    // 복원 로그 기록
    const logDir = path.join(this.backupDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `restore-${this.timestamp.split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
  }

  // 사용 가능한 백업 파일 목록
  listBackupFiles() {
    const backups = {
      json: [],
      sql: []
    };

    ['json', 'sql'].forEach(type => {
      const typeDir = path.join(this.backupDir, type);
      
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir)
          .filter(file => file.startsWith('gameplaza-'))
          .map(file => {
            const filePath = path.join(typeDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              path: filePath,
              mtime: stats.mtime,
              size: stats.size,
              type: type
            };
          })
          .sort((a, b) => b.mtime - a.mtime);
        
        backups[type] = files;
      }
    });

    return backups;
  }

  // 백업 파일 선택 (대화형)
  async selectBackupFile() {
    const backups = this.listBackupFiles();
    const allBackups = [...backups.json, ...backups.sql];
    
    if (allBackups.length === 0) {
      this.log('사용 가능한 백업 파일이 없습니다.', 'ERROR');
      return null;
    }

    console.log('\n=== 사용 가능한 백업 파일 ===');
    allBackups.forEach((backup, index) => {
      const typeLabel = backup.type.toUpperCase();
      const sizeLabel = `${(backup.size / 1024 / 1024).toFixed(2)}MB`;
      const dateLabel = backup.mtime.toLocaleString('ko-KR');
      
      console.log(`${index + 1}. [${typeLabel}] ${backup.name}`);
      console.log(`   날짜: ${dateLabel}, 크기: ${sizeLabel}`);
    });

    return new Promise((resolve) => {
      this.rl.question('\n복원할 백업을 선택하세요 (번호 입력): ', (answer) => {
        const index = parseInt(answer) - 1;
        
        if (index >= 0 && index < allBackups.length) {
          resolve(allBackups[index]);
        } else {
          this.log('잘못된 선택입니다.', 'ERROR');
          resolve(null);
        }
      });
    });
  }

  // 안전 확인
  async confirmRestore(backupFile) {
    console.log(`\n⚠️  데이터베이스 복원 경고 ⚠️`);
    console.log(`백업 파일: ${backupFile.name}`);
    console.log(`백업 날짜: ${backupFile.mtime.toLocaleString('ko-KR')}`);
    console.log(`백업 크기: ${(backupFile.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`\n이 작업은 현재 데이터베이스의 모든 데이터를 삭제하고 백업 데이터로 대체합니다.`);
    console.log(`복원 전에 현재 데이터를 백업하는 것을 강력히 권장합니다.`);

    return new Promise((resolve) => {
      this.rl.question('\n정말로 복원하시겠습니까? (yes/no): ', (answer) => {
        resolve(answer.toLowerCase() === 'yes');
      });
    });
  }

  // 현재 데이터 백업
  async backupCurrentData() {
    this.log('복원 전 현재 데이터 백업 중...', 'INFO');
    
    try {
      const DatabaseBackup = require('./backup-database.js');
      const backup = new DatabaseBackup();
      const result = await backup.runFullBackup();
      
      if (result.success) {
        this.log('현재 데이터 백업 완료', 'INFO');
        return true;
      } else {
        this.log('현재 데이터 백업 실패', 'ERROR');
        return false;
      }
    } catch (err) {
      this.log(`현재 데이터 백업 중 오류: ${err.message}`, 'ERROR');
      return false;
    }
  }

  // JSON 백업 복원
  async restoreFromJson(backupFile) {
    this.log(`JSON 백업 복원 시작: ${backupFile.name}`, 'INFO');
    
    try {
      const backupData = JSON.parse(fs.readFileSync(backupFile.path, 'utf8'));
      
      if (!backupData.tables) {
        throw new Error('잘못된 백업 파일 형식');
      }

      const tables = Object.keys(backupData.tables);
      this.log(`복원할 테이블: ${tables.join(', ')}`, 'INFO');

      let totalRestored = 0;
      const errors = [];

      for (const tableName of tables) {
        try {
          this.log(`테이블 ${tableName} 복원 중...`, 'INFO');
          
          const records = backupData.tables[tableName];
          
          if (!Array.isArray(records) || records.length === 0) {
            this.log(`테이블 ${tableName}: 복원할 데이터 없음`, 'WARN');
            continue;
          }

          // 기존 데이터 삭제 (주의: 모든 데이터가 삭제됨)
          const { error: deleteError } = await this.supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

          if (deleteError && !deleteError.message.includes('No rows found')) {
            this.log(`테이블 ${tableName} 기존 데이터 삭제 오류: ${deleteError.message}`, 'WARN');
          }

          // 새 데이터 삽입 (배치 처리)
          const batchSize = 100;
          let insertedCount = 0;

          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            const { error: insertError } = await this.supabase
              .from(tableName)
              .insert(batch);

            if (insertError) {
              this.log(`테이블 ${tableName} 배치 ${Math.floor(i/batchSize) + 1} 삽입 오류: ${insertError.message}`, 'ERROR');
              errors.push(`${tableName}: ${insertError.message}`);
            } else {
              insertedCount += batch.length;
            }
          }

          this.log(`테이블 ${tableName}: ${insertedCount}/${records.length}개 레코드 복원 완료`, 'INFO');
          totalRestored += insertedCount;

        } catch (tableError) {
          this.log(`테이블 ${tableName} 복원 중 오류: ${tableError.message}`, 'ERROR');
          errors.push(`${tableName}: ${tableError.message}`);
        }
      }

      this.log(`JSON 복원 완료: 총 ${totalRestored}개 레코드 복원`, 'INFO');
      
      if (errors.length > 0) {
        this.log('복원 중 발생한 오류:', 'WARN');
        errors.forEach(error => this.log(`  - ${error}`, 'WARN'));
      }

      return { success: true, recordsRestored: totalRestored, errors };

    } catch (err) {
      this.log(`JSON 복원 중 오류: ${err.message}`, 'ERROR');
      return { success: false, error: err.message };
    }
  }

  // SQL 백업 복원
  async restoreFromSql(backupFile) {
    this.log(`SQL 백업 복원 시작: ${backupFile.name}`, 'INFO');
    
    if (!this.dbUrl) {
      this.log('DATABASE_URL이 설정되지 않았습니다. SQL 복원을 할 수 없습니다.', 'ERROR');
      return { success: false, error: 'DATABASE_URL not configured' };
    }

    return new Promise((resolve) => {
      const psql = spawn('psql', [
        this.dbUrl,
        '--file', backupFile.path,
        '--quiet',
        '--single-transaction'
      ]);

      let errorOutput = '';
      let output = '';

      psql.stdout.on('data', (data) => {
        output += data.toString();
      });

      psql.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      psql.on('close', (code) => {
        if (code === 0) {
          this.log('SQL 복원 완료', 'INFO');
          resolve({ success: true });
        } else {
          this.log(`SQL 복원 실패 (코드: ${code}): ${errorOutput}`, 'ERROR');
          resolve({ success: false, error: errorOutput });
        }
      });
    });
  }

  // 복원 후 검증
  async verifyRestore() {
    this.log('복원 데이터 검증 중...', 'INFO');
    
    const tables = [
      'users', 'devices', 'device_groups', 'reservations', 
      'time_slots', 'analytics_events', 'feedback', 'announcements'
    ];

    const verification = {
      success: true,
      tableCounts: {},
      errors: []
    };

    for (const table of tables) {
      try {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          verification.errors.push(`${table}: ${error.message}`);
          verification.success = false;
        } else {
          verification.tableCounts[table] = count;
          this.log(`테이블 ${table}: ${count}개 레코드`, 'INFO');
        }
      } catch (err) {
        verification.errors.push(`${table}: ${err.message}`);
        verification.success = false;
      }
    }

    if (verification.success) {
      const totalRecords = Object.values(verification.tableCounts).reduce((sum, count) => sum + count, 0);
      this.log(`데이터 검증 완료: 총 ${totalRecords}개 레코드`, 'INFO');
    } else {
      this.log('데이터 검증 중 오류 발생', 'ERROR');
      verification.errors.forEach(error => this.log(`  - ${error}`, 'ERROR'));
    }

    return verification;
  }

  // 전체 복원 프로세스
  async runRestore(backupFilePath = null) {
    this.log('=== 데이터베이스 복원 시작 ===', 'INFO');

    try {
      let backupFile;
      
      if (backupFilePath) {
        // 파일 경로가 지정된 경우
        if (!fs.existsSync(backupFilePath)) {
          this.log(`백업 파일을 찾을 수 없습니다: ${backupFilePath}`, 'ERROR');
          return { success: false };
        }
        
        const stats = fs.statSync(backupFilePath);
        backupFile = {
          name: path.basename(backupFilePath),
          path: backupFilePath,
          mtime: stats.mtime,
          size: stats.size,
          type: backupFilePath.endsWith('.json') ? 'json' : 'sql'
        };
      } else {
        // 대화형 선택
        backupFile = await this.selectBackupFile();
        if (!backupFile) {
          return { success: false };
        }
      }

      // 안전 확인
      const confirmed = await this.confirmRestore(backupFile);
      if (!confirmed) {
        this.log('복원이 취소되었습니다.', 'INFO');
        return { success: false };
      }

      // 현재 데이터 백업
      const currentBackupSuccess = await this.backupCurrentData();
      if (!currentBackupSuccess) {
        this.log('현재 데이터 백업에 실패했습니다. 복원을 중단합니다.', 'ERROR');
        return { success: false };
      }

      // 복원 실행
      let restoreResult;
      if (backupFile.type === 'json') {
        restoreResult = await this.restoreFromJson(backupFile);
      } else {
        restoreResult = await this.restoreFromSql(backupFile);
      }

      if (!restoreResult.success) {
        this.log('복원 실패', 'ERROR');
        return restoreResult;
      }

      // 복원 검증
      const verification = await this.verifyRestore();
      
      if (verification.success) {
        this.log('=== 데이터베이스 복원 완료 ===', 'INFO');
      } else {
        this.log('=== 복원 완료되었으나 검증 중 문제 발견 ===', 'WARN');
      }

      return {
        success: true,
        backupFile: backupFile.name,
        ...restoreResult,
        verification
      };

    } catch (err) {
      this.log(`복원 중 예상치 못한 오류: ${err.message}`, 'ERROR');
      return { success: false, error: err.message };
    } finally {
      this.rl.close();
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const restore = new DatabaseRestore();

  try {
    if (args.length === 0) {
      // 대화형 모드
      await restore.runRestore();
      
    } else if (args[0] === 'list') {
      // 백업 파일 목록
      const backups = restore.listBackupFiles();
      
      console.log('\n=== 사용 가능한 백업 파일 ===');
      
      if (backups.json.length > 0) {
        console.log('\n[JSON 백업]');
        backups.json.forEach(backup => {
          console.log(`  ${backup.name} (${backup.mtime.toLocaleString('ko-KR')}, ${(backup.size/1024/1024).toFixed(2)}MB)`);
        });
      }
      
      if (backups.sql.length > 0) {
        console.log('\n[SQL 백업]');
        backups.sql.forEach(backup => {
          console.log(`  ${backup.name} (${backup.mtime.toLocaleString('ko-KR')}, ${(backup.size/1024/1024).toFixed(2)}MB)`);
        });
      }
      
      if (backups.json.length === 0 && backups.sql.length === 0) {
        console.log('사용 가능한 백업 파일이 없습니다.');
      }
      
    } else if (fs.existsSync(args[0])) {
      // 특정 파일 복원
      await restore.runRestore(args[0]);
      
    } else {
      console.log(`
사용법:
  node restore-database.js           # 대화형 복원
  node restore-database.js list      # 백업 파일 목록
  node restore-database.js <file>    # 특정 파일 복원
      `);
    }
    
  } catch (err) {
    console.error('복원 실행 중 오류:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseRestore;