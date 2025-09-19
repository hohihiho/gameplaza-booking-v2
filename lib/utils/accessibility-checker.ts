/**
 * 접근성 검사 유틸리티
 * WCAG 2.1 AA 기준 준수 검증
 */

// 검사 결과 인터페이스
export interface AccessibilityIssue {
  element: HTMLElement;
  severity: 'error' | 'warning' | 'info';
  category: string;
  rule: string;
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string;
  howToFix: string;
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  score: number;
  passed: number;
  failed: number;
  warnings: number;
  timestamp: Date;
}

// WCAG 2.1 색상 대비 기준
const CONTRAST_RATIOS = {
  normalText: { AA: 4.5, AAA: 7 },
  largeText: { AA: 3, AAA: 4.5 },
  ui: { AA: 3 }
};

export class AccessibilityChecker {
  private issues: AccessibilityIssue[] = [];

  /**
   * 전체 페이지 검사 실행
   */
  async checkPage(): Promise<AccessibilityReport> {
    this.issues = [];

    // 각 검사 항목 실행
    await Promise.all([
      this.checkImages(),
      this.checkHeadings(),
      this.checkForms(),
      this.checkLinks(),
      this.checkButtons(),
      this.checkColorContrast(),
      this.checkKeyboardNavigation(),
      this.checkAriaAttributes(),
      this.checkTables(),
      this.checkMultimedia(),
      this.checkLanguage(),
      this.checkFocusIndicators(),
      this.checkTouchTargets(),
      this.checkTimeouts()
    ]);

    return this.generateReport();
  }

  /**
   * 이미지 대체 텍스트 검사
   */
  private async checkImages(): Promise<void> {
    const images = document.querySelectorAll('img');

    images.forEach((img: HTMLImageElement) => {
      // alt 속성 누락
      if (!img.hasAttribute('alt')) {
        this.addIssue({
          element: img,
          severity: 'error',
          category: 'Images',
          rule: 'Images must have alternative text',
          message: `이미지에 alt 속성이 없습니다: ${img.src}`,
          wcagLevel: 'A',
          wcagCriteria: '1.1.1 Non-text Content',
          howToFix: 'alt 속성을 추가하세요. 장식용 이미지는 alt=""로 설정하세요.'
        });
      }

      // 빈 alt 속성이지만 의미있는 이미지
      if (img.alt === '' && this.isInformativeImage(img)) {
        this.addIssue({
          element: img,
          severity: 'warning',
          category: 'Images',
          rule: 'Informative images should have descriptive alt text',
          message: '정보를 전달하는 이미지에 설명이 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '1.1.1 Non-text Content',
          howToFix: '이미지의 내용을 설명하는 alt 텍스트를 추가하세요.'
        });
      }

      // alt 텍스트가 너무 긴 경우
      if (img.alt && img.alt.length > 125) {
        this.addIssue({
          element: img,
          severity: 'warning',
          category: 'Images',
          rule: 'Alt text should be concise',
          message: `alt 텍스트가 너무 깁니다 (${img.alt.length}자)`,
          wcagLevel: 'A',
          wcagCriteria: '1.1.1 Non-text Content',
          howToFix: '125자 이내로 간결하게 작성하세요. 긴 설명은 longdesc나 aria-describedby를 사용하세요.'
        });
      }
    });
  }

