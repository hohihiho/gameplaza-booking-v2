#!/usr/bin/env node

/**
 * AI 코드 리뷰 자동화 시스템
 * 변경된 코드를 분석하여 자동으로 리뷰 및 개선사항 제안
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AICodeReviewer {
  constructor() {
    this.reviewRules = {
      // 보안 검사 규칙
      security: [
        {
          pattern: /console\.log\([^)]*password[^)]*\)/gi,
          severity: 'high',
          message: '비밀번호가 콘솔에 로그될 수 있습니다.',
          suggestion: 'console.log에서 민감한 정보를 제거하세요.'
        },
        {
          pattern: /\.innerHTML\s*=\s*[^;]+/gi,
          severity: 'medium',
          message: 'innerHTML 사용은 XSS 취약점을 유발할 수 있습니다.',
          suggestion: '대신 textContent나 안전한 DOM 조작을 사용하세요.'
        },
        {
          pattern: /eval\s*\(/gi,
          severity: 'high',
          message: 'eval() 사용은 보안 위험이 높습니다.',
          suggestion: 'eval() 대신 안전한 대안을 사용하세요.'
        }
      ],

      // 성능 검사 규칙
      performance: [
        {
          pattern: /for\s*\(\s*let\s+\w+\s*=\s*0[^{]*{[^}]*\.push\(/gi,
          severity: 'medium', 
          message: '반복문에서 배열 push는 성능상 비효율적일 수 있습니다.',
          suggestion: '가능하면 map, filter 등 함수형 방법을 고려하세요.'
        },
        {
          pattern: /document\.getElementById\([^)]+\)/gi,
          severity: 'low',
          message: '반복적인 DOM 조회는 성능에 영향을 줄 수 있습니다.',
          suggestion: 'DOM 요소를 변수에 캐시하는 것을 고려하세요.'
        }
      ],

      // 코드 품질 검사 규칙
      quality: [
        {
          pattern: /function\s+\w+\([^)]*\)\s*{[\s\S]{200,}/gm,
          severity: 'medium',
          message: '함수가 너무 깁니다 (200+ 문자).',
          suggestion: '함수를 더 작은 단위로 분리하는 것을 고려하세요.'
        },
        {
          pattern: /\/\/\s*TODO:/gi,
          severity: 'low',
          message: 'TODO 주석이 발견되었습니다.',
          suggestion: 'TODO 항목을 이슈로 등록하거나 완료하세요.'
        },
        {
          pattern: /var\s+/gi,
          severity: 'low',
          message: 'var 대신 let/const 사용을 권장합니다.',
          suggestion: 'let 또는 const를 사용하세요.'
        }
      ],

      // React 특화 규칙
      react: [
        {
          pattern: /useEffect\(\s*\(\s*\)\s*=>\s*{[\s\S]*},\s*\[\s*\]\s*\)/gm,
          severity: 'medium',
          message: '빈 의존성 배열의 useEffect는 주의가 필요합니다.',
          suggestion: '컴포넌트 마운트 시에만 실행되는지 확인하세요.'
        },
        {
          pattern: /useState\(\s*[^)]*\)\s*\n\s*useState/gm,
          severity: 'low',
          message: '연속적인 useState는 하나의 객체로 관리할 수 있습니다.',
          suggestion: 'useReducer나 단일 상태 객체 사용을 고려하세요.'
        }
      ],

      // Next.js 특화 규칙
      nextjs: [
        {
          pattern: /<img\s+src=/gi,
          severity: 'medium',
          message: 'Next.js에서는 Image 컴포넌트 사용을 권장합니다.',
          suggestion: 'next/image의 Image 컴포넌트를 사용하세요.'
        },
        {
          pattern: /<a\s+href=/gi,
          severity: 'low',
          message: 'Next.js에서는 Link 컴포넌트 사용을 권장합니다.',
          suggestion: 'next/link의 Link 컴포넌트를 사용하세요.'
        }
      ]
    };

    this.codeMetrics = {
      complexity: 0,
      maintainability: 100,
      testCoverage: 0,
      duplication: 0
    };
  }

  log(message, level = 'INFO') {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      HIGH: '\x1b[41m',
      MEDIUM: '\x1b[43m',
      LOW: '\x1b[44m',
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

  // 변경된 파일 목록 가져오기
  async getChangedFiles(baseBranch = 'main') {
    try {
      const diff = await this.runCommand('git', ['diff', '--name-only', `${baseBranch}...HEAD`]);
      const staged = await this.runCommand('git', ['diff', '--cached', '--name-only']);
      
      const allFiles = [...new Set([
        ...diff.split('\n').filter(f => f.trim()),
        ...staged.split('\n').filter(f => f.trim())
      ])];

      // 코드 파일만 필터링
      return allFiles.filter(file => 
        /\.(js|jsx|ts|tsx|vue|py|java|go|php|rb)$/i.test(file) &&
        fs.existsSync(file)
      );
    } catch (error) {
      this.log(`파일 목록 가져오기 실패: ${error.message}`, 'ERROR');
      return [];
    }
  }

  // 파일 내용 분석
  analyzeFile(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    // 파일 확장자에 따른 규칙 선택
    const ext = path.extname(filePath).toLowerCase();
    let rulesToApply = ['security', 'performance', 'quality'];
    
    if (['.jsx', '.tsx'].includes(ext)) {
      rulesToApply.push('react');
    }
    
    if (filePath.includes('pages/') || filePath.includes('app/')) {
      rulesToApply.push('nextjs');
    }

    // 각 규칙 적용
    rulesToApply.forEach(category => {
      if (this.reviewRules[category]) {
        this.reviewRules[category].forEach(rule => {
          const matches = content.match(rule.pattern);
          if (matches) {
            matches.forEach(match => {
              const lineNumber = this.findLineNumber(content, match);
              issues.push({
                file: filePath,
                line: lineNumber,
                category,
                severity: rule.severity,
                message: rule.message,
                suggestion: rule.suggestion,
                code: match.trim()
              });
            });
          }
        });
      }
    });

    return issues;
  }

  // 코드에서 특정 패턴의 라인 번호 찾기
  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 1;
  }

  // 코드 복잡도 계산
  calculateComplexity(content) {
    const complexityPatterns = [
      /if\s*\(/gi,      // if 문
      /for\s*\(/gi,     // for 문
      /while\s*\(/gi,   // while 문
      /catch\s*\(/gi,   // try-catch
      /case\s+/gi,      // switch-case
      /&&|\|\|/gi       // 논리 연산자
    ];

    let complexity = 1; // 기본 복잡도
    
    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  // 중복 코드 검사
  detectDuplication(files, contents) {
    const duplications = [];
    const minDuplicateLength = 50; // 최소 중복 길이

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const content1 = contents[i];
        const content2 = contents[j];
        
        const lines1 = content1.split('\n');
        const lines2 = content2.split('\n');
        
        for (let l1 = 0; l1 < lines1.length - 3; l1++) {
          const block1 = lines1.slice(l1, l1 + 4).join('\n');
          
          if (block1.length < minDuplicateLength) continue;
          
          for (let l2 = 0; l2 < lines2.length - 3; l2++) {
            const block2 = lines2.slice(l2, l2 + 4).join('\n');
            
            if (block1 === block2) {
              duplications.push({
                file1: files[i],
                line1: l1 + 1,
                file2: files[j],
                line2: l2 + 1,
                duplicatedCode: block1
              });
            }
          }
        }
      }
    }

    return duplications;
  }

  // 테스트 커버리지 확인
  async checkTestCoverage() {
    try {
      const coverageOutput = await this.runCommand('npm', ['run', 'test:coverage']);
      
      // Jest 커버리지 결과 파싱
      const coverageMatch = coverageOutput.match(/All files\s+\|\s+(\d+\.?\d*)/);
      return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
    } catch (error) {
      this.log('테스트 커버리지 확인 실패 (테스트 실행 안됨)', 'WARNING');
      return 0;
    }
  }

  // 개선 제안 생성
  generateSuggestions(issues, metrics) {
    const suggestions = [];

    // 심각도별 이슈 분류
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');

    if (highIssues.length > 0) {
      suggestions.push({
        priority: 'high',
        title: '🚨 긴급 수정 필요',
        description: `${highIssues.length}개의 심각한 보안/성능 이슈가 발견되었습니다.`,
        actions: highIssues.map(i => `${i.file}:${i.line} - ${i.message}`)
      });
    }

    if (metrics.complexity > 10) {
      suggestions.push({
        priority: 'medium',
        title: '🔧 코드 복잡도 개선',
        description: `평균 복잡도가 ${metrics.complexity}로 높습니다 (권장: 10 이하).`,
        actions: ['함수를 더 작은 단위로 분리', '조건문 중첩 줄이기', 'early return 패턴 사용']
      });
    }

    if (metrics.testCoverage < 80) {
      suggestions.push({
        priority: 'medium',
        title: '🧪 테스트 커버리지 향상',
        description: `현재 커버리지: ${metrics.testCoverage}% (권장: 80% 이상)`,
        actions: ['핵심 비즈니스 로직 테스트 추가', '에지 케이스 테스트 작성']
      });
    }

    if (metrics.duplication > 5) {
      suggestions.push({
        priority: 'low',
        title: '♻️ 코드 중복 제거',
        description: `${metrics.duplication}개의 중복 코드 블록이 발견되었습니다.`,
        actions: ['공통 함수로 추출', '컴포넌트/유틸리티 분리']
      });
    }

    return suggestions;
  }

  // 리뷰 보고서 생성
  generateReport(issues, metrics, suggestions, files) {
    const timestamp = new Date().toLocaleString('ko-KR');
    
    const report = {
      timestamp,
      summary: {
        filesReviewed: files.length,
        issuesFound: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'high').length,
        averageComplexity: metrics.complexity,
        testCoverage: metrics.testCoverage
      },
      issues: issues.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      metrics,
      suggestions,
      files
    };

    return report;
  }

  // 보고서를 마크다운으로 출력
  printMarkdownReport(report) {
    const { summary, issues, suggestions } = report;
    
    console.log('# 🤖 AI 코드 리뷰 보고서\n');
    console.log(`**생성 시간:** ${report.timestamp}\n`);
    
    console.log('## 📊 요약\n');
    console.log(`- 리뷰된 파일: ${summary.filesReviewed}개`);
    console.log(`- 발견된 이슈: ${summary.issuesFound}개`);
    console.log(`- 심각한 이슈: ${summary.criticalIssues}개`);
    console.log(`- 평균 복잡도: ${summary.averageComplexity}`);
    console.log(`- 테스트 커버리지: ${summary.testCoverage}%\n`);

    if (issues.length > 0) {
      console.log('## 🔍 발견된 이슈\n');
      
      issues.forEach((issue, index) => {
        const severityEmoji = {
          high: '🚨',
          medium: '⚠️',
          low: 'ℹ️'
        };
        
        console.log(`### ${severityEmoji[issue.severity]} 이슈 #${index + 1}`);
        console.log(`**파일:** \`${issue.file}:${issue.line}\``);
        console.log(`**카테고리:** ${issue.category}`);
        console.log(`**심각도:** ${issue.severity}`);
        console.log(`**문제:** ${issue.message}`);
        console.log(`**제안:** ${issue.suggestion}\n`);
        
        if (issue.code) {
          console.log('```javascript');
          console.log(issue.code);
          console.log('```\n');
        }
      });
    }

    if (suggestions.length > 0) {
      console.log('## 💡 개선 제안\n');
      
      suggestions.forEach((suggestion, index) => {
        const priorityEmoji = {
          high: '🚨',
          medium: '⚠️', 
          low: 'ℹ️'
        };
        
        console.log(`### ${priorityEmoji[suggestion.priority]} ${suggestion.title}`);
        console.log(`${suggestion.description}\n`);
        
        if (suggestion.actions) {
          console.log('**액션 아이템:**');
          suggestion.actions.forEach(action => {
            console.log(`- ${action}`);
          });
          console.log('');
        }
      });
    }

    console.log('---');
    console.log('*🤖 AI 코드 리뷰어에 의해 자동 생성됨*');
  }

  // 메인 리뷰 실행
  async runReview(baseBranch = 'main') {
    this.log('🤖 AI 코드 리뷰 시작', 'INFO');
    
    try {
      // 변경된 파일 목록 가져오기
      const files = await this.getChangedFiles(baseBranch);
      
      if (files.length === 0) {
        this.log('리뷰할 파일이 없습니다.', 'WARNING');
        return;
      }

      this.log(`${files.length}개 파일 리뷰 중...`, 'INFO');

      const allIssues = [];
      const contents = [];
      let totalComplexity = 0;

      // 각 파일 분석
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          contents.push(content);
          
          const issues = this.analyzeFile(file, content);
          allIssues.push(...issues);
          
          const complexity = this.calculateComplexity(content);
          totalComplexity += complexity;
          
          this.log(`✅ ${file} 분석 완료 (이슈: ${issues.length}개, 복잡도: ${complexity})`, 'SUCCESS');
        } catch (error) {
          this.log(`❌ ${file} 분석 실패: ${error.message}`, 'ERROR');
        }
      }

      // 메트릭 계산
      const duplications = this.detectDuplication(files, contents);
      const testCoverage = await this.checkTestCoverage();
      
      this.codeMetrics = {
        complexity: Math.round(totalComplexity / files.length),
        maintainability: Math.max(0, 100 - (totalComplexity * 2) - (allIssues.length * 5)),
        testCoverage,
        duplication: duplications.length
      };

      // 개선 제안 생성
      const suggestions = this.generateSuggestions(allIssues, this.codeMetrics);

      // 보고서 생성 및 출력
      const report = this.generateReport(allIssues, this.codeMetrics, suggestions, files);
      
      // 보고서 저장
      const reportPath = path.join(process.cwd(), 'docs', 'code-review-report.md');
      const reportDir = path.dirname(reportPath);
      
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // 콘솔 출력을 파일로 리다이렉트
      const originalLog = console.log;
      let markdownContent = '';
      
      console.log = (message) => {
        markdownContent += message + '\n';
      };
      
      this.printMarkdownReport(report);
      
      console.log = originalLog;
      
      fs.writeFileSync(reportPath, markdownContent);
      
      // 콘솔에도 출력
      this.printMarkdownReport(report);
      
      this.log(`📄 보고서가 저장되었습니다: ${reportPath}`, 'SUCCESS');
      
      // 점수 계산
      const score = Math.max(0, 100 - (allIssues.length * 10) - (this.codeMetrics.complexity * 2));
      this.log(`🏆 코드 품질 점수: ${score}/100`, score >= 80 ? 'SUCCESS' : score >= 60 ? 'WARNING' : 'ERROR');

    } catch (error) {
      this.log(`리뷰 실행 중 오류: ${error.message}`, 'ERROR');
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const reviewer = new AICodeReviewer();

  try {
    const baseBranch = args[0] || 'main';
    await reviewer.runReview(baseBranch);
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AICodeReviewer;