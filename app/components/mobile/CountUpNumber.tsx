'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUpNumber({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: CountUpNumberProps) {
  const spring = useSpring(0, { 
    duration: duration * 1000,
    bounce: 0
  });
  
  const display = useTransform(spring, (current) => {
    const formatted = new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(current);
    
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}