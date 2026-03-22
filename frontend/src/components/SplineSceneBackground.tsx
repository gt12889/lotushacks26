'use client';

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

export function SplineSceneBackground({
  sceneUrl,
  overlay = 'abyss',
  zoom = 1.2,
  disableControls = true,
  className = '',
}: SplineSceneBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      aria-hidden
    >
      <Spline
        scene={sceneUrl}
        className="!absolute !inset-0 !w-full !h-full"
        renderOnDemand={false}
        onLoad={(s) => onSplineLoad(s, zoom, disableControls)}
      />
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
