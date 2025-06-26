// 다크모드 토글 버튼
// 비전공자 설명: 라이트모드/다크모드를 전환하는 버튼입니다
'use client';

import { useTheme } from './ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => {
        // 현재 테마에 따라 다음 테마로 전환
        if (theme === 'light') {
          setTheme('dark');
        } else if (theme === 'dark') {
          setTheme('system');
        } else {
          setTheme('light');
        }
      }}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="테마 변경"
    >
      {/* 테마별 아이콘 표시 */}
      {theme === 'light' && <Sun className="w-5 h-5 text-gray-700" />}
      {theme === 'dark' && <Moon className="w-5 h-5 text-gray-300" />}
      {theme === 'system' && <Monitor className="w-5 h-5 text-gray-500" />}
    </button>
  );
}