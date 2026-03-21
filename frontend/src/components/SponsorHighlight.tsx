import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Visually emphasize sponsor / integration names on the landing page. */
export function SponsorHighlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline font-mono font-semibold text-cyan',
        'rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 text-[0.9em] align-baseline',
        'shadow-[0_0_20px_-4px_rgba(0,219,231,0.35)]',
        className,
      )}
    >
      {children}
    </span>
  );
}