  /**
   * 제목 구조 검사
   */
  private async checkHeadings(): Promise<void> {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let h1Count = 0;

    headings.forEach((heading: HTMLHeadingElement) => {
      const level = parseInt(heading.tagName[1]);

      // H1 중복 검사
      if (level === 1) {
        h1Count++;
        if (h1Count > 1) {
          this.addIssue({
            element: heading,
            severity: 'warning',
            category: 'Structure',
            rule: 'Page should have only one H1',
            message: 'H1 제목이 여러 개 있습니다',
            wcagLevel: 'AA',
            wcagCriteria: '2.4.6 Headings and Labels',
            howToFix: '페이지당 H1은 하나만 사용하세요.'
          });
        }
      }

      // 제목 레벨 건너뛰기 검사
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue({
          element: heading,
          severity: 'warning',
          category: 'Structure',
          rule: 'Heading levels should not skip',
          message: `제목 레벨을 건너뛰었습니다 (H${previousLevel} → H${level})`,
          wcagLevel: 'AA',
          wcagCriteria: '1.3.1 Info and Relationships',
          howToFix: '제목 레벨을 순차적으로 사용하세요.'
        });
      }

      previousLevel = level;

      // 빈 제목 검사
      if (!heading.textContent?.trim()) {
        this.addIssue({
          element: heading,
          severity: 'error',
          category: 'Structure',
          rule: 'Headings must have content',
          message: '빈 제목이 있습니다',
          wcagLevel: 'A',
          wcagCriteria: '2.4.6 Headings and Labels',
          howToFix: '제목에 의미있는 텍스트를 추가하세요.'
        });
      }
    });

