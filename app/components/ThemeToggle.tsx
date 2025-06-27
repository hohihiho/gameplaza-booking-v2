// 다크모드 토글 버튼
// 비전공자 설명: 라이트모드/다크모드를 전환하는 버튼입니다
'use client';

import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => {
        // 라이트/다크 모드만 토글
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="테마 변경"
    >
      {/* 현재 테마의 반대 아이콘 표시 (클릭시 변경될 테마) */}
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}