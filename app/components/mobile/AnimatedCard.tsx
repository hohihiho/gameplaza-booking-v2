'use client';

import { ReactNode, memo } from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  tap?: boolean;
  glow?: boolean;
  variant?: 'fade' | 'slide' | 'scale' | 'flip';
}

const cardVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  },
  slide: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  },
  flip: {
    hidden: { opacity: 0, rotateY: 90 },
    visible: { 
      opacity: 1, 
      rotateY: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }
};

const AnimatedCard = memo(function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = true,
  tap = true,
  glow = false,
  variant = 'slide'
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}
      variants={cardVariants[variant]}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              boxShadow: glow
                ? '0 10px 30px -10px rgba(99, 102, 241, 0.3)'
                : '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
              transition: { duration: 0.2 }
            }
          : undefined
      }
      whileTap={
        tap
          ? {
              scale: 0.98,
              transition: { duration: 0.1 }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
});

export default AnimatedCard;