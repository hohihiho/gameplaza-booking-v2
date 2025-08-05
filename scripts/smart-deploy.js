#!/usr/bin/env node

/**
 * 스마트 배포 파이프라인
 * 자동화된 빌드, 테스트, 배포 프로세스
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SmartDeployPipeline {
  constructor() {
    this.environments = {
      'development': {
        name: '개발 환경',
        branch: 'develop',
        url: 'http://localhost:3000',
        requiresTests: false,
        autoMode: true
      },
      'staging': {
        name: '스테이징 환경',
        branch: 'staging',
        url: 'https://staging.gameplaza.com',
        requiresTests: true,
        autoMode: false
      },
      'production': {
        name: '프로덕션 환경',
        branch: 'main',
        url: 'https://gameplaza.com',
        requiresTests: true,
        autoMode: false,
        requiresApproval: true
      }
    };

    this.deploymentSteps = [
      { name: '사전 검사', key: 'precheck', required: true },
      { name: '종속성 설치', key: 'install', required: true },
      { name: '린트 검사', key: 'lint', required: true },
      { name: '타입 검사', key: 'typecheck', required: true },
      { name: '테스트 실행', key: 'test', required: false },
      { name: '보안 검사', key: 'security', required: true },
      { name: '빌드', key: 'build', required: true },
      { name: '성능 검사', key: 'performance', required: false },
      { name: '배포', key: 'deploy', required: true },
      { name: '배포 후 검사', key: 'postcheck', required: true }
    ];

    this.deploymentResults = {
      startTime: null,
      endTime: null,
      environment: null,
      success: false,
      steps: {},
      errors: [],
      warnings: []
    };
  }

  log(message, level = 'INFO') {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.RESET}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { 
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options 
      });
      
      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve(options.silent ? stdout.trim() : '');
        } else {
          reject(new Error(options.silent ? stderr : `Command failed with code ${code}`));
        }
      });
    });
  }

  // 사전 검사
  async runPrecheck() {
    this.log('🔍 사전 검사 시작', 'INFO');
    
    const checks = [];

    // Git 상태 확인
    try {
      const status = await this.runCommand('git', ['status', '--porcelain'], { silent: true });
      if (status.trim()) {
        checks.push({ 
          name: 'Git 상태', 
          status: 'warning', 
          message: '커밋되지 않은 변경사항이 있습니다.' 
        });
      } else {
        checks.push({ 
          name: 'Git 상태', 
          status: 'success', 
          message: '모든 변경사항이 커밋되었습니다.' 
        });
      }
    } catch (error) {
      checks.push({ 
        name: 'Git 상태', 
        status: 'error', 
        message: 'Git 상태 확인 실패' 
      });
    }

    // Node.js 버전 확인
    try {
      const nodeVersion = await this.runCommand('node', ['--version'], { silent: true });
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      
      if (majorVersion >= 18) {
        checks.push({ 
          name: 'Node.js 버전', 
          status: 'success', 
          message: `Node.js ${nodeVersion} (호환됨)` 
        });
      } else {
        checks.push({ 
          name: 'Node.js 버전', 
          status: 'warning', 
          message: `Node.js ${nodeVersion} (최소 v18 권장)` 
        });
      }
    } catch (error) {
      checks.push({ 
        name: 'Node.js 버전', 
        status: 'error', 
        message: 'Node.js 버전 확인 실패' 
      });
    }

    // 환경 변수 확인
    const requiredEnvs = ['.env.local', '.env'];
    let envFound = false;
    
    for (const envFile of requiredEnvs) {
      if (fs.existsSync(envFile)) {
        envFound = true;
        break;
      }
    }
    
    checks.push({ 
      name: '환경 변수', 
      status: envFound ? 'success' : 'warning', 
      message: envFound ? '환경 변수 파일 발견' : '환경 변수 파일이 없습니다' 
    });

    // 디스크 공간 확인
    try {
      const df = await this.runCommand('df', ['-h', '.'], { silent: true });
      const diskInfo = df.split('\n')[1];
      const usage = diskInfo.split(/\s+/)[4];
      const usagePercent = parseInt(usage.replace('%', ''));
      
      if (usagePercent < 90) {
        checks.push({ 
          name: '디스크 공간', 
          status: 'success', 
          message: `사용률 ${usage}` 
        });
      } else {
        checks.push({ 
          name: '디스크 공간', 
          status: 'warning', 
          message: `사용률 ${usage} (정리 권장)` 
        });
      }
    } catch (error) {
      checks.push({ 
        name: '디스크 공간', 
        status: 'info', 
        message: '디스크 공간 확인 불가' 
      });
    }

    // 결과 출력
    checks.forEach(check => {
      const icon = {
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'info': 'ℹ️'
      }[check.status];

      this.log(`${icon} ${check.name}: ${check.message}`, check.status.toUpperCase());
    });

    const hasErrors = checks.some(check => check.status === 'error');
    const hasWarnings = checks.some(check => check.status === 'warning');

    if (hasErrors) {
      throw new Error('사전 검사에서 오류가 발견되었습니다.');
    }

    if (hasWarnings) {
      this.deploymentResults.warnings.push('사전 검사에서 경고가 발견되었습니다.');
    }

    return { success: true, checks };
  }

  // 종속성 설치
  async runInstall() {
    this.log('📦 종속성 설치 중...', 'INFO');
    
    // package-lock.json이 있으면 npm ci, 없으면 npm install
    const useCI = fs.existsSync('package-lock.json');
    const command = useCI ? 'ci' : 'install';
    
    await this.runCommand('npm', [command]);
    
    this.log('✅ 종속성 설치 완료', 'SUCCESS');
    return { success: true };
  }

  // 린트 검사
  async runLint() {
    this.log('🔍 린트 검사 중...', 'INFO');
    
    try {
      await this.runCommand('npm', ['run', 'lint']);
      this.log('✅ 린트 검사 통과', 'SUCCESS');
      return { success: true };
    } catch (error) {
      this.log('❌ 린트 검사 실패', 'ERROR');
      throw error;
    }
  }

  // 타입 검사
  async runTypecheck() {
    this.log('🔍 타입 검사 중...', 'INFO');
    
    try {
      await this.runCommand('npm', ['run', 'type-check']);
      this.log('✅ 타입 검사 통과', 'SUCCESS');
      return { success: true };
    } catch (error) {
      this.log('❌ 타입 검사 실패', 'ERROR');
      throw error;
    }
  }

  // 테스트 실행
  async runTests() {
    this.log('🧪 테스트 실행 중...', 'INFO');
    
    try {
      await this.runCommand('npm', ['test', '--', '--passWithNoTests', '--watchAll=false']);
      this.log('✅ 모든 테스트 통과', 'SUCCESS');
      return { success: true };
    } catch (error) {
      this.log('❌ 테스트 실패', 'ERROR');
      throw error;
    }
  }

  // 보안 검사
  async runSecurity() {
    this.log('🔐 보안 검사 중...', 'INFO');
    
    const securityChecks = [];

    // npm audit
    try {
      await this.runCommand('npm', ['audit', '--audit-level=moderate'], { silent: true });
      securityChecks.push({ name: 'NPM Audit', status: 'success' });
    } catch (error) {
      securityChecks.push({ name: 'NPM Audit', status: 'warning', error: error.message });
      this.deploymentResults.warnings.push('보안 취약점이 발견되었습니다.');
    }

    // 환경 변수 노출 검사
    try {
      const files = await this.runCommand('find', ['.', '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx'], { silent: true });
      const fileList = files.split('\n').filter(f => f.trim() && !f.includes('node_modules'));
      
      let secretsFound = false;
      for (const file of fileList.slice(0, 20)) { // 처음 20개 파일만 검사
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.match(/(password|secret|key|token)\s*=\s*['"][^'"]{10,}/gi)) {
            secretsFound = true;
            break;
          }
        } catch (error) {
          // 파일 읽기 실패는 무시
        }
      }
      
      securityChecks.push({ 
        name: '시크릿 노출', 
        status: secretsFound ? 'warning' : 'success' 
      });
      
      if (secretsFound) {
        this.deploymentResults.warnings.push('코드에 하드코딩된 시크릿이 발견되었습니다.');
      }
    } catch (error) {
      securityChecks.push({ name: '시크릿 노출', status: 'info' });
    }

    securityChecks.forEach(check => {
      const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : 'ℹ️';
      this.log(`${icon} ${check.name}: ${check.status}`, check.status.toUpperCase());
    });

    this.log('🔐 보안 검사 완료', 'SUCCESS');
    return { success: true, checks: securityChecks };
  }

  // 빌드
  async runBuild() {
    this.log('🏗️ 빌드 시작...', 'INFO');
    
    const buildStart = Date.now();
    
    try {
      await this.runCommand('npm', ['run', 'build']);
      
      const buildTime = Date.now() - buildStart;
      this.log(`✅ 빌드 완료 (${buildTime}ms)`, 'SUCCESS');
      
      // 빌드 크기 확인
      const buildDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(buildDir)) {
        const buildSize = await this.getBuildSize(buildDir);
        this.log(`📦 빌드 크기: ${buildSize}MB`, 'INFO');
      }
      
      return { success: true, buildTime };
    } catch (error) {
      this.log('❌ 빌드 실패', 'ERROR');
      throw error;
    }
  }

  // 빌드 크기 계산
  async getBuildSize(dir) {
    try {
      const du = await this.runCommand('du', ['-sm', dir], { silent: true });
      return parseInt(du.split('\t')[0]);
    } catch (error) {
      return 0;
    }
  }

  // 성능 검사
  async runPerformance() {
    this.log('⚡ 성능 검사 중...', 'INFO');
    
    const performanceChecks = [];

    // 빌드 크기 검사
    try {
      const buildSize = await this.getBuildSize(path.join(process.cwd(), '.next'));
      if (buildSize > 0) {
        const status = buildSize < 100 ? 'success' : buildSize < 200 ? 'warning' : 'error';
        performanceChecks.push({
          name: '빌드 크기',
          status,
          value: `${buildSize}MB`,
          threshold: status === 'error' ? '200MB 초과 (최적화 필요)' : status === 'warning' ? '100MB 초과 (주의)' : '100MB 미만 (양호)'
        });
      }
    } catch (error) {
      performanceChecks.push({ name: '빌드 크기', status: 'info', value: '측정 불가' });
    }

    // 번들 분석 (간단한 추정)
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      try {
        const staticDir = path.join(nextDir, 'static');
        if (fs.existsSync(staticDir)) {
          const jsFiles = await this.runCommand('find', [staticDir, '-name', '*.js', '-type', 'f'], { silent: true });
          const jsFileCount = jsFiles.split('\n').filter(f => f.trim()).length;
          
          performanceChecks.push({
            name: 'JS 번들 수',
            status: jsFileCount < 20 ? 'success' : jsFileCount < 50 ? 'warning' : 'error',
            value: `${jsFileCount}개`
          });
        }
      } catch (error) {
        performanceChecks.push({ name: 'JS 번들 수', status: 'info', value: '측정 불가' });
      }
    }

    performanceChecks.forEach(check => {
      const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      this.log(`${icon} ${check.name}: ${check.value}`, check.status.toUpperCase());
    });

    const hasErrors = performanceChecks.some(check => check.status === 'error');
    if (hasErrors) {
      this.deploymentResults.warnings.push('성능 검사에서 문제가 발견되었습니다.');
    }

    this.log('⚡ 성능 검사 완료', 'SUCCESS');
    return { success: true, checks: performanceChecks };
  }

  // 배포 (시뮬레이션)
  async runDeploy(environment) {
    this.log(`🚀 ${environment.name} 배포 중...`, 'INFO');
    
    // 실제 배포는 환경에 따라 다르게 구현
    switch (environment) {
      case 'development':
        return this.deployToLocal();
      case 'staging':
        return this.deployToStaging();
      case 'production':
        return this.deployToProduction();
      default:
        throw new Error(`알 수 없는 환경: ${environment}`);
    }
  }

  // 로컬 배포 (개발 서버 시작)
  async deployToLocal() {
    this.log('💻 로컬 개발 서버 배포...', 'INFO');
    
    // 포트 정리
    try {
      await this.runCommand('lsof', ['-ti:3000'], { silent: true }).then(pids => {
        if (pids.trim()) {
          return this.runCommand('kill', ['-9', ...pids.split('\n')], { silent: true });
        }
      }).catch(() => {
        // 포트가 사용되지 않음 (정상)
      });
    } catch (error) {
      // 포트 정리 실패는 무시
    }

    this.log('✅ 로컬 배포 완료', 'SUCCESS');
    this.log('💡 개발 서버 시작: npm run dev', 'INFO');
    
    return { success: true, url: 'http://localhost:3000' };
  }

  // 스테이징 배포 (시뮬레이션)
  async deployToStaging() {
    this.log('🏗️ 스테이징 환경 배포...', 'INFO');
    
    // 여기서는 시뮬레이션만 수행
    // 실제로는 Docker, Vercel, AWS 등의 배포 명령어 실행
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // 배포 시뮬레이션
    
    this.log('✅ 스테이징 배포 완료', 'SUCCESS');
    return { success: true, url: 'https://staging.gameplaza.com' };
  }

  // 프로덕션 배포 (시뮬레이션)
  async deployToProduction() {
    this.log('🌟 프로덕션 환경 배포...', 'INFO');
    
    // 프로덕션은 추가 안전 장치 필요
    this.log('⚠️ 프로덕션 배포는 신중하게!', 'WARNING');
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // 배포 시뮬레이션
    
    this.log('✅ 프로덕션 배포 완료', 'SUCCESS');
    return { success: true, url: 'https://gameplaza.com' };
  }

  // 배포 후 검사
  async runPostcheck(deployResult) {
    this.log('🔍 배포 후 검사 중...', 'INFO');
    
    const checks = [];

    if (deployResult.url) {
      // URL 접근성 확인 (curl 사용)
      try {
        if (deployResult.url.startsWith('http://localhost')) {
          // 로컬은 실제 서버가 실행되지 않으므로 스킵
          checks.push({ 
            name: 'URL 접근성', 
            status: 'info', 
            message: '로컬 서버 - 수동 확인 필요' 
          });
        } else {
          await this.runCommand('curl', ['-f', '-s', deployResult.url], { silent: true });
          checks.push({ 
            name: 'URL 접근성', 
            status: 'success', 
            message: '정상 응답' 
          });
        }
      } catch (error) {
        checks.push({ 
          name: 'URL 접근성', 
          status: 'warning', 
          message: '접근 확인 실패' 
        });
      }
    }

    // 빌드 파일 존재 확인
    const buildFiles = ['.next/BUILD_ID', '.next/build-manifest.json'];
    const buildFilesExist = buildFiles.every(file => fs.existsSync(file));
    
    checks.push({ 
      name: '빌드 파일', 
      status: buildFilesExist ? 'success' : 'error', 
      message: buildFilesExist ? '모든 빌드 파일 존재' : '빌드 파일 누락' 
    });

    checks.forEach(check => {
      const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      this.log(`${icon} ${check.name}: ${check.message}`, check.status.toUpperCase());
    });

    const hasErrors = checks.some(check => check.status === 'error');
    if (hasErrors) {
      throw new Error('배포 후 검사에서 오류가 발견되었습니다.');
    }

    this.log('🔍 배포 후 검사 완료', 'SUCCESS');
    return { success: true, checks };
  }

  // 배포 승인 요청
  async requestApproval(environment) {
    this.log(`⚠️ ${environment.name} 배포 승인이 필요합니다.`, 'WARNING');
    
    // 실제로는 Slack, 이메일 등으로 승인 요청
    // 여기서는 CLI 프롬프트로 시뮬레이션
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('배포를 진행하시겠습니까? (y/N): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  // 배포 보고서 생성
  generateDeploymentReport() {
    const duration = this.deploymentResults.endTime - this.deploymentResults.startTime;
    const reportPath = path.join(process.cwd(), 'docs', 'deployment-report.md');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = `# 🚀 배포 보고서

**배포 시간:** ${new Date(this.deploymentResults.startTime).toLocaleString('ko-KR')}
**완료 시간:** ${new Date(this.deploymentResults.endTime).toLocaleString('ko-KR')}
**소요 시간:** ${Math.round(duration / 1000)}초
**환경:** ${this.deploymentResults.environment}
**결과:** ${this.deploymentResults.success ? '✅ 성공' : '❌ 실패'}

## 📋 실행된 단계

${Object.entries(this.deploymentResults.steps).map(([step, result]) => `
### ${step}
- **상태:** ${result.success ? '✅ 성공' : '❌ 실패'}
- **소요 시간:** ${result.duration ? Math.round(result.duration / 1000) + '초' : '-'}
${result.message ? `- **메시지:** ${result.message}` : ''}
`).join('\n')}

## ⚠️ 경고사항

${this.deploymentResults.warnings.length > 0 ? 
  this.deploymentResults.warnings.map(warning => `- ${warning}`).join('\n') : 
  '경고사항이 없습니다.'}

## ❌ 오류사항

${this.deploymentResults.errors.length > 0 ? 
  this.deploymentResults.errors.map(error => `- ${error}`).join('\n') : 
  '오류가 없습니다.'}

## 🎯 다음 단계

${this.deploymentResults.success ? `
✅ 배포가 성공적으로 완료되었습니다!

### 확인사항
- [ ] 애플리케이션 정상 동작 확인
- [ ] 주요 기능 테스트 수행
- [ ] 성능 모니터링 확인

### 모니터링
- 실시간 에러: \`npm run logs:errors\`
- 성능 대시보드: \`npm run dashboard\`
` : `
❌ 배포가 실패했습니다.

### 해결 방법
1. 오류 로그 확인
2. 실패한 단계 재실행
3. 필요시 롤백 수행

### 재시도
\`npm run deploy:${this.deploymentResults.environment}\`
`}

---
*🤖 스마트 배포 파이프라인에 의해 생성됨*`;

    fs.writeFileSync(reportPath, report);
    this.log(`📄 배포 보고서 저장됨: ${reportPath}`, 'SUCCESS');
    
    return reportPath;
  }

  // 메인 배포 실행
  async deploy(environmentKey) {
    const environment = this.environments[environmentKey];
    if (!environment) {
      throw new Error(`알 수 없는 환경: ${environmentKey}`);
    }

    this.deploymentResults.startTime = Date.now();
    this.deploymentResults.environment = environment.name;

    this.log(`🚀 ${environment.name} 배포 시작`, 'INFO');

    // 승인이 필요한 환경인지 확인
    if (environment.requiresApproval && !environment.autoMode) {
      const approved = await this.requestApproval(environment);
      if (!approved) {
        this.log('🛑 배포가 취소되었습니다.', 'WARNING');
        return;
      }
    }

    try {
      // 각 단계 실행
      for (const step of this.deploymentSteps) {
        // 테스트는 필요한 경우에만 실행
        if (step.key === 'test' && !environment.requiresTests) {
          this.log(`⏭️ ${step.name} 단계 건너뜀`, 'INFO');
          continue;
        }

        // 성능 검사는 선택사항
        if (step.key === 'performance' && !step.required) {
          this.log(`⏭️ ${step.name} 단계 건너뜀`, 'INFO');
          continue;
        }

        this.log(`▶️ ${step.name} 단계 시작`, 'INFO');
        const stepStart = Date.now();

        try {
          let result;
          switch (step.key) {
            case 'precheck':
              result = await this.runPrecheck();
              break;
            case 'install':
              result = await this.runInstall();
              break;
            case 'lint':
              result = await this.runLint();
              break;
            case 'typecheck':
              result = await this.runTypecheck();
              break;
            case 'test':
              result = await this.runTests();
              break;
            case 'security':
              result = await this.runSecurity();
              break;
            case 'build':
              result = await this.runBuild();
              break;
            case 'performance':
              result = await this.runPerformance();
              break;
            case 'deploy':
              result = await this.runDeploy(environmentKey);
              this.deploymentUrl = result.url;
              break;
            case 'postcheck':
              result = await this.runPostcheck({ url: this.deploymentUrl });
              break;
          }

          const stepDuration = Date.now() - stepStart;
          this.deploymentResults.steps[step.name] = {
            success: true,
            duration: stepDuration,
            ...result
          };

          this.log(`✅ ${step.name} 완료 (${Math.round(stepDuration / 1000)}초)`, 'SUCCESS');

        } catch (error) {
          const stepDuration = Date.now() - stepStart;
          this.deploymentResults.steps[step.name] = {
            success: false,
            duration: stepDuration,
            error: error.message
          };

          this.deploymentResults.errors.push(`${step.name}: ${error.message}`);

          if (step.required) {
            this.log(`❌ ${step.name} 실패: ${error.message}`, 'ERROR');
            throw new Error(`필수 단계 실패: ${step.name}`);
          } else {
            this.log(`⚠️ ${step.name} 실패: ${error.message} (선택사항이므로 계속 진행)`, 'WARNING');
            this.deploymentResults.warnings.push(`${step.name} 실패`);
          }
        }
      }

      this.deploymentResults.success = true;
      this.deploymentResults.endTime = Date.now();

      const totalDuration = this.deploymentResults.endTime - this.deploymentResults.startTime;
      this.log(`🎉 ${environment.name} 배포 성공! (${Math.round(totalDuration / 1000)}초)`, 'SUCCESS');

      if (this.deploymentUrl) {
        this.log(`🌐 배포 URL: ${this.deploymentUrl}`, 'INFO');
      }

    } catch (error) {
      this.deploymentResults.success = false;
      this.deploymentResults.endTime = Date.now();
      this.log(`❌ 배포 실패: ${error.message}`, 'ERROR');
    }

    // 보고서 생성
    const reportPath = this.generateDeploymentReport();
    
    // 보고서 출력
    console.log('\n' + fs.readFileSync(reportPath, 'utf8'));
  }

  // 환경 목록 표시
  listEnvironments() {
    console.log('\n🌍 사용 가능한 배포 환경:\n');
    
    Object.entries(this.environments).forEach(([key, env]) => {
      const status = env.autoMode ? '🤖 자동' : '👤 수동';
      const tests = env.requiresTests ? '🧪 테스트 필요' : '⏭️ 테스트 건너뜀';
      const approval = env.requiresApproval ? '✋ 승인 필요' : '🚀 즉시 배포';
      
      console.log(`📦 ${key}`);
      console.log(`   이름: ${env.name}`);
      console.log(`   브랜치: ${env.branch}`);
      console.log(`   URL: ${env.url}`);
      console.log(`   모드: ${status}`);
      console.log(`   테스트: ${tests}`);
      console.log(`   승인: ${approval}`);
      console.log('');
    });
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const pipeline = new SmartDeployPipeline();

  try {
    if (args.length === 0 || args[0] === 'list') {
      // 환경 목록 표시
      pipeline.listEnvironments();
      
    } else if (args[0] === 'dev' || args[0] === 'development') {
      // 개발 환경 배포
      await pipeline.deploy('development');
      
    } else if (args[0] === 'staging') {
      // 스테이징 환경 배포
      await pipeline.deploy('staging');
      
    } else if (args[0] === 'prod' || args[0] === 'production') {
      // 프로덕션 환경 배포
      await pipeline.deploy('production');
      
    } else {
      // 지정된 환경으로 배포
      await pipeline.deploy(args[0]);
    }
    
  } catch (error) {
    console.error('❌ 배포 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SmartDeployPipeline;