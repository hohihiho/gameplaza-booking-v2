#!/usr/bin/env node

/**
 * 테스트 자동 생성 및 실행 시스템
 * 컴포넌트, API, 유틸리티 함수에 대한 테스트를 자동으로 생성
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutoTestGenerator {
  constructor() {
    this.testTemplates = {
      react: {
        component: `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {{componentName}} from '{{componentPath}}';

describe('{{componentName}}', () => {
  // 기본 렌더링 테스트
  it('renders without crashing', () => {
    render(<{{componentName}} />);
  });

  // Props 테스트
  it('renders with props', () => {
    const testProps = {
      // TODO: 적절한 props 추가
    };
    render(<{{componentName}} {...testProps} />);
  });

  // 상호작용 테스트  
  it('handles user interactions', async () => {
    render(<{{componentName}} />);
    
    // TODO: 클릭, 입력 등 상호작용 테스트 추가
    // 예: fireEvent.click(screen.getByRole('button'));
  });

  // 상태 변경 테스트
  it('updates state correctly', async () => {
    render(<{{componentName}} />);
    
    // TODO: 상태 변경 테스트 추가
    await waitFor(() => {
      // 예: expect(screen.getByText('expected text')).toBeInTheDocument();
    });
  });

  // 에러 처리 테스트
  it('handles errors gracefully', () => {
    // TODO: 에러 상황 테스트 추가
  });

  // 접근성 테스트
  it('is accessible', () => {
    render(<{{componentName}} />);
    // TODO: 접근성 테스트 추가
    // 예: expect(screen.getByRole('main')).toBeInTheDocument();
  });
});`,

        page: `import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {{pageName}} from '{{pagePath}}';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '{{pathname}}',
    query: {},
    asPath: '{{pathname}}'
  })
}));

describe('{{pageName}} Page', () => {
  beforeEach(() => {
    // 각 테스트 전 초기화
  });

  it('renders page correctly', () => {
    render(<{{pageName}} />);
    
    // TODO: 페이지 제목, 주요 요소 확인
  });

  it('handles navigation correctly', () => {
    render(<{{pageName}} />);
    
    // TODO: 네비게이션 테스트
  });

  it('loads data correctly', async () => {
    render(<{{pageName}} />);
    
    // TODO: 데이터 로딩 테스트
  });

  it('handles error states', () => {
    // TODO: 에러 상태 테스트
  });
});`
      },

      api: {
        route: `import { createMocks } from 'node-mocks-http';
import handler from '{{apiPath}}';

describe('{{apiEndpoint}} API', () => {
  // GET 테스트
  it('handles GET request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        // TODO: 쿼리 파라미터 추가
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    // TODO: 응답 데이터 검증
  });

  // POST 테스트
  it('handles POST request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // TODO: 요청 본문 추가
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    // TODO: 생성 결과 검증
  });

  // 에러 처리 테스트
  it('handles invalid requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // TODO: 잘못된 데이터
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  // 인증 테스트
  it('requires authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        // TODO: 인증 헤더 없음
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});`
      },

      util: {
        function: `import { {{functionName}} } from '{{utilPath}}';

describe('{{functionName}}', () => {
  // 정상 케이스 테스트
  it('works with valid input', () => {
    const input = /* TODO: 테스트 입력값 */;
    const expected = /* TODO: 예상 결과 */;
    
    const result = {{functionName}}(input);
    
    expect(result).toEqual(expected);
  });

  // 경계값 테스트
  it('handles edge cases', () => {
    // TODO: 경계값 테스트 케이스들
    expect({{functionName}}(null)).toBe(/* expected */);
    expect({{functionName}}(undefined)).toBe(/* expected */);
    expect({{functionName}}('')).toBe(/* expected */);
  });

  // 에러 케이스 테스트
  it('throws error for invalid input', () => {
    expect(() => {
      {{functionName}}(/* invalid input */);
    }).toThrow();
  });

  // 타입 체크 테스트 (TypeScript)
  it('has correct types', () => {
    // TODO: 타입 관련 테스트
  });
});`
      }
    };

    this.testStats = {
      generated: 0,
      executed: 0,
      passed: 0,
      failed: 0,
      coverage: 0
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

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      
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
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  // 파일 분석하여 테스트 대상 식별
  analyzeFile(filePath, content) {
    const analysis = {
      type: null,
      name: null,
      functions: [],
      components: [],
      exports: [],
      imports: []
    };

    // 파일 타입 결정
    if (filePath.includes('/api/')) {
      analysis.type = 'api';
    } else if (filePath.includes('/components/') || filePath.endsWith('.tsx')) {
      analysis.type = 'component';
    } else if (filePath.includes('/pages/') || filePath.includes('/app/')) {
      analysis.type = 'page';
    } else if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
      analysis.type = 'util';
    }

    // 컴포넌트 찾기
    const componentMatches = content.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+(\w+)|function\s+(\w+))/g);
    if (componentMatches) {
      componentMatches.forEach(match => {
        const nameMatch = match.match(/(?:function|const)\s+(\w+)/);
        if (nameMatch) {
          analysis.components.push(nameMatch[1]);
        }
      });
    }

    // 함수 찾기
    const functionMatches = content.match(/(?:export\s+)?(?:const|function)\s+(\w+)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const nameMatch = match.match(/(?:const|function)\s+(\w+)/);
        if (nameMatch) {
          analysis.functions.push(nameMatch[1]);
        }
      });
    }

    // exports 찾기
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:\{[^}]+\}|(?:const|function|class)\s+\w+)/g);
    if (exportMatches) {
      analysis.exports = exportMatches;
    }

    analysis.name = path.basename(filePath, path.extname(filePath));
    
    return analysis;
  }

  // 테스트 파일 생성
  generateTestFile(filePath, analysis) {
    let template = '';
    let testPath = '';

    const relativePath = path.relative(process.cwd(), filePath);
    const testDir = path.join(process.cwd(), '__tests__');
    
    // 테스트 디렉토리 생성
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    switch (analysis.type) {
      case 'component':
        template = this.testTemplates.react.component;
        testPath = path.join(testDir, `${analysis.name}.test.tsx`);
        
        template = template
          .replace(/\{\{componentName\}\}/g, analysis.name)
          .replace(/\{\{componentPath\}\}/g, `../${relativePath.replace(/\\/g, '/')}`);
        break;

      case 'page':
        template = this.testTemplates.react.page;
        testPath = path.join(testDir, `${analysis.name}.page.test.tsx`);
        
        const pathname = relativePath.includes('pages') 
          ? '/' + path.dirname(relativePath.replace('pages/', '')).replace(/\\/g, '/')
          : '/' + analysis.name.toLowerCase();
        
        template = template
          .replace(/\{\{pageName\}\}/g, analysis.name)
          .replace(/\{\{pagePath\}\}/g, `../${relativePath.replace(/\\/g, '/')}`)
          .replace(/\{\{pathname\}\}/g, pathname);
        break;

      case 'api':
        template = this.testTemplates.api.route;
        testPath = path.join(testDir, `${analysis.name}.api.test.js`);
        
        template = template
          .replace(/\{\{apiEndpoint\}\}/g, analysis.name)
          .replace(/\{\{apiPath\}\}/g, `../${relativePath.replace(/\\/g, '/')}`);
        break;

      case 'util':
        template = this.testTemplates.util.function;
        testPath = path.join(testDir, `${analysis.name}.util.test.js`);
        
        const mainFunction = analysis.functions[0] || analysis.name;
        template = template
          .replace(/\{\{functionName\}\}/g, mainFunction)
          .replace(/\{\{utilPath\}\}/g, `../${relativePath.replace(/\\/g, '/')}`);
        break;

      default:
        this.log(`알 수 없는 파일 타입: ${filePath}`, 'WARNING');
        return null;
    }

    return { testPath, template };
  }

  // 기존 테스트 분석
  analyzeExistingTest(testPath) {
    if (!fs.existsSync(testPath)) {
      return { exists: false, coverage: 0, testCount: 0 };
    }

    const content = fs.readFileSync(testPath, 'utf8');
    
    // 테스트 케이스 개수 세기
    const testMatches = content.match(/it\(|test\(/g);
    const testCount = testMatches ? testMatches.length : 0;
    
    // TODO 개수 세기 (완성도 측정)
    const todoMatches = content.match(/\/\/\s*TODO:/gi);
    const todoCount = todoMatches ? todoMatches.length : 0;
    
    // 대략적인 커버리지 추정 (TODO가 적을수록 높음)
    const coverage = testCount > 0 ? Math.max(0, 100 - (todoCount * 10)) : 0;

    return {
      exists: true,
      coverage,
      testCount,
      todoCount
    };
  }

  // 스마트 테스트 생성
  async generateSmartTests(targetFiles = []) {
    this.log('🧪 스마트 테스트 생성 시작', 'INFO');

    let filesToProcess = targetFiles;
    
    if (filesToProcess.length === 0) {
      // 변경된 파일들 자동 감지
      try {
        const gitDiff = await this.runCommand('git', ['diff', '--name-only', 'HEAD']);
        const stagedDiff = await this.runCommand('git', ['diff', '--cached', '--name-only']);
        
        const changedFiles = [...new Set([
          ...gitDiff.split('\n').filter(f => f.trim()),
          ...stagedDiff.split('\n').filter(f => f.trim())
        ])];

        filesToProcess = changedFiles.filter(file => 
          (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
          !file.includes('test') &&
          !file.includes('spec') &&
          fs.existsSync(file)
        );
      } catch (error) {
        this.log('Git 변경사항 감지 실패, 전체 스캔 진행', 'WARNING');
        
        // 전체 파일 스캔
        const findOutput = await this.runCommand('find', ['.', '-name', '*.tsx', '-o', '-name', '*.ts', '-o', '-name', '*.jsx', '-o', '-name', '*.js']);
        filesToProcess = findOutput.split('\n')
          .filter(f => f.trim() && !f.includes('node_modules') && !f.includes('test') && !f.includes('spec'))
          .slice(0, 20); // 최대 20개 파일만
      }
    }

    if (filesToProcess.length === 0) {
      this.log('테스트 생성할 파일이 없습니다.', 'WARNING');
      return;
    }

    this.log(`${filesToProcess.length}개 파일 분석 중...`, 'INFO');

    const results = [];

    for (const filePath of filesToProcess) {
      try {
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeFile(filePath, content);
        
        if (!analysis.type) {
          continue;
        }

        const testGeneration = this.generateTestFile(filePath, analysis);
        
        if (!testGeneration) {
          continue;
        }

        const { testPath, template } = testGeneration;
        const existingTest = this.analyzeExistingTest(testPath);

        if (!existingTest.exists) {
          // 새 테스트 파일 생성
          fs.writeFileSync(testPath, template);
          this.log(`✅ 테스트 생성: ${path.basename(testPath)}`, 'SUCCESS');
          this.testStats.generated++;
        } else if (existingTest.coverage < 50) {
          // 기존 테스트가 불완전한 경우 개선 제안
          this.log(`⚠️ 테스트 개선 필요: ${path.basename(testPath)} (커버리지: ${existingTest.coverage}%)`, 'WARNING');
        } else {
          this.log(`✅ 테스트 존재: ${path.basename(testPath)} (커버리지: ${existingTest.coverage}%)`, 'INFO');
        }

        results.push({
          filePath,
          testPath,
          analysis,
          existingTest,
          action: !existingTest.exists ? 'created' : 'exists'
        });

      } catch (error) {
        this.log(`❌ ${filePath} 처리 실패: ${error.message}`, 'ERROR');
      }
    }

    return results;
  }

  // 테스트 실행
  async runTests(testPattern = '') {
    this.log('🚀 테스트 실행 중...', 'INFO');

    try {
      const jestArgs = [
        'test',
        '--coverage',
        '--verbose',
        '--passWithNoTests'
      ];

      if (testPattern) {
        jestArgs.push(testPattern);
      }

      const output = await this.runCommand('npm', jestArgs);
      
      // Jest 출력 파싱
      const lines = output.split('\n');
      
      // 테스트 결과 파싱
      let passed = 0, failed = 0, coverage = 0;
      
      lines.forEach(line => {
        if (line.includes('passed')) {
          const match = line.match(/(\d+) passed/);
          if (match) passed += parseInt(match[1]);
        }
        
        if (line.includes('failed')) {
          const match = line.match(/(\d+) failed/);
          if (match) failed += parseInt(match[1]);
        }
        
        if (line.includes('All files')) {
          const match = line.match(/(\d+\.?\d*)%/);
          if (match) coverage = parseFloat(match[1]);
        }
      });

      this.testStats.executed = passed + failed;
      this.testStats.passed = passed;
      this.testStats.failed = failed;
      this.testStats.coverage = coverage;

      this.log(`✅ 테스트 완료: ${passed}개 통과, ${failed}개 실패, 커버리지: ${coverage}%`, 'SUCCESS');
      
      return {
        passed,
        failed,
        coverage,
        output
      };

    } catch (error) {
      this.log(`❌ 테스트 실행 실패: ${error.message}`, 'ERROR');
      return {
        passed: 0,
        failed: 1,
        coverage: 0,
        output: error.message
      };
    }
  }

  // 테스트 커버리지 분석
  async analyzeCoverage() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html');
    
    if (fs.existsSync(coveragePath)) {
      this.log(`📊 커버리지 보고서: ${coveragePath}`, 'INFO');
      
      // 커버리지 데이터 읽기
      const coverageData = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coverageData)) {
        const summary = JSON.parse(fs.readFileSync(coverageData, 'utf8'));
        
        return {
          lines: summary.total.lines.pct,
          functions: summary.total.functions.pct,
          branches: summary.total.branches.pct,
          statements: summary.total.statements.pct
        };
      }
    }

    return null;
  }

  // 테스트 보고서 생성
  generateTestReport(results, testResults, coverage) {
    const reportPath = path.join(process.cwd(), 'docs', 'test-generation-report.md');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = `# 🧪 자동 테스트 생성 보고서

