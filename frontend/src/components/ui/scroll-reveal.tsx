'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type ScrollRevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before animation starts after becoming visible */
  delay?: number;
  /** IntersectionObserver threshold (0-1) */
  threshold?: number;
  /** Enter motion axis / style */
  direction?: ScrollRevealDirection;
}

const hiddenClass: Record<ScrollRevealDirection, string> = {
  up: 'opacity-0 translate-y-10',
  down: 'opacity-0 -translate-y-10',
  left: 'opacity-0 translate-x-10',
  right: 'opacity-0 -translate-x-10',
  scale: 'opacity-0 scale-[0.94]',
};

const visibleClass: Record<ScrollRevealDirection, string> = {
  up: 'opacity-100 translate-y-0',
  down: 'opacity-100 translate-y-0',
  left: 'opacity-100 translate-x-0',
  right: 'opacity-100 translate-x-0',
  scale: 'opacity-100 scale-100',
};

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
  direction = 'up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setVisible(true), delay);
          } else {
            setVisible(true);
          }
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? visibleClass[direction] : hiddenClass[direction]
      } ${className}`}
    >
      {children}
    </div>
  );
}
