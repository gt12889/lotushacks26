'use client';

import { useDemoMode } from '@/components/DemoModeProvider';
import { useCallback } from 'react';

/**
 * Check demo mode from localStorage (for use outside React components).
 */
function isDemoModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('megladon-demo-mode') === 'true';
}

/**
 * Fetch wrapper that adds X-Demo-Mode header when demo mode is on.
 * Works outside React components by reading localStorage directly.
 */
export function demoFetch(url: string | URL, options?: RequestInit): Promise<Response> {
  const demo = isDemoModeActive();
  if (!demo) return fetch(url, options);

  const headers = new Headers(options?.headers);
  headers.set('X-Demo-Mode', 'true');

  return fetch(url, { ...options, headers });
}

/**
 * React hook that returns a fetch function aware of demo mode context.
 * Preferred over demoFetch when inside a React component.
 */
export function useDemoFetch() {
  const { isDemoMode } = useDemoMode();

  return useCallback(
    (url: string | URL, options?: RequestInit): Promise<Response> => {
      if (!isDemoMode) return fetch(url, options);

      const headers = new Headers(options?.headers);
      headers.set('X-Demo-Mode', 'true');

      return fetch(url, { ...options, headers });
    },
    [isDemoMode]
  );
}
