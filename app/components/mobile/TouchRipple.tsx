'use client';

import { useState, useRef, ReactNode, MouseEvent, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

interface TouchRippleProps {
  children: ReactNode;
  color?: string;
  duration?: number;
  className?: string;
  disabled?: boolean;
}

export default function TouchRipple({
  children,
  color = 'rgba(0, 0, 0, 0.1)',
  duration = 0.6,
  className = '',
  disabled = false
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const createRipple = (event: MouseEvent | TouchEvent) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in event) {
      x = (event.touches[0]?.clientX || 0) - rect.left;
      y = (event.touches[0]?.clientY || 0) - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // 리플 크기 계산 (컨테이너의 대각선 길이)
    const size = Math.sqrt(rect.width ** 2 + rect.height ** 2) * 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: nextId.current++
    };

    setRipples(prev => [...prev, newRipple]);

    // 햅틱 피드백 (지원하는 기기에서만)
    if ('vibrate' in navigator && 'ontouchstart' in window) {
      navigator.vibrate(10);
    }
  };

  const handleRippleComplete = (id: number) => {
    setRipples(prev => prev.filter(ripple => ripple.id !== id));
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={createRipple}
      onTouchStart={createRipple}
      className={`relative overflow-hidden ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
      
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: 'easeOut' }}
            onAnimationComplete={() => handleRippleComplete(ripple.id)}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}