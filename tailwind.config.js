/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 다크모드 설정 - 클래스 기반으로 동작
  darkMode: 'class',
  theme: {
    extend: {
      // 커스텀 색상 팔레트 정의
      colors: {
        // 메인 브랜드 색상
        primary: {
          50: '#eff6ff',   // 가장 밝은 파란색
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // 기본 파란색
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',  // 가장 진한 파란색
        },
        // 게임 테마 색상
        game: {
          rhythm: '#ec4899',    // 리듬게임 (핑크)
          fighting: '#f59e0b',  // 격투게임 (주황)
          racing: '#10b981',    // 레이싱게임 (초록)
          arcade: '#8b5cf6',    // 아케이드 (보라)
        },
        // 상태 색상
        status: {
          pending: '#f59e0b',   // 대기중 (주황)
          approved: '#10b981',  // 승인 (초록)
          rejected: '#ef4444',  // 거절 (빨강)
          completed: '#6b7280', // 완료 (회색)
        }
      },
      // 커스텀 폰트 크기
      fontSize: {
        '2xs': '0.625rem',  // 10px
      },
      // 애니메이션
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      // 그림자 효과
      boxShadow: {
        'game': '0 4px 20px -2px rgba(59, 130, 246, 0.2)',
        'game-hover': '0 8px 30px -4px rgba(59, 130, 246, 0.3)',
      },
      // 간격 설정
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // 테두리 반경
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}