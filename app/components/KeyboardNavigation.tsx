/**
 * 키보드 네비게이션 컴포넌트
 * 키보드만으로 모든 기능 사용 가능하도록 지원
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronUp, Keyboard, X } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export default function KeyboardNavigation() {
  const [showSkipLinks, setShowSkipLinks] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const skipLinksRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // 키보드 단축키 정의
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: '검색 포커스',
      action: () => {
        const search = document.querySelector('input[type="search"]') as HTMLElement;
        search?.focus();
      }
    },
    {
      key: 'g',
      shift: true,
      description: '홈으로 이동',
      action: () => {
        window.location.href = '/';
      }
    },
    {
      key: 'r',
      shift: true,
      description: '예약 페이지',
      action: () => {
        window.location.href = '/reservations';
      }
    },
    {
      key: 'm',
      shift: true,
      description: '마이페이지',
      action: () => {
        window.location.href = '/mypage';
      }
    },
    {
      key: '?',
      description: '키보드 단축키 도움말',
      action: () => {
        setShowShortcutHelp(true);
      }
    },
    {
      key: 'Escape',
      description: '닫기/취소',
      action: () => {
        setShowShortcutHelp(false);
        setShowSkipLinks(false);
      }
    },
    {
      key: 't',
      description: '테마 전환',
      action: () => {
        document.documentElement.classList.toggle('dark');
      }
    },
    {
      key: 'Tab',
      description: '다음 요소로 이동',
      action: () => {} // 기본 동작 유지
    },
    {
      key: 'Tab',
      shift: true,
      description: '이전 요소로 이동',
      action: () => {} // 기본 동작 유지
    }
  ];

  // 키보드 모드 감지
  useEffect(() => {
    let mouseTimeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setKeyboardMode(false);
      document.body.classList.remove('keyboard-navigation');

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        setKeyboardMode(false);
      }, 100);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardMode(true);
        document.body.classList.add('keyboard-navigation');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(mouseTimeout);
    };
  }, []);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable) {
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;

        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // 스크롤 위치에 따른 "맨 위로" 버튼 표시
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 포커스 트랩 (모달용)
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // 스킵 링크 렌더링
  const renderSkipLinks = () => (
    <div
      ref={skipLinksRef}
      className={`skip-links fixed top-0 left-0 z-50 ${
        showSkipLinks ? 'block' : 'sr-only sr-only-focusable'
      }`}
      onFocus={() => setShowSkipLinks(true)}
      onBlur={() => setShowSkipLinks(false)}
    >
      <nav className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 m-4">
        <h2 className="font-bold mb-2">빠른 이동</h2>
        <ul className="space-y-2">
          <li>
            <a
              href="#main-content"
              className="block px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2"
              onClick={() => setShowSkipLinks(false)}
            >
              본문 바로가기
            </a>
          </li>
          <li>
            <a
              href="#main-navigation"
              className="block px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2"
              onClick={() => setShowSkipLinks(false)}
            >
              주 메뉴 바로가기
            </a>
          </li>
          <li>
            <a
              href="#reservation-form"
              className="block px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2"
              onClick={() => setShowSkipLinks(false)}
            >
              예약하기 바로가기
            </a>
          </li>
          <li>
            <a
              href="#footer"
              className="block px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2"
              onClick={() => setShowSkipLinks(false)}
            >
              하단 정보 바로가기
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );

  // 키보드 단축키 도움말 모달
  const renderShortcutHelp = () => {
    if (!showShortcutHelp) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowShortcutHelp(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="키보드 단축키 도움말"
          ref={(el) => el && trapFocus(el)}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Keyboard className="w-6 h-6" />
              키보드 단축키
            </h2>
            <button
              onClick={() => setShowShortcutHelp(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                네비게이션
              </h3>
              <div className="space-y-2">
                {shortcuts.filter(s => ['g', 'r', 'm'].includes(s.key.toLowerCase())).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono">
                      {shortcut.shift && 'Shift + '}
                      {shortcut.ctrl && 'Ctrl + '}
                      {shortcut.alt && 'Alt + '}
                      {shortcut.key}
                    </kbd>
                    <span className="text-gray-600 dark:text-gray-400">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                기능
              </h3>
              <div className="space-y-2">
                {shortcuts.filter(s => ['/', '?', 't'].includes(s.key)).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono">
                      {shortcut.shift && 'Shift + '}
                      {shortcut.ctrl && 'Ctrl + '}
                      {shortcut.alt && 'Alt + '}
                      {shortcut.key}
                    </kbd>
                    <span className="text-gray-600 dark:text-gray-400">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                기본 탐색
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono">
                    Tab
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    다음 요소로 이동
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono">
                    Shift + Tab
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    이전 요소로 이동
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono">
                    Enter / Space
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    버튼/링크 실행
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-mono">
                    Escape
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    모달/메뉴 닫기
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              💡 팁: 키보드 탐색 중에는 포커스 표시가 더 선명하게 나타납니다.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 맨 위로 버튼
  const renderScrollTop = () => {
    if (!showScrollTop) return null;

    return (
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="fixed bottom-20 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all"
        aria-label="맨 위로 이동"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    );
  };

  // 키보드 모드 인디케이터
  const renderKeyboardIndicator = () => {
    if (!keyboardMode) return null;

    return (
      <div className="fixed bottom-4 left-4 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg flex items-center gap-2">
        <Keyboard className="w-4 h-4" />
        <span>키보드 모드</span>
      </div>
    );
  };

  return (
    <>
      {/* 스킵 링크 */}
      {renderSkipLinks()}

      {/* 키보드 단축키 도움말 */}
      {renderShortcutHelp()}

      {/* 맨 위로 버튼 */}
      {renderScrollTop()}

      {/* 키보드 모드 인디케이터 */}
      {renderKeyboardIndicator()}

      {/* 키보드 도움말 버튼 (화면 우측 하단) */}
      <button
        onClick={() => setShowShortcutHelp(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-900 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-all"
        aria-label="키보드 단축키 도움말"
        title="키보드 단축키 (Shift + ?)"
      >
        <Keyboard className="w-6 h-6" />
      </button>
    </>
  );
}

// 포커스 가능한 요소들을 순회하는 커스텀 훅
export function useFocusableElements() {
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const updateFocusableElements = () => {
      const elements = Array.from(document.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, []);

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

  const focusFirst = useCallback(() => {
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      setCurrentIndex(0);
    }
  }, [focusableElements]);

  const focusLast = useCallback(() => {
    if (focusableElements.length > 0) {
      const lastIndex = focusableElements.length - 1;
      focusableElements[lastIndex].focus();
      setCurrentIndex(lastIndex);
    }
  }, [focusableElements]);

  return {
    focusableElements,
    currentIndex,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  };
}