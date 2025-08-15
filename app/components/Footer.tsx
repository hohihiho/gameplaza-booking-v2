'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 회사 정보 */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            광주 게임플라자
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            리듬게임 전문 게임 아케이드
          </p>
        </div>
        
        {/* 법적 링크들 - 더 명확한 마크업으로 봇 인식 개선 */}
        <nav aria-label="법적 문서 링크" className="mb-6">
          <div className="flex flex-wrap justify-center items-center gap-2">
            <Link 
              href="/privacy" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              rel="privacy-policy"
              title="개인정보처리방침 - Privacy Policy"
            >
              개인정보처리방침 (Privacy Policy)
            </Link>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <Link 
              href="/terms" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              rel="terms-of-service"
              title="서비스 이용약관 - Terms of Service"
            >
              이용약관 (Terms of Service)
            </Link>
          </div>
        </nav>
        
        
        {/* 저작권 */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 광주 게임플라자. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}