**생성 시간:** ${new Date().toLocaleString('ko-KR')}

## 📊 요약

- **생성된 테스트:** ${this.testStats.generated}개
- **실행된 테스트:** ${this.testStats.executed}개
- **통과한 테스트:** ${this.testStats.passed}개
- **실패한 테스트:** ${this.testStats.failed}개
- **전체 커버리지:** ${this.testStats.coverage}%

## 📋 생성된 테스트 목록

${results.map(result => `
### ${path.basename(result.filePath)}

- **타입:** ${result.analysis.type}
- **테스트 파일:** \`${path.basename(result.testPath)}\`
- **상태:** ${result.action === 'created' ? '✅ 새로 생성됨' : '📄 기존 파일 존재'}
- **커버리지:** ${result.existingTest.coverage || 0}%
${result.analysis.components.length > 0 ? `- **컴포넌트:** ${result.analysis.components.join(', ')}` : ''}
${result.analysis.functions.length > 0 ? `- **함수:** ${result.analysis.functions.join(', ')}` : ''}
`).join('\n')}

## 📈 커버리지 상세

${coverage ? `
- **라인 커버리지:** ${coverage.lines}%
- **함수 커버리지:** ${coverage.functions}%
- **브랜치 커버리지:** ${coverage.branches}%
- **구문 커버리지:** ${coverage.statements}%
` : '커버리지 데이터 없음'}

