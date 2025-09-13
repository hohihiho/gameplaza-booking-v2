#!/usr/bin/env node

/**
 * 🔮 Ultra Monitor - 보이지 않는 에러까지 잡는 궁극의 모니터
 *
 * 감지 가능한 문제들:
 * - 클릭해도 반응 없는 버튼
 * - 무한 로딩 상태
 * - 렌더링 실패 (빈 화면)
 * - 이벤트 리스너 누락
 * - 데드 링크
 * - 느린 응답 시간
 * - 접근성 문제
 * - 레이아웃 깨짐
 * - 스크롤 불가
 * - 폼 제출 실패
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class UltraMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.issues = [];
    this.clickableElements = new Map();
    this.interactionLog = [];
    this.performanceBaseline = new Map();
    this.config = {
      url: 'http://localhost:3000',
      checkInterval: 1000, // 1초마다 체크
      clickTimeout: 3000, // 클릭 후 3초 대기
      scrollTimeout: 2000, // 스크롤 후 2초 대기
      loadingTimeout: 10000, // 로딩 10초 초과시 문제
      renderCheckDelay: 500, // 렌더링 체크 딜레이
      autoFix: true
    };
  }

  async initialize() {
    console.log(chalk.magenta.bold(`
╔══════════════════════════════════════╗
║   🔮 Ultra Monitor - 궁극의 감시자   ║
╚══════════════════════════════════════╝
    `));

    await this.initBrowser();
    await this.startMonitoring();
  }

  async initBrowser() {
    this.browser = await chromium.launch({
      headless: false,
      devtools: true
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });

    this.page = await this.context.newPage();

    // 모든 종류의 이벤트 감시
    await this.setupComprehensiveMonitoring();

    await this.page.goto(this.config.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(chalk.green('✅ 브라우저 초기화 완료'));
  }

  async setupComprehensiveMonitoring() {
    // 1. 클릭 이벤트 감시
    await this.page.exposeFunction('__reportClick', (data) => {
      this.handleClickEvent(data);
    });

    // 2. 무반응 감지
    await this.page.exposeFunction('__reportNoResponse', (data) => {
      this.handleNoResponse(data);
    });

    // 3. 렌더링 문제 감지
    await this.page.exposeFunction('__reportRenderIssue', (data) => {
      this.handleRenderIssue(data);
    });

    // 4. 성능 문제 감지
    await this.page.exposeFunction('__reportPerformance', (data) => {
      this.handlePerformanceIssue(data);
    });

    // 페이지에 감시 스크립트 주입
    await this.page.addInitScript(() => {
      // 클릭 가능한 모든 요소 추적
      const clickableSelectors = [
        'button',
        'a',
        '[role="button"]',
        '[onclick]',
        'input[type="submit"]',
        'input[type="button"]',
        '.clickable',
        '[data-clickable]'
      ];

      // 클릭 이벤트 모니터링
      document.addEventListener('click', (event) => {
        const element = event.target;
        const selector = element.tagName.toLowerCase() +
                        (element.id ? `#${element.id}` : '') +
                        (element.className ? `.${element.className.split(' ')[0]}` : '');

        // 클릭 시작 시간 기록
        element.dataset.clickTime = Date.now();

        // 3초 후 반응 체크
        setTimeout(() => {
          const clickTime = parseInt(element.dataset.clickTime);
          const now = Date.now();

          // 페이지 변화 체크
          const pageChanged = window.location.href !== element.dataset.originalUrl;
          const hasLoader = document.querySelector('.loading, .spinner, [data-loading="true"]');
          const modalOpened = document.querySelector('.modal, [role="dialog"], .popup');

          if (!pageChanged && !hasLoader && !modalOpened) {
            // 아무 변화 없음 = 문제
            window.__reportNoResponse?.({
              element: selector,
              text: element.textContent?.trim(),
              href: element.href,
              timestamp: now,
              waitTime: now - clickTime
            });
          }
        }, 3000);

        // 원래 URL 저장
        element.dataset.originalUrl = window.location.href;

        window.__reportClick?.({
          element: selector,
          text: element.textContent?.trim(),
          timestamp: Date.now()
        });
      }, true);

      // 무한 로딩 감지
      const observeLoading = () => {
        const loadingElements = document.querySelectorAll(
          '.loading, .spinner, [data-loading="true"], .skeleton'
        );

        loadingElements.forEach(element => {
          if (!element.dataset.loadingStart) {
            element.dataset.loadingStart = Date.now();
          } else {
            const loadingTime = Date.now() - parseInt(element.dataset.loadingStart);
            if (loadingTime > 10000) { // 10초 이상 로딩
              window.__reportPerformance?.({
                type: 'infiniteLoading',
                element: element.className,
                duration: loadingTime,
                timestamp: Date.now()
              });
            }
          }
        });
      };

      setInterval(observeLoading, 2000);

      // 빈 화면 감지
      const checkEmptyScreen = () => {
        const mainContent = document.querySelector('main, #root, #app, .content');
        if (mainContent && mainContent.children.length === 0) {
          window.__reportRenderIssue?.({
            type: 'emptyScreen',
            selector: mainContent.tagName,
            timestamp: Date.now()
          });
        }

        // 텍스트 없는 버튼 감지
        document.querySelectorAll('button').forEach(button => {
          if (!button.textContent?.trim() && !button.querySelector('svg') && !button.querySelector('img')) {
            window.__reportRenderIssue?.({
              type: 'emptyButton',
              selector: button.className || button.id || 'unknown',
              timestamp: Date.now()
            });
          }
        });
      };

      setInterval(checkEmptyScreen, 5000);

      // 스크롤 불가 감지
      let lastScrollY = window.scrollY;
      let scrollAttempts = 0;

      document.addEventListener('wheel', () => {
        setTimeout(() => {
          if (window.scrollY === lastScrollY && document.body.scrollHeight > window.innerHeight) {
            scrollAttempts++;
            if (scrollAttempts > 3) {
              window.__reportRenderIssue?.({
                type: 'scrollBlocked',
                scrollHeight: document.body.scrollHeight,
                viewportHeight: window.innerHeight,
                timestamp: Date.now()
              });
            }
          } else {
            scrollAttempts = 0;
            lastScrollY = window.scrollY;
          }
        }, 100);
      });

      // 이벤트 리스너 누락 감지
      const checkEventListeners = () => {
        document.querySelectorAll('button, a').forEach(element => {
          const hasClickListener = element.onclick ||
                                  element.getAttribute('onclick') ||
                                  element.href ||
                                  element.type === 'submit';

          if (!hasClickListener && !element.dataset.checkedListener) {
            element.dataset.checkedListener = 'true';

            // 실제로 클릭해보기
            const testClick = new MouseEvent('click', {
              bubbles: true,
              cancelable: true
            });

            let hasReaction = false;
            const originalPreventDefault = testClick.preventDefault;
            testClick.preventDefault = () => {
              hasReaction = true;
              originalPreventDefault.call(testClick);
            };

            element.dispatchEvent(testClick);

            if (!hasReaction) {
              window.__reportNoResponse?.({
                type: 'noEventListener',
                element: element.tagName + (element.className ? `.${element.className}` : ''),
                text: element.textContent?.trim(),
                timestamp: Date.now()
              });
            }
          }
        });
      };

      setInterval(checkEventListeners, 5000);

      // 접근성 문제 감지
      const checkAccessibility = () => {
        // alt 텍스트 없는 이미지
        document.querySelectorAll('img:not([alt])').forEach(img => {
          if (!img.dataset.reportedA11y) {
            img.dataset.reportedA11y = 'true';
            window.__reportRenderIssue?.({
              type: 'missingAlt',
              src: img.src,
              timestamp: Date.now()
            });
          }
        });

        // label 없는 input
        document.querySelectorAll('input:not([aria-label])').forEach(input => {
          if (!input.labels?.length && !input.dataset.reportedA11y) {
            input.dataset.reportedA11y = 'true';
            window.__reportRenderIssue?.({
              type: 'missingLabel',
              inputType: input.type,
              inputName: input.name,
              timestamp: Date.now()
            });
          }
        });

        // 색상 대비 문제 (간단한 체크)
        document.querySelectorAll('*').forEach(element => {
          const style = window.getComputedStyle(element);
          const bgColor = style.backgroundColor;
          const textColor = style.color;

          if (bgColor === textColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            window.__reportRenderIssue?.({
              type: 'colorContrast',
              element: element.tagName,
              colors: { bg: bgColor, text: textColor },
              timestamp: Date.now()
            });
          }
        });
      };

      setInterval(checkAccessibility, 10000);

      // 레이아웃 깨짐 감지
      const checkLayout = () => {
        // 화면 밖으로 나간 요소
        document.querySelectorAll('*').forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.right > window.innerWidth + 100 || rect.left < -100) {
              window.__reportRenderIssue?.({
                type: 'layoutOverflow',
                element: element.tagName + (element.className ? `.${element.className}` : ''),
                position: { left: rect.left, right: rect.right },
                timestamp: Date.now()
              });
            }
          }
        });

        // 겹친 요소
        const elements = Array.from(document.querySelectorAll('button, a, input'));
        for (let i = 0; i < elements.length; i++) {
          for (let j = i + 1; j < elements.length; j++) {
            const rect1 = elements[i].getBoundingClientRect();
            const rect2 = elements[j].getBoundingClientRect();

            if (rect1.left < rect2.right && rect1.right > rect2.left &&
                rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
              window.__reportRenderIssue?.({
                type: 'overlappingElements',
                element1: elements[i].tagName,
                element2: elements[j].tagName,
                timestamp: Date.now()
              });
            }
          }
        }
      };

      setInterval(checkLayout, 5000);

      // 폼 제출 실패 감지
      document.addEventListener('submit', (event) => {
        const form = event.target;
        const formId = form.id || form.className || 'unknown';

        setTimeout(() => {
          // 폼이 여전히 화면에 있고, 에러 메시지가 없으면 문제
          if (document.contains(form) &&
              !document.querySelector('.error, .alert, [role="alert"]')) {
            window.__reportNoResponse?.({
              type: 'formSubmitFailed',
              formId: formId,
              action: form.action,
              method: form.method,
              timestamp: Date.now()
            });
          }
        }, 3000);
      }, true);

      // 네트워크 지연 감지
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 3000) {
            window.__reportPerformance?.({
              type: 'slowRequest',
              name: entry.name,
              duration: entry.duration,
              timestamp: Date.now()
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource', 'navigation'] });
    });
  }

  async startMonitoring() {
    console.log(chalk.cyan('\n🔍 모니터링 시작...\n'));

    // 정기적으로 페이지 상태 체크
    setInterval(async () => {
      await this.performComprehensiveCheck();
    }, this.config.checkInterval);

    // 자동 탐색 (모든 클릭 가능한 요소 테스트)
    if (this.config.autoExplore) {
      await this.autoExplore();
    }
  }

  async performComprehensiveCheck() {
    try {
      // 1. 모든 클릭 가능한 요소 찾기
      const clickables = await this.page.$$eval(
        'button, a, [role="button"], [onclick]',
        elements => elements.map(el => ({
          selector: el.tagName.toLowerCase() +
                   (el.id ? `#${el.id}` : '') +
                   (el.className ? `.${el.className.split(' ')[0]}` : ''),
          text: el.textContent?.trim(),
          visible: el.offsetWidth > 0 && el.offsetHeight > 0,
          enabled: !el.disabled,
          href: el.href
        }))
      );

      // 2. 시각적으로 보이지만 클릭 불가능한 요소 체크
      for (const element of clickables) {
        if (element.visible && element.enabled) {
          const isClickable = await this.testClickability(element.selector);
          if (!isClickable) {
            this.reportIssue({
              type: 'unclickable',
              severity: 'high',
              element: element.selector,
              text: element.text,
              reason: '요소가 보이지만 클릭할 수 없음'
            });
          }
        }
      }

      // 3. 콘솔 에러는 없지만 문제가 있는 상황 체크
      await this.checkSilentErrors();

    } catch (error) {
      console.error(chalk.red('체크 중 에러:'), error);
    }
  }

  async testClickability(selector) {
    try {
      // 요소가 실제로 클릭 가능한지 테스트
      const element = await this.page.$(selector);
      if (!element) return false;

      // 클릭 시도
      const originalUrl = this.page.url();
      const originalContent = await this.page.content();

      await element.click({ timeout: 1000, trial: true });

      // 변화 체크
      await this.page.waitForTimeout(500);
      const newUrl = this.page.url();
      const newContent = await this.page.content();

      return newUrl !== originalUrl || newContent !== originalContent;
    } catch {
      return false;
    }
  }

  async checkSilentErrors() {
    // 1. 무한 로딩 체크
    const hasLoader = await this.page.$('.loading, .spinner, [data-loading="true"]');
    if (hasLoader) {
      const loadingTime = await this.page.evaluate(() => {
        const loader = document.querySelector('.loading, .spinner, [data-loading="true"]');
        return loader?.dataset?.loadingStart ?
          Date.now() - parseInt(loader.dataset.loadingStart) : 0;
      });

      if (loadingTime > this.config.loadingTimeout) {
        this.reportIssue({
          type: 'infiniteLoading',
          severity: 'critical',
          duration: loadingTime,
          reason: '10초 이상 로딩 중'
        });
      }
    }

    // 2. 빈 화면 체크
    const isEmpty = await this.page.evaluate(() => {
      const main = document.querySelector('main, #root, #app, .content');
      return main && main.children.length === 0;
    });

    if (isEmpty) {
      this.reportIssue({
        type: 'emptyScreen',
        severity: 'critical',
        reason: '메인 콘텐츠가 비어있음'
      });
    }

    // 3. 깨진 이미지 체크
    const brokenImages = await this.page.$$eval('img', images =>
      images.filter(img => !img.complete || img.naturalHeight === 0)
            .map(img => img.src)
    );

    brokenImages.forEach(src => {
      this.reportIssue({
        type: 'brokenImage',
        severity: 'medium',
        src: src,
        reason: '이미지 로드 실패'
      });
    });
  }

  async autoExplore() {
    console.log(chalk.yellow('\n🤖 자동 탐색 모드 시작...\n'));

    // 모든 페이지 링크 수집
    const links = await this.page.$$eval('a[href]', anchors =>
      anchors.map(a => a.href).filter(href => href.startsWith('http'))
    );

    for (const link of links) {
      try {
        console.log(chalk.blue(`📍 방문: ${link}`));
        await this.page.goto(link, { waitUntil: 'networkidle', timeout: 10000 });
        await this.performComprehensiveCheck();

        // 각 페이지에서 버튼 클릭 테스트
        await this.testAllButtons();

      } catch (error) {
        this.reportIssue({
          type: 'pageLoadError',
          severity: 'high',
          url: link,
          error: error.message
        });
      }
    }
  }

  async testAllButtons() {
    const buttons = await this.page.$$('button');

    for (const button of buttons) {
      try {
        const text = await button.textContent();
        const beforeClick = await this.page.content();

        await button.click({ timeout: 1000 });
        await this.page.waitForTimeout(1000);

        const afterClick = await this.page.content();

        if (beforeClick === afterClick) {
          this.reportIssue({
            type: 'noResponse',
            severity: 'high',
            button: text?.trim(),
            reason: '버튼 클릭 후 아무 변화 없음'
          });
        }
      } catch (error) {
        // 클릭 실패도 문제
        this.reportIssue({
          type: 'clickError',
          severity: 'medium',
          error: error.message
        });
      }
    }
  }

  handleClickEvent(data) {
    console.log(chalk.blue(`🖱️ 클릭: ${data.element} - ${data.text}`));
    this.interactionLog.push(data);
  }

  handleNoResponse(data) {
    console.log(chalk.red(`❌ 무반응: ${data.element} - ${data.text || data.type}`));
    this.reportIssue({
      type: 'noResponse',
      severity: 'high',
      ...data
    });

    if (this.config.autoFix) {
      this.attemptAutoFix(data);
    }
  }

  handleRenderIssue(data) {
    console.log(chalk.yellow(`🎨 렌더링 문제: ${data.type}`));
    this.reportIssue({
      type: 'renderIssue',
      severity: 'medium',
      ...data
    });
  }

  handlePerformanceIssue(data) {
    console.log(chalk.magenta(`⚡ 성능 문제: ${data.type} - ${data.duration}ms`));
    this.reportIssue({
      type: 'performance',
      severity: data.duration > 5000 ? 'high' : 'medium',
      ...data
    });
  }

  reportIssue(issue) {
    issue.timestamp = Date.now();
    this.issues.push(issue);

    // 심각도별 색상
    const color = issue.severity === 'critical' ? chalk.red.bold :
                  issue.severity === 'high' ? chalk.red :
                  issue.severity === 'medium' ? chalk.yellow :
                  chalk.blue;

    console.log(color(`
╔════════════════════════════════════════╗
║ 문제 감지: ${issue.type.padEnd(27)}║
║ 심각도: ${issue.severity.padEnd(30)}║
║ 이유: ${(issue.reason || '').padEnd(32).substring(0, 32)}║
╚════════════════════════════════════════╝
    `));
  }

  async attemptAutoFix(issue) {
    console.log(chalk.green('\n🔧 자동 수정 시도 중...\n'));

    switch (issue.type) {
      case 'noEventListener':
        await this.fixMissingEventListener(issue);
        break;
      case 'noResponse':
        await this.fixNoResponse(issue);
        break;
      case 'infiniteLoading':
        await this.fixInfiniteLoading(issue);
        break;
      case 'emptyScreen':
        await this.fixEmptyScreen(issue);
        break;
      default:
        console.log(chalk.yellow('자동 수정 불가능한 문제입니다.'));
    }
  }

  async fixMissingEventListener(issue) {
    // 이벤트 리스너 추가 코드 생성
    const code = `
      const element = document.querySelector('${issue.element}');
      if (element) {
        element.addEventListener('click', () => {
          console.log('Auto-fixed: Click handler added');
          // TODO: Add actual functionality
        });
      }
    `;

    await this.page.evaluate(code);
    console.log(chalk.green('✅ 이벤트 리스너 추가됨'));
  }

  async fixNoResponse(issue) {
    // 버튼이 API 호출해야 하는 경우
    if (issue.element.includes('submit') || issue.element.includes('save')) {
      console.log(chalk.yellow('API 엔드포인트 확인 필요'));
      // API 엔드포인트 자동 생성 로직
    }
  }

  async fixInfiniteLoading(issue) {
    // 로딩 상태 강제 종료
    await this.page.evaluate(() => {
      document.querySelectorAll('.loading, .spinner, [data-loading="true"]').forEach(el => {
        el.style.display = 'none';
      });
    });
    console.log(chalk.green('✅ 로딩 상태 해제'));
  }

  async fixEmptyScreen(issue) {
    // 에러 바운더리 체크
    const hasError = await this.page.evaluate(() => {
      return document.body.textContent?.includes('Error') ||
             document.body.textContent?.includes('error');
    });

    if (hasError) {
      console.log(chalk.yellow('React 에러 바운더리 문제 가능성'));
      // 페이지 새로고침
      await this.page.reload();
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: this.config.url,
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
      highIssues: this.issues.filter(i => i.severity === 'high').length,
      mediumIssues: this.issues.filter(i => i.severity === 'medium').length,
      issues: this.issues,
      interactionLog: this.interactionLog
    };

    await fs.writeFile(
      path.join(process.cwd(), `ultra-monitor-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    console.log(chalk.green('\n📊 리포트 생성 완료\n'));
    console.log(chalk.cyan(`총 문제: ${report.totalIssues}`));
    console.log(chalk.red(`심각: ${report.criticalIssues}`));
    console.log(chalk.yellow(`높음: ${report.highIssues}`));
    console.log(chalk.blue(`중간: ${report.mediumIssues}`));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// 메인 실행
async function main() {
  const monitor = new UltraMonitor();

  try {
    await monitor.initialize();

    // Ctrl+C 핸들러
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n📊 리포트 생성 중...\n'));
      await monitor.generateReport();
      await monitor.cleanup();
      process.exit(0);
    });

  } catch (error) {
    console.error(chalk.red('초기화 실패:'), error);
    process.exit(1);
  }
}

// 실행
main().catch(console.error);