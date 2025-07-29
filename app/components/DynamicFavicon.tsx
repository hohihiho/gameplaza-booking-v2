'use client';

import { useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export default function DynamicFavicon() {
  const { theme } = useTheme();
  
  useEffect(() => {
    // 현재 테마 결정 (system 설정일 경우 시스템 테마 사용)
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    // 기존 파비콘 링크 제거
    const existingLinks = document.querySelectorAll("link[rel='icon']");
    existingLinks.forEach(link => link.remove());
    
    // 새 파비콘 링크 생성
    const link32 = document.createElement('link');
    link32.rel = 'icon';
    link32.type = 'image/png';
    link32.sizes = '32x32';
    
    const link16 = document.createElement('link');
    link16.rel = 'icon';
    link16.type = 'image/png';
    link16.sizes = '16x16';
    
    // 테마에 따라 다른 파비콘 설정
    if (currentTheme === 'dark') {
      // 다크모드용 파비콘
      link32.href = '/icons/favicon-dark-32x32.png';
      link16.href = '/icons/favicon-dark-16x16.png';
    } else {
      // 라이트모드용 파비콘
      link32.href = '/icons/favicon-light-32x32.png';
      link16.href = '/icons/favicon-light-16x16.png';
    }
    
    document.head.appendChild(link32);
    document.head.appendChild(link16);
    
    // 추가로 다양한 크기의 아이콘도 업데이트 (PNG가 있는 경우에만)
    // 현재는 SVG만 사용하므로 주석 처리
    /*
    const sizes = ['16x16', '32x32', '96x96'];
    sizes.forEach(size => {
      const sizeLink = document.createElement('link');
      sizeLink.rel = 'icon';
      sizeLink.type = 'image/png';
      sizeLink.sizes = size;
      sizeLink.href = currentTheme === 'dark' 
        ? `/icons/favicon-dark-${size}.png`
        : `/icons/favicon-light-${size}.png`;
      document.head.appendChild(sizeLink);
    });
    */
    
  }, [theme]);
  
  return null;
}