'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';

interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  formatter?: (value: number) => string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function Counter({
  value,
  duration = 1200,
  className,
  style,
  formatter,
}: CounterProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    const start = performance.now();

    if (from === to) return;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = from + (to - from) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = to;
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  const rounded = Math.round(display);
  return (
    <span className={className} style={style}>
      {formatter ? formatter(rounded) : rounded}
    </span>
  );
}
