'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Status = 'loading' | 'configured' | 'not_configured' | 'unreachable';

export default function SupermemoryStatusBadge() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (!r.ok) {
          if (!cancelled) setStatus('unreachable');
          return;
        }
        const data = (await r.json()) as { supermemory_configured?: boolean };
        if (!cancelled) {
          setStatus(data.supermemory_configured ? 'configured' : 'not_configured');
        }
      } catch {
        if (!cancelled) setStatus('unreachable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    status === 'loading'
      ? 'Checking API…'
      : status === 'configured'
        ? 'Supermemory: API key configured'
        : status === 'not_configured'
          ? 'Supermemory: not configured (no API key)'
          : 'API unreachable';

  const className =
    status === 'configured'
      ? 'border-success/40 bg-success/10 text-success'
      : status === 'not_configured'
        ? 'border-warn/40 bg-warn/10 text-warn'
        : status === 'unreachable'
          ? 'border-border bg-card/40 text-t3'
          : 'border-border bg-card/40 text-t3 animate-pulse';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-mono ${className}`}
      role="status"
    >
      {label}
    </span>
  );
}