## 🎯 개선 제안

${this.testStats.failed > 0 ? `
### 🚨 실패한 테스트 수정
${this.testStats.failed}개의 테스트가 실패했습니다. 다음 사항을 확인하세요:
- TODO 주석으로 표시된 부분 완성
- Mock 데이터 추가
- 컴포넌트 Props 타입 확인
` : ''}

${this.testStats.coverage < 80 ? `
### 📊 커버리지 향상
현재 커버리지가 ${this.testStats.coverage}%입니다. 다음을 고려하세요:
- 에지 케이스 테스트 추가
- 에러 처리 로직 테스트
- 사용자 상호작용 시나리오 테스트
` : ''}

### ✨ 테스트 품질 향상
- TODO 주석 완성하기
- 실제 비즈니스 로직에 맞는 테스트 데이터 사용
- 접근성 테스트 추가
- 성능 테스트 고려

## 🚀 다음 단계

1. **생성된 테스트 완성하기**
   \`\`\`bash
   # TODO 주석이 있는 테스트 파일들 확인
   grep -r "TODO:" __tests__/
   \`\`\`

2. **테스트 실행하기**
   \`\`\`bash
   npm test
   \`\`\`

3. **커버리지 확인하기**
   \`\`\`bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   \`\`\`

---
*🤖 자동 테스트 생성기에 의해 생성됨*`;

    fs.writeFileSync(reportPath, report);
    this.log(`📄 테스트 보고서 저장됨: ${reportPath}`, 'SUCCESS');
    
    return reportPath;
  }

  // 메인 실행 함수
  async run(options = {}) {
    const { files = [], runTests = true, generateReport = true } = options;

    try {
      // 1. 테스트 생성
      const results = await this.generateSmartTests(files);
      
      if (!results || results.length === 0) {
        this.log('생성된 테스트가 없습니다.', 'WARNING');
        return;
      }

      // 2. 테스트 실행
      let testResults = null;
      if (runTests) {
        testResults = await this.runTests();
      }

      // 3. 커버리지 분석
      let coverage = null;
      if (runTests) {
        coverage = await this.analyzeCoverage();
      }

      // 4. 보고서 생성
      if (generateReport) {
        const reportPath = this.generateTestReport(results, testResults, coverage);
        
        // 보고서 출력
        console.log('\n' + fs.readFileSync(reportPath, 'utf8'));
      }

      // 5. 요약 출력
      this.log('🎉 자동 테스트 생성 완료!', 'SUCCESS');
      console.log(`
📊 결과 요약:
- 생성된 테스트: ${this.testStats.generated}개
- 실행 결과: ${this.testStats.passed}개 통과, ${this.testStats.failed}개 실패
- 커버리지: ${this.testStats.coverage}%
      `);

    } catch (error) {
      this.log(`❌ 테스트 생성 중 오류: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const generator = new AutoTestGenerator();

  try {
    if (args.length === 0) {
      // 기본 모드: 변경된 파일들 자동 감지
      await generator.run();
      
    } else if (args[0] === 'generate') {
      // 테스트 생성만
      await generator.run({ runTests: false });
      
    } else if (args[0] === 'run') {
      // 테스트 실행만
      const testResults = await generator.runTests();
      console.log(testResults.output);
      
    } else if (args[0] === 'coverage') {
      // 커버리지 분석만
      const coverage = await generator.analyzeCoverage();
      console.log('커버리지:', coverage);
      
    } else {
      // 특정 파일들 지정
      await generator.run({ files: args });
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutoTestGenerator;