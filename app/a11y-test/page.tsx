'use client';

import { useA11y } from '@/app/hooks/useA11y';
import { useState } from 'react';

export default function A11yTestPage() {
  const { 
    announceToScreenReader, 
    runA11yAudit,
    checkColorContrast 
  } = useA11y();
  
  const [testMessage, setTestMessage] = useState('');

  const handleAnnounceTest = () => {
    announceToScreenReader('스크린 리더 테스트 메시지입니다.', 'polite');
  };

  const handleAudit = () => {
    runA11yAudit();
  };

  const testColorContrast = () => {
    const contrast = checkColorContrast('rgb(0,0,0)', 'rgb(255,255,255)');
    console.log('대비율:', contrast.toFixed(2));
    announceToScreenReader(`색상 대비율: ${contrast.toFixed(2)}:1`, 'polite');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 페이지 제목 - 올바른 헤딩 구조 */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          접근성 테스트 페이지
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          WCAG 2.1 AA 기준 접근성 개선사항을 테스트합니다.
        </p>
      </header>

      {/* 스크린 리더 테스트 섹션 */}
      <section aria-labelledby="screen-reader-test">
        <h2 id="screen-reader-test" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          스크린 리더 테스트
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={handleAnnounceTest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            스크린 리더에 메시지 알리기
          </button>
          
          <div className="space-y-2">
            <label htmlFor="test-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              테스트 메시지:
            </label>
            <input
              id="test-message"
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="스크린 리더에 알릴 메시지를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={() => announceToScreenReader(testMessage, 'assertive')}
              disabled={!testMessage.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              긴급 메시지로 알리기
            </button>
          </div>
        </div>
      </section>

      {/* 키보드 네비게이션 테스트 */}
      <section aria-labelledby="keyboard-nav-test">
        <h2 id="keyboard-nav-test" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          키보드 네비게이션 테스트
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            버튼 1
          </button>
          <button className="p-4 bg-green-100 dark:bg-green-900 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            버튼 2
          </button>
          <button className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
            버튼 3
          </button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Tab</kbd> 키로 이동, 
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs ml-1">Enter</kbd> 또는 
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs ml-1">Space</kbd> 키로 활성화
        </p>
      </section>

      {/* 이미지 alt 텍스트 테스트 */}
      <section aria-labelledby="image-alt-test">
        <h2 id="image-alt-test" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          이미지 Alt 텍스트 테스트
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              올바른 alt 텍스트
            </h3>
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%234f46e5'/%3E%3Ctext x='100' y='55' text-anchor='middle' fill='white' font-family='Arial' font-size='16'%3E게임플라자%3C/text%3E%3C/svg%3E"
              alt="게임플라자 로고 - 보라색 배경에 흰색 텍스트"
              className="w-full h-auto rounded-lg border"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              장식적 이미지 (alt="")
            </h3>
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23e5e7eb'/%3E%3Ctext x='100' y='55' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='12'%3E장식적 이미지%3C/text%3E%3C/svg%3E"
              alt=""
              role="presentation"
              className="w-full h-auto rounded-lg border"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              장식적 이미지는 alt=""와 role="presentation" 사용
            </p>
          </div>
        </div>
      </section>

      {/* 색상 대비 테스트 */}
      <section aria-labelledby="color-contrast-test">
        <h2 id="color-contrast-test" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          색상 대비 테스트
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-lg font-medium text-black mb-2">
                높은 대비 (21:1)
              </h3>
              <p className="text-black">
                검은색 텍스트와 흰색 배경은 최고의 대비를 제공합니다.
              </p>
            </div>
            
            <div className="p-4 bg-gray-100 border rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                적절한 대비 (12.6:1)
              </h3>
              <p className="text-gray-700">
                회색 텍스트도 WCAG AA 기준을 충족합니다.
              </p>
            </div>
          </div>
          
          <button
            onClick={testColorContrast}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            색상 대비 계산하기
          </button>
        </div>
      </section>

      {/* 접근성 검증 도구 */}
      <section aria-labelledby="a11y-audit">
        <h2 id="a11y-audit" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          접근성 검증 도구
        </h2>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            현재 페이지의 접근성을 검증합니다. 결과는 브라우저 콘솔에서 확인하세요.
          </p>
          
          <button
            onClick={handleAudit}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
          >
            🔍 접근성 검증 실행
          </button>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>검증 항목:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>헤딩 구조 (H1~H6 순서)</li>
              <li>이미지 alt 텍스트</li>
              <li>키보드 접근성</li>
              <li>색상 대비 (기본)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t pt-6 mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          이 페이지는 WCAG 2.1 AA 기준을 준수하도록 설계되었습니다.
        </p>
      </footer>
    </div>
  );
}