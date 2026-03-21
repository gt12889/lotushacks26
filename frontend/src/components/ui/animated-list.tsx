'use client';

import { useEffect, useRef, type ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: ReactElement[];
  className?: string;
  animationDuration?: number;
}

/**
 * AnimatedList wraps a list of keyed children and applies a slide-in
 * animation to each item when it first mounts. Items with stable keys
 * won't re-animate on subsequent renders.
 *
 * Each child is wrapped in a div with an entry animation. The animation
 * uses CSS @keyframes so it only plays once per mount.
 */
export function AnimatedList({
  children,
  className,
  animationDuration = 300,
}: AnimatedListProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {children.map((child) => (
        <div
          key={child.key}
          style={{
            animation: `animatedListSlideIn ${animationDuration}ms ease-out both`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
