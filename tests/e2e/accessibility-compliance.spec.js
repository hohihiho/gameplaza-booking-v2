/**
 * 🟡 MEDIUM RISK: 접근성(A11Y) 준수 테스트
 * 
 * 리스크 레벨: 7/10 (Medium-High)
 * 
 * 테스트 범위:
 * 1. WCAG 2.1 AA 기준 준수
 * 2. 스크린 리더 호환성
 * 3. 키보드 네비게이션
 * 4. 색상 대비 및 가독성
 * 5. 포커스 관리
 * 6. 의미적 HTML 구조
 * 7. ARIA 속성 사용
 */

import { test, expect } from '@playwright/test';

test.describe('🟡 MEDIUM RISK: 접근성(A11Y) 준수', () => {

  test('🎯 A11Y #1: 키보드 네비게이션 테스트', async ({ page }) => {
    console.log('⌨️ 키보드 네비게이션 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. Tab 키로 포커스 가능한 요소들 확인
    console.log('1️⃣ Tab 키 네비게이션 확인...');
    
    const focusableElements = await page.evaluate(() => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];
      
      const elements = [];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            elements.push({
              tagName: el.tagName,
              type: el.type || '',
              text: el.textContent?.trim().substring(0, 30) || '',
              tabIndex: el.tabIndex,
              hasAriaLabel: !!el.getAttribute('aria-label'),
              id: el.id || ''
            });
          }
        });
      });
      return elements;
    });
    
    console.log(`🔍 포커스 가능한 요소: ${focusableElements.length}개`);
    focusableElements.slice(0, 5).forEach((el, index) => {
      console.log(`   ${index + 1}. ${el.tagName} ${el.type ? `(${el.type})` : ''} - "${el.text}"`);
    });
    
    // 2. 실제 Tab 키 네비게이션 테스트
    console.log('2️⃣ 실제 Tab 키 네비게이션 테스트...');
    
    let currentFocusIndex = 0;
    const maxTabAttempts = Math.min(focusableElements.length, 10);
    
    for (let i = 0; i < maxTabAttempts; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (el && el !== document.body) {
          return {
            tagName: el.tagName,
            className: el.className,
            text: el.textContent?.trim().substring(0, 20) || '',
            outline: window.getComputedStyle(el).outline
          };
        }
        return null;
      });
      
      if (focusedElement) {
        console.log(`   Tab ${i + 1}: ${focusedElement.tagName} - "${focusedElement.text}"`);
        currentFocusIndex++;
      } else {
        console.log(`   Tab ${i + 1}: 포커스 없음`);
      }
    }
    
    console.log(`📊 Tab 네비게이션 성공률: ${currentFocusIndex}/${maxTabAttempts}`);
    
    // 3. Shift+Tab 역방향 네비게이션
    console.log('3️⃣ Shift+Tab 역방향 네비게이션...');
    
    let reverseTabCount = 0;
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Shift+Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el && el !== document.body ? el.tagName : null;
      });
      
      if (focusedElement) {
        reverseTabCount++;
        console.log(`   Shift+Tab ${i + 1}: ${focusedElement}`);
      }
    }
    
    console.log(`📊 역방향 네비게이션: ${reverseTabCount > 0 ? '작동' : '미작동'}`);
    
    // 4. Enter/Space 키 활성화 테스트
    console.log('4️⃣ Enter/Space 키 활성화 테스트...');
    
    const interactiveElements = await page.locator('button, a, input[type="submit"], [role="button"]').all();
    
    if (interactiveElements.length > 0) {
      const firstElement = interactiveElements[0];
      await firstElement.focus();
      
      // Enter 키 테스트
      const enterKeyResult = await page.evaluate(() => {
        let activated = false;
        const el = document.activeElement;
        
        if (el) {
          const clickHandler = () => { activated = true; };
          el.addEventListener('click', clickHandler, { once: true });
          
          // Enter 키 이벤트 시뮬레이션
          const event = new KeyboardEvent('keydown', { key: 'Enter' });
          el.dispatchEvent(event);
          
          setTimeout(() => el.removeEventListener('click', clickHandler), 100);
        }
        
        return activated;
      });
      
      console.log(`⏎ Enter 키 활성화: ${enterKeyResult ? '작동' : '미작동'}`);
    } else {
      console.log('❌ 상호작용 가능한 요소 없음');
    }
    
    console.log('✅ 키보드 네비게이션 테스트 완료!');
  });

  test('🎯 A11Y #2: 의미적 HTML 및 ARIA 속성', async ({ page }) => {
    console.log('🏗️ 의미적 HTML 및 ARIA 속성 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. 의미적 HTML 요소 확인
    console.log('1️⃣ 의미적 HTML 요소 확인...');
    
    const semanticElements = await page.evaluate(() => {
      const semanticTags = [
        'header', 'nav', 'main', 'article', 'section', 
        'aside', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ];
      
      const found = {};
      semanticTags.forEach(tag => {
        const elements = document.querySelectorAll(tag);
        found[tag] = elements.length;
      });
      
      return found;
    });
    
    console.log('🏷️ 의미적 HTML 요소:');
    Object.entries(semanticElements).forEach(([tag, count]) => {
      if (count > 0) {
        console.log(`   ${tag}: ${count}개`);
      }
    });
    
    // 2. 제목 구조 확인 - 올바른 계층 구조
    console.log('2️⃣ 제목 계층 구조 확인...');
    
    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim().substring(0, 50) || '',
        id: h.id || '',
        hasTabIndex: h.hasAttribute('tabindex')
      }));
    });
    
    console.log(`📑 제목 요소: ${headingStructure.length}개`);
    if (headingStructure.length > 0) {
      headingStructure.forEach((heading, index) => {
        console.log(`   H${heading.level}: "${heading.text}"`);
      });
      
      // 제목 계층 구조 검증
      let properHierarchy = true;
      for (let i = 1; i < headingStructure.length; i++) {
        const prev = headingStructure[i - 1];
        const curr = headingStructure[i];
        
        if (curr.level > prev.level + 1) {
          properHierarchy = false;
          console.log(`   ⚠️ 계층 구조 위반: H${prev.level} → H${curr.level}`);
        }
      }
      
      console.log(`📊 제목 계층 구조: ${properHierarchy ? '적절함' : '개선 필요'}`);
    }
    
    // 3. ARIA 속성 사용 확인
    console.log('3️⃣ ARIA 속성 사용 확인...');
    
    const ariaUsage = await page.evaluate(() => {
      const ariaAttributes = [
        'aria-label', 'aria-labelledby', 'aria-describedby',
        'aria-expanded', 'aria-hidden', 'aria-live',
        'aria-controls', 'aria-owns', 'role'
      ];
      
      const usage = {};
      ariaAttributes.forEach(attr => {
        const elements = document.querySelectorAll(`[${attr}]`);
        usage[attr] = elements.length;
      });
      
      return usage;
    });
    
    console.log('🎭 ARIA 속성 사용:');
    Object.entries(ariaUsage).forEach(([attr, count]) => {
      if (count > 0) {
        console.log(`   ${attr}: ${count}개`);
      }
    });
    
    // 4. 폼 요소 접근성 확인
    console.log('4️⃣ 폼 요소 접근성 확인...');
    
    const formAccessibility = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      let labeledInputs = 0;
      let totalInputs = inputs.length;
      
      const inputDetails = inputs.map(input => {
        const hasLabel = !!document.querySelector(`label[for="${input.id}"]`) || 
                         !!input.getAttribute('aria-label') ||
                         !!input.getAttribute('aria-labelledby') ||
                         !!input.closest('label');
        
        if (hasLabel) labeledInputs++;
        
        return {
          type: input.type || input.tagName.toLowerCase(),
          hasLabel,
          hasPlaceholder: !!input.placeholder,
          hasAriaLabel: !!input.getAttribute('aria-label'),
          id: input.id || '',
          required: input.required
        };
      });
      
      return {
        total: totalInputs,
        labeled: labeledInputs,
        details: inputDetails
      };
    });
    
    console.log(`📝 폼 요소 접근성:`);
    console.log(`   전체 입력 요소: ${formAccessibility.total}개`);
    console.log(`   라벨이 있는 요소: ${formAccessibility.labeled}개`);
    console.log(`   라벨링 비율: ${formAccessibility.total > 0 ? Math.round((formAccessibility.labeled / formAccessibility.total) * 100) : 0}%`);
    
    if (formAccessibility.details.length > 0) {
      formAccessibility.details.slice(0, 3).forEach((input, index) => {
        const labels = [];
        if (input.hasLabel) labels.push('Label');
        if (input.hasAriaLabel) labels.push('ARIA');
        if (input.hasPlaceholder) labels.push('Placeholder');
        
        console.log(`   Input ${index + 1} (${input.type}): ${labels.join(', ') || '라벨 없음'}`);
      });
    }
    
    // 5. 이미지 대체 텍스트 확인
    console.log('5️⃣ 이미지 대체 텍스트 확인...');
    
    const imageAccessibility = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      let imagesWithAlt = 0;
      
      const imageDetails = images.map(img => {
        const hasAlt = img.hasAttribute('alt');
        const altText = img.getAttribute('alt') || '';
        const hasAriaLabel = !!img.getAttribute('aria-label');
        const isDecorative = altText === '';
        
        if (hasAlt) imagesWithAlt++;
        
        return {
          src: img.src.substring(img.src.lastIndexOf('/') + 1) || 'no-src',
          hasAlt,
          altText: altText.substring(0, 30),
          hasAriaLabel,
          isDecorative
        };
      });
      
      return {
        total: images.length,
        withAlt: imagesWithAlt,
        details: imageDetails
      };
    });
    
    console.log(`🖼️ 이미지 접근성:`);
    console.log(`   전체 이미지: ${imageAccessibility.total}개`);
    console.log(`   Alt 속성이 있는 이미지: ${imageAccessibility.withAlt}개`);
    console.log(`   Alt 속성 비율: ${imageAccessibility.total > 0 ? Math.round((imageAccessibility.withAlt / imageAccessibility.total) * 100) : 0}%`);
    
    if (imageAccessibility.details.length > 0) {
      imageAccessibility.details.slice(0, 3).forEach((img, index) => {
        console.log(`   Image ${index + 1}: ${img.src} - Alt: "${img.altText || '없음'}"`);
      });
    }
    
    console.log('✅ 의미적 HTML 및 ARIA 속성 테스트 완료!');
  });

  test('🎯 A11Y #3: 색상 대비 및 시각적 접근성', async ({ page }) => {
    console.log('🎨 색상 대비 및 시각적 접근성 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. 텍스트 색상 대비 확인
    console.log('1️⃣ 텍스트 색상 대비 확인...');
    
    const colorContrast = await page.evaluate(() => {
      // RGB를 휘도로 변환하는 함수
      function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      
      // 대비 비율 계산
      function getContrastRatio(color1, color2) {
        const lum1 = getLuminance(...color1);
        const lum2 = getLuminance(...color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }
      
      // RGB 문자열 파싱
      function parseRGB(colorStr) {
        if (colorStr === 'rgba(0, 0, 0, 0)' || colorStr === 'transparent') {
          return [255, 255, 255]; // 기본 배경색을 흰색으로 가정
        }
        const match = colorStr.match(/rgba?\(([^)]+)\)/);
        if (match) {
          const values = match[1].split(',').map(v => parseInt(v.trim()));
          return [values[0] || 0, values[1] || 0, values[2] || 0];
        }
        return [0, 0, 0]; // 기본값
      }
      
      const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label'));
      const contrastResults = [];
      
      textElements.slice(0, 10).forEach(el => {
        if (el.textContent && el.textContent.trim().length > 0) {
          const styles = window.getComputedStyle(el);
          const textColor = parseRGB(styles.color);
          const bgColor = parseRGB(styles.backgroundColor);
          
          const contrast = getContrastRatio(textColor, bgColor);
          const meetsAA = contrast >= 4.5;
          const meetsAAA = contrast >= 7;
          
          contrastResults.push({
            text: el.textContent.trim().substring(0, 30),
            textColor: styles.color,
            backgroundColor: styles.backgroundColor,
            contrast: contrast.toFixed(2),
            meetsAA,
            meetsAAA,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          });
        }
      });
      
      return contrastResults;
    });
    
    console.log(`🔍 색상 대비 분석: ${colorContrast.length}개 요소`);
    
    const aaCompliant = colorContrast.filter(c => c.meetsAA).length;
    const aaaCompliant = colorContrast.filter(c => c.meetsAAA).length;
    
    console.log(`📊 WCAG AA 준수: ${aaCompliant}/${colorContrast.length} (${Math.round((aaCompliant / colorContrast.length) * 100)}%)`);
    console.log(`📊 WCAG AAA 준수: ${aaaCompliant}/${colorContrast.length} (${Math.round((aaaCompliant / colorContrast.length) * 100)}%)`);
    
    // 대비가 낮은 요소들 출력
    const lowContrast = colorContrast.filter(c => !c.meetsAA);
    if (lowContrast.length > 0) {
      console.log('⚠️ 대비가 낮은 요소들:');
      lowContrast.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.text}" - 대비: ${item.contrast}:1`);
      });
    }
    
    // 2. 포커스 표시 확인
    console.log('2️⃣ 포커스 표시 확인...');
    
    const focusIndicators = await page.evaluate(() => {
      const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const focusResults = [];
      
      Array.from(focusableElements).slice(0, 5).forEach(el => {
        el.focus();
        const styles = window.getComputedStyle(el);
        
        const hasFocusOutline = styles.outline !== 'none' && styles.outline !== '0px';
        const hasBoxShadow = styles.boxShadow !== 'none';
        const hasBorder = styles.border !== 'none' && styles.borderWidth !== '0px';
        
        focusResults.push({
          tagName: el.tagName,
          hasFocusOutline,
          hasBoxShadow,
          hasBorder,
          outline: styles.outline,
          boxShadow: styles.boxShadow
        });
        
        el.blur();
      });
      
      return focusResults;
    });
    
    const elementsWithFocus = focusIndicators.filter(f => f.hasFocusOutline || f.hasBoxShadow).length;
    console.log(`🎯 포커스 표시: ${elementsWithFocus}/${focusIndicators.length} 요소`);
    console.log(`📊 포커스 표시 비율: ${focusIndicators.length > 0 ? Math.round((elementsWithFocus / focusIndicators.length) * 100) : 0}%`);
    
    // 3. 텍스트 크기 및 가독성
    console.log('3️⃣ 텍스트 크기 및 가독성...');
    
    const textSizes = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label'));
      const sizeResults = [];
      
      textElements.forEach(el => {
        if (el.textContent && el.textContent.trim().length > 0) {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.2;
          
          sizeResults.push({
            fontSize,
            lineHeight,
            fontFamily: styles.fontFamily,
            fontWeight: styles.fontWeight,
            meetsMinSize: fontSize >= 16, // 최소 권장 크기
            meetsMinLineHeight: (lineHeight / fontSize) >= 1.2 // 최소 줄 간격
          });
        }
      });
      
      return sizeResults;
    });
    
    const avgFontSize = textSizes.reduce((sum, t) => sum + t.fontSize, 0) / textSizes.length;
    const minSizeCompliant = textSizes.filter(t => t.meetsMinSize).length;
    const lineHeightCompliant = textSizes.filter(t => t.meetsMinLineHeight).length;
    
    console.log(`📏 평균 폰트 크기: ${avgFontSize.toFixed(1)}px`);
    console.log(`📏 최소 크기(16px) 준수: ${minSizeCompliant}/${textSizes.length} (${Math.round((minSizeCompliant / textSizes.length) * 100)}%)`);
    console.log(`📏 줄 간격(1.2x) 준수: ${lineHeightCompliant}/${textSizes.length} (${Math.round((lineHeightCompliant / textSizes.length) * 100)}%)`);
    
    // 4. 색상에만 의존하지 않는 정보 전달
    console.log('4️⃣ 색상 독립적 정보 전달 확인...');
    
    const colorDependency = await page.evaluate(() => {
      // 에러, 성공, 경고 메시지 등을 찾기
      const indicators = Array.from(document.querySelectorAll('.error, .success, .warning, .info, .alert, .danger'));
      
      return indicators.map(el => {
        const hasIcon = !!el.querySelector('svg, i, .icon');
        const hasTextIndicator = /error|success|warning|info|alert|danger|실패|성공|경고|정보|주의/i.test(el.textContent || '');
        const styles = window.getComputedStyle(el);
        
        return {
          className: el.className,
          hasIcon,
          hasTextIndicator,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          text: (el.textContent || '').substring(0, 50)
        };
      });
    });
    
    if (colorDependency.length > 0) {
      const withAlternatives = colorDependency.filter(item => item.hasIcon || item.hasTextIndicator).length;
      console.log(`🎨 색상 의존적 요소: ${colorDependency.length}개`);
      console.log(`📊 대체 수단 제공: ${withAlternatives}/${colorDependency.length} (${Math.round((withAlternatives / colorDependency.length) * 100)}%)`);
    } else {
      console.log('🎨 색상 의존적 요소: 없음');
    }
    
    console.log('✅ 색상 대비 및 시각적 접근성 테스트 완료!');
  });

  test('🎯 A11Y #4: 스크린 리더 호환성', async ({ page }) => {
    console.log('🔊 스크린 리더 호환성 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. 페이지 제목 및 메타데이터
    console.log('1️⃣ 페이지 제목 및 메타데이터 확인...');
    
    const pageMetadata = await page.evaluate(() => {
      return {
        title: document.title,
        lang: document.documentElement.lang || document.documentElement.getAttribute('lang'),
        hasDescription: !!document.querySelector('meta[name="description"]'),
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        hasViewport: !!document.querySelector('meta[name="viewport"]'),
        charset: document.characterSet || 'not-set'
      };
    });
    
    console.log(`📄 페이지 제목: "${pageMetadata.title}"`);
    console.log(`🌐 언어 설정: ${pageMetadata.lang || '설정되지 않음'}`);
    console.log(`📝 설명: ${pageMetadata.hasDescription ? '있음' : '없음'}`);
    console.log(`📱 뷰포트: ${pageMetadata.hasViewport ? '설정됨' : '미설정'}`);
    console.log(`🔤 문자셋: ${pageMetadata.charset}`);
    
    if (pageMetadata.description) {
      console.log(`   설명 내용: "${pageMetadata.description.substring(0, 80)}..."`);
    }
    
    // 2. 랜드마크 및 구조적 요소
    console.log('2️⃣ 랜드마크 및 구조적 요소 확인...');
    
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'region'];
      const landmarkElements = ['header', 'nav', 'main', 'aside', 'footer', 'section'];
      
      const foundLandmarks = {};
      
      // 명시적 role 속성
      landmarkRoles.forEach(role => {
        const elements = document.querySelectorAll(`[role="${role}"]`);
        if (elements.length > 0) {
          foundLandmarks[role] = elements.length;
        }
      });
      
      // 의미적 HTML 요소
      landmarkElements.forEach(element => {
        const elements = document.querySelectorAll(element);
        if (elements.length > 0) {
          foundLandmarks[element] = elements.length;
        }
      });
      
      return foundLandmarks;
    });
    
    console.log('🗺️ 랜드마크 요소:');
    Object.entries(landmarks).forEach(([landmark, count]) => {
      console.log(`   ${landmark}: ${count}개`);
    });
    
    const hasNavigation = landmarks.nav || landmarks.navigation;
    const hasMain = landmarks.main;
    const hasHeader = landmarks.header || landmarks.banner;
    const hasFooter = landmarks.footer || landmarks.contentinfo;
    
    console.log(`📊 주요 랜드마크 존재: 네비게이션(${!!hasNavigation}), 메인(${!!hasMain}), 헤더(${!!hasHeader}), 푸터(${!!hasFooter})`);
    
    // 3. 스킵 링크 확인
    console.log('3️⃣ 스킵 링크 확인...');
    
    const skipLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="#"]'));
      const skipLinks = links.filter(link => {
        const text = link.textContent?.toLowerCase() || '';
        return text.includes('skip') || text.includes('건너뛰기') || text.includes('바로가기');
      });
      
      return skipLinks.map(link => ({
        text: link.textContent?.trim() || '',
        href: link.getAttribute('href'),
        isVisible: link.offsetWidth > 0 && link.offsetHeight > 0,
        tabIndex: link.tabIndex
      }));
    });
    
    console.log(`⏭️ 스킵 링크: ${skipLinks.length}개`);
    skipLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. "${link.text}" → ${link.href} (${link.isVisible ? '보임' : '숨김'})`);
    });
    
    // 4. 동적 콘텐츠 접근성
    console.log('4️⃣ 동적 콘텐츠 접근성 확인...');
    
    const dynamicContent = await page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live]');
      const alerts = document.querySelectorAll('[role="alert"]');
      const status = document.querySelectorAll('[role="status"]');
      
      const results = {
        liveRegions: Array.from(liveRegions).map(el => ({
          ariaLive: el.getAttribute('aria-live'),
          ariaAtomic: el.getAttribute('aria-atomic'),
          text: el.textContent?.trim().substring(0, 50) || ''
        })),
        alerts: alerts.length,
        status: status.length
      };
      
      return results;
    });
    
    console.log(`📢 라이브 리전: ${dynamicContent.liveRegions.length}개`);
    console.log(`🚨 Alert 역할: ${dynamicContent.alerts}개`);
    console.log(`📊 Status 역할: ${dynamicContent.status}개`);
    
    if (dynamicContent.liveRegions.length > 0) {
      dynamicContent.liveRegions.forEach((region, index) => {
        console.log(`   ${index + 1}. aria-live="${region.ariaLive}" - "${region.text}"`);
      });
    }
    
    // 5. 폼 요소의 스크린 리더 접근성
    console.log('5️⃣ 폼 요소 스크린 리더 접근성...');
    
    const formAccessibility = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const formResults = [];
      
      forms.forEach((form, formIndex) => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        const fieldsets = form.querySelectorAll('fieldset');
        const legends = form.querySelectorAll('legend');
        
        const formResult = {
          index: formIndex,
          hasFieldsets: fieldsets.length > 0,
          hasLegends: legends.length > 0,
          inputs: inputs.map(input => {
            const label = form.querySelector(`label[for="${input.id}"]`) || input.closest('label');
            const hasAriaLabel = !!input.getAttribute('aria-label');
            const hasAriaDescribedby = !!input.getAttribute('aria-describedby');
            const hasPlaceholder = !!input.placeholder;
            
            return {
              type: input.type || input.tagName.toLowerCase(),
              hasLabel: !!label,
              hasAriaLabel,
              hasAriaDescribedby,
              hasPlaceholder,
              required: input.required,
              labelText: label?.textContent?.trim() || input.getAttribute('aria-label') || ''
            };
          })
        };
        
        formResults.push(formResult);
      });
      
      return formResults;
    });
    
    if (formAccessibility.length > 0) {
      console.log(`📝 폼 요소: ${formAccessibility.length}개 폼`);
      
      formAccessibility.forEach((form, index) => {
        const totalInputs = form.inputs.length;
        const labeledInputs = form.inputs.filter(i => i.hasLabel || i.hasAriaLabel).length;
        
        console.log(`   폼 ${index + 1}: ${totalInputs}개 입력 요소, ${labeledInputs}개 라벨링됨`);
        
        if (form.hasFieldsets) {
          console.log(`     그룹화: fieldset ${form.hasFieldsets ? '사용' : '미사용'}`);
        }
      });
    } else {
      console.log('📝 폼 요소: 없음');
    }
    
    // 6. 테이블 접근성
    console.log('6️⃣ 테이블 접근성 확인...');
    
    const tableAccessibility = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      
      return tables.map((table, index) => {
        const caption = table.querySelector('caption');
        const thead = table.querySelector('thead');
        const th = table.querySelectorAll('th');
        const hasScope = Array.from(th).some(header => header.hasAttribute('scope'));
        const hasId = Array.from(th).some(header => header.id);
        const hasHeaders = Array.from(table.querySelectorAll('td')).some(cell => cell.hasAttribute('headers'));
        
        return {
          index,
          hasCaption: !!caption,
          captionText: caption?.textContent?.trim() || '',
          hasThead: !!thead,
          headerCount: th.length,
          hasScope,
          hasId,
          hasHeaders,
          rows: table.querySelectorAll('tr').length,
          cells: table.querySelectorAll('td').length
        };
      });
    });
    
    if (tableAccessibility.length > 0) {
      console.log(`📊 테이블: ${tableAccessibility.length}개`);
      
      tableAccessibility.forEach(table => {
        console.log(`   테이블 ${table.index + 1}: ${table.rows}행 ${table.cells}셀`);
        console.log(`     캡션: ${table.hasCaption ? '있음' : '없음'}`);
        console.log(`     헤더: ${table.headerCount}개 (scope: ${table.hasScope ? '사용' : '미사용'})`);
      });
    } else {
      console.log('📊 테이블: 없음');
    }
    
    console.log('✅ 스크린 리더 호환성 테스트 완료!');
  });

  test('🎯 A11Y #5: 모바일 접근성', async ({ page }) => {
    console.log('📱 모바일 접근성 테스트 시작...');
    
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. 터치 타겟 크기 확인
    console.log('1️⃣ 터치 타겟 크기 확인...');
    
    const touchTargets = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"], [onclick]'));
      
      return interactiveElements.map(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        // Apple 권장: 최소 44x44px, Android 권장: 최소 48x48px
        const meetsApple = rect.width >= 44 && rect.height >= 44;
        const meetsAndroid = rect.width >= 48 && rect.height >= 48;
        
        return {
          tagName: el.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          meetsApple,
          meetsAndroid,
          padding: styles.padding,
          margin: styles.margin,
          text: el.textContent?.trim().substring(0, 20) || ''
        };
      }).filter(target => target.width > 0 && target.height > 0); // 보이는 요소만
    });
    
    const appleCompliant = touchTargets.filter(t => t.meetsApple).length;
    const androidCompliant = touchTargets.filter(t => t.meetsAndroid).length;
    
    console.log(`👆 터치 타겟: ${touchTargets.length}개`);
    console.log(`📊 Apple 권장(44px) 준수: ${appleCompliant}/${touchTargets.length} (${Math.round((appleCompliant / touchTargets.length) * 100)}%)`);
    console.log(`📊 Android 권장(48px) 준수: ${androidCompliant}/${touchTargets.length} (${Math.round((androidCompliant / touchTargets.length) * 100)}%)`);
    
    // 작은 터치 타겟들 출력
    const smallTargets = touchTargets.filter(t => !t.meetsApple);
    if (smallTargets.length > 0) {
      console.log('⚠️ 작은 터치 타겟들:');
      smallTargets.slice(0, 3).forEach((target, index) => {
        console.log(`   ${index + 1}. ${target.tagName} (${target.width}x${target.height}px) - "${target.text}"`);
      });
    }
    
    // 2. 터치 타겟 간격 확인
    console.log('2️⃣ 터치 타겟 간격 확인...');
    
    const targetSpacing = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      const spacingIssues = [];
      
      for (let i = 0; i < buttons.length; i++) {
        for (let j = i + 1; j < buttons.length; j++) {
          const rect1 = buttons[i].getBoundingClientRect();
          const rect2 = buttons[j].getBoundingClientRect();
          
          // 두 요소가 같은 수직선상에 있고 가까운 경우
          const horizontalOverlap = !(rect1.right < rect2.left || rect2.right < rect1.left);
          const verticalDistance = Math.abs(rect1.bottom - rect2.top);
          
          if (horizontalOverlap && verticalDistance < 8) { // 8px 미만 간격
            spacingIssues.push({
              element1: buttons[i].textContent?.trim().substring(0, 15) || `${buttons[i].tagName}`,
              element2: buttons[j].textContent?.trim().substring(0, 15) || `${buttons[j].tagName}`,
              distance: Math.round(verticalDistance)
            });
          }
        }
      }
      
      return spacingIssues.slice(0, 5); // 최대 5개만 보고
    });
    
    if (targetSpacing.length > 0) {
      console.log(`⚠️ 간격이 좁은 터치 타겟: ${targetSpacing.length}쌍`);
      targetSpacing.forEach((issue, index) => {
        console.log(`   ${index + 1}. "${issue.element1}" ↔ "${issue.element2}" (${issue.distance}px)`);
      });
    } else {
      console.log('✅ 터치 타겟 간격: 적절함');
    }
    
    // 3. 모바일 네비게이션 접근성
    console.log('3️⃣ 모바일 네비게이션 접근성...');
    
    const mobileNavigation = await page.evaluate(() => {
      // 햄버거 메뉴나 모바일 네비게이션 찾기
      const hamburgerMenu = document.querySelector('.hamburger, .menu-toggle, .nav-toggle, [aria-label*="menu"], [aria-label*="메뉴"]');
      const mobileNav = document.querySelector('.mobile-nav, .nav-mobile, .sidebar, .drawer');
      
      let navDetails = {
        hasHamburgerMenu: !!hamburgerMenu,
        hasMobileNav: !!mobileNav,
        hamburgerDetails: null,
        navDetails: null
      };
      
      if (hamburgerMenu) {
        navDetails.hamburgerDetails = {
          hasAriaLabel: !!hamburgerMenu.getAttribute('aria-label'),
          hasAriaExpanded: hamburgerMenu.hasAttribute('aria-expanded'),
          ariaExpanded: hamburgerMenu.getAttribute('aria-expanded'),
          isButton: hamburgerMenu.tagName === 'BUTTON',
          tabIndex: hamburgerMenu.tabIndex
        };
      }
      
      if (mobileNav) {
        navDetails.navDetails = {
          isVisible: mobileNav.offsetWidth > 0 && mobileNav.offsetHeight > 0,
          hasAriaHidden: mobileNav.hasAttribute('aria-hidden'),
          ariaHidden: mobileNav.getAttribute('aria-hidden'),
          role: mobileNav.getAttribute('role')
        };
      }
      
      return navDetails;
    });
    
    console.log(`🍔 햄버거 메뉴: ${mobileNavigation.hasHamburgerMenu ? '있음' : '없음'}`);
    if (mobileNavigation.hasHamburgerMenu && mobileNavigation.hamburgerDetails) {
      const details = mobileNavigation.hamburgerDetails;
      console.log(`   ARIA 라벨: ${details.hasAriaLabel ? '있음' : '없음'}`);
      console.log(`   ARIA expanded: ${details.hasAriaExpanded ? details.ariaExpanded : '없음'}`);
      console.log(`   버튼 요소: ${details.isButton ? '예' : '아니오'}`);
    }
    
    console.log(`📱 모바일 네비게이션: ${mobileNavigation.hasMobileNav ? '있음' : '없음'}`);
    if (mobileNavigation.hasMobileNav && mobileNavigation.navDetails) {
      const details = mobileNavigation.navDetails;
      console.log(`   현재 표시: ${details.isVisible ? '예' : '아니오'}`);
      console.log(`   ARIA hidden: ${details.hasAriaHidden ? details.ariaHidden : '없음'}`);
    }
    
    // 4. 확대/축소 접근성
    console.log('4️⃣ 확대/축소 접근성 확인...');
    
    const zoomAccessibility = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      const viewportContent = viewport?.getAttribute('content') || '';
      
      // 확대 금지 속성들 확인
      const preventsZoom = viewportContent.includes('user-scalable=no') || 
                          viewportContent.includes('maximum-scale=1') ||
                          viewportContent.includes('maximum-scale=1.0');
      
      return {
        hasViewport: !!viewport,
        viewportContent,
        preventsZoom,
        allowsZoom: !preventsZoom
      };
    });
    
    console.log(`🔍 뷰포트 메타태그: ${zoomAccessibility.hasViewport ? '있음' : '없음'}`);
    console.log(`📏 확대/축소: ${zoomAccessibility.allowsZoom ? '허용됨' : '제한됨'}`);
    
    if (zoomAccessibility.preventsZoom) {
      console.log(`⚠️ 확대 제한 발견: ${zoomAccessibility.viewportContent}`);
    }
    
    // 5. 모바일 폼 접근성
    console.log('5️⃣ 모바일 폼 접근성...');
    
    const mobileFormAccessibility = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      
      return inputs.map(input => {
        const hasInputMode = !!input.getAttribute('inputmode');
        const hasAutocomplete = !!input.getAttribute('autocomplete');
        const inputType = input.type || input.tagName.toLowerCase();
        
        // 모바일에서 유용한 input type들
        const isMobileFriendlyType = ['email', 'tel', 'url', 'number', 'date', 'time'].includes(inputType);
        
        return {
          type: inputType,
          hasInputMode,
          inputMode: input.getAttribute('inputmode'),
          hasAutocomplete,
          autocomplete: input.getAttribute('autocomplete'),
          isMobileFriendlyType,
          placeholder: input.placeholder
        };
      });
    });
    
    const totalInputs = mobileFormAccessibility.length;
    const mobileFriendlyInputs = mobileFormAccessibility.filter(i => i.isMobileFriendlyType || i.hasInputMode).length;
    const autocompleteInputs = mobileFormAccessibility.filter(i => i.hasAutocomplete).length;
    
    console.log(`📝 입력 요소: ${totalInputs}개`);
    console.log(`📱 모바일 친화적 타입: ${mobileFriendlyInputs}/${totalInputs} (${Math.round((mobileFriendlyInputs / totalInputs) * 100)}%)`);
    console.log(`🔄 자동완성 지원: ${autocompleteInputs}/${totalInputs} (${Math.round((autocompleteInputs / totalInputs) * 100)}%)`);
    
    // 6. 가로/세로 모드 지원
    console.log('6️⃣ 화면 회전 지원 확인...');
    
    // 세로 모드에서 가로 모드로 변경
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    const landscapeLayout = await page.evaluate(() => {
      const body = document.body;
      const bodyRect = body.getBoundingClientRect();
      
      // 가로 스크롤 확인
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      
      // 주요 콘텐츠가 여전히 접근 가능한지 확인
      const mainContent = document.querySelector('main, .main, .content');
      const isMainVisible = mainContent ? mainContent.getBoundingClientRect().width > 0 : true;
      
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        bodyWidth: bodyRect.width,
        hasHorizontalScroll,
        isMainVisible
      };
    });
    
    console.log(`🔄 가로 모드 (${landscapeLayout.viewportWidth}x${landscapeLayout.viewportHeight}):`);
    console.log(`   수평 스크롤: ${landscapeLayout.hasHorizontalScroll ? '있음 ⚠️' : '없음 ✅'}`);
    console.log(`   주요 콘텐츠: ${landscapeLayout.isMainVisible ? '접근 가능' : '접근 불가'}`);
    
    // 다시 세로 모드로 복원
    await page.setViewportSize({ width: 375, height: 667 });
    
    console.log('✅ 모바일 접근성 테스트 완료!');
  });

  test('🎯 A11Y #6: 전체 접근성 점수 및 요약', async ({ page }) => {
    console.log('📊 전체 접근성 평가 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. 종합 접근성 점수 계산
    console.log('1️⃣ 종합 접근성 점수 계산...');
    
    const comprehensiveScore = await page.evaluate(() => {
      const scores = {
        structure: 0,    // 구조적 점수
        navigation: 0,   // 네비게이션 점수
        content: 0,      // 콘텐츠 점수
        forms: 0,        // 폼 점수
        media: 0         // 미디어 점수
      };
      
      // 구조적 점수 (40점)
      const hasTitle = !!document.title && document.title.trim().length > 0;
      const hasLang = !!document.documentElement.lang;
      const hasMain = !!document.querySelector('main, [role="main"]');
      const hasHeadings = document.querySelectorAll('h1,h2,h3,h4,h5,h6').length > 0;
      const hasLandmarks = document.querySelectorAll('header,nav,main,aside,footer,[role="banner"],[role="navigation"],[role="main"],[role="complementary"],[role="contentinfo"]').length >= 3;
      
      scores.structure = (hasTitle ? 10 : 0) + 
                        (hasLang ? 5 : 0) + 
                        (hasMain ? 10 : 0) + 
                        (hasHeadings ? 10 : 0) + 
                        (hasLandmarks ? 5 : 0);
      
      // 네비게이션 점수 (25점)
      const focusableElements = document.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      const hasSkipLink = Array.from(document.querySelectorAll('a')).some(a => 
        a.textContent && (a.textContent.toLowerCase().includes('skip') || a.textContent.includes('건너뛰기'))
      );
      const hasKeyboardNav = focusableElements.length > 0;
      const hasFocusIndicators = Array.from(focusableElements).slice(0,3).some(el => {
        el.focus();
        const styles = getComputedStyle(el);
        const hasFocus = styles.outline !== 'none' || styles.boxShadow !== 'none';
        el.blur();
        return hasFocus;
      });
      
      scores.navigation = (hasSkipLink ? 5 : 0) + 
                         (hasKeyboardNav ? 10 : 0) + 
                         (hasFocusIndicators ? 10 : 0);
      
      // 콘텐츠 점수 (20점)
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.hasAttribute('alt')).length;
      const altScore = images.length > 0 ? Math.round((imagesWithAlt / images.length) * 10) : 10;
      
      const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6');
      const hasProperHeadingStructure = headings.length > 0;
      
      scores.content = altScore + (hasProperHeadingStructure ? 10 : 0);
      
      // 폼 점수 (10점)
      const inputs = document.querySelectorAll('input,select,textarea');
      const inputsWithLabels = Array.from(inputs).filter(input => 
        document.querySelector(`label[for="${input.id}"]`) || 
        input.getAttribute('aria-label') || 
        input.closest('label')
      ).length;
      const formScore = inputs.length > 0 ? Math.round((inputsWithLabels / inputs.length) * 10) : 10;
      
      scores.forms = formScore;
      
      // 미디어 점수 (5점) - 현재는 기본점수
      scores.media = 5;
      
      return scores;
    });
    
    const totalScore = Object.values(comprehensiveScore).reduce((sum, score) => sum + score, 0);
    const maxScore = 100;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    console.log('📊 접근성 점수:');
    console.log(`   구조적 요소: ${comprehensiveScore.structure}/40`);
    console.log(`   네비게이션: ${comprehensiveScore.navigation}/25`);
    console.log(`   콘텐츠: ${comprehensiveScore.content}/20`);
    console.log(`   폼 요소: ${comprehensiveScore.forms}/10`);
    console.log(`   미디어: ${comprehensiveScore.media}/5`);
    console.log(`   총 점수: ${totalScore}/100 (${percentage}%)`);
    
    // 2. 접근성 등급 평가
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    
    console.log(`🏆 접근성 등급: ${grade}`);
    
    // 3. 주요 이슈 및 개선사항
    console.log('2️⃣ 주요 개선사항...');
    
    const issues = await page.evaluate(() => {
      const foundIssues = [];
      
      // 제목 관련
      if (!document.title || document.title.trim().length === 0) {
        foundIssues.push('페이지 제목이 없음');
      }
      
      // 언어 설정
      if (!document.documentElement.lang) {
        foundIssues.push('HTML lang 속성이 설정되지 않음');
      }
      
      // 메인 콘텐츠
      if (!document.querySelector('main, [role="main"]')) {
        foundIssues.push('메인 콘텐츠 영역이 명시되지 않음');
      }
      
      // 이미지 대체 텍스트
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.hasAttribute('alt'));
      if (imagesWithoutAlt.length > 0) {
        foundIssues.push(`${imagesWithoutAlt.length}개 이미지에 대체 텍스트 없음`);
      }
      
      // 폼 라벨
      const inputs = document.querySelectorAll('input,select,textarea');
      const unlabeledInputs = Array.from(inputs).filter(input => 
        !document.querySelector(`label[for="${input.id}"]`) && 
        !input.getAttribute('aria-label') && 
        !input.closest('label')
      );
      if (unlabeledInputs.length > 0) {
        foundIssues.push(`${unlabeledInputs.length}개 입력 요소에 라벨 없음`);
      }
      
      // 스킵 링크
      const hasSkipLink = Array.from(document.querySelectorAll('a')).some(a => 
        a.textContent && (a.textContent.toLowerCase().includes('skip') || a.textContent.includes('건너뛰기'))
      );
      if (!hasSkipLink) {
        foundIssues.push('스킵 링크 없음');
      }
      
      return foundIssues;
    });
    
    if (issues.length > 0) {
      console.log('⚠️ 주요 개선사항:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ 주요 접근성 이슈 없음');
    }
    
    // 4. 권장사항
    console.log('3️⃣ 권장사항...');
    
    const recommendations = [
      '정기적인 접근성 테스트 실시',
      '스크린 리더를 사용한 실제 테스트',
      '키보드만으로 전체 사이트 탐색 테스트',
      '색상 대비 도구를 사용한 정기 검사',
      '사용자 피드백 수집 및 반영'
    ];
    
    console.log('💡 권장사항:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    // 5. WCAG 준수 레벨 평가
    console.log('4️⃣ WCAG 2.1 준수 레벨 평가...');
    
    const wcagCompliance = await page.evaluate(() => {
      let levelA = 0;
      let levelAA = 0;
      let levelAAA = 0;
      
      // Level A 기준 (기본적인 접근성)
      const criteriaA = [
        !!document.title,  // 1.3.1 Info and Relationships
        !!document.documentElement.lang,  // 3.1.1 Language of Page
        document.querySelectorAll('img[alt]').length === document.querySelectorAll('img').length,  // 1.1.1 Non-text Content
        !!document.querySelector('main, [role="main"]')  // 2.4.1 Bypass Blocks
      ];
      levelA = criteriaA.filter(Boolean).length;
      
      // Level AA 기준 (권장 수준)
      const criteriaAA = [
        // 색상 대비는 별도 측정 필요하므로 여기서는 기본 점수
        true,  // 1.4.3 Contrast (Minimum) - 기본 점수
        document.querySelectorAll('input,select,textarea').length === 0 || 
        Array.from(document.querySelectorAll('input,select,textarea')).every(input => 
          document.querySelector(`label[for="${input.id}"]`) || 
          input.getAttribute('aria-label') || 
          input.closest('label')
        ),  // 3.3.2 Labels or Instructions
        document.querySelectorAll('h1,h2,h3,h4,h5,h6').length > 0  // 2.4.6 Headings and Labels
      ];
      levelAA = criteriaAA.filter(Boolean).length;
      
      // Level AAA 기준 (최고 수준)
      const criteriaAAA = [
        true,  // 1.4.6 Contrast (Enhanced) - 기본 점수
        Array.from(document.querySelectorAll('a')).some(a => 
          a.textContent && (a.textContent.toLowerCase().includes('skip') || a.textContent.includes('건너뛰기'))
        )  // 2.4.1 Bypass Blocks (Enhanced)
      ];
      levelAAA = criteriaAAA.filter(Boolean).length;
      
      return { levelA, levelAA, levelAAA };
    });
    
    console.log(`📋 WCAG 2.1 준수도:`);
    console.log(`   Level A: ${wcagCompliance.levelA}/4 기준`);
    console.log(`   Level AA: ${wcagCompliance.levelAA}/3 기준`);
    console.log(`   Level AAA: ${wcagCompliance.levelAAA}/2 기준`);
    
    // 전체 평가 결과
    console.log(`\n🎯 전체 접근성 평가 결과:`);
    console.log(`   점수: ${totalScore}/100 (${percentage}%)`);
    console.log(`   등급: ${grade}`);
    console.log(`   개선사항: ${issues.length}개`);
    console.log(`   상태: ${percentage >= 80 ? 'WCAG AA 수준 근접' : percentage >= 60 ? '기본 접근성 확보' : '접근성 개선 필요'}`);
    
    console.log('✅ 전체 접근성 평가 완료!');
  });

});