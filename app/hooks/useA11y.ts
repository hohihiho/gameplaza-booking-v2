'use client';

import { useEffect, useRef } from 'react';

// 접근성 관련 커스텀 훅
export function useA11y() {
  // 포커스 트랩
  const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!isActive || !containerRef.current) return;

      const container = containerRef.current;
      const focusableElements = container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }, [isActive]);

    return containerRef;
  };

  // 스크린 리더 알림 - 향상된 버전
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // 기존 라이브 리전 사용 시도
    const existingRegion = document.getElementById(
      priority === 'assertive' ? 'live-region-assertive' : 'live-region-polite'
    );
    
    if (existingRegion) {
      existingRegion.textContent = message;
      // 같은 메시지 반복 시에도 읽도록 잠시 비운 후 설정
      setTimeout(() => {
        existingRegion.textContent = message;
      }, 100);
    } else {
      // 대체: 임시 엘리먼트 생성
      const announcement = document.createElement('div');
      announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  // Escape 키 핸들러
  const useEscapeKey = (callback: () => void, isActive = true) => {
    useEffect(() => {
      if (!isActive) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          callback();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [callback, isActive]);
  };

  // 색상 대비 체크 (WCAG 기준)
  const checkColorContrast = (foreground: string, background: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return 0;
      
      const [r, g, b] = rgb.map(x => {
        const channel = parseInt(x) / 255;
        return channel <= 0.03928
          ? channel / 12.92
          : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * (r || 0) + 0.7152 * (g || 0) + 0.0722 * (b || 0);
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  // ARIA 라이브 리전 업데이트
  const updateLiveRegion = (regionId: string, message: string) => {
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = message;
    }
  };

  // 헤딩 레벨 확인 및 올바른 구조 제안
  const validateHeadingStructure = () => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const issues: string[] = [];
    
    if (headings.length === 0) {
      issues.push('페이지에 헤딩이 없습니다.');
      return issues;
    }
    
    const h1Count = headings.filter(h => h.tagName === 'H1').length;
    if (h1Count === 0) {
      issues.push('페이지에 H1 태그가 없습니다.');
    } else if (h1Count > 1) {
      issues.push('페이지에 H1 태그가 여러 개 있습니다.');
    }
    
    // 헤딩 레벨 건너뛰기 검사
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = parseInt(headings[i].tagName.substring(1));
      const previousLevel = parseInt(headings[i - 1].tagName.substring(1));
      
      if (currentLevel > previousLevel + 1) {
        issues.push(`헤딩 레벨이 건너뛰어졌습니다: H${previousLevel} 다음에 H${currentLevel}`);
      }
    }
    
    return issues;
  };

  // 이미지 alt 텍스트 검증
  const validateImageAltText = () => {
    const images = Array.from(document.querySelectorAll('img'));
    const issues: string[] = [];
    
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      
      if (alt === null) {
        issues.push(`이미지 ${index + 1} (${src}): alt 속성이 없습니다.`);
      } else if (alt === '' && !img.hasAttribute('role')) {
        // 장식적 이미지는 alt=""이 정상이지만, role="presentation" 권장
        issues.push(`이미지 ${index + 1} (${src}): 장식적 이미지라면 role="presentation" 추가 권장`);
      } else if (alt && alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture')) {
        issues.push(`이미지 ${index + 1} (${src}): alt 텍스트에 '이미지' 또는 'picture' 단어 제거 권장`);
      }
    });
    
    return issues;
  };

  // 키보드 접근성 검증
  const validateKeyboardAccessibility = () => {
    const interactiveElements = Array.from(document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    const issues: string[] = [];
    
    interactiveElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const tabIndex = element.getAttribute('tabindex');
      
      // 양수 tabindex 검사
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push(`요소 ${index + 1} (${tagName}): 양수 tabindex(${tabIndex}) 사용을 피하세요.`);
      }
      
      // 버튼 역할을 하는 요소에 적절한 태그 사용 검사
      if (tagName === 'div' || tagName === 'span') {
        const onclick = element.getAttribute('onclick');
        const role = element.getAttribute('role');
        
        if (onclick && role !== 'button') {
          issues.push(`요소 ${index + 1} (${tagName}): 클릭 이벤트가 있는 요소는 button 태그 또는 role="button" 사용 권장`);
        }
      }
    });
    
    return issues;
  };

  // 전체 접근성 검증 실행
  const runA11yAudit = () => {
    const audit = {
      headings: validateHeadingStructure(),
      images: validateImageAltText(),
      keyboard: validateKeyboardAccessibility(),
      timestamp: new Date().toISOString(),
    };
    
    const totalIssues = audit.headings.length + audit.images.length + audit.keyboard.length;
    
    console.group('🔍 접근성 검증 결과');
    console.log(`총 ${totalIssues}개의 이슈가 발견되었습니다.`);
    
    if (audit.headings.length > 0) {
      console.group('📋 헤딩 구조 이슈');
      audit.headings.forEach(issue => console.warn(issue));
      console.groupEnd();
    }
    
    if (audit.images.length > 0) {
      console.group('🖼️ 이미지 alt 텍스트 이슈');
      audit.images.forEach(issue => console.warn(issue));
      console.groupEnd();
    }
    
    if (audit.keyboard.length > 0) {
      console.group('⌨️ 키보드 접근성 이슈');
      audit.keyboard.forEach(issue => console.warn(issue));
      console.groupEnd();
    }
    
    if (totalIssues === 0) {
      console.log('✅ 접근성 이슈가 발견되지 않았습니다!');
    }
    
    console.groupEnd();
    
    return audit;
  };

  return {
    useFocusTrap,
    announceToScreenReader,
    useEscapeKey,
    checkColorContrast,
    updateLiveRegion,
    validateHeadingStructure,
    validateImageAltText,
    validateKeyboardAccessibility,
    runA11yAudit,
  };
}