    // H1 누락 검사
    if (h1Count === 0) {
      this.addIssue({
        element: document.body,
        severity: 'error',
        category: 'Structure',
        rule: 'Page must have H1',
        message: 'H1 제목이 없습니다',
        wcagLevel: 'AA',
        wcagCriteria: '2.4.6 Headings and Labels',
        howToFix: '페이지의 주요 제목으로 H1을 추가하세요.'
      });
    }
  }

  /**
   * 폼 요소 검사
   */
  private async checkForms(): Promise<void> {
    // 라벨 검사
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input: HTMLInputElement) => {
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;

      const hasLabel = this.hasAssociatedLabel(input);
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel) {
        this.addIssue({
          element: input,
          severity: 'error',
          category: 'Forms',
          rule: 'Form elements must have labels',
          message: `${input.tagName} 요소에 라벨이 없습니다`,
          wcagLevel: 'A',
          wcagCriteria: '1.3.1 Info and Relationships',
          howToFix: '<label> 요소를 추가하거나 aria-label/aria-labelledby를 사용하세요.'
        });
      }

      // 필수 필드 표시 검사
      if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
        this.addIssue({
          element: input,
          severity: 'warning',
          category: 'Forms',
          rule: 'Required fields should use aria-required',
          message: '필수 필드에 aria-required가 없습니다',
          wcagLevel: 'AA',
          wcagCriteria: '3.3.2 Labels or Instructions',
          howToFix: 'aria-required="true"를 추가하세요.'
        });
      }
    });

    // 폼 그룹 검사
    const fieldsets = document.querySelectorAll('fieldset');
    fieldsets.forEach((fieldset: HTMLFieldSetElement) => {
      const legend = fieldset.querySelector('legend');
      if (!legend) {
        this.addIssue({
          element: fieldset,
          severity: 'warning',
          category: 'Forms',
          rule: 'Fieldsets should have legends',
          message: 'Fieldset에 legend가 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '1.3.1 Info and Relationships',
          howToFix: '<legend> 요소를 추가하여 그룹의 목적을 설명하세요.'
        });
      }
    });
  }

  /**
   * 링크 검사
   */
  private async checkLinks(): Promise<void> {
    const links = document.querySelectorAll('a');

    links.forEach((link: HTMLAnchorElement) => {
      // 빈 링크 검사
      if (!link.textContent?.trim() && !link.querySelector('img')) {
        this.addIssue({
          element: link,
          severity: 'error',
          category: 'Links',
          rule: 'Links must have discernible text',
          message: '링크에 텍스트가 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '2.4.4 Link Purpose',
          howToFix: '링크 텍스트를 추가하거나 aria-label을 사용하세요.'
        });
      }

      // 의미없는 링크 텍스트 검사
      const genericTexts = ['click here', 'here', 'link', 'more', '더보기', '여기', '클릭'];
      const linkText = link.textContent?.toLowerCase().trim();
      if (linkText && genericTexts.includes(linkText)) {
        this.addIssue({
          element: link,
          severity: 'warning',
          category: 'Links',
          rule: 'Links should have meaningful text',
          message: `링크 텍스트가 불명확합니다: "${linkText}"`,
          wcagLevel: 'AA',
          wcagCriteria: '2.4.4 Link Purpose',
          howToFix: '링크의 목적을 명확히 설명하는 텍스트를 사용하세요.'
        });
      }

      // 새 창 열기 알림 검사
      if (link.target === '_blank' && !link.textContent?.includes('새 창')) {
        this.addIssue({
          element: link,
          severity: 'info',
          category: 'Links',
          rule: 'Links opening in new windows should be indicated',
          message: '새 창에서 열리는 링크임을 표시하지 않았습니다',
          wcagLevel: 'AAA',
          wcagCriteria: 'G201 Giving users advance warning',
          howToFix: '링크 텍스트에 "(새 창)"을 추가하거나 aria-label에 포함하세요.'
        });
      }
    });
  }

  /**
   * 버튼 검사
   */
  private async checkButtons(): Promise<void> {
    const buttons = document.querySelectorAll('button, [role="button"]');

    buttons.forEach((button: HTMLElement) => {
      // 빈 버튼 검사
      if (!button.textContent?.trim() && !button.querySelector('img, svg')) {
        this.addIssue({
          element: button,
          severity: 'error',
          category: 'Buttons',
          rule: 'Buttons must have discernible text',
          message: '버튼에 텍스트가 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '4.1.2 Name, Role, Value',
          howToFix: '버튼 텍스트를 추가하거나 aria-label을 사용하세요.'
        });
      }

      // role="button"의 키보드 지원 검사
      if (button.getAttribute('role') === 'button' && button.tagName !== 'BUTTON') {
        if (!button.hasAttribute('tabindex')) {
          this.addIssue({
            element: button,
            severity: 'error',
            category: 'Buttons',
            rule: 'Elements with role="button" must be keyboard accessible',
            message: 'role="button" 요소에 tabindex가 없습니다',
            wcagLevel: 'A',
            wcagCriteria: '2.1.1 Keyboard',
            howToFix: 'tabindex="0"을 추가하여 키보드로 접근 가능하게 하세요.'
          });
        }
      }
    });
  }

  /**
   * 색상 대비 검사
   */
  private async checkColorContrast(): Promise<void> {
    const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, li, td, th');

    textElements.forEach((element: HTMLElement) => {
      if (!element.textContent?.trim()) return;

      const styles = window.getComputedStyle(element);
      const backgroundColor = this.getBackgroundColor(element);
      const textColor = styles.color;

      if (backgroundColor && textColor) {
        const contrast = this.getContrastRatio(
          this.parseColor(backgroundColor),
          this.parseColor(textColor)
        );

        const fontSize = parseFloat(styles.fontSize);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= '700');
        const requiredRatio = isLargeText ? CONTRAST_RATIOS.largeText.AA : CONTRAST_RATIOS.normalText.AA;

        if (contrast < requiredRatio) {
          this.addIssue({
            element,
            severity: 'error',
            category: 'Color Contrast',
            rule: 'Text must have sufficient color contrast',
            message: `색상 대비가 부족합니다 (${contrast.toFixed(2)}:1, 필요: ${requiredRatio}:1)`,
            wcagLevel: 'AA',
            wcagCriteria: '1.4.3 Contrast (Minimum)',
            howToFix: '텍스트나 배경색을 조정하여 대비를 높이세요.'
          });
        }
      }
    });
  }

  /**
   * 키보드 네비게이션 검사
   */
  private async checkKeyboardNavigation(): Promise<void> {
    // Tab 순서 검사
    const tabbableElements = document.querySelectorAll('[tabindex]');
    tabbableElements.forEach((element: HTMLElement) => {
      const tabindex = parseInt(element.getAttribute('tabindex') || '0');

      if (tabindex > 0) {
        this.addIssue({
          element,
          severity: 'warning',
          category: 'Keyboard',
          rule: 'Avoid positive tabindex',
          message: `양수 tabindex 사용 (tabindex="${tabindex}")`,
          wcagLevel: 'A',
          wcagCriteria: '2.4.3 Focus Order',
          howToFix: 'tabindex="0" 또는 "-1"만 사용하세요. DOM 순서로 탭 순서를 제어하세요.'
        });
      }
    });

    // 인터랙티브 요소의 키보드 접근성 검사
    const interactiveElements = document.querySelectorAll('[onclick], [onmousedown], [onmouseup]');
    interactiveElements.forEach((element: HTMLElement) => {
      if (!element.hasAttribute('tabindex') &&
          !['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
        this.addIssue({
          element,
          severity: 'error',
          category: 'Keyboard',
          rule: 'Interactive elements must be keyboard accessible',
          message: '마우스 이벤트만 있는 요소',
          wcagLevel: 'A',
          wcagCriteria: '2.1.1 Keyboard',
          howToFix: 'tabindex="0"과 키보드 이벤트 핸들러를 추가하세요.'
        });
      }
    });
  }

  /**
   * ARIA 속성 검사
   */
  private async checkAriaAttributes(): Promise<void> {
    // 잘못된 ARIA 역할 검사
    const elementsWithRole = document.querySelectorAll('[role]');
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'checkbox', 'complementary', 'contentinfo', 'dialog', 'document',
      'form', 'grid', 'heading', 'img', 'link', 'list', 'listbox',
      'listitem', 'main', 'menu', 'menubar', 'menuitem', 'navigation',
      'option', 'progressbar', 'radio', 'radiogroup', 'region', 'search',
      'slider', 'spinbutton', 'status', 'tab', 'tablist', 'tabpanel',
      'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];

    elementsWithRole.forEach((element: HTMLElement) => {
      const role = element.getAttribute('role');
      if (role && !validRoles.includes(role)) {
        this.addIssue({
          element,
          severity: 'error',
          category: 'ARIA',
          rule: 'Use valid ARIA roles',
          message: `잘못된 ARIA role: "${role}"`,
          wcagLevel: 'A',
          wcagCriteria: '4.1.2 Name, Role, Value',
          howToFix: '유효한 ARIA role을 사용하세요.'
        });
      }
    });

    // aria-labelledby/describedby 참조 검사
    const elementsWithLabelledBy = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
    elementsWithLabelledBy.forEach((element: HTMLElement) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const describedBy = element.getAttribute('aria-describedby');

      if (labelledBy) {
        const ids = labelledBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.addIssue({
              element,
              severity: 'error',
              category: 'ARIA',
              rule: 'ARIA references must point to existing elements',
              message: `aria-labelledby가 존재하지 않는 ID를 참조: "${id}"`,
              wcagLevel: 'A',
              wcagCriteria: '1.3.1 Info and Relationships',
              howToFix: '참조하는 요소의 ID를 확인하세요.'
            });
          }
        });
      }

      if (describedBy) {
        const ids = describedBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.addIssue({
              element,
              severity: 'error',
              category: 'ARIA',
              rule: 'ARIA references must point to existing elements',
              message: `aria-describedby가 존재하지 않는 ID를 참조: "${id}"`,
              wcagLevel: 'A',
              wcagCriteria: '1.3.1 Info and Relationships',
              howToFix: '참조하는 요소의 ID를 확인하세요.'
            });
          }
        });
      }
    });
  }

  /**
   * 테이블 검사
   */
  private async checkTables(): Promise<void> {
    const tables = document.querySelectorAll('table');

    tables.forEach((table: HTMLTableElement) => {
      // caption 검사
      if (!table.querySelector('caption') && !table.hasAttribute('aria-label')) {
        this.addIssue({
          element: table,
          severity: 'warning',
          category: 'Tables',
          rule: 'Tables should have captions',
          message: '테이블에 설명이 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '1.3.1 Info and Relationships',
          howToFix: '<caption> 요소나 aria-label을 추가하세요.'
        });
      }

      // 헤더 셀 검사
      const headers = table.querySelectorAll('th');
      if (headers.length === 0) {
        this.addIssue({
          element: table,
          severity: 'error',
          category: 'Tables',
          rule: 'Data tables must have headers',
          message: '테이블에 헤더 셀(th)이 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '1.3.1 Info and Relationships',
          howToFix: '적절한 <th> 요소를 추가하세요.'
        });
      }

      // scope 속성 검사
      headers.forEach((header: HTMLTableCellElement) => {
        if (!header.hasAttribute('scope')) {
          this.addIssue({
            element: header,
            severity: 'warning',
            category: 'Tables',
            rule: 'Header cells should have scope',
            message: 'th 요소에 scope 속성이 없습니다',
            wcagLevel: 'A',
            wcagCriteria: '1.3.1 Info and Relationships',
            howToFix: 'scope="col" 또는 scope="row"를 추가하세요.'
          });
        }
      });
    });
  }

  /**
   * 멀티미디어 검사
   */
  private async checkMultimedia(): Promise<void> {
    // 비디오 검사
    const videos = document.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
      if (!video.querySelector('track[kind="captions"]')) {
        this.addIssue({
          element: video,
          severity: 'error',
          category: 'Multimedia',
          rule: 'Videos must have captions',
          message: '비디오에 자막이 없습니다',
          wcagLevel: 'A',
          wcagCriteria: '1.2.2 Captions (Prerecorded)',
          howToFix: '<track kind="captions"> 요소를 추가하세요.'
        });
      }

      if (video.autoplay && !video.muted) {
        this.addIssue({
          element: video,
          severity: 'error',
          category: 'Multimedia',
          rule: 'Auto-playing media must be muted',
          message: '자동 재생되는 비디오에 소리가 있습니다',
          wcagLevel: 'A',
          wcagCriteria: '1.4.2 Audio Control',
          howToFix: 'muted 속성을 추가하거나 autoplay를 제거하세요.'
        });
      }
    });

    // 오디오 검사
    const audios = document.querySelectorAll('audio');
    audios.forEach((audio: HTMLAudioElement) => {
      if (audio.autoplay) {
        this.addIssue({
          element: audio,
          severity: 'error',
          category: 'Multimedia',
          rule: 'Audio must not autoplay',
          message: '오디오가 자동 재생됩니다',
          wcagLevel: 'A',
          wcagCriteria: '1.4.2 Audio Control',
          howToFix: 'autoplay 속성을 제거하세요.'
        });
      }
    });
  }

  /**
   * 언어 설정 검사
   */
  private async checkLanguage(): Promise<void> {
    // HTML lang 속성 검사
    if (!document.documentElement.hasAttribute('lang')) {
      this.addIssue({
        element: document.documentElement,
        severity: 'error',
        category: 'Language',
        rule: 'Page must have lang attribute',
        message: 'HTML 요소에 lang 속성이 없습니다',
        wcagLevel: 'A',
        wcagCriteria: '3.1.1 Language of Page',
        howToFix: '<html lang="ko">를 설정하세요.'
      });
    }

    // 언어 변경 검사
    const elementsWithLang = document.querySelectorAll('[lang]');
    elementsWithLang.forEach((element: HTMLElement) => {
      const lang = element.getAttribute('lang');
      if (lang && !this.isValidLanguageCode(lang)) {
        this.addIssue({
          element,
          severity: 'warning',
          category: 'Language',
          rule: 'Use valid language codes',
          message: `유효하지 않은 언어 코드: "${lang}"`,
          wcagLevel: 'AA',
          wcagCriteria: '3.1.2 Language of Parts',
          howToFix: 'ISO 639-1 언어 코드를 사용하세요.'
        });
      }
    });
  }

  /**
   * 포커스 인디케이터 검사
   */
  private async checkFocusIndicators(): Promise<void> {
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element: HTMLElement) => {
      const styles = window.getComputedStyle(element);
      const focusStyles = window.getComputedStyle(element, ':focus');

      // outline이 none으로 설정되어 있는지 검사
      if (styles.outline === 'none' || styles.outline === '0px none rgb(0, 0, 0)') {
        this.addIssue({
          element,
          severity: 'error',
          category: 'Focus',
          rule: 'Interactive elements must have visible focus indicator',
          message: '포커스 표시가 제거되었습니다',
          wcagLevel: 'AA',
          wcagCriteria: '2.4.7 Focus Visible',
          howToFix: 'outline을 제거하지 말거나 대체 포커스 스타일을 제공하세요.'
        });
      }
    });
  }

  /**
   * 터치 타겟 크기 검사
   */
  private async checkTouchTargets(): Promise<void> {
    const interactiveElements = document.querySelectorAll(
      'a, button, input[type="checkbox"], input[type="radio"], [role="button"]'
    );

    interactiveElements.forEach((element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG 2.1 AA 기준

      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue({
          element,
          severity: 'warning',
          category: 'Touch',
          rule: 'Touch targets must be at least 44x44 pixels',
          message: `터치 타겟이 너무 작습니다 (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
          wcagLevel: 'AA',
          wcagCriteria: '2.5.5 Target Size',
          howToFix: '최소 44x44px 크기로 조정하세요.'
        });
      }
    });
  }

  /**
   * 시간 제한 검사
   */
  private async checkTimeouts(): Promise<void> {
    // Meta refresh 검사
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      const content = metaRefresh.getAttribute('content');
      const seconds = parseInt(content?.split(';')[0] || '0');

      if (seconds > 0 && seconds < 20) {
        this.addIssue({
          element: metaRefresh as HTMLElement,
          severity: 'error',
          category: 'Time',
          rule: 'Give users enough time',
          message: `페이지가 ${seconds}초 후 자동으로 새로고침됩니다`,
          wcagLevel: 'A',
          wcagCriteria: '2.2.1 Timing Adjustable',
          howToFix: '자동 새로고침을 제거하거나 사용자가 제어할 수 있게 하세요.'
        });
      }
    }
  }

  // === 유틸리티 함수들 ===

  /**
   * 이슈 추가
   */
  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue);
  }

  /**
   * 이미지가 정보를 전달하는지 확인
   */
  private isInformativeImage(img: HTMLImageElement): boolean {
    // 링크나 버튼 안의 이미지
    if (img.closest('a, button')) return true;

    // 특정 클래스명 확인
    const decorativeClasses = ['decoration', 'background', 'icon-decorative'];
    const hasDecorativeClass = decorativeClasses.some(cls =>
      img.className.includes(cls)
    );

    return !hasDecorativeClass;
  }

  /**
   * 요소의 배경색 가져오기
   */
  private getBackgroundColor(element: HTMLElement): string {
    let bg = window.getComputedStyle(element).backgroundColor;

    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
      const parent = element.parentElement;
      if (parent) {
        return this.getBackgroundColor(parent);
      }
      return 'rgb(255, 255, 255)'; // 기본값: 흰색
    }

    return bg;
  }

  /**
   * RGB 색상 파싱
   */
  private parseColor(color: string): { r: number; g: number; b: number } {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return { r: 255, g: 255, b: 255 };
  }

  /**
   * 색상 대비 비율 계산
   */
  private getContrastRatio(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * 상대 휘도 계산
   */
  private getRelativeLuminance(color: { r: number; g: number; b: number }): number {
    const rsRGB = color.r / 255;
    const gsRGB = color.g / 255;
    const bsRGB = color.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * 라벨 연결 확인
   */
  private hasAssociatedLabel(input: HTMLInputElement): boolean {
    // for 속성으로 연결된 라벨
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return true;
    }

    // 라벨 안에 포함된 경우
    const parent = input.closest('label');
    if (parent) return true;

    return false;
  }

  /**
   * 유효한 언어 코드 확인
   */
  private isValidLanguageCode(code: string): boolean {
    // ISO 639-1 주요 언어 코드
    const validCodes = [
      'ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru',
      'ar', 'hi', 'bn', 'pa', 'te', 'mr', 'ta', 'ur', 'gu', 'kn'
    ];

    return validCodes.includes(code.toLowerCase().split('-')[0]);
  }

  /**
   * 보고서 생성
   */
  private generateReport(): AccessibilityReport {
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');

    const totalChecks = 100; // 전체 검사 항목 수 (예시)
    const passed = totalChecks - errors.length;
    const score = Math.max(0, Math.round((passed / totalChecks) * 100));

    return {
      issues: this.issues,
      score,
      passed,
      failed: errors.length,
      warnings: warnings.length,
      timestamp: new Date()
    };
  }
}

// 싱글톤 인스턴스
export const accessibilityChecker = new AccessibilityChecker();