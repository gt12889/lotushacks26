'use client';

import { Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Application } from '@splinetool/runtime';

const Spline = dynamic(
  () => import('@splinetool/react-spline').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-abyss animate-pulse" aria-hidden />
    ),
  }
);

interface SplineSceneBackgroundProps {
  sceneUrl: string;
  overlay?: 'abyss' | 'none' | 'subtle';
  zoom?: number;
  disableControls?: boolean;
  className?: string;
}

function onSplineLoad(spline: Application, zoom?: number, disableControls?: boolean) {
  if (zoom != null) spline.setZoom(zoom);
  if (disableControls !== false && spline.controls) {
    spline.controls.enabled = false;
  }
}

const overlays = {
  abyss:
    'linear-gradient(to_bottom,rgba(13,28,50,0.7)_0%,rgba(13,28,50,0.4)_50%,rgba(13,28,50,0.85)_100%)',
  subtle:
    'linear-gradient(to_bottom,rgba(13,28,50,0.3)_0%,transparent_50%,rgba(13,28,50,0.4)_100%)',
  none: 'none',
};

const FALLBACK_GRADIENT =
  'linear-gradient(135deg,#0D1C32_0%,#0a1628_25%,#05101f_50%,#0D1C32_75%,#0a1628_100%)';

/** Catches Spline "Data read, but end of buffer not reached" and similar runtime errors */
class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function SplineSceneBackground({
  sceneUrl,
  overlay = 'abyss',
  zoom = 1.2,
  disableControls = true,
  className = '',
}: SplineSceneBackgroundProps) {
  const containerClass = `absolute inset-0 w-full h-full overflow-hidden ${className}`;

  return (
    <div className={containerClass} aria-hidden>
      <SplineErrorBoundary
        fallback={
          <div
            className="absolute inset-0"
            style={{ background: FALLBACK_GRADIENT }}
            aria-hidden
          />
        }
      >
        <Spline
          scene={sceneUrl}
          className="!absolute !inset-0 !w-full !h-full"
          renderOnDemand={false}
          onLoad={(s) => onSplineLoad(s, zoom, disableControls)}
        />
      </SplineErrorBoundary>
      {overlay !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ background: overlays[overlay] }}
          aria-hidden
        />
      )}
    </div>
  );
}
