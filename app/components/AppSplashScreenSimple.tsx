'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * 애니메이션 없는 심플한 스플래시 화면입니다.
 * 0.5초 동안만 보여지고 사라집니다.
 */
export default function AppSplashScreenSimple() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-100 to-purple-200 dark:from-purple-950 dark:via-indigo-900 dark:to-purple-900"
      data-testid="app-splash-screen"
      role="presentation"
    >
      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
        <Image
          src="/light.png"
          alt="Gameplaza logo"
          fill
          sizes="96px"
          priority
          className="object-contain drop-shadow-2xl dark:hidden"
        />
        <Image
          src="/dark.png"
          alt="Gameplaza logo"
          fill
          sizes="96px"
          priority
          className="hidden object-contain drop-shadow-2xl dark:block"
        />
      </div>
    </div>
  );
}