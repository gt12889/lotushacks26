'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SplitType = 'chars' | 'words';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: SplitType;
  from?: { opacity?: number; y?: number; x?: number };
  to?: { opacity?: number; y?: number; x?: number };
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
  onLetterAnimationComplete?: () => void;
  showCallback?: boolean;
}

const EASE_MAP: Record<string, string | number[]> = {
  'power3.out': [0.33, 1, 0.68, 1],
  'power2.out': [0.33, 1, 0.68, 1],
  easeOut: 'easeOut',
  easeIn: 'easeIn',
  easeInOut: 'easeInOut',
};

export function SplitText({
  text,
  className,
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  onLetterAnimationComplete,
  showCallback = false,
}: SplitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: threshold,
    margin: rootMargin as `${number}px`,
  });
  const reduceMotion = useReducedMotion();
  const shouldAnimate = isInView && !reduceMotion;

  const chars = text.split('');
  const totalChars = chars.length;
  const easeResolved = typeof ease === 'string' ? (EASE_MAP[ease] ?? ease) : ease;
  const easeValue =
    typeof easeResolved === 'string'
      ? easeResolved
      : ([...(easeResolved as number[])] as [number, number, number, number]);

  const handleLastComplete = () => {
    if (showCallback && onLetterAnimationComplete) {
      onLetterAnimationComplete();
    }
  };

  return (
    <div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ textAlign }}
    >
      {splitType === 'chars' ? (
        chars.map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={from}
            animate={shouldAnimate ? to : from}
            transition={{
              duration,
              delay: shouldAnimate ? (i * delay) / 1000 : 0,
              ease: easeValue as [number, number, number, number] | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut',
            }}
            onAnimationComplete={
              showCallback && i === totalChars - 1 ? handleLastComplete : undefined
            }
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))
      ) : (
        text.split(/\s+/).map((word, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={from}
            animate={shouldAnimate ? to : from}
            transition={{
              duration,
              delay: shouldAnimate ? (i * delay) / 1000 : 0,
              ease: easeValue as [number, number, number, number] | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut',
            }}
            onAnimationComplete={
              showCallback && i === text.split(/\s+/).length - 1
                ? handleLastComplete
                : undefined
            }
          >
            {word}
            {i < text.split(/\s+/).length - 1 ? '\u00A0' : ''}
          </motion.span>
        ))
      )}
    </div>
  );
}
