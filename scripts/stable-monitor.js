#!/usr/bin/env node

/**
 * 안정적인 브라우저 에러 모니터링 시스템
 * - 스크롤 문제 해결
 * - 클릭 가능성 정확히 감지
 * - 자동 수정 기능 개선
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class StableMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.isMonitoring = true;
    this.scrollPosition = { x: 0, y: 0 };
  }

  async init() {
    console.log('🎯 안정적인 모니터링 시스템 시작');
    console.log('📌 특징:');
    console.log('  - 스크롤 위치 고정');
    console.log('  - 정확한 클릭 감지');
    console.log('  - 자동 문제 수정');
    console.log('');

    try {
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });

      this.page = await this.browser.newPage();

      // 스크롤 위치 저장 및 복원
      await this.setupScrollControl();

      // 에러 리스너 설정
      this.setupErrorListeners();

      // 클릭 문제 해결 스크립트 주입
      await this.injectClickFix();

      // localhost:3000 접속
      await this.page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log('✅ 모니터링 시작됨');
      console.log('');

      // 주기적 체크
      this.startPeriodicCheck();

    } catch (error) {
      console.error('초기화 실패:', error);
      await this.cleanup();
    }
  }

  // 스크롤 제어 설정
  async setupScrollControl() {
    // 스크롤 이벤트 감지 및 위치 저장
    await this.page.addInitScript(() => {
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          window.__lastScrollPosition = {
            x: window.scrollX,
            y: window.scrollY
          };
        }, 100);
      });

      // 자동 스크롤 방지
      const originalScrollTo = window.scrollTo;
      window.scrollTo = function(x, y) {
        // 의도적인 스크롤만 허용
        if (window.__allowScroll) {
          originalScrollTo.call(window, x, y);
        }
      };
    });
  }

  // 클릭 문제 해결 스크립트 주입
  async injectClickFix() {
    await this.page.addInitScript(() => {
      // 클릭 이벤트 개선
      document.addEventListener('DOMContentLoaded', () => {
        // 모든 클릭 가능 요소에 대해 처리
        const fixClickability = () => {
          const clickableElements = document.querySelectorAll('button, a, [role="button"], [onclick], input[type="submit"], input[type="button"]');

          clickableElements.forEach(element => {
            // pointer-events 확인 및 수정
            const styles = window.getComputedStyle(element);
            if (styles.pointerEvents === 'none') {
              element.style.pointerEvents = 'auto';
              console.log('🔧 pointer-events 수정:', element);
            }

            // z-index 문제 해결
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const elementAtPoint = document.elementFromPoint(centerX, centerY);

            if (elementAtPoint && elementAtPoint !== element && !element.contains(elementAtPoint)) {
              // 다른 요소가 위에 있는 경우
              element.style.position = 'relative';
              element.style.zIndex = '10000';
              console.log('🔧 z-index 수정:', element);
            }

            // disabled 속성 체크
            if (element.disabled && !element.dataset.intentionallyDisabled) {
              console.warn('⚠️ 비활성화된 요소 감지:', element);
            }
          });
        };

        // 초기 실행
        fixClickability();

        // DOM 변경 감지
        const observer = new MutationObserver(() => {
          fixClickability();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['disabled', 'style', 'class']
        });
      });
    });
  }

  // 에러 리스너 설정
  setupErrorListeners() {
    // 콘솔 에러
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        console.log('🔴 콘솔 에러:', text.substring(0, 100));
        this.errors.push({
          type: 'console',
          message: text,
          timestamp: new Date()
        });
      }
    });

    // 페이지 에러
    this.page.on('pageerror', error => {
      console.log('🔴 페이지 에러:', error.message);
      this.errors.push({
        type: 'page',
        message: error.message,
        timestamp: new Date()
      });
    });

    // 네트워크 실패
    this.page.on('requestfailed', request => {
      console.log('🔴 네트워크 실패:', request.url());
      this.errors.push({
        type: 'network',
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date()
      });
    });
  }

  // 주기적 체크
  async startPeriodicCheck() {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        // 클릭 가능성 체크
        await this.checkClickability();

        // 스크롤 위치 복원
        await this.restoreScrollPosition();

        // 에러 요약
        if (this.errors.length > 0) {
          console.log(`\n📊 에러 요약: ${this.errors.length}개 감지됨`);
          this.errors = []; // 초기화
        }

      } catch (error) {
        // 페이지가 닫혔거나 새로고침된 경우 무시
        if (!error.message.includes('closed') && !error.message.includes('detached')) {
          console.error('체크 중 에러:', error);
        }
      }
    }, 3000); // 3초마다 체크
  }

  // 클릭 가능성 체크
  async checkClickability() {
    try {
      const unclickableElements = await this.page.evaluate(() => {
        const issues = [];
        const clickableElements = document.querySelectorAll('button, a, [role="button"], [onclick]');

        clickableElements.forEach(element => {
          const rect = element.getBoundingClientRect();

          // 화면에 보이는지 체크
          if (rect.width === 0 || rect.height === 0) {
            return; // 크기가 0인 요소는 무시
          }

          // 클릭 지점 체크
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const elementAtPoint = document.elementFromPoint(centerX, centerY);

          // 클릭 불가능한 경우
          if (elementAtPoint !== element && !element.contains(elementAtPoint) && !elementAtPoint?.contains(element)) {
            issues.push({
              text: element.textContent?.substring(0, 30),
              tagName: element.tagName,
              covering: elementAtPoint?.tagName
            });
          }
        });

        return issues;
      });

      if (unclickableElements.length > 0) {
        console.log('⚠️ 클릭 불가능한 요소 발견:', unclickableElements.length, '개');
        unclickableElements.forEach(el => {
          console.log(`  - ${el.tagName}: "${el.text}" (가려진 요소: ${el.covering})`);
        });
      }
    } catch (error) {
      // 무시
    }
  }

  // 스크롤 위치 복원
  async restoreScrollPosition() {
    try {
      await this.page.evaluate(() => {
        const lastPosition = window.__lastScrollPosition;
        if (lastPosition && (window.scrollX !== lastPosition.x || window.scrollY !== lastPosition.y)) {
          // 의도하지 않은 스크롤 감지
          console.log('📍 스크롤 위치 복원');
          window.__allowScroll = true;
          window.scrollTo(lastPosition.x, lastPosition.y);
          window.__allowScroll = false;
        }
      });
    } catch (error) {
      // 무시
    }
  }

  // 정리
  async cleanup() {
    this.isMonitoring = false;
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// 실행
const monitor = new StableMonitor();

// 종료 핸들러
process.on('SIGINT', async () => {
  console.log('\n👋 모니터링 종료 중...');
  await monitor.cleanup();
  process.exit(0);
});

// 시작
monitor.init().catch(console.error);