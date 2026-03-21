'use client';

import dynamic from 'next/dynamic';

const Spline = dynamic(
  () => import('@splinetool/react-spline').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-abyss animate-pulse" aria-hidden />
    ),
  }
);

const SPLINE_SCENE = 'https://prod.spline.design/A3OzKbt9KVVITkmz/scene.splinecode';

export function HeroSplineBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Spline
        scene={SPLINE_SCENE}
        className="!absolute !inset-0 !w-full !h-full"
        renderOnDemand={false}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-abyss/70 via-abyss/40 to-deep/95 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
