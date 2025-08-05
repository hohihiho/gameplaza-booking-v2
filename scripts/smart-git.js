#!/usr/bin/env node

/**
 * 스마트 Git 워크플로우 자동화 도구
 * 브랜치 생성, 커밋 메시지 자동 생성, PR 자동 생성
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

class SmartGit {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.branchTypes = {
      'feature': '새로운 기능 개발',
      'fix': '버그 수정',
      'refactor': '코드 리팩토링',
      'docs': '문서화',
      'test': '테스트 추가/수정',
      'chore': '기타 작업',
      'hotfix': '긴급 수정'
    };

    this.commitTypes = {
      'feat': '새로운 기능 추가',
      'fix': '버그 수정',
      'docs': '문서 수정',
      'style': '코드 스타일 변경',
      'refactor': '코드 리팩토링',
      'test': '테스트 코드',
      'chore': '기타 변경사항',
      'perf': '성능 개선',
      'ci': 'CI/CD 변경',
      'build': '빌드 시스템 변경'
    };
  }

  log(message, level = 'INFO') {
    const colors = {
      INFO: '\x1b[36m',    // cyan
      SUCCESS: '\x1b[32m', // green
      WARNING: '\x1b[33m', // yellow
      ERROR: '\x1b[31m',   // red
      RESET: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.RESET}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        ...options
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
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  // Git 상태 확인
  async checkGitStatus() {
    try {
      const status = await this.runCommand('git', ['status', '--porcelain']);
      const branch = await this.runCommand('git', ['branch', '--show-current']);
      
      return {
        hasChanges: status.length > 0,
        currentBranch: branch,
        changes: status.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      throw new Error('Git 저장소가 아니거나 Git이 설치되지 않았습니다.');
    }
  }

  // 변경사항 분석
  async analyzeChanges() {
    try {
      const diffOutput = await this.runCommand('git', ['diff', '--name-status', 'HEAD']);
      const stagedDiff = await this.runCommand('git', ['diff', '--cached', '--name-status']);
      
      const allChanges = (diffOutput + '\n' + stagedDiff).split('\n').filter(line => line.trim());
      
      const analysis = {
        modified: [],
        added: [],
        deleted: [],
        renamed: [],
        total: 0
      };

      allChanges.forEach(line => {
        const [status, file] = line.split('\t');
        if (!file) return;
        
        analysis.total++;
        
        switch (status[0]) {
          case 'M': analysis.modified.push(file); break;
          case 'A': analysis.added.push(file); break;
          case 'D': analysis.deleted.push(file); break;
          case 'R': analysis.renamed.push(file); break;
        }
      });

      return analysis;
    } catch (error) {
      return { modified: [], added: [], deleted: [], renamed: [], total: 0 };
    }
  }

  // 커밋 메시지 자동 생성
  generateCommitMessage(changes, type = 'feat') {
    const { modified, added, deleted, total } = changes;
    
    let subject = '';
    let body = [];

    // 주제 생성
    if (added.length > 0) {
      const newFiles = added.filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js'));
      if (newFiles.length > 0) {
        subject = `${type}: ${path.basename(newFiles[0], path.extname(newFiles[0]))} 컴포넌트 추가`;
      }
    }

    if (!subject && modified.length > 0) {
      const mainFile = modified.find(f => f.includes('page.tsx') || f.includes('component') || f.includes('api'));
      if (mainFile) {
        subject = `${type}: ${path.basename(mainFile, path.extname(mainFile))} 기능 개선`;
      }
    }

    if (!subject) {
      subject = `${type}: ${total}개 파일 업데이트`;
    }

    // 본문 생성
    if (added.length > 0) {
      body.push(`새로운 파일: ${added.length}개`);
      added.slice(0, 5).forEach(file => body.push(`  + ${file}`));
      if (added.length > 5) body.push(`  + ... ${added.length - 5}개 더`);
    }

    if (modified.length > 0) {
      body.push(`수정된 파일: ${modified.length}개`);
      modified.slice(0, 5).forEach(file => body.push(`  * ${file}`));
      if (modified.length > 5) body.push(`  * ... ${modified.length - 5}개 더`);
    }

    if (deleted.length > 0) {
      body.push(`삭제된 파일: ${deleted.length}개`);
      deleted.forEach(file => body.push(`  - ${file}`));
    }

    return {
      subject,
      body: body.join('\n'),
      full: body.length > 0 ? `${subject}\n\n${body.join('\n')}` : subject
    };
  }

  // 스마트 브랜치 생성
  async createSmartBranch() {
    this.log('🌿 스마트 브랜치 생성 시작', 'INFO');
    
    console.log('\n=== 브랜치 타입 선택 ===');
    Object.entries(this.branchTypes).forEach(([type, desc], index) => {
      console.log(`${index + 1}. ${type} - ${desc}`);
    });

    const typeChoice = await this.question('\n브랜치 타입을 선택하세요 (1-7): ');
    const typeIndex = parseInt(typeChoice) - 1;
    const types = Object.keys(this.branchTypes);
    
    if (typeIndex < 0 || typeIndex >= types.length) {
      throw new Error('잘못된 선택입니다.');
    }

    const branchType = types[typeIndex];
    const description = await this.question('브랜치 설명을 입력하세요: ');
    
    // 브랜치명 생성 (한글 -> 영문 변환)
    const branchDescription = description
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const branchName = `${branchType}/${timestamp}-${branchDescription}`;

    try {
      await this.runCommand('git', ['checkout', '-b', branchName]);
      this.log(`✅ 브랜치 생성 성공: ${branchName}`, 'SUCCESS');
      return branchName;
    } catch (error) {
      throw new Error(`브랜치 생성 실패: ${error.message}`);
    }
  }

  // 스마트 커밋
  async createSmartCommit() {
    this.log('💬 스마트 커밋 생성 시작', 'INFO');
    
    const status = await this.checkGitStatus();
    
    if (!status.hasChanges) {
      this.log('커밋할 변경사항이 없습니다.', 'WARNING');
      return;
    }

    console.log('\n=== 현재 변경사항 ===');
    status.changes.forEach(change => console.log(`  ${change}`));

    const stageAll = await this.question('\n모든 변경사항을 스테이징하시겠습니까? (y/n): ');
    
    if (stageAll.toLowerCase() === 'y') {
      await this.runCommand('git', ['add', '.']);
      this.log('✅ 모든 변경사항이 스테이징되었습니다.', 'SUCCESS');
    }

    console.log('\n=== 커밋 타입 선택 ===');
    Object.entries(this.commitTypes).forEach(([type, desc], index) => {
      console.log(`${index + 1}. ${type} - ${desc}`);
    });

    const typeChoice = await this.question('\n커밋 타입을 선택하세요 (1-10): ');
    const typeIndex = parseInt(typeChoice) - 1;
    const types = Object.keys(this.commitTypes);
    
    if (typeIndex < 0 || typeIndex >= types.length) {
      throw new Error('잘못된 선택입니다.');
    }

    const commitType = types[typeIndex];
    const changes = await this.analyzeChanges();
    const autoMessage = this.generateCommitMessage(changes, commitType);

    console.log('\n=== 자동 생성된 커밋 메시지 ===');
    console.log(autoMessage.full);

    const useAuto = await this.question('\n자동 생성된 메시지를 사용하시겠습니까? (y/n): ');
    
    let finalMessage;
    if (useAuto.toLowerCase() === 'y') {
      finalMessage = autoMessage.full;
    } else {
      const customMessage = await this.question('커밋 메시지를 입력하세요: ');
      finalMessage = `${commitType}: ${customMessage}`;
    }

    try {
      await this.runCommand('git', ['commit', '-m', finalMessage]);
      this.log('✅ 커밋 생성 성공', 'SUCCESS');
      return finalMessage;
    } catch (error) {
      throw new Error(`커밋 생성 실패: ${error.message}`);
    }
  }

  // 스마트 PR 생성
  async createSmartPR() {
    this.log('🔄 스마트 PR 생성 시작', 'INFO');
    
    const status = await this.checkGitStatus();
    const currentBranch = status.currentBranch;
    
    if (currentBranch === 'main' || currentBranch === 'master') {
      throw new Error('메인 브랜치에서는 PR을 생성할 수 없습니다.');
    }

    // 브랜치 푸시
    try {
      await this.runCommand('git', ['push', 'origin', currentBranch]);
      this.log('✅ 브랜치 푸시 완료', 'SUCCESS');
    } catch (error) {
      this.log(`브랜치 푸시 실패: ${error.message}`, 'ERROR');
    }

    // PR 제목 자동 생성
    const commits = await this.runCommand('git', ['log', '--oneline', 'main..HEAD']);
    const commitLines = commits.split('\n').filter(line => line.trim());
    
    let prTitle = currentBranch.replace(/^(feature|fix|refactor)\//, '').replace(/-/g, ' ');
    prTitle = prTitle.charAt(0).toUpperCase() + prTitle.slice(1);

    // PR 본문 자동 생성
    const prBody = `## 📋 변경사항

${commitLines.map(line => `- ${line.substring(8)}`).join('\n')}

## 🧪 테스트

- [ ] 로컬 테스트 완료
- [ ] 브라우저 테스트 완료
- [ ] 모바일 테스트 완료

## 📸 스크린샷

<!-- 필요시 스크린샷 추가 -->

## 🔗 관련 이슈

<!-- 관련 이슈 번호 입력 -->

---
🤖 자동 생성된 PR by Smart Git Tool`;

    console.log('\n=== 자동 생성된 PR 정보 ===');
    console.log(`제목: ${prTitle}`);
    console.log(`\n본문:\n${prBody}`);

    const createPR = await this.question('\nPR을 생성하시겠습니까? (y/n): ');
    
    if (createPR.toLowerCase() === 'y') {
      try {
        // GitHub CLI 사용
        await this.runCommand('gh', ['pr', 'create', '--title', prTitle, '--body', prBody]);
        this.log('✅ PR 생성 성공', 'SUCCESS');
      } catch (error) {
        this.log('GitHub CLI를 사용할 수 없습니다. 수동으로 PR을 생성해주세요.', 'WARNING');
        console.log(`\nPR 정보:\n제목: ${prTitle}\n본문:\n${prBody}`);
      }
    }
  }

  // 워크플로우 통합 실행
  async runWorkflow() {
    this.log('🚀 스마트 Git 워크플로우 시작', 'INFO');
    
    console.log('\n=== Git 워크플로우 메뉴 ===');
    console.log('1. 🌿 새 브랜치 생성');
    console.log('2. 💬 스마트 커밋');
    console.log('3. 🔄 PR 생성');
    console.log('4. 🎯 전체 워크플로우 (브랜치 → 커밋 → PR)');
    console.log('5. 📊 Git 상태 확인');

    const choice = await this.question('\n선택하세요 (1-5): ');

    try {
      switch (choice) {
        case '1':
          await this.createSmartBranch();
          break;
        case '2':
          await this.createSmartCommit();
          break;
        case '3':
          await this.createSmartPR();
          break;
        case '4':
          this.log('🎯 전체 워크플로우 실행', 'INFO');
          const branchName = await this.createSmartBranch();
          this.log('브랜치 생성 완료. 코드를 수정한 후 다시 실행하세요.', 'INFO');
          break;
        case '5':
          const status = await this.checkGitStatus();
          console.log('\n=== Git 상태 ===');
          console.log(`현재 브랜치: ${status.currentBranch}`);
          console.log(`변경사항: ${status.hasChanges ? '있음' : '없음'}`);
          if (status.hasChanges) {
            console.log('변경된 파일:');
            status.changes.forEach(change => console.log(`  ${change}`));
          }
          break;
        default:
          this.log('잘못된 선택입니다.', 'ERROR');
      }
    } catch (error) {
      this.log(`오류 발생: ${error.message}`, 'ERROR');
    } finally {
      this.rl.close();
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const smartGit = new SmartGit();

  try {
    if (args.length === 0) {
      await smartGit.runWorkflow();
    } else if (args[0] === 'branch') {
      await smartGit.createSmartBranch();
    } else if (args[0] === 'commit') {
      await smartGit.createSmartCommit();
    } else if (args[0] === 'pr') {
      await smartGit.createSmartPR();
    } else if (args[0] === 'status') {
      const status = await smartGit.checkGitStatus();
      console.log(`현재 브랜치: ${status.currentBranch}`);
      console.log(`변경사항: ${status.hasChanges ? '있음' : '없음'}`);
    } else {
      console.log(`
사용법:
  node smart-git.js          # 대화형 메뉴
  node smart-git.js branch   # 브랜치 생성
  node smart-git.js commit   # 스마트 커밋
  node smart-git.js pr       # PR 생성
  node smart-git.js status   # Git 상태 확인
      `);
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  } finally {
    smartGit.rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = SmartGit;