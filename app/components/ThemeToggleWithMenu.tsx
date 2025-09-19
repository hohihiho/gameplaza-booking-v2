// 다크모드 토글 버튼 (드롭다운 메뉴 포함)
// 비전공자 설명: 라이트/다크/시스템 모드를 선택할 수 있는 버튼입니다
'use client';

import { useTheme } from './ThemeProvider';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleWithMenuProps {
  variant?: 'transparent' | 'solid';
  size?: 'sm' | 'md';
}

export function ThemeToggleWithMenu({ variant = 'solid', size = 'md' }: ThemeToggleWithMenuProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentIcon = () => {
    const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const iconColor = variant === 'transparent' ? 'text-white/90' : 'text-gray-700 dark:text-gray-300';
    
    if (theme === 'system') {
      return <Monitor className={`${iconClass} ${iconColor}`} />;
    } else if (theme === 'dark') {
      return <Moon className={`${iconClass} ${iconColor}`} />;
    } else {
      return <Sun className={`${iconClass} ${iconColor}`} />;
    }
  };

  const themeOptions = [
    { value: 'light' as const, label: '라이트', icon: Sun },
    { value: 'dark' as const, label: '다크', icon: Moon },
    { value: 'system' as const, label: '시스템', icon: Monitor },
  ];

  const buttonClass = variant === 'transparent'
    ? `p-2 rounded-full hover:bg-white/10 transition-colors touch-target touch-feedback ${size === 'sm' ? 'p-1.5' : 'p-2'}`
    : `p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target touch-feedback ${size === 'sm' ? 'p-1.5' : 'p-2'}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        aria-label="테마 변경"
      >
        {getCurrentIcon()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target touch-feedback"
                >
                  <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-left">
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}