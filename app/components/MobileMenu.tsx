// 모바일 메뉴 컴포넌트
// 비전공자 설명: 모바일 화면에서 햄버거 메뉴를 클릭했을 때 나타나는 메뉴입니다
'use client';

import { useState } from 'react';

export default function MobileMenu() {
  // 메뉴 열림/닫힘 상태를 관리하는 변수
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <button 
        className="md:hidden p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="메뉴 열기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 모바일 메뉴 패널 */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 메뉴 내용 */}
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-50 md:hidden">
            <div className="p-4">
              {/* 닫기 버튼 */}
              <button 
                className="absolute top-4 right-4 p-2"
                onClick={() => setIsOpen(false)}
                aria-label="메뉴 닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* 메뉴 항목들 */}
              <nav className="mt-8 space-y-4">
                <a href="/reservations/new" className="block py-2 text-gray-700 hover:text-blue-600">
                  🎯 예약하기
                </a>
                <a href="/reservations" className="block py-2 text-gray-700 hover:text-blue-600">
                  📋 내 예약
                </a>
                <a href="/guide" className="block py-2 text-gray-700 hover:text-blue-600">
                  📖 이용안내
                </a>
                <a href="/mypage" className="block py-2 text-gray-700 hover:text-blue-600">
                  👤 마이페이지
                </a>
                <hr className="my-4" />
                <a href="/login" className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center">
                  로그인
                </a>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}