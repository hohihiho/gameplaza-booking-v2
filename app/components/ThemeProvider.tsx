// 다크모드 테마 Provider
// 비전공자 설명: 웹사이트의 다크모드를 관리하는 컴포넌트입니다
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// 테마 타입 정의
type Theme = 'light' | 'dark';

// Context 생성
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'light',
  setTheme: () => {},
});

// Provider 컴포넌트
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 저장된 테마 가져오기
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // system이거나 없으면 시스템 설정 확인
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 테마 적용 로직
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // 로컬 스토리지에 저장
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // 마운트되지 않았을 때는 아무것도 렌더링하지 않음 (hydration 오류 방지)
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook으로 사용하기 쉽게 만들기
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};