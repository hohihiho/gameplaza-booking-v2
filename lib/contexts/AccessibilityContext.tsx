/**
 * 접근성 컨텍스트 제공자
 * WCAG 2.1 AA 준수를 위한 전역 접근성 설정 관리
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// 접근성 설정 인터페이스
interface AccessibilitySettings {
  // 시각 설정
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  contrast: 'normal' | 'high' | 'highest';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
  reduceMotion: boolean;
  reduceTransparency: boolean;

  // 인터랙션 설정
  keyboardNavigation: boolean;
  focusIndicator: 'default' | 'enhanced' | 'high-contrast';
  clickTargetSize: 'default' | 'large' | 'x-large';

  // 스크린 리더 설정
  announceUpdates: boolean;
  verboseDescriptions: boolean;

  // 타이머 설정
  autoPlayMedia: boolean;
  extendTimeouts: boolean;
  timeoutMultiplier: number;
}

// 접근성 컨텍스트 타입
interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  applySystemPreferences: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  getFontSizeClass: () => string;
  getContrastClass: () => string;
  getColorBlindClass: () => string;
  getClickTargetClass: () => string;
  getFocusClass: () => string;
}

// 기본 설정값
const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  contrast: 'normal',
  colorBlindMode: 'none',
  reduceMotion: false,
  reduceTransparency: false,
  keyboardNavigation: true,
  focusIndicator: 'default',
  clickTargetSize: 'default',
  announceUpdates: true,
  verboseDescriptions: false,
  autoPlayMedia: true,
  extendTimeouts: false,
  timeoutMultiplier: 1
};

// 컨텍스트 생성
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// 컨텍스트 제공자 컴포넌트
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null);

  // 로컬스토리지에서 설정 로드
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (error) {
          console.error('접근성 설정 로드 실패:', error);
        }
      }
    };

    loadSettings();
  }, []);

  // 설정 변경 시 로컬스토리지 저장 및 CSS 변수 업데이트
  useEffect(() => {
    // 로컬스토리지 저장
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));

    // CSS 변수 업데이트
    const root = document.documentElement;

    // 폰트 크기
    const fontScale = {
      small: 0.875,
      medium: 1,
      large: 1.125,
      'x-large': 1.25
    };
    root.style.setProperty('--a11y-font-scale', fontScale[settings.fontSize].toString());

    // 모션 감소
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // 투명도 감소
    if (settings.reduceTransparency) {
      root.classList.add('reduce-transparency');
    } else {
      root.classList.remove('reduce-transparency');
    }

    // 대비 모드
    root.setAttribute('data-contrast', settings.contrast);

    // 색맹 모드
    root.setAttribute('data-colorblind', settings.colorBlindMode);

    // 클릭 대상 크기
    root.setAttribute('data-target-size', settings.clickTargetSize);

    // 포커스 표시
    root.setAttribute('data-focus-indicator', settings.focusIndicator);

  }, [settings]);

  // 스크린 리더 알림을 위한 Live Region 생성
  useEffect(() => {
    const div = document.createElement('div');
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.setAttribute('aria-atomic', 'true');
    div.className = 'sr-only';
    div.id = 'a11y-announcer';
    document.body.appendChild(div);
    setAnnouncer(div);

    return () => {
      document.body.removeChild(div);
    };
  }, []);

  // 시스템 설정 감지 및 적용
  const applySystemPreferences = useCallback(() => {
    const newSettings: Partial<AccessibilitySettings> = {};

    // 모션 감소 설정
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      newSettings.reduceMotion = true;
    }

    // 투명도 감소 설정
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
      newSettings.reduceTransparency = true;
    }

    // 고대비 모드
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      newSettings.contrast = 'high';
    } else if (window.matchMedia('(prefers-contrast: more)').matches) {
      newSettings.contrast = 'highest';
    }

    // 다크 모드 (대비와 관련)
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // 다크 모드에서는 기본적으로 대비를 약간 높임
      if (newSettings.contrast === 'normal') {
        newSettings.contrast = 'high';
      }
    }

    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 시스템 설정 변경 감지
  useEffect(() => {
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-contrast: more)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ];

    const handler = () => applySystemPreferences();

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handler);
    });

    // 초기 적용
    applySystemPreferences();

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handler);
      });
    };
  }, [applySystemPreferences]);

  // 설정 업데이트 함수
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // 설정 초기화
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  // 스크린 리더 알림 함수
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer || !settings.announceUpdates) return;

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // 메시지 클리어 (다음 알림을 위해)
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }, [announcer, settings.announceUpdates]);

  // 유틸리티 함수들
  const getFontSizeClass = useCallback(() => {
    const classes = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      'x-large': 'text-xl'
    };
    return classes[settings.fontSize];
  }, [settings.fontSize]);

  const getContrastClass = useCallback(() => {
    const classes = {
      normal: '',
      high: 'high-contrast',
      highest: 'highest-contrast'
    };
    return classes[settings.contrast];
  }, [settings.contrast]);

  const getColorBlindClass = useCallback(() => {
    const classes = {
      none: '',
      protanopia: 'cb-protanopia',
      deuteranopia: 'cb-deuteranopia',
      tritanopia: 'cb-tritanopia',
      monochrome: 'cb-monochrome'
    };
    return classes[settings.colorBlindMode];
  }, [settings.colorBlindMode]);

  const getClickTargetClass = useCallback(() => {
    const classes = {
      default: '',
      large: 'target-large',
      'x-large': 'target-x-large'
    };
    return classes[settings.clickTargetSize];
  }, [settings.clickTargetSize]);

  const getFocusClass = useCallback(() => {
    const classes = {
      default: '',
      enhanced: 'focus-enhanced',
      'high-contrast': 'focus-high-contrast'
    };
    return classes[settings.focusIndicator];
  }, [settings.focusIndicator]);

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    applySystemPreferences,
    announce,
    getFontSizeClass,
    getContrastClass,
    getColorBlindClass,
    getClickTargetClass,
    getFocusClass
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// 컨텍스트 사용 훅
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// 키보드 네비게이션 훅
export function useKeyboardNavigation() {
  const { settings } = useAccessibility();
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const updateFocusableElements = () => {
      const elements = Array.from(document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];

      setFocusableElements(elements);
    };

    updateFocusableElements();

    // DOM 변경 감지
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [settings.keyboardNavigation]);

  const focusNext = useCallback(() => {
    if (focusableElements.length === 0) return;

    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
    setCurrentIndex(nextIndex);
  }, [focusableElements, currentIndex]);

  const focusPrevious = useCallback(() => {
    if (focusableElements.length === 0) return;

    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex]?.focus();
    setCurrentIndex(prevIndex);
  }, [focusableElements, currentIndex]);

  return { focusNext, focusPrevious, focusableElements };
}

// 포커스 트랩 훅
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = element.querySelectorAll(focusableSelectors.join(', '));
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // 초기 포커스 설정
    const firstFocusable = element.querySelector(focusableSelectors.join(', ')) as HTMLElement;
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref]);
}