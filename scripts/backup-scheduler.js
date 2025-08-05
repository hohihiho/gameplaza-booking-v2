#!/usr/bin/env node

/**
 * 게임플라자 자동 백업 스케줄러
 * cron 스타일 스케줄링과 백업 모니터링
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class BackupScheduler {
  constructor() {
    this.configFile = path.join(process.cwd(), 'backup-config.json');
    this.pidFile = path.join(process.cwd(), 'backup-scheduler.pid');
    this.logFile = path.join(process.cwd(), 'backups/logs/scheduler.log');
    
    this.defaultConfig = {
      schedules: [
        {
          name: 'daily-backup',
          enabled: true,
          cron: '0 2 * * *', // 매일 새벽 2시
          type: 'full',
          description: '매일 전체 백업'
        },
        {
          name: 'hourly-json',
          enabled: false,
          cron: '0 * * * *', // 매시간
          type: 'json',
          description: '시간별 JSON 백업 (선택적)'
        },
        {
          name: 'weekly-cleanup',
          enabled: true,
          cron: '0 3 * * 0', // 매주 일요일 새벽 3시
          type: 'cleanup',
          description: '주간 오래된 백업 정리'
        }
      ],
      notifications: {
        email: null,
        webhook: null,
        console: true
      },
      maxBackupSize: 1024 * 1024 * 1024, // 1GB
      alertThresholds: {
        failureCount: 3,
        diskUsage: 90 // 퍼센트
      }
    };
    
    this.runningJobs = new Map();
    this.initConfig();
  }

  initConfig() {
    if (!fs.existsSync(this.configFile)) {
      this.saveConfig(this.defaultConfig);
      this.log('기본 백업 설정 파일을 생성했습니다.', 'INFO');
    }
    
    // 로그 디렉토리 생성
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    } catch (err) {
      this.log(`설정 파일 로드 오류: ${err.message}`, 'ERROR');
      return this.defaultConfig;
    }
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (err) {
      this.log(`설정 파일 저장 오류: ${err.message}`, 'ERROR');
      return false;
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (err) {
      console.error('로그 파일 쓰기 오류:', err.message);
    }
  }

  // Cron 표현식 파싱 (단순 버전)
  parseCron(cronExpression) {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    return {
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4]
    };
  }

  // 다음 실행 시간 계산
  getNextRunTime(cronExpression) {
    try {
      const cron = this.parseCron(cronExpression);
      const now = new Date();
      const next = new Date(now);
      
      // 단순한 계산 (분 단위만 정확히 처리)
      if (cron.minute !== '*') {
        const targetMinute = parseInt(cron.minute);
        if (now.getMinutes() >= targetMinute) {
          next.setHours(next.getHours() + 1);
        }
        next.setMinutes(targetMinute);
        next.setSeconds(0);
        next.setMilliseconds(0);
      }
      
      if (cron.hour !== '*') {
        const targetHour = parseInt(cron.hour);
        if (now.getHours() >= targetHour && cron.minute !== '*') {
          next.setDate(next.getDate() + 1);
        }
        next.setHours(targetHour);
      }
      
      return next;
    } catch (err) {
      this.log(`Cron 파싱 오류: ${err.message}`, 'ERROR');
      return new Date(Date.now() + 60000); // 1분 후
    }
  }

  // 백업 실행
  async executeBackup(schedule) {
    const jobId = `${schedule.name}-${Date.now()}`;
    this.log(`백업 작업 시작: ${schedule.name} (${schedule.type})`, 'INFO');
    
    this.runningJobs.set(jobId, {
      schedule,
      startTime: new Date(),
      status: 'running'
    });

    try {
      let command, args;
      
      if (schedule.type === 'cleanup') {
        command = 'node';
        args = [path.join(__dirname, 'backup-database.js'), 'cleanup'];
      } else {
        command = 'node';
        args = [path.join(__dirname, 'backup-database.js'), schedule.type];
      }

      const result = await this.runCommand(command, args);
      
      if (result.success) {
        this.log(`백업 작업 완료: ${schedule.name}`, 'INFO');
        this.runningJobs.get(jobId).status = 'completed';
      } else {
        this.log(`백업 작업 실패: ${schedule.name} - ${result.error}`, 'ERROR');
        this.runningJobs.get(jobId).status = 'failed';
        this.runningJobs.get(jobId).error = result.error;
      }

      this.runningJobs.get(jobId).endTime = new Date();
      
      // 알림 전송
      await this.sendNotification(schedule, result);
      
      return result;

    } catch (err) {
      this.log(`백업 작업 예외: ${schedule.name} - ${err.message}`, 'ERROR');
      this.runningJobs.get(jobId).status = 'error';
      this.runningJobs.get(jobId).error = err.message;
      this.runningJobs.get(jobId).endTime = new Date();
      
      return { success: false, error: err.message };
    }
  }

  // 명령어 실행
  runCommand(command, args) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: stdout });
        } else {
          resolve({ success: false, error: stderr || `Exit code: ${code}` });
        }
      });
    });
  }

  // 알림 전송
  async sendNotification(schedule, result) {
    const config = this.loadConfig();
    const message = result.success 
      ? `✅ 백업 완료: ${schedule.name}`
      : `❌ 백업 실패: ${schedule.name} - ${result.error}`;

    if (config.notifications.console) {
      this.log(`[알림] ${message}`, 'INFO');
    }

    // 여기에 이메일이나 웹훅 알림 기능을 추가할 수 있습니다
    if (config.notifications.webhook) {
      try {
        // 웹훅 전송 로직 (예시)
        this.log(`웹훅 알림 전송: ${config.notifications.webhook}`, 'DEBUG');
      } catch (err) {
        this.log(`웹훅 알림 실패: ${err.message}`, 'ERROR');
      }
    }
  }

  // 스케줄러 시작
  async startScheduler() {
    // PID 파일 생성
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    this.log('백업 스케줄러 시작', 'INFO');
    
    const config = this.loadConfig();
    const enabledSchedules = config.schedules.filter(s => s.enabled);
    
    if (enabledSchedules.length === 0) {
      this.log('활성화된 스케줄이 없습니다.', 'WARN');
      return;
    }

    this.log(`${enabledSchedules.length}개의 백업 스케줄 활성화됨`, 'INFO');
    
    // 각 스케줄의 다음 실행 시간 계산
    const scheduledJobs = enabledSchedules.map(schedule => ({
      ...schedule,
      nextRun: this.getNextRunTime(schedule.cron)
    }));

    // 메인 루프
    const checkInterval = 60000; // 1분마다 확인
    
    setInterval(() => {
      const now = new Date();
      
      scheduledJobs.forEach(job => {
        if (now >= job.nextRun) {
          // 백업 실행
          this.executeBackup(job);
          
          // 다음 실행 시간 계산
          job.nextRun = this.getNextRunTime(job.cron);
          this.log(`다음 ${job.name} 실행 예정: ${job.nextRun.toLocaleString('ko-KR')}`, 'DEBUG');
        }
      });
      
    }, checkInterval);

    // 시작 시 다음 실행 시간 로그
    scheduledJobs.forEach(job => {
      this.log(`${job.name}: 다음 실행 ${job.nextRun.toLocaleString('ko-KR')}`, 'INFO');
    });

    // 종료 시그널 처리
    process.on('SIGINT', () => this.stopScheduler());
    process.on('SIGTERM', () => this.stopScheduler());
  }

  // 스케줄러 중지
  stopScheduler() {
    this.log('백업 스케줄러 중지 중...', 'INFO');
    
    // PID 파일 삭제
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    this.log('백업 스케줄러 중지됨', 'INFO');
    process.exit(0);
  }

  // 스케줄러 상태 확인
  getStatus() {
    const config = this.loadConfig();
    const isRunning = fs.existsSync(this.pidFile);
    
    const status = {
      running: isRunning,
      pid: isRunning ? fs.readFileSync(this.pidFile, 'utf8').trim() : null,
      schedules: config.schedules.map(schedule => ({
        name: schedule.name,
        enabled: schedule.enabled,
        cron: schedule.cron,
        description: schedule.description,
        nextRun: schedule.enabled ? this.getNextRunTime(schedule.cron) : null
      })),
      recentJobs: Array.from(this.runningJobs.values())
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 10)
    };

    return status;
  }

  // 설정 관리
  updateSchedule(name, updates) {
    const config = this.loadConfig();
    const scheduleIndex = config.schedules.findIndex(s => s.name === name);
    
    if (scheduleIndex === -1) {
      throw new Error(`스케줄을 찾을 수 없습니다: ${name}`);
    }
    
    config.schedules[scheduleIndex] = {
      ...config.schedules[scheduleIndex],
      ...updates
    };
    
    return this.saveConfig(config);
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const scheduler = new BackupScheduler();

  try {
    if (args.length === 0 || args[0] === 'start') {
      await scheduler.startScheduler();
      
    } else if (args[0] === 'status') {
      const status = scheduler.getStatus();
      
      console.log('\n=== 백업 스케줄러 상태 ===');
      console.log(`실행 중: ${status.running ? '예' : '아니오'}`);
      if (status.running) {
        console.log(`PID: ${status.pid}`);
      }
      
      console.log('\n=== 스케줄 목록 ===');
      status.schedules.forEach(schedule => {
        const enabledText = schedule.enabled ? '✅' : '❌';
        const nextRunText = schedule.nextRun 
          ? schedule.nextRun.toLocaleString('ko-KR') 
          : '비활성화됨';
        
        console.log(`${enabledText} ${schedule.name}`);
        console.log(`   ${schedule.description}`);
        console.log(`   크론: ${schedule.cron}`);
        console.log(`   다음 실행: ${nextRunText}`);
        console.log('');
      });
      
      if (status.recentJobs.length > 0) {
        console.log('=== 최근 백업 작업 ===');
        status.recentJobs.forEach(job => {
          const duration = job.endTime 
            ? `${Math.round((job.endTime - job.startTime) / 1000)}초`
            : '진행 중';
          
          console.log(`${job.schedule.name}: ${job.status} (${duration})`);
          console.log(`   시작: ${job.startTime.toLocaleString('ko-KR')}`);
          if (job.error) {
            console.log(`   오류: ${job.error}`);
          }
        });
      }
      
    } else if (args[0] === 'stop') {
      if (fs.existsSync(scheduler.pidFile)) {
        const pid = fs.readFileSync(scheduler.pidFile, 'utf8').trim();
        try {
          process.kill(parseInt(pid), 'SIGTERM');
          console.log('백업 스케줄러를 중지했습니다.');
        } catch (err) {
          console.log('스케줄러 프로세스를 찾을 수 없습니다.');
          fs.unlinkSync(scheduler.pidFile);
        }
      } else {
        console.log('실행 중인 스케줄러가 없습니다.');
      }
      
    } else if (args[0] === 'enable' && args[1]) {
      scheduler.updateSchedule(args[1], { enabled: true });
      console.log(`스케줄 '${args[1]}'을 활성화했습니다.`);
      
    } else if (args[0] === 'disable' && args[1]) {
      scheduler.updateSchedule(args[1], { enabled: false });
      console.log(`스케줄 '${args[1]}'을 비활성화했습니다.`);
      
    } else {
      console.log(`
사용법:
  node backup-scheduler.js [command]

명령어:
  start                    - 스케줄러 시작 (기본값)
  status                   - 스케줄러 상태 확인
  stop                     - 스케줄러 중지
  enable <schedule-name>   - 스케줄 활성화
  disable <schedule-name>  - 스케줄 비활성화

예시:
  node backup-scheduler.js start
  node backup-scheduler.js status
  node backup-scheduler.js enable daily-backup
      `);
    }
    
  } catch (err) {
    console.error('스케줄러 실행 중 오류:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BackupScheduler;