import { cn } from '@/lib/utils';

const sizeClass = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
} as const;

export function LoadingSpinner({
  size = 'md',
  className,
  label,
}: {
  size?: keyof typeof sizeClass;
  className?: string;
  /** Shown to screen readers when no visible label */
  label?: string;
}) {
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={cn(
          'shrink-0 rounded-full border-cyan/25 border-t-cyan animate-spin',
          sizeClass[size]
        )}
        aria-hidden
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

export function LoadingPanel({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-deep/80 px-8 py-12 text-center',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size="lg" label={message} />
      <p className="text-xs font-mono text-t3">{message}</p>
    </div>
  );
}
