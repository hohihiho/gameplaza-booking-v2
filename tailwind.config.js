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
      // 폴드 화면을 위한 커스텀 브레이크포인트
      screens: {
        'xs': '320px',    // 갤럭시 폴드 등 매우 좁은 화면
        'fold': '280px',  // 가장 좁은 폴드 화면
      },
      // 커스텀 폰트
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
      },
      // 커스텀 색상 팔레트 정의
      colors: {
        // 메인 브랜드 색상 - 인디고
        primary: {
          50: '#eef2ff',   
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // 메인 인디고
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // 보조 색상 - 청록색
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // 메인 청록색
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // 코랄/핑크 포인트
        coral: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',  // 메인 코랄
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
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
        },
        // 배경 그라데이션용
        gradient: {
          start: '#f3f1ff',
          middle: '#e0f2fe',
          end: '#ecfeff',
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
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: 0.8 },
          '50%': { opacity: 1 },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      // 그림자 효과
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(132, 61, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(132, 61, 255, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(132, 61, 255, 0.1)',
        'neon': '0 0 10px rgba(132, 61, 255, 0.8), 0 0 20px rgba(132, 61, 255, 0.6), 0 0 30px rgba(132, 61, 255, 0.4)',
      },
      // 백드롭 필터
      backdropBlur: {
        xs: '2px',
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