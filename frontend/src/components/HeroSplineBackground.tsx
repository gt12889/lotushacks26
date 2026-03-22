'use client';

import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
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

const SPLINE_SCENE = 'https://prod.spline.design/A3OzKbt9KVVITkmz/scene.splinecode';

function onSplineLoad(spline: Application) {
  spline.setZoom(1.5);
  if (spline.controls) {
    spline.controls.enabled = false;
  }
}

const splineProps = {
  scene: SPLINE_SCENE,
  className: '!absolute !inset-0 !w-full !h-full',
  renderOnDemand: false as const,
  onLoad: onSplineLoad,
};

export function HeroSplineBackground() {
  const reduceMotion = useReducedMotion();

  const scene = <Spline {...splineProps} />;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden [perspective:1600px]">
      {reduceMotion ? (
        <div className="absolute inset-0">{scene}</div>
      ) : (
        <motion.div
          className="absolute inset-0 w-full h-full origin-center will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
          initial={false}
          animate={{
            rotateX: [0, 2.2, 0, -1.8, 0],
            rotateY: [0, -3.5, 0, 2.8, 0],
            rotateZ: [0, 0.35, 0, -0.35, 0],
          }}
          transition={{
            duration: 36,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.22, 0.48, 0.72, 1],
          }}
          aria-hidden
        >
          {scene}
        </motion.div>
      )}
      <div
        className="absolute inset-0 pointer-events-none z-[1] [background:linear-gradient(to_bottom,rgba(13,28,50,0.68)_0%,rgba(13,28,50,0.55)_15%,rgba(13,28,50,0.45)_30%,rgba(1,14,36,0.5)_50%,rgba(13,28,50,0.6)_70%,rgba(13,28,50,0.82)_85%,rgba(13,28,50,0.95)_95%,#0D1C32_100%)]"
        aria-hidden
      />
    </div>
  );
}
