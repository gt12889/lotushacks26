'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ApiErrorBanner({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-alert-red/40 bg-alert-red/10 px-4 py-3 flex items-start gap-3',
        className
      )}
    >
      <p className="text-sm text-t1 flex-1 leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-t3 hover:text-t1 hover:bg-alert-red/15 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      ) : null}
    </div>
  );
}
