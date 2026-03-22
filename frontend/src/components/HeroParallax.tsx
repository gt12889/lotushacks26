'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Parallax depth: background layers drift slower than hero content on scroll.
 */
export function HeroParallax({
  parallaxBack,
  children,
  className,
}: {
  parallaxBack: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const yBg = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 40, 70, 100]);
  const yFg = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 14, 26, 36]);

  if (reduceMotion) {
    return (
      <section ref={ref} className={className}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">{parallaxBack}</div>
        <div className="relative z-10">{children}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className={className}>
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none will-change-transform"
        style={{ y: yBg }}
        aria-hidden
      >
        {parallaxBack}
      </motion.div>
      <motion.div className="relative z-10 will-change-transform" style={{ y: yFg }}>
        {children}
      </motion.div>
    </section>
  );
